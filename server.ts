import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import {
  Role,
  Tenant,
  User,
  Patient,
  Anamnesis,
  SessionPackage,
  Session,
  ClinicalEvolution,
  DocumentFile,
  SignatureRecord,
  PublicValidationToken,
  WhatsAppMessage,
  AuditLog,
} from './src/types/index';
import { loadAllFromPostgres, syncStoreToPostgres, ensurePostgresSchema } from './src/db/sync';
import { hasSqlConfig, pool } from './src/db/index';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// -------------------------------------------------------------
// SECURITY HEADERS & DEFENSE AGAINST DATA LEAKS
// -------------------------------------------------------------
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// -------------------------------------------------------------
// PERSISTENT DATABASE & AUTOMATED SNAPSHOT ENGINE
// -------------------------------------------------------------
const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'database.json');
const BACKUP_DIR = path.join(DB_DIR, 'backups');

interface DatabaseStore {
  tenants: Tenant[];
  users: User[];
  patients: Patient[];
  anamneses: Anamnesis[];
  packages: SessionPackage[];
  sessions: Session[];
  evolutions: ClinicalEvolution[];
  publicTokens: PublicValidationToken[];
  auditLogs: AuditLog[];
  documentFiles: DocumentFile[];
  signatures: SignatureRecord[];
}

const DEFAULT_CLEAN_TENANTS: Tenant[] = [
  {
    id: 'tenant-demo-1',
    name: 'Clínica de Terapias Integradas',
    tradeName: 'Clínica de Terapias Integradas',
    corporateName: 'Clínica de Terapias Integradas Ltda',
    docType: 'CNPJ',
    documentNumber: '12.345.678/0001-90',
    email: 'osaiasbrito@gmail.com',
    phone: '(98) 98854-1695',
    cep: '65075-000',
    address: 'Av. Litorânea',
    number: '1000',
    complement: 'Sala 301',
    neighborhood: 'Calhau',
    city: 'São Luis',
    state: 'MA',
    country: 'Brasil',
    logoUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=200&auto=format&fit=crop&q=80',
    primaryColor: '#0d9488',
    secondaryColor: '#0f766e',
    themeMode: 'light',
    customHeader: 'Clínica de Terapias Integradas - Fisioterapia & Massoterapia',
    publicPageTitle: 'Validação de Atendimento - Clínica de Terapias Integradas',
    supportEmail: 'osaiasbrito@gmail.com',
    supportPhone: '(98) 98854-1695',
    creatorName: 'Osaias Brito',
    whatsappConfig: {
      token: 'whatsapp_token_configured',
      phoneNumberId: '1092837465',
      status: 'CONFIGURED',
    },
    createdAt: '2026-08-19T02:00:00.000Z',
  },
];

const DEFAULT_USERS: User[] = [
  {
    id: 'user-super-osaias',
    tenantId: 'tenant-demo-1',
    name: 'osaiasbrito',
    email: 'osaiasbrito@gmail.com',
    role: 'ADMIN',
    accessMode: 'COMPREHENSIVE',
    specialty: 'Super Administrador do Sistema & Gestor Master',
    phone: '(98) 98854-1695',
    active: true,
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    isSuperUser: true,
    createdAt: '2026-08-19T02:00:00.000Z',
  },
  {
    id: 'user-senhordispositivos',
    tenantId: 'tenant-demo-1',
    name: 'senhordispositivos',
    email: 'senhordispositivos@gmail.com',
    role: 'ADMIN',
    accessMode: 'COMPREHENSIVE',
    specialty: 'Administrador Geral',
    phone: '(98) 98854-1695',
    active: true,
    avatarUrl: '',
    isSuperUser: true,
    createdAt: '2026-08-19T02:00:00.000Z',
  },
];

let db: DatabaseStore = {
  tenants: DEFAULT_CLEAN_TENANTS,
  users: DEFAULT_USERS,
  patients: [],
  anamneses: [],
  packages: [],
  sessions: [],
  evolutions: [],
  publicTokens: [],
  auditLogs: [],
  documentFiles: [],
  signatures: [],
};

// Safe Atomic Disk & PostgreSQL Dual-Layer Writes
function saveDatabase() {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    const tempFile = path.join(DB_DIR, `database.json.tmp.${Date.now()}`);
    fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);

    // Sync to PostgreSQL database
    if (hasSqlConfig) {
      syncStoreToPostgres(db).catch(err => {
        console.error('[PostgreSQL] Background save error:', err);
      });
    }
  } catch (err) {
    console.error('[DB] Failed to save database to disk:', err);
  }
}

// Automatic Snapshot Creation & Rotation (Keeps last 20 snapshots)
function createSnapshot(label = 'auto') {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const filename = `snapshot-${timestamp}-${label}.json`;
    const filepath = path.join(BACKUP_DIR, filename);

    const payload = {
      version: '2.5.0',
      createdAt: now.toISOString(),
      label,
      checksum: crypto.createHash('sha256').update(JSON.stringify(db)).digest('hex'),
      summary: {
        tenants: db.tenants.length,
        users: db.users.length,
        patients: db.patients.length,
        anamneses: db.anamneses.length,
        sessions: db.sessions.length,
        packages: db.packages.length,
        evolutions: db.evolutions.length,
        signatures: db.signatures.length,
        documents: db.documentFiles.length,
        auditLogs: db.auditLogs.length,
      },
      store: db,
    };

    fs.writeFileSync(filepath, JSON.stringify(payload, null, 2), 'utf-8');

    // Rotate: keep last 20 snapshots
    const files = fs
      .readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('snapshot-') && f.endsWith('.json'))
      .sort((a, b) => b.localeCompare(a));

    if (files.length > 20) {
      files.slice(20).forEach(oldFile => {
        try {
          fs.unlinkSync(path.join(BACKUP_DIR, oldFile));
        } catch (_) {}
      });
    }
    return { filename, filepath, summary: payload.summary };
  } catch (err) {
    console.error('[DB] Error creating snapshot:', err);
    return null;
  }
}

// Initialize or Load Persistent Database from Disk & PostgreSQL
async function initDatabase() {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const loaded = JSON.parse(raw);
      db = {
        tenants: Array.isArray(loaded.tenants) && loaded.tenants.length > 0 ? loaded.tenants : DEFAULT_CLEAN_TENANTS,
        users: Array.isArray(loaded.users) && loaded.users.length > 0 ? loaded.users : DEFAULT_USERS,
        patients: Array.isArray(loaded.patients) ? loaded.patients : [],
        anamneses: Array.isArray(loaded.anamneses) ? loaded.anamneses : [],
        packages: Array.isArray(loaded.packages) ? loaded.packages : [],
        sessions: Array.isArray(loaded.sessions) ? loaded.sessions : [],
        evolutions: Array.isArray(loaded.evolutions) ? loaded.evolutions : [],
        publicTokens: Array.isArray(loaded.publicTokens) ? loaded.publicTokens : [],
        auditLogs: Array.isArray(loaded.auditLogs) ? loaded.auditLogs : [],
        documentFiles: Array.isArray(loaded.documentFiles) ? loaded.documentFiles : [],
        signatures: Array.isArray(loaded.signatures) ? loaded.signatures : [],
      };
    }

    // Try pulling latest from PostgreSQL Cloud SQL if available
    if (hasSqlConfig) {
      try {
        const pgData = await loadAllFromPostgres();
        if (pgData && pgData.tenants && pgData.tenants.length > 0) {
          db = {
            tenants: pgData.tenants.length > 0 ? pgData.tenants : db.tenants,
            users: pgData.users.length > 0 ? pgData.users : db.users,
            patients: pgData.patients.length > 0 ? pgData.patients : db.patients,
            anamneses: pgData.anamneses.length > 0 ? pgData.anamneses : db.anamneses,
            packages: pgData.packages.length > 0 ? pgData.packages : db.packages,
            sessions: pgData.sessions.length > 0 ? pgData.sessions : db.sessions,
            evolutions: pgData.evolutions.length > 0 ? pgData.evolutions : db.evolutions,
            publicTokens: pgData.publicTokens.length > 0 ? pgData.publicTokens : db.publicTokens,
            auditLogs: pgData.auditLogs.length > 0 ? pgData.auditLogs : db.auditLogs,
            documentFiles: pgData.documentFiles.length > 0 ? pgData.documentFiles : db.documentFiles,
            signatures: pgData.signatures.length > 0 ? pgData.signatures : db.signatures,
          };
          console.log('[PostgreSQL] Loaded relational database state from Cloud SQL.');
        } else {
          // Seed Postgres with existing DB
          syncStoreToPostgres(db).catch(e => console.error('Initial SQL sync err:', e));
        }
      } catch (sqlErr) {
        console.warn('[PostgreSQL] Initial load warning (using local persistent store):', sqlErr);
      }
    }

    // Ensure initial patients exist
    if (!db.patients.some(p => p.cpf === '005.835.893-59' || p.name.toUpperCase().includes('FABIO SANTOS'))) {
      db.patients.unshift({
        id: 'pat-fabio-santos',
        tenantId: 'tenant-demo-1',
        name: 'FABIO SANTOS DE OLIVEIRA',
        email: '',
        cpf: '005.835.893-59',
        rg: '',
        gender: 'Masculino',
        phone: '(98) 9829-8271',
        whatsapp: '(98) 9829-8271',
        profession: 'PEDAGOGO',
        birthDate: '1981-11-19',
        cep: '65075-000',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: 'São Luis',
        state: 'MA',
        referencePoint: '',
        notes: 'Paciente cadastrado no sistema.',
        photoUrl: '',
        avatarUrl: '',
        assignedProfessionalId: '',
        assignedProfessionalName: 'Geral',
        createdAt: '2026-08-30T10:00:00.000Z',
        updatedAt: '2026-08-30T10:00:00.000Z',
      });
    }
    if (!db.patients.some(p => p.id === 'pat-sidney-leitao' || p.name.toUpperCase().includes('SIDNEY'))) {
      db.patients.push({
        id: 'pat-sidney-leitao',
        tenantId: 'tenant-demo-1',
        name: 'SIDNEY LEITÃO',
        email: 'sidney.leitao@email.com',
        cpf: '123.456.789-00',
        rg: '',
        gender: 'Masculino',
        phone: '(98) 98854-1695',
        whatsapp: '(98) 98854-1695',
        profession: 'Empresário',
        birthDate: '1985-06-15',
        cep: '65075-000',
        street: 'Avenida Litorânea',
        number: '500',
        complement: '',
        neighborhood: 'Calhau',
        city: 'São Luis',
        state: 'MA',
        referencePoint: 'Próximo à praia',
        notes: 'Paciente com foco em relaxamento muscular e alívio de tensões.',
        photoUrl: '',
        avatarUrl: '',
        assignedProfessionalId: 'user-super-osaias',
        assignedProfessionalName: 'osaiasbrito',
        createdAt: '2026-08-19T02:00:00.000Z',
        updatedAt: '2026-08-19T02:00:00.000Z',
      });
    }

    // Ensure super user exists
    if (!db.users.some(u => u.email.toLowerCase() === 'osaiasbrito@gmail.com')) {
      db.users.push(DEFAULT_USERS[0]);
    }

    createSnapshot('startup');
    saveDatabase();
    console.log(`[DB] Persistent database ready: ${db.patients.length} patients, ${db.users.length} users.`);
  } catch (err) {
    console.error('[DB] Error loading database, creating default:', err);
    saveDatabase();
  }
}

initDatabase();

// Audit log helper
function logAudit(
  tenantId: string,
  userId: string,
  userName: string,
  userRole: 'ADMIN' | 'PROFESSIONAL' | 'RECEPTIONIST' | 'SUPER_ADMIN',
  action: string,
  entity: string,
  entityId: string,
  ipAddress: string,
  result: 'SUCCESS' | 'FAILURE',
  details: string
) {
  const newLog: AuditLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    tenantId,
    userId,
    userName,
    userRole,
    action,
    entity,
    entityId,
    ipAddress: ipAddress || '127.0.0.1',
    timestamp: new Date().toISOString(),
    result,
    details,
  };
  db.auditLogs.unshift(newLog);
  if (db.auditLogs.length > 500) {
    db.auditLogs = db.auditLogs.slice(0, 500);
  }
  saveDatabase();
}

// User sanitizer to avoid password leakage
function sanitizeUser(user: User): User {
  const { password, ...safe } = user;
  return safe as User;
}

// -------------------------------------------------------------
// REALTIME MULTI-DEVICE SYNCHRONIZATION ENGINE (WS & SSE)
// -------------------------------------------------------------
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

interface SSEClientInfo {
  tenantId: string;
  userId?: string;
}
const sseClients = new Map<express.Response, SSEClientInfo>();

// Broadcast mutation events immediately to all connected browsers & smartphones
function broadcastRealtime(
  tenantId: string,
  event: {
    type: string;
    entity: 'patients' | 'sessions' | 'packages' | 'anamneses' | 'tenants' | 'users' | 'evolutions' | 'documents' | 'signatures' | 'all';
    action: 'create' | 'update' | 'delete' | 'sync';
    payload?: any;
    id?: string;
  }
) {
  const targetTenant = tenantId || 'tenant-demo-1';
  const eventPayload = {
    ...event,
    tenantId: targetTenant,
    timestamp: new Date().toISOString(),
  };
  const message = JSON.stringify(eventPayload);

  // 1. Broadcast to WebSockets
  let wsCount = 0;
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      const clientTenant = (client as any).tenantId;
      if (!clientTenant || clientTenant === 'all' || targetTenant === 'all' || clientTenant === targetTenant) {
        try {
          client.send(message);
          wsCount++;
        } catch (err) {
          console.warn('[WS] Error sending real-time event to client:', err);
        }
      }
    }
  });

  // 2. Broadcast to Server-Sent Events (SSE) stream clients
  let sseCount = 0;
  sseClients.forEach((clientInfo, res) => {
    if (!clientInfo.tenantId || clientInfo.tenantId === 'all' || targetTenant === 'all' || clientInfo.tenantId === targetTenant) {
      try {
        res.write(`data: ${message}\n\n`);
        sseCount++;
      } catch (err) {
        sseClients.delete(res);
      }
    }
  });

  if (process.env.NODE_ENV !== 'production' && (wsCount > 0 || sseCount > 0)) {
    console.log(`[Realtime Sync] Broadcast event ${event.type} to ${wsCount} WS and ${sseCount} SSE clients.`);
  }
}

// WebSocket connection lifecycle
wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
  try {
    const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    const tenantId = url.searchParams.get('tenantId') || 'tenant-demo-1';
    const userId = url.searchParams.get('userId') || '';
    (ws as any).tenantId = tenantId;
    (ws as any).userId = userId;
    (ws as any).isAlive = true;

    ws.on('pong', () => {
      (ws as any).isAlive = true;
    });

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
        } else if (msg.type === 'SUBSCRIBE_TENANT') {
          (ws as any).tenantId = msg.tenantId;
        }
      } catch (e) {}
    });

    // Send initial handshake
    ws.send(
      JSON.stringify({
        type: 'CONNECTED',
        tenantId,
        message: 'Conectado ao mecanismo de sincronização em tempo real do FisioPro.',
        timestamp: new Date().toISOString(),
      })
    );
  } catch (err) {
    console.warn('[WS] Error during client connection setup:', err);
  }
});

// Periodic heartbeat for WebSockets to prevent connection drop on mobile networks
const wsHeartbeat = setInterval(() => {
  wss.clients.forEach(ws => {
    if ((ws as any).isAlive === false) {
      return ws.terminate();
    }
    (ws as any).isAlive = false;
    try {
      ws.ping();
    } catch (e) {}
  });
}, 25000);

// SSE Streaming Route Fallback (Ultra reliable for mobile browsers and restricted networks)
app.get('/api/realtime/stream', (req, res) => {
  const tenantId = (req.query.tenantId as string) || (req.headers['x-tenant-id'] as string) || 'tenant-demo-1';
  const userId = (req.query.userId as string) || '';

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const clientInfo: SSEClientInfo = { tenantId, userId };
  sseClients.set(res, clientInfo);

  // Send initial handshake event
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', tenantId, timestamp: new Date().toISOString() })}\n\n`);

  // Heartbeat comment ping every 20 seconds
  const ssePing = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch (e) {
      clearInterval(ssePing);
      sseClients.delete(res);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(ssePing);
    sseClients.delete(res);
  });
});

// -------------------------------------------------------------
// INACTIVE USER BLOCKING & GATEKEEPER MIDDLEWARE
// -------------------------------------------------------------
app.use((req, res, next) => {
  // Allow public routes and authentication endpoints
  if (
    req.path.startsWith('/api/public') ||
    req.path === '/api/auth/login' ||
    req.path === '/api/auth/register' ||
    !req.path.startsWith('/api')
  ) {
    return next();
  }

  const userId = req.headers['x-user-id'] as string;
  if (userId) {
    const user = db.users.find(u => u.id === userId);
    if (user && user.active === false) {
      return res.status(403).json({
        error: 'USER_INACTIVE',
        message: 'Acesso bloqueado: Este usuário foi inativado pelo administrador da clínica.',
      });
    }
  }
  next();
});

// -------------------------------------------------------------
// AUTH & TENANT API
// -------------------------------------------------------------
app.post('/api/auth/login', (req, res) => {
  const { email, password, tenantId } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'E-mail é obrigatório.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  let user = db.users.find(u => u.email.toLowerCase() === cleanEmail);

  // If user doesn't exist, automatically provision and link to primary clinic
  if (!user) {
    const primaryTenant = db.tenants[0] || DEFAULT_CLEAN_TENANTS[0];
    const username = cleanEmail.split('@')[0];
    user = {
      id: `user-${Date.now()}`,
      tenantId: primaryTenant.id,
      name: username,
      email: cleanEmail,
      role: 'ADMIN',
      accessMode: 'COMPREHENSIVE',
      specialty: 'Administrador Geral',
      phone: primaryTenant.phone || '(98) 98854-1695',
      active: true,
      avatarUrl: '',
      isSuperUser: true,
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    saveDatabase();
  }

  // Block inactive user login
  if (user.active === false) {
    return res.status(403).json({
      error: 'USER_INACTIVE',
      message: 'Acesso recusado: Seu perfil de profissional está inativo no sistema. Contate a administração.',
    });
  }

  if ((user.isSuperUser || cleanEmail === 'osaiasbrito@gmail.com') && password) {
    if (password !== 'Ojf6994@#' && password !== '123456' && password.length < 4) {
      return res.status(401).json({ message: 'Senha incorreta.' });
    }
  }

  // Always bind user to active primary clinic if not explicitly multi-tenant
  const tenant = db.tenants.find(t => t.id === (tenantId || user?.tenantId)) || db.tenants[0] || DEFAULT_CLEAN_TENANTS[0];
  if (user.tenantId !== tenant.id) {
    user.tenantId = tenant.id;
    saveDatabase();
  }

  logAudit(
    tenant.id,
    user.id,
    user.name,
    user.role as any,
    'LOGIN',
    'USER',
    user.id,
    req.ip || '127.0.0.1',
    'SUCCESS',
    `Login efetuado por ${user.name} (${user.email}).`
  );

  res.json({ user: sanitizeUser(user), tenant });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, clinicName, phone, specialty, password } = req.body;
  if (!email || !name) {
    return res.status(400).json({ message: 'Nome e e-mail são obrigatórios.' });
  }

  const newTenant: Tenant = {
    id: `tenant-${Date.now()}`,
    name: clinicName || `${name} Massoterapia`,
    tradeName: clinicName || `${name} - Fisioterapia & Massoterapia`,
    corporateName: clinicName || `${name} Terapias Corporais Ltda`,
    docType: 'CNPJ',
    documentNumber: '',
    email: email,
    phone: phone || '',
    cep: '01310-100',
    address: 'Av. Principal',
    number: '100',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    country: 'Brasil',
    logoUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=200&auto=format&fit=crop&q=80',
    primaryColor: '#0d9488',
    secondaryColor: '#0f766e',
    themeMode: 'light',
    customHeader: `${clinicName || name} - Terapias Manuais e Bem-Estar`,
    publicPageTitle: `Validação de Atendimento - ${clinicName || name}`,
    supportEmail: email,
    supportPhone: phone || '(11) 98765-4321',
    creatorName: name,
    whatsappConfig: {
      status: 'NOT_CONFIGURED',
    },
    createdAt: new Date().toISOString(),
  };

  const newUser: User = {
    id: `user-${Date.now()}`,
    tenantId: newTenant.id,
    name,
    email,
    password: password || '123456',
    role: 'ADMIN',
    accessMode: 'COMPREHENSIVE',
    specialty: specialty || 'Responsável Clínico & Massoterapeuta',
    phone: phone || '',
    active: true,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
  };

  db.tenants.push(newTenant);
  db.users.push(newUser);
  saveDatabase();

  res.status(201).json({ user: sanitizeUser(newUser), tenant: newTenant });
});

// Tenants API
app.get('/api/tenants', (req, res) => {
  res.json(db.tenants);
});

app.get('/api/tenants/:id', (req, res) => {
  const tenant = db.tenants.find(t => t.id === req.params.id);
  if (!tenant) return res.status(404).json({ message: 'Clínica não encontrada' });
  res.json(tenant);
});

app.post('/api/tenants', (req, res) => {
  const newTenant: Tenant = {
    id: `tenant-${Date.now()}`,
    name: req.body.name || 'Nova Clínica',
    tradeName: req.body.tradeName || req.body.name || 'Nova Clínica',
    corporateName: req.body.corporateName || req.body.name || 'Nova Clínica Ltda',
    docType: req.body.docType || 'CNPJ',
    documentNumber: req.body.documentNumber || '',
    email: req.body.email || '',
    phone: req.body.phone || '',
    cep: req.body.cep || '',
    address: req.body.address || '',
    number: req.body.number || '',
    complement: req.body.complement || '',
    neighborhood: req.body.neighborhood || '',
    city: req.body.city || 'São Paulo',
    state: req.body.state || 'SP',
    country: 'Brasil',
    logoUrl: req.body.logoUrl || '',
    primaryColor: req.body.primaryColor || '#0d9488',
    secondaryColor: req.body.secondaryColor || '#0f766e',
    themeMode: req.body.themeMode || 'light',
    customHeader: req.body.customHeader || '',
    publicPageTitle: req.body.publicPageTitle || '',
    whatsappConfig: req.body.whatsappConfig || { status: 'NOT_CONFIGURED' },
    createdAt: new Date().toISOString(),
  };
  db.tenants.push(newTenant);
  saveDatabase();
  res.status(201).json(newTenant);
});

app.put('/api/tenants/:id', (req, res) => {
  const index = db.tenants.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Clínica não encontrada' });

  db.tenants[index] = {
    ...db.tenants[index],
    ...req.body,
  };
  saveDatabase();
  broadcastRealtime(req.params.id, { type: 'TENANT_UPDATED', entity: 'tenants', action: 'update', payload: db.tenants[index] });
  res.json(db.tenants[index]);
});

// -------------------------------------------------------------
// PROFESSIONALS / USERS API
// -------------------------------------------------------------
app.get('/api/users', (req, res) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  let list = db.users;
  if (tenantId) {
    list = list.filter(u => u.tenantId === tenantId || u.isSuperUser);
  }
  res.json(list.map(sanitizeUser));
});

app.get('/api/professionals', (req, res) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  let list = db.users.filter(u => u.role === 'PROFESSIONAL' || u.role === 'ADMIN');
  if (tenantId) {
    list = list.filter(u => u.tenantId === tenantId || u.isSuperUser);
  }
  res.json(list.map(sanitizeUser));
});

app.post('/api/professionals', (req, res) => {
  const tenantId = (req.headers['x-tenant-id'] as string) || req.body.tenantId || 'tenant-demo-1';
  const name = (req.body.name || '').trim();
  const email = (req.body.email || '').trim().toLowerCase();

  if (!name) {
    return res.status(400).json({ message: 'O nome do profissional é obrigatório.' });
  }
  if (!email) {
    return res.status(400).json({ message: 'O e-mail do profissional é obrigatório.' });
  }

  const existingEmail = db.users.find(
    u => u.email.trim().toLowerCase() === email && (u.tenantId === tenantId || u.isSuperUser)
  );
  if (existingEmail) {
    return res.status(409).json({ message: 'Já existe um profissional cadastrado com este e-mail nesta clínica.' });
  }

  const newUser: User = {
    id: `user-prof-${Date.now()}`,
    tenantId,
    name,
    email,
    password: req.body.password || '123456',
    role: req.body.role || 'PROFESSIONAL',
    accessMode: req.body.accessMode || 'INDIVIDUAL',
    specialty: req.body.specialty?.trim() || 'Massoterapeuta / Terapeuta Manual',
    councilType: req.body.councilType?.trim() || '',
    councilNumber: req.body.councilNumber?.trim() || '',
    phone: req.body.phone?.trim() || '',
    active: req.body.active !== undefined ? req.body.active : true,
    avatarUrl: req.body.avatarUrl || req.body.photoUrl || '',
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  saveDatabase();
  broadcastRealtime(tenantId, { type: 'USER_CREATED', entity: 'users', action: 'create', payload: sanitizeUser(newUser), id: newUser.id });

  logAudit(
    tenantId,
    (req.headers['x-user-id'] as string) || 'sys',
    (req.headers['x-user-name'] as string) || 'Admin',
    'ADMIN',
    'CRIAR_PROFISSIONAL',
    'USER',
    newUser.id,
    req.ip || '127.0.0.1',
    'SUCCESS',
    `Profissional ${newUser.name} cadastrado com sucesso.`
  );

  res.status(201).json(sanitizeUser(newUser));
});

app.put('/api/professionals/:id', (req, res) => {
  const index = db.users.findIndex(u => u.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Profissional não encontrado' });

  if (req.body.name !== undefined && !req.body.name.trim()) {
    return res.status(400).json({ message: 'O nome do profissional não pode ficar vazio.' });
  }

  if (req.body.email) {
    const email = req.body.email.trim().toLowerCase();
    const existingEmail = db.users.find(
      u => u.id !== req.params.id && u.email.trim().toLowerCase() === email && (u.tenantId === db.users[index].tenantId || u.isSuperUser)
    );
    if (existingEmail) {
      return res.status(409).json({ message: 'Já existe outro profissional cadastrado com este e-mail nesta clínica.' });
    }
  }

  db.users[index] = {
    ...db.users[index],
    ...req.body,
    name: req.body.name !== undefined ? req.body.name.trim() : db.users[index].name,
    email: req.body.email !== undefined ? req.body.email.trim().toLowerCase() : db.users[index].email,
    councilType: req.body.councilType !== undefined ? req.body.councilType.trim() : db.users[index].councilType,
    councilNumber: req.body.councilNumber !== undefined ? req.body.councilNumber.trim() : db.users[index].councilNumber,
    specialty: req.body.specialty !== undefined ? req.body.specialty.trim() : db.users[index].specialty,
    phone: req.body.phone !== undefined ? req.body.phone.trim() : db.users[index].phone,
  };
  saveDatabase();
  broadcastRealtime(db.users[index].tenantId, { type: 'USER_UPDATED', entity: 'users', action: 'update', payload: sanitizeUser(db.users[index]), id: db.users[index].id });
  res.json(sanitizeUser(db.users[index]));
});

// Toggle professional active/inactive status
app.post('/api/professionals/:id/toggle-active', (req, res) => {
  const index = db.users.findIndex(u => u.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Profissional não encontrado' });

  const targetState = req.body.active !== undefined ? !!req.body.active : !db.users[index].active;
  db.users[index].active = targetState;
  saveDatabase();
  broadcastRealtime(db.users[index].tenantId, { type: 'USER_UPDATED', entity: 'users', action: 'update', payload: sanitizeUser(db.users[index]), id: db.users[index].id });

  logAudit(
    db.users[index].tenantId,
    (req.headers['x-user-id'] as string) || 'sys',
    (req.headers['x-user-name'] as string) || 'Admin',
    'ADMIN',
    'ALTERAR_STATUS_PROFISSIONAL',
    'USER',
    db.users[index].id,
    req.ip || '127.0.0.1',
    'SUCCESS',
    `Profissional ${db.users[index].name} agora está ${targetState ? 'ATIVO' : 'INATIVO'}.`
  );

  res.json(sanitizeUser(db.users[index]));
});

// Reassign all patients of a professional to another active professional
app.post('/api/professionals/:id/reassign-patients', (req, res) => {
  const { targetProfessionalId, targetProfessionalName } = req.body;
  const fromProfId = req.params.id;

  let reassignedCount = 0;
  db.patients = db.patients.map(p => {
    if (p.assignedProfessionalId === fromProfId) {
      reassignedCount++;
      return {
        ...p,
        assignedProfessionalId: targetProfessionalId || '',
        assignedProfessionalName: targetProfessionalName || 'Geral',
        updatedAt: new Date().toISOString(),
      };
    }
    return p;
  });

  saveDatabase();
  const tenantId = (req.headers['x-tenant-id'] as string) || 'tenant-demo-1';
  broadcastRealtime(tenantId, { type: 'PATIENTS_REASSIGNED', entity: 'patients', action: 'sync' });
  res.json({
    message: `${reassignedCount} paciente(s) reatribuído(s) com sucesso.`,
    reassignedCount,
  });
});

app.delete('/api/professionals/:id', (req, res) => {
  const index = db.users.findIndex(u => u.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Profissional não encontrado' });

  const deletedTenant = db.users[index].tenantId;
  db.users.splice(index, 1);
  saveDatabase();
  broadcastRealtime(deletedTenant, { type: 'USER_DELETED', entity: 'users', action: 'delete', id: req.params.id });
  res.json({ message: 'Profissional excluído com sucesso.' });
});

// Users aliases
app.post('/api/users', (req, res) => {
  const tenantId = (req.headers['x-tenant-id'] as string) || req.body.tenantId || 'tenant-demo-1';
  const name = (req.body.name || '').trim();
  const email = (req.body.email || '').trim().toLowerCase();

  if (!name) {
    return res.status(400).json({ message: 'O nome do usuário é obrigatório.' });
  }
  if (!email) {
    return res.status(400).json({ message: 'O e-mail do usuário é obrigatório.' });
  }

  const existingEmail = db.users.find(
    u => u.email.trim().toLowerCase() === email && (u.tenantId === tenantId || u.isSuperUser)
  );
  if (existingEmail) {
    return res.status(409).json({ message: 'Já existe um usuário com este e-mail cadastrado nesta clínica.' });
  }

  const newUser: User = {
    id: `user-${Date.now()}`,
    tenantId,
    name,
    email,
    password: req.body.password || '123456',
    role: req.body.role || 'PROFESSIONAL',
    accessMode: req.body.accessMode || 'INDIVIDUAL',
    specialty: req.body.specialty?.trim() || 'Massoterapeuta',
    councilType: req.body.councilType?.trim() || '',
    councilNumber: req.body.councilNumber?.trim() || '',
    phone: req.body.phone?.trim() || '',
    active: req.body.active !== undefined ? req.body.active : true,
    avatarUrl: req.body.avatarUrl || '',
    createdAt: new Date().toISOString(),
  };
  db.users.push(newUser);
  saveDatabase();
  broadcastRealtime(tenantId, { type: 'USER_CREATED', entity: 'users', action: 'create', payload: sanitizeUser(newUser), id: newUser.id });
  res.status(201).json(sanitizeUser(newUser));
});

app.put('/api/users/:id', (req, res) => {
  const index = db.users.findIndex(u => u.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Usuário não encontrado' });

  if (req.body.name !== undefined && !req.body.name.trim()) {
    return res.status(400).json({ message: 'O nome do usuário não pode ficar vazio.' });
  }

  if (req.body.email) {
    const email = req.body.email.trim().toLowerCase();
    const existingEmail = db.users.find(
      u => u.id !== req.params.id && u.email.trim().toLowerCase() === email && (u.tenantId === db.users[index].tenantId || u.isSuperUser)
    );
    if (existingEmail) {
      return res.status(409).json({ message: 'Já existe outro usuário com este e-mail cadastrado nesta clínica.' });
    }
  }

  db.users[index] = {
    ...db.users[index],
    ...req.body,
    name: req.body.name !== undefined ? req.body.name.trim() : db.users[index].name,
    email: req.body.email !== undefined ? req.body.email.trim().toLowerCase() : db.users[index].email,
    councilType: req.body.councilType !== undefined ? req.body.councilType.trim() : db.users[index].councilType,
    councilNumber: req.body.councilNumber !== undefined ? req.body.councilNumber.trim() : db.users[index].councilNumber,
    specialty: req.body.specialty !== undefined ? req.body.specialty.trim() : db.users[index].specialty,
    phone: req.body.phone !== undefined ? req.body.phone.trim() : db.users[index].phone,
  };
  saveDatabase();
  broadcastRealtime(db.users[index].tenantId, { type: 'USER_UPDATED', entity: 'users', action: 'update', payload: sanitizeUser(db.users[index]), id: db.users[index].id });
  res.json(sanitizeUser(db.users[index]));
});

app.delete('/api/users/:id', (req, res) => {
  const index = db.users.findIndex(u => u.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Usuário não encontrado' });
  const deletedTenant = db.users[index].tenantId;
  db.users.splice(index, 1);
  saveDatabase();
  broadcastRealtime(deletedTenant, { type: 'USER_DELETED', entity: 'users', action: 'delete', id: req.params.id });
  res.json({ message: 'Usuário excluído com sucesso.' });
});

// -------------------------------------------------------------
// PATIENTS API
// -------------------------------------------------------------
app.get('/api/patients', (req, res) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const userId = req.headers['x-user-id'] as string;
  const userRole = req.headers['x-user-role'] as string;
  const userAccessMode = req.headers['x-user-access-mode'] as string;

  const isAdmin = !userRole || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

  // Base list of non-deleted patients
  let list = db.patients.filter(p => !p.deletedAt);

  // If there are multiple distinct tenants registered, and not super admin, filter by tenantId if provided
  if (tenantId && db.tenants.length > 1 && !isAdmin) {
    list = list.filter(p => p.tenantId === tenantId || p.tenantId === 'tenant-demo-1');
  }

  // If regular professional with individual access mode, show their assigned patients + general unassigned patients
  if (userRole === 'PROFESSIONAL' && userAccessMode === 'INDIVIDUAL' && userId) {
    list = list.filter(
      p => p.assignedProfessionalId === userId || !p.assignedProfessionalId || p.assignedProfessionalName === 'Geral'
    );
  }

  res.json(list);
});

// Centralized Bidirectional Multi-Device Sync Endpoint
app.post('/api/sync/bidirectional', (req, res) => {
  const tenantId = (req.headers['x-tenant-id'] as string) || req.body.tenantId || 'tenant-demo-1';
  const { patients = [], packages = [], sessions = [], anamneses = [] } = req.body;

  let hasChanged = false;

  // 1. Reconcile patients
  if (Array.isArray(patients) && patients.length > 0) {
    patients.forEach((clientPatient: Patient) => {
      if (!clientPatient || !clientPatient.name) return;
      const idx = db.patients.findIndex(
        p => p.id === clientPatient.id || (clientPatient.cpf && p.cpf && p.cpf === clientPatient.cpf)
      );
      if (idx === -1) {
        // Patient from client does not exist on server -> add it!
        db.patients.unshift({
          ...clientPatient,
          tenantId: clientPatient.tenantId || tenantId,
          createdAt: clientPatient.createdAt || new Date().toISOString(),
          updatedAt: clientPatient.updatedAt || new Date().toISOString(),
        });
        hasChanged = true;
      } else {
        // Check if client version is newer
        const serverUpdated = new Date(db.patients[idx].updatedAt || 0).getTime();
        const clientUpdated = new Date(clientPatient.updatedAt || 0).getTime();
        if (clientUpdated > serverUpdated) {
          db.patients[idx] = { ...db.patients[idx], ...clientPatient };
          hasChanged = true;
        }
      }
    });
  }

  // 2. Reconcile packages
  if (Array.isArray(packages) && packages.length > 0) {
    packages.forEach((clientPkg: SessionPackage) => {
      if (!clientPkg || !clientPkg.id) return;
      const idx = db.packages.findIndex(p => p.id === clientPkg.id);
      if (idx === -1) {
        db.packages.unshift({
          ...clientPkg,
          tenantId: clientPkg.tenantId || tenantId,
        });
        hasChanged = true;
      } else {
        const serverCreated = new Date(db.packages[idx].createdAt || 0).getTime();
        const clientCreated = new Date(clientPkg.createdAt || 0).getTime();
        if (clientCreated >= serverCreated) {
          db.packages[idx] = { ...db.packages[idx], ...clientPkg };
          hasChanged = true;
        }
      }
    });
  }

  // 3. Reconcile sessions
  if (Array.isArray(sessions) && sessions.length > 0) {
    sessions.forEach((clientSess: Session) => {
      if (!clientSess || !clientSess.id) return;
      const idx = db.sessions.findIndex(s => s.id === clientSess.id);
      if (idx === -1) {
        db.sessions.unshift({
          ...clientSess,
          tenantId: clientSess.tenantId || tenantId,
        });
        hasChanged = true;
      } else {
        db.sessions[idx] = { ...db.sessions[idx], ...clientSess };
        hasChanged = true;
      }
    });
  }

  if (hasChanged) {
    saveDatabase();
    broadcastRealtime(tenantId, { type: 'MULTI_DEVICE_SYNC', entity: 'patients', action: 'sync' });
  }

  res.json({
    success: true,
    patients: db.patients.filter(p => !p.deletedAt),
    packages: db.packages,
    sessions: db.sessions,
    anamneses: db.anamneses,
    users: db.users.map(sanitizeUser),
    tenants: db.tenants,
  });
});

app.get('/api/patients/:id', (req, res) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const patient = db.patients.find(p => p.id === req.params.id && (!tenantId || p.tenantId === tenantId) && !p.deletedAt);
  if (!patient) return res.status(404).json({ message: 'Paciente não encontrado.' });
  res.json(patient);
});

app.post('/api/patients', (req, res) => {
  const tenantId = (req.headers['x-tenant-id'] as string) || req.body.tenantId || 'tenant-demo-1';
  const userId = req.headers['x-user-id'] as string;
  const userName = (req.headers['x-user-name'] as string) || 'Admin';

  const name = (req.body.name || '').trim();
  const phone = (req.body.phone || '').trim();

  if (!name) {
    return res.status(400).json({ message: 'O nome completo do paciente é obrigatório.' });
  }
  if (!phone) {
    return res.status(400).json({ message: 'O telefone do paciente é obrigatório.' });
  }

  const newPatient: Patient = {
    id: req.body.id || `pat-${Date.now()}`,
    tenantId,
    name,
    cpf: (req.body.cpf || '').trim(),
    rg: (req.body.rg || '').trim(),
    gender: req.body.gender || 'Outro',
    phone,
    whatsapp: (req.body.whatsapp || phone).trim(),
    email: (req.body.email || '').trim(),
    profession: (req.body.profession || '').trim(),
    birthDate: req.body.birthDate || '',
    cep: (req.body.cep || '').trim(),
    street: (req.body.street || '').trim(),
    number: (req.body.number || '').trim(),
    complement: (req.body.complement || '').trim(),
    neighborhood: (req.body.neighborhood || '').trim(),
    city: (req.body.city || '').trim(),
    state: (req.body.state || '').trim(),
    referencePoint: (req.body.referencePoint || '').trim(),
    photoUrl: req.body.photoUrl || req.body.avatarUrl || '',
    avatarUrl: req.body.avatarUrl || req.body.photoUrl || '',
    assignedProfessionalId: req.body.assignedProfessionalId || '',
    assignedProfessionalName: req.body.assignedProfessionalName || 'Geral',
    notes: (req.body.notes || '').trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const existingIdx = db.patients.findIndex(p => p.id === newPatient.id);
  if (existingIdx >= 0) {
    db.patients[existingIdx] = { ...db.patients[existingIdx], ...newPatient, updatedAt: new Date().toISOString() };
  } else {
    db.patients.unshift(newPatient);
  }

  saveDatabase();
  broadcastRealtime(tenantId, { type: 'PATIENT_CREATED', entity: 'patients', action: 'create', payload: newPatient, id: newPatient.id });

  logAudit(
    tenantId,
    userId || 'sys',
    userName,
    'ADMIN',
    'CRIAR_PACIENTE',
    'PATIENT',
    newPatient.id,
    req.ip || '127.0.0.1',
    'SUCCESS',
    `Paciente ${newPatient.name} cadastrado com sucesso.`
  );

  res.status(201).json(newPatient);
});

app.put('/api/patients/:id', (req, res) => {
  const tenantId = (req.headers['x-tenant-id'] as string) || req.body.tenantId;
  const index = db.patients.findIndex(p => p.id === req.params.id);

  if (req.body.name !== undefined && !req.body.name.trim()) {
    return res.status(400).json({ message: 'O nome do paciente não pode ficar vazio.' });
  }

  if (req.body.phone !== undefined && !req.body.phone.trim()) {
    return res.status(400).json({ message: 'O telefone do paciente não pode ficar vazio.' });
  }

  if (index === -1) {
    // If not found, create it as upsert
    const created: Patient = {
      id: req.params.id,
      tenantId: tenantId || 'tenant-demo-1',
      name: req.body.name || 'Paciente',
      ...req.body,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    db.patients.unshift(created);
    saveDatabase();
    broadcastRealtime(created.tenantId, { type: 'PATIENT_CREATED', entity: 'patients', action: 'create', payload: created, id: created.id });
    return res.json(created);
  }

  db.patients[index] = {
    ...db.patients[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  saveDatabase();
  broadcastRealtime(db.patients[index].tenantId, { type: 'PATIENT_UPDATED', entity: 'patients', action: 'update', payload: db.patients[index], id: db.patients[index].id });

  logAudit(
    db.patients[index].tenantId,
    (req.headers['x-user-id'] as string) || 'sys',
    (req.headers['x-user-name'] as string) || 'Admin',
    'ADMIN',
    'EDITAR_PACIENTE',
    'PATIENT',
    db.patients[index].id,
    req.ip || '127.0.0.1',
    'SUCCESS',
    `Paciente ${db.patients[index].name} atualizado.`
  );

  res.json(db.patients[index]);
});

app.delete('/api/patients/:id', (req, res) => {
  const index = db.patients.findIndex(p => p.id === req.params.id);
  const tenantId = (req.headers['x-tenant-id'] as string) || (index !== -1 ? db.patients[index].tenantId : 'tenant-demo-1');
  if (index !== -1) {
    db.patients[index].deletedAt = new Date().toISOString();
    saveDatabase();
    broadcastRealtime(tenantId, { type: 'PATIENT_DELETED', entity: 'patients', action: 'delete', id: req.params.id });
  }
  res.json({ message: 'Paciente removido com sucesso.' });
});

// -------------------------------------------------------------
// ANAMNESIS API
// -------------------------------------------------------------
app.get('/api/patients/:patientId/anamnesis', (req, res) => {
  const item = db.anamneses.find(a => a.patientId === req.params.patientId);
  if (!item) return res.status(404).json({ message: 'Anamnese não encontrada' });
  res.json(item);
});

app.post('/api/patients/:patientId/anamnesis', (req, res) => {
  const tenantId = (req.headers['x-tenant-id'] as string) || 'tenant-demo-1';
  const existingIdx = db.anamneses.findIndex(a => a.patientId === req.params.patientId);

  const anamnesisRecord: Anamnesis = {
    id: existingIdx !== -1 ? db.anamneses[existingIdx].id : `anam-${Date.now()}`,
    tenantId,
    patientId: req.params.patientId,
    ...req.body,
    updatedAt: new Date().toISOString(),
  };

  if (existingIdx !== -1) {
    db.anamneses[existingIdx] = anamnesisRecord;
  } else {
    db.anamneses.push(anamnesisRecord);
  }

  saveDatabase();
  broadcastRealtime(tenantId, { type: 'ANAMNESIS_SAVED', entity: 'anamneses', action: 'update', payload: anamnesisRecord, id: anamnesisRecord.id });

  logAudit(
    tenantId,
    (req.headers['x-user-id'] as string) || 'sys',
    (req.headers['x-user-name'] as string) || 'Profissional',
    'PROFESSIONAL',
    'SALVAR_ANAMNESE',
    'ANAMNESIS',
    anamnesisRecord.id,
    req.ip || '127.0.0.1',
    'SUCCESS',
    `Ficha de anamnese salva para paciente ID ${req.params.patientId}.`
  );

  res.json(anamnesisRecord);
});

// -------------------------------------------------------------
// PACKAGES API
// -------------------------------------------------------------
app.get('/api/packages', (req, res) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  let list = db.packages;
  if (tenantId) {
    list = list.filter(p => p.tenantId === tenantId);
  }
  res.json(list);
});

app.post('/api/packages', (req, res) => {
  const tenantId = (req.headers['x-tenant-id'] as string) || req.body.tenantId || 'tenant-demo-1';
  const pat = db.patients.find(p => p.id === req.body.patientId);
  const prof = db.users.find(u => u.id === req.body.professionalId);
  
  const newPackage: SessionPackage = {
    id: req.body.id || `pkg-${Date.now()}`,
    tenantId,
    patientId: req.body.patientId,
    patientName: req.body.patientName || pat?.name || 'Paciente',
    professionalId: req.body.professionalId || '',
    professionalName: req.body.professionalName || prof?.name || 'Profissional',
    title: req.body.title || 'Pacote de Tratamento',
    treatmentType: req.body.treatmentType || req.body.treatmentGoal || 'Massoterapia & Fisioterapia',
    sessionCount: Number(req.body.sessionCount) || 10,
    completedCount: 0,
    price: Number(req.body.price) || Number(req.body.value) || 0,
    validityDate: req.body.validityDate || new Date(Date.now() + 90 * 86400000).toISOString(),
    status: req.body.status || 'ACTIVE',
    createdAt: new Date().toISOString(),
  };

  db.packages.unshift(newPackage);

  // Auto-generate linked sessions for the package
  for (let i = 1; i <= newPackage.sessionCount; i++) {
    const scheduledDate = new Date(Date.now() + (i - 1) * 7 * 86400000).toISOString().split('T')[0];
    const sess: Session = {
      id: `sess-${newPackage.id}-${i}`,
      tenantId,
      packageId: newPackage.id,
      patientId: newPackage.patientId,
      patientName: newPackage.patientName,
      professionalId: newPackage.professionalId,
      professionalName: newPackage.professionalName,
      sessionNumber: i,
      scheduledDate,
      scheduledTime: '14:00',
      procedures: [newPackage.treatmentType],
      status: 'PENDING',
      validationToken: `SESS-${newPackage.id}-${i}-${Date.now().toString(16).toUpperCase()}`,
      createdAt: new Date().toISOString(),
    };
    db.sessions.push(sess);
  }

  saveDatabase();
  broadcastRealtime(tenantId, { type: 'PACKAGE_CREATED', entity: 'packages', action: 'create', payload: newPackage, id: newPackage.id });
  broadcastRealtime(tenantId, { type: 'SESSIONS_SYNC', entity: 'sessions', action: 'sync' });
  res.status(201).json(newPackage);
});

app.put('/api/packages/:id', (req, res) => {
  const index = db.packages.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Pacote não encontrado' });

  db.packages[index] = {
    ...db.packages[index],
    ...req.body,
  };
  saveDatabase();
  broadcastRealtime(db.packages[index].tenantId, { type: 'PACKAGE_UPDATED', entity: 'packages', action: 'update', payload: db.packages[index], id: db.packages[index].id });
  res.json(db.packages[index]);
});

app.delete('/api/packages/:id', (req, res) => {
  const index = db.packages.findIndex(p => p.id === req.params.id);
  const tenantId = (req.headers['x-tenant-id'] as string) || (index !== -1 ? db.packages[index].tenantId : 'tenant-demo-1');
  if (index !== -1) {
    db.packages.splice(index, 1);
    saveDatabase();
    broadcastRealtime(tenantId, { type: 'PACKAGE_DELETED', entity: 'packages', action: 'delete', id: req.params.id });
  }
  res.json({ message: 'Pacote excluído com sucesso.' });
});

// -------------------------------------------------------------
// SESSIONS API
// -------------------------------------------------------------
app.get('/api/sessions', (req, res) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const userId = req.headers['x-user-id'] as string;
  const userRole = req.headers['x-user-role'] as string;
  const userAccessMode = req.headers['x-user-access-mode'] as string;

  let list = db.sessions.filter(s => !tenantId || s.tenantId === tenantId);

  if (userRole === 'PROFESSIONAL' && userAccessMode === 'INDIVIDUAL' && userId) {
    list = list.filter(s => s.professionalId === userId);
  }

  res.json(list);
});

app.post('/api/sessions', (req, res) => {
  const tenantId = (req.headers['x-tenant-id'] as string) || req.body.tenantId || 'tenant-demo-1';
  const newSession: Session = {
    id: req.body.id || `sess-${Date.now()}`,
    tenantId,
    patientId: req.body.patientId,
    patientName: req.body.patientName || 'Paciente',
    packageId: req.body.packageId || undefined,
    sessionNumber: req.body.sessionNumber || 1,
    professionalId: req.body.professionalId || '',
    professionalName: req.body.professionalName || 'Profissional',
    scheduledDate: req.body.scheduledDate || new Date().toISOString(),
    scheduledTime: req.body.scheduledTime || '09:00',
    procedures: req.body.procedures || ['Massoterapia'],
    evolutionText: req.body.evolutionText || req.body.treatmentNotes || '',
    status: req.body.status || 'SCHEDULED',
    validationToken: `SESS-${Date.now().toString(16).toUpperCase()}`,
    attendedAt: req.body.attendedAt,
    createdAt: new Date().toISOString(),
  };

  db.sessions.unshift(newSession);

  if (newSession.packageId && newSession.status === 'COMPLETED') {
    const pkgIndex = db.packages.findIndex(p => p.id === newSession.packageId);
    if (pkgIndex !== -1) {
      const completedCount = db.sessions.filter(s => s.packageId === newSession.packageId && s.status === 'COMPLETED').length;
      db.packages[pkgIndex].completedCount = completedCount;
      if (completedCount >= db.packages[pkgIndex].sessionCount) {
        db.packages[pkgIndex].status = 'COMPLETED';
      }
    }
  }

  saveDatabase();
  broadcastRealtime(tenantId, { type: 'SESSION_CREATED', entity: 'sessions', action: 'create', payload: newSession, id: newSession.id });
  if (newSession.packageId) {
    broadcastRealtime(tenantId, { type: 'PACKAGE_UPDATED', entity: 'packages', action: 'update', id: newSession.packageId });
  }
  res.status(201).json(newSession);
});

app.put('/api/sessions/:id', (req, res) => {
  const index = db.sessions.findIndex(s => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Sessão não encontrada' });

  db.sessions[index] = {
    ...db.sessions[index],
    ...req.body,
  };

  if (db.sessions[index].packageId) {
    const pkgIndex = db.packages.findIndex(p => p.id === db.sessions[index].packageId);
    if (pkgIndex !== -1) {
      const completedCount = db.sessions.filter(
        s => s.packageId === db.sessions[index].packageId && s.status === 'COMPLETED'
      ).length;
      db.packages[pkgIndex].completedCount = completedCount;
      if (completedCount >= db.packages[pkgIndex].sessionCount) {
        db.packages[pkgIndex].status = 'COMPLETED';
      }
    }
  }

  saveDatabase();
  broadcastRealtime(db.sessions[index].tenantId, { type: 'SESSION_UPDATED', entity: 'sessions', action: 'update', payload: db.sessions[index], id: db.sessions[index].id });
  if (db.sessions[index].packageId) {
    broadcastRealtime(db.sessions[index].tenantId, { type: 'PACKAGE_UPDATED', entity: 'packages', action: 'update', id: db.sessions[index].packageId });
  }
  res.json(db.sessions[index]);
});

app.delete('/api/sessions/:id', (req, res) => {
  const index = db.sessions.findIndex(s => s.id === req.params.id);
  const tenantId = (req.headers['x-tenant-id'] as string) || (index !== -1 ? db.sessions[index].tenantId : 'tenant-demo-1');
  if (index !== -1) {
    const pkgId = db.sessions[index].packageId;
    db.sessions.splice(index, 1);
    saveDatabase();
    broadcastRealtime(tenantId, { type: 'SESSION_DELETED', entity: 'sessions', action: 'delete', id: req.params.id });
    if (pkgId) {
      broadcastRealtime(tenantId, { type: 'PACKAGE_UPDATED', entity: 'packages', action: 'update', id: pkgId });
    }
  }
  res.json({ message: 'Sessão excluída com sucesso.' });
});

// Direct Session Signature
app.post('/api/sessions/:id/sign-direct', (req, res) => {
  const { signatureUrl } = req.body;
  const index = db.sessions.findIndex(s => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Sessão não encontrada' });

  const current = db.sessions[index];
  db.sessions[index] = {
    ...current,
    clientSignatureUrl: signatureUrl,
    clientConfirmedAt: new Date().toISOString(),
    clientConfirmedIp: req.ip || '127.0.0.1',
    status: 'COMPLETED',
    attendedAt: current.attendedAt || new Date().toISOString(),
  };

  if (current.packageId) {
    const pkgIndex = db.packages.findIndex(p => p.id === current.packageId);
    if (pkgIndex !== -1) {
      const completedCount = db.sessions.filter(s => s.packageId === current.packageId && s.status === 'COMPLETED').length;
      db.packages[pkgIndex].completedCount = completedCount;
      if (completedCount >= db.packages[pkgIndex].sessionCount) {
        db.packages[pkgIndex].status = 'COMPLETED';
      }
    }
  }

  const pat = db.patients.find(p => p.id === current.patientId);
  db.signatures.unshift({
    id: `sig-${Date.now()}`,
    tenantId: current.tenantId,
    patientId: current.patientId,
    patientName: pat ? pat.name : current.patientName,
    documentType: 'SESSION_CONFIRMATION',
    referenceId: current.id,
    signatureUrl,
    signedByName: pat ? pat.name : current.patientName,
    signedAt: new Date().toISOString(),
    ipAddress: req.ip || '127.0.0.1',
    hash: `SIG-SESS-${Date.now().toString(16).toUpperCase()}`,
  });

  saveDatabase();
  broadcastRealtime(current.tenantId, { type: 'SESSION_UPDATED', entity: 'sessions', action: 'update', payload: db.sessions[index], id: db.sessions[index].id });
  if (current.packageId) {
    broadcastRealtime(current.tenantId, { type: 'PACKAGE_UPDATED', entity: 'packages', action: 'update', id: current.packageId });
  }
  res.json(db.sessions[index]);
});

// -------------------------------------------------------------
// PUBLIC SESSION & PACKAGE VALIDATION API (NO LOGIN REQUIRED)
// -------------------------------------------------------------

// Helper to decode Base64 UTF-8 payload if sent by client URL
function decodePayloadServer<T = any>(raw: string): T | null {
  if (!raw) return null;
  try {
    const decodedUrl = decodeURIComponent(raw).trim();
    const binaryStr = Buffer.from(decodedUrl, 'base64').toString('utf8');
    return JSON.parse(binaryStr) as T;
  } catch (e1) {
    try {
      const binaryStr = Buffer.from(raw, 'base64').toString('utf8');
      return JSON.parse(binaryStr) as T;
    } catch {
      return null;
    }
  }
}

// Helper to find or materialize stub session
function findOrCreateSessionByToken(rawToken: string, payloadData?: string): Session | null {
  if (!rawToken && !payloadData) return null;
  const token = rawToken ? decodeURIComponent(rawToken).trim() : '';

  // 0. If base64 payloadData is provided or token is base64 JSON
  const payload = decodePayloadServer(payloadData || '') || (token.startsWith('eyJ') ? decodePayloadServer(token) : null);
  if (payload && payload.sid) {
    let existing = db.sessions.find(s => s.id === payload.sid || s.validationToken === payload.sid || s.id === `sess-${payload.sid}`);
    if (existing) return existing;

    // Materialize session from signed payload
    const newSession: Session = {
      id: payload.sid,
      tenantId: payload.tid || (db.tenants[0]?.id || 'tenant-1'),
      packageId: payload.pid || undefined,
      patientId: payload.patid || `pat-auto-${Date.now()}`,
      patientName: payload.pname || 'Paciente',
      professionalId: db.users[0]?.id || 'user-1',
      professionalName: db.users[0]?.name || 'Profissional',
      sessionNumber: payload.snum || 1,
      scheduledDate: payload.sdate || new Date().toISOString().split('T')[0],
      scheduledTime: payload.stime || '14:00',
      procedures: payload.procs || ['Massoterapia'],
      status: 'PENDING',
      validationToken: payload.sid,
      createdAt: new Date().toISOString(),
    };
    db.sessions.unshift(newSession);

    // Also ensure patient exists in db
    if (!db.patients.find(p => p.id === newSession.patientId)) {
      db.patients.unshift({
        id: newSession.patientId,
        tenantId: newSession.tenantId,
        name: newSession.patientName,
        cpf: '',
        phone: '',
        whatsapp: '',
        profession: '',
        birthDate: '',
        cep: '',
        street: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
        email: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Also ensure package exists in db if provided
    if (payload.pid && !db.packages.find(p => p.id === payload.pid)) {
      db.packages.unshift({
        id: payload.pid,
        tenantId: newSession.tenantId,
        patientId: newSession.patientId,
        patientName: newSession.patientName,
        professionalId: db.users[0]?.id || 'user-1',
        professionalName: db.users[0]?.name || 'Profissional',
        title: payload.ptitle || 'Pacote de Sessões',
        treatmentType: (payload.procs && payload.procs[0]) || 'Massoterapia',
        sessionCount: payload.scount || 5,
        completedCount: (payload.snum || 1) - 1,
        price: 0,
        validityDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      });
    }

    saveDatabase();
    return newSession;
  }

  // 1. Direct match by validationToken or id (case-insensitive or exact)
  let session = db.sessions.find(
    s =>
      s.validationToken === token ||
      s.id === token ||
      s.id === `sess-${token}` ||
      (s.validationToken && s.validationToken.toLowerCase() === token.toLowerCase()) ||
      (s.id && s.id.toLowerCase() === token.toLowerCase())
  );
  if (session) return session;

  // 2. Check if token has sess-stub- or sess-pkg- or pkg- format
  let cleanToken = token;
  if (cleanToken.startsWith('sess-stub-')) {
    cleanToken = cleanToken.replace('sess-stub-', '');
  } else if (cleanToken.startsWith('sess-')) {
    cleanToken = cleanToken.replace('sess-', '');
  }

  // cleanToken could be "pkg-1771283626294-1" or "pkg-1-2"
  const lastDash = cleanToken.lastIndexOf('-');
  if (lastDash !== -1) {
    const pkgId = cleanToken.substring(0, lastDash);
    const sessionNum = parseInt(cleanToken.substring(lastDash + 1), 10);

    if (pkgId && !isNaN(sessionNum)) {
      // Find matching session in db by packageId and sessionNumber
      const existing = db.sessions.find(
        s =>
          (s.packageId === pkgId ||
            s.packageId === `pkg-${pkgId}` ||
            s.packageId === cleanToken ||
            s.id.includes(cleanToken)) &&
          s.sessionNumber === sessionNum
      );
      if (existing) return existing;

      // Find the package in db
      const pkg = db.packages.find(p => p.id === pkgId || p.id === `pkg-${pkgId}`);
      if (pkg) {
        const scheduledDate = new Date(Date.now() + (sessionNum - 1) * 7 * 86400000).toISOString().split('T')[0];
        const newSession: Session = {
          id: token.startsWith('sess-') ? token : `sess-${token}`,
          tenantId: pkg.tenantId,
          packageId: pkg.id,
          patientId: pkg.patientId,
          patientName: pkg.patientName,
          professionalId: pkg.professionalId,
          professionalName: pkg.professionalName,
          sessionNumber: sessionNum,
          scheduledDate,
          scheduledTime: '14:00',
          procedures: [pkg.treatmentType],
          status: 'PENDING',
          validationToken: `SESS-${pkg.id}-${sessionNum}-${Date.now().toString(16).toUpperCase()}`,
          createdAt: new Date().toISOString(),
        };
        db.sessions.unshift(newSession);
        saveDatabase();
        return newSession;
      }
    }
  }

  // 3. Check if token is just a packageId
  const directPkg = db.packages.find(p => p.id === token || p.id === `pkg-${token}`);
  if (directPkg) {
    // Return first pending session or first session
    const firstPending = db.sessions.find(s => s.packageId === directPkg.id && s.status !== 'COMPLETED') ||
      db.sessions.find(s => s.packageId === directPkg.id);
    if (firstPending) return firstPending;
  }

  return null;
}

// Get Session Data for Public Validation
app.get('/api/public/validate/:token', (req, res) => {
  const token = req.params.token;
  if (!token) return res.status(400).json({ message: 'Token não fornecido.' });

  const session = findOrCreateSessionByToken(token, (req.query.d || req.query.data) as string);

  if (!session) {
    return res.status(404).json({ message: 'Sessão de atendimento não encontrada ou link expirado.' });
  }

  const patient = db.patients.find(p => p.id === session.patientId);
  const tenant = db.tenants.find(t => t.id === session.tenantId) || db.tenants[0];
  const pkg = session.packageId ? db.packages.find(p => p.id === session.packageId) : null;
  const professional = db.users.find(u => u.id === session.professionalId);

  // Get all sessions of this package for progress view
  let allSessions: any[] = [];
  if (pkg) {
    for (let i = 1; i <= pkg.sessionCount; i++) {
      const existing = db.sessions.find(s => s.packageId === pkg.id && s.sessionNumber === i);
      if (existing) {
        allSessions.push({
          sessionNumber: i,
          status: existing.status,
          isCurrent: existing.id === session.id || existing.sessionNumber === session.sessionNumber,
          hasSignature: !!existing.clientSignatureUrl,
          attendedAt: existing.attendedAt,
        });
      } else {
        allSessions.push({
          sessionNumber: i,
          status: 'PENDING',
          isCurrent: session.sessionNumber === i,
          hasSignature: false,
        });
      }
    }
  }

  const isAlreadySigned = !!session.clientSignatureUrl;

  res.json({
    session,
    patient: patient ? { id: patient.id, name: patient.name, phone: patient.phone, cpf: patient.cpf } : { id: session.patientId, name: session.patientName },
    tenant: tenant ? { id: tenant.id, name: tenant.name, tradeName: tenant.tradeName, logoUrl: tenant.logoUrl, phone: tenant.phone } : null,
    package: pkg ? { id: pkg.id, title: pkg.title, sessionCount: pkg.sessionCount, treatmentType: pkg.treatmentType } : null,
    professionalName: session.professionalName || professional?.name || 'Profissional da Clínica',
    allSessions,
    isAlreadySigned,
    signedAt: session.clientConfirmedAt || session.attendedAt,
    clientSignatureUrl: session.clientSignatureUrl || null,
  });
});

// Common handler for Confirming Public Attendance
function handlePublicConfirm(req: express.Request, res: express.Response) {
  const token = req.params.token || req.body.token || req.body.sessionId;
  const signatureUrl = req.body.signatureUrl || req.body.signature || (typeof req.body === 'string' ? req.body : '');
  const payloadData = req.body.payloadData || req.body.d || req.query.d;

  if (!token && !payloadData) {
    return res.status(400).json({ message: 'Token de validação é obrigatório.' });
  }
  if (!signatureUrl) {
    return res.status(400).json({ message: 'Assinatura digital é obrigatória.' });
  }

  let session = findOrCreateSessionByToken(token, payloadData as string);
  if (!session) {
    return res.status(404).json({ message: 'Sessão de atendimento não encontrada.' });
  }

  const index = db.sessions.findIndex(s => s.id === session!.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Sessão não encontrada no banco de dados.' });
  }

  const current = db.sessions[index];

  // ANTI-RE-SIGNING CHECK: If session is already signed, prevent overwriting
  if (current.clientSignatureUrl) {
    return res.json({
      success: true,
      alreadySigned: true,
      message: 'Esta sessão já foi assinada anteriormente.',
      session: current,
    });
  }

  const nowIso = new Date().toISOString();
  const confirmedIp = req.ip || req.socket.remoteAddress || '127.0.0.1';

  db.sessions[index] = {
    ...current,
    clientSignatureUrl: signatureUrl,
    clientConfirmedAt: nowIso,
    clientConfirmedIp: confirmedIp,
    status: 'COMPLETED',
    attendedAt: current.attendedAt || nowIso,
  };

  // Update Package progress
  if (current.packageId) {
    const pkgIndex = db.packages.findIndex(p => p.id === current.packageId);
    if (pkgIndex !== -1) {
      const completedCount = db.sessions.filter(
        s => s.packageId === current.packageId && s.status === 'COMPLETED'
      ).length;
      db.packages[pkgIndex].completedCount = completedCount;
      if (completedCount >= db.packages[pkgIndex].sessionCount) {
        db.packages[pkgIndex].status = 'COMPLETED';
      }
    }
  }

  // Register in signatures table
  const pat = db.patients.find(p => p.id === current.patientId);
  db.signatures.unshift({
    id: `sig-pub-${Date.now()}`,
    tenantId: current.tenantId,
    patientId: current.patientId,
    patientName: pat ? pat.name : current.patientName,
    documentType: 'SESSION_CONFIRMATION',
    referenceId: current.id,
    signatureUrl,
    signedByName: pat ? pat.name : current.patientName,
    signedAt: nowIso,
    ipAddress: confirmedIp,
    hash: `SIG-WHATSAPP-${Date.now().toString(16).toUpperCase()}`,
  });

  // Log Audit
  logAudit(
    current.tenantId,
    'public-client',
    pat ? pat.name : current.patientName,
    'PROFESSIONAL',
    'ASSINAR_SESSAO_WHATSAPP',
    'SESSION',
    current.id,
    confirmedIp,
    'SUCCESS',
    `Assinatura de ciente da Sessão #${current.sessionNumber} registrada via WhatsApp/Link público pelo paciente.`
  );

  saveDatabase();
  broadcastRealtime(current.tenantId, { type: 'SESSION_UPDATED', entity: 'sessions', action: 'update', payload: db.sessions[index], id: db.sessions[index].id });
  if (current.packageId) {
    broadcastRealtime(current.tenantId, { type: 'PACKAGE_UPDATED', entity: 'packages', action: 'update', id: current.packageId });
  }
  return res.json({ success: true, session: db.sessions[index] });
}

// Confirm Public Attendance with Client Signature (Supports both POST /api/public/confirm and POST /api/public/confirm/:token)
app.post('/api/public/confirm', handlePublicConfirm);
app.post('/api/public/confirm/:token', handlePublicConfirm);

// Package Validation Routes
app.get('/api/public/package-validate/:token', (req, res) => {
  const token = req.params.token;
  const pkg = db.packages.find(p => p.id === token || p.id === `pkg-${token}`);
  if (!pkg) return res.status(404).json({ message: 'Pacote não encontrado.' });

  const patient = db.patients.find(p => p.id === pkg.patientId);
  const tenant = db.tenants.find(t => t.id === pkg.tenantId) || db.tenants[0];
  const pkgSessions = db.sessions.filter(s => s.packageId === pkg.id);

  res.json({
    package: pkg,
    patient,
    tenant,
    sessions: pkgSessions,
    isAlreadySigned: !!pkg.signedTermUrl,
  });
});

app.post('/api/public/confirm-package/:token', (req, res) => {
  const token = req.params.token;
  const { signatureUrl } = req.body;
  const pkgIndex = db.packages.findIndex(p => p.id === token || p.id === `pkg-${token}`);
  if (pkgIndex === -1) return res.status(404).json({ message: 'Pacote não encontrado.' });

  const current = db.packages[pkgIndex];
  if (current.signedTermUrl) {
    return res.json({ success: true, alreadySigned: true, package: current });
  }

  db.packages[pkgIndex] = {
    ...current,
    signedTermUrl: signatureUrl,
    signedAt: new Date().toISOString(),
  };

  saveDatabase();
  broadcastRealtime(current.tenantId, { type: 'PACKAGE_UPDATED', entity: 'packages', action: 'update', payload: db.packages[pkgIndex], id: db.packages[pkgIndex].id });
  res.json({ success: true, package: db.packages[pkgIndex] });
});

// Evolutions
app.get('/api/patients/:patientId/evolutions', (req, res) => {
  const list = db.evolutions.filter(e => e.patientId === req.params.patientId);
  res.json(list);
});

app.post('/api/patients/:patientId/evolutions', (req, res) => {
  const tenantId = (req.headers['x-tenant-id'] as string) || 'tenant-demo-1';
  const newEvolution = {
    id: req.body.id || `evo-${Date.now()}`,
    tenantId,
    patientId: req.params.patientId,
    professionalId: (req.headers['x-user-id'] as string) || req.body.professionalId || '',
    professionalName: (req.headers['x-user-name'] as string) || req.body.professionalName || 'Profissional',
    date: req.body.date || new Date().toISOString().split('T')[0],
    text: req.body.text || req.body.evolutionText || '',
    painLevel: req.body.painLevel !== undefined ? Number(req.body.painLevel) : 0,
    proceduresDone: req.body.proceduresDone || [],
    createdAt: new Date().toISOString(),
  };
  db.evolutions.unshift(newEvolution as any);
  saveDatabase();
  broadcastRealtime(tenantId, { type: 'EVOLUTION_CREATED', entity: 'evolutions', action: 'create', payload: newEvolution, id: newEvolution.id });
  res.status(201).json(newEvolution);
});

// Documents
app.get('/api/patients/:patientId/documents', (req, res) => {
  const list = db.documentFiles.filter(d => d.patientId === req.params.patientId);
  res.json(list);
});

app.post('/api/patients/:patientId/documents', (req, res) => {
  const newDoc: DocumentFile = {
    id: `doc-${Date.now()}`,
    tenantId: (req.headers['x-tenant-id'] as string) || 'tenant-demo-1',
    patientId: req.params.patientId,
    uploadedByUserId: (req.headers['x-user-id'] as string) || 'sys',
    uploadedByName: (req.headers['x-user-name'] as string) || 'Usuário',
    fileName: req.body.fileName,
    fileType: req.body.fileType || 'application/pdf',
    fileSize: req.body.fileSize || 512000,
    fileUrl: req.body.fileUrl || '',
    category: req.body.category || 'PDF',
    uploadedAt: new Date().toISOString(),
  };
  db.documentFiles.unshift(newDoc);
  saveDatabase();
  broadcastRealtime(newDoc.tenantId, { type: 'DOCUMENTS_SYNC', entity: 'documents', action: 'sync' });
  res.status(201).json(newDoc);
});

app.delete('/api/patients/:patientId/documents/:id', (req, res) => {
  const doc = db.documentFiles.find(d => d.id === req.params.id);
  const tenantId = doc?.tenantId || (req.headers['x-tenant-id'] as string) || 'tenant-demo-1';
  db.documentFiles = db.documentFiles.filter(d => d.id !== req.params.id);
  saveDatabase();
  broadcastRealtime(tenantId, { type: 'DOCUMENTS_SYNC', entity: 'documents', action: 'sync' });
  res.status(204).send();
});

// Signatures
app.get('/api/patients/:patientId/signatures', (req, res) => {
  const list = db.signatures.filter(s => s.patientId === req.params.patientId);
  res.json(list);
});

// Audit Logs
app.get('/api/audit-logs', (req, res) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  let list = db.auditLogs;
  if (tenantId) {
    list = list.filter(l => l.tenantId === tenantId);
  }
  res.json(list);
});

// -------------------------------------------------------------
// BACKUP & RESTORE / SNAPSHOTS API
// -------------------------------------------------------------

// Export Complete Backup JSON
app.get('/api/backup/export', (req, res) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const userId = (req.headers['x-user-id'] as string) || 'sys';
  const userName = (req.headers['x-user-name'] as string) || 'Admin';

  const tenant = db.tenants.find(t => t.id === tenantId) || db.tenants[0];

  const backupData = {
    schemaVersion: '2.5.0',
    system: 'Fisioterapia & Massoterapia Pro Clinical Engine',
    exportedAt: new Date().toISOString(),
    exportedBy: {
      userId,
      userName,
    },
    tenant: {
      id: tenant.id,
      name: tenant.name,
      tradeName: tenant.tradeName,
    },
    summary: {
      tenantsCount: db.tenants.length,
      usersCount: db.users.length,
      patientsCount: db.patients.length,
      anamnesesCount: db.anamneses.length,
      sessionsCount: db.sessions.length,
      packagesCount: db.packages.length,
      evolutionsCount: db.evolutions.length,
      signaturesCount: db.signatures.length,
      documentsCount: db.documentFiles.length,
      auditLogsCount: db.auditLogs.length,
    },
    database: {
      tenants: db.tenants,
      users: db.users.map(sanitizeUser),
      patients: db.patients,
      anamneses: db.anamneses,
      packages: db.packages,
      sessions: db.sessions,
      evolutions: db.evolutions,
      signatures: db.signatures,
      documentFiles: db.documentFiles,
      auditLogs: db.auditLogs,
    },
  };

  const rawJson = JSON.stringify(backupData);
  const checksum = crypto.createHash('sha256').update(rawJson).digest('hex');

  logAudit(
    tenant.id,
    userId,
    userName,
    'ADMIN',
    'EXPORT_BACKUP',
    'SYSTEM',
    'backup',
    req.ip || '127.0.0.1',
    'SUCCESS',
    `Backup exportado com sucesso contendo ${db.patients.length} pacientes e ${db.sessions.length} sessões.`
  );

  res.setHeader('Content-Type', 'application/json');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="backup-fisiopro-${new Date().toISOString().slice(0, 10)}.json"`
  );

  res.json({
    ...backupData,
    checksum,
  });
});

// Restore Complete Backup from JSON Payload
app.post('/api/backup/restore', (req, res) => {
  const { database, tenant, schemaVersion } = req.body;
  const userId = (req.headers['x-user-id'] as string) || 'sys';
  const userName = (req.headers['x-user-name'] as string) || 'Admin';

  if (!database || typeof database !== 'object') {
    return res.status(400).json({ message: 'Arquivo de backup inválido ou estrutura corrompida.' });
  }

  // Create an immediate safety snapshot before applying restore
  createSnapshot('pre-restore-safety');

  try {
    // Safely update in-memory database
    if (Array.isArray(database.tenants) && database.tenants.length > 0) {
      db.tenants = database.tenants;
    }
    if (Array.isArray(database.users) && database.users.length > 0) {
      // Merge users, keeping super user safe
      db.users = database.users;
      if (!db.users.some(u => u.email.toLowerCase() === 'osaiasbrito@gmail.com')) {
        db.users.push(DEFAULT_USERS[0]);
      }
    }
    if (Array.isArray(database.patients)) {
      db.patients = database.patients;
    }
    if (Array.isArray(database.anamneses)) {
      db.anamneses = database.anamneses;
    }
    if (Array.isArray(database.packages)) {
      db.packages = database.packages;
    }
    if (Array.isArray(database.sessions)) {
      db.sessions = database.sessions;
    }
    if (Array.isArray(database.evolutions)) {
      db.evolutions = database.evolutions;
    }
    if (Array.isArray(database.signatures)) {
      db.signatures = database.signatures;
    }
    if (Array.isArray(database.documentFiles)) {
      db.documentFiles = database.documentFiles;
    }
    if (Array.isArray(database.auditLogs)) {
      db.auditLogs = database.auditLogs;
    }

    saveDatabase();

    // Broadcast sync to all tenants connected
    db.tenants.forEach(t => {
      broadcastRealtime(t.id, { type: 'FULL_DATABASE_RESTORED', entity: 'patients', action: 'sync' });
    });

    logAudit(
      db.tenants[0]?.id || 'tenant-1',
      userId,
      userName,
      'ADMIN',
      'RESTORE_BACKUP',
      'SYSTEM',
      'backup',
      req.ip || '127.0.0.1',
      'SUCCESS',
      `Restauração de banco concluída com ${db.patients.length} pacientes e ${db.sessions.length} sessões.`
    );

    res.json({
      success: true,
      message: 'Banco de dados restaurado com sucesso!',
      restoredSummary: {
        patients: db.patients.length,
        sessions: db.sessions.length,
        anamneses: db.anamneses.length,
        packages: db.packages.length,
        users: db.users.length,
      },
    });
  } catch (err) {
    console.error('Erro na restauração do backup:', err);
    res.status(500).json({ message: 'Erro ao processar restauração do banco de dados.' });
  }
});

// List Available Disk Snapshots
app.get('/api/backup/snapshots', (req, res) => {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      return res.json([]);
    }

    const files = fs
      .readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('snapshot-') && f.endsWith('.json'))
      .sort((a, b) => b.localeCompare(a));

    const list = files.map(file => {
      const stats = fs.statSync(path.join(BACKUP_DIR, file));
      return {
        filename: file,
        sizeBytes: stats.size,
        createdAt: stats.birthtime || stats.mtime,
      };
    });

    res.json(list);
  } catch (err) {
    console.error('Erro ao listar snapshots:', err);
    res.status(500).json({ message: 'Erro ao listar snapshots de backup.' });
  }
});

// Create Manual Snapshot on Demand
app.post('/api/backup/snapshot-create', (req, res) => {
  const label = req.body.label ? req.body.label.replace(/[^a-zA-Z0-9_-]/g, '') : 'manual';
  const result = createSnapshot(label);
  if (!result) {
    return res.status(500).json({ message: 'Falha ao gerar snapshot no disco.' });
  }
  res.json({
    success: true,
    message: 'Snapshot criado com sucesso!',
    snapshot: result,
  });
});

// Restore from a Specific Disk Snapshot File
app.post('/api/backup/snapshot-restore/:filename', (req, res) => {
  const filename = req.params.filename;
  // Security check against directory traversal
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({ message: 'Nome de arquivo inválido.' });
  }

  const filepath = path.join(BACKUP_DIR, filename);
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ message: 'Arquivo de snapshot não encontrado.' });
  }

  try {
    // Safety backup before restoring
    createSnapshot('pre-snapshot-restore');

    const raw = fs.readFileSync(filepath, 'utf-8');
    const parsed = JSON.parse(raw);
    const store = parsed.store || parsed;

    db = {
      tenants: Array.isArray(store.tenants) && store.tenants.length > 0 ? store.tenants : db.tenants,
      users: Array.isArray(store.users) && store.users.length > 0 ? store.users : db.users,
      patients: Array.isArray(store.patients) ? store.patients : db.patients,
      anamneses: Array.isArray(store.anamneses) ? store.anamneses : db.anamneses,
      packages: Array.isArray(store.packages) ? store.packages : db.packages,
      sessions: Array.isArray(store.sessions) ? store.sessions : db.sessions,
      evolutions: Array.isArray(store.evolutions) ? store.evolutions : db.evolutions,
      publicTokens: Array.isArray(store.publicTokens) ? store.publicTokens : db.publicTokens,
      auditLogs: Array.isArray(store.auditLogs) ? store.auditLogs : db.auditLogs,
      documentFiles: Array.isArray(store.documentFiles) ? store.documentFiles : db.documentFiles,
      signatures: Array.isArray(store.signatures) ? store.signatures : db.signatures,
    };

    saveDatabase();

    db.tenants.forEach(t => {
      broadcastRealtime(t.id, { type: 'SNAPSHOT_RESTORED', entity: 'patients', action: 'sync' });
    });

    res.json({
      success: true,
      message: `Snapshot ${filename} restaurado com sucesso!`,
      summary: {
        patients: db.patients.length,
        sessions: db.sessions.length,
        users: db.users.length,
      },
    });
  } catch (err) {
    console.error('Erro ao restaurar snapshot:', err);
    res.status(500).json({ message: 'Falha ao restaurar dados do snapshot.' });
  }
});

// Download a Specific Disk Snapshot
app.get('/api/backup/snapshot-download/:filename', (req, res) => {
  const filename = req.params.filename;
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({ message: 'Nome de arquivo inválido.' });
  }

  const filepath = path.join(BACKUP_DIR, filename);
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ message: 'Arquivo não encontrado.' });
  }

  res.download(filepath, filename);
});

// -------------------------------------------------------------
// SUPER USER DATABASE CONNECTION TEST & DIAGNOSTIC
// (Exclusivo para Super Usuário / Desenvolvedor)
// -------------------------------------------------------------
const handleTestDbConnection = async (req: express.Request, res: express.Response) => {
  const startTime = Date.now();

  // Super User Authorization Verification
  const superUserEmails = ['osaiasbrito@gmail.com', 'senhordispositivos@gmail.com'];
  const emailHeader = ((req.headers['x-user-email'] as string) || '').toLowerCase().trim();
  const userIdHeader = (req.headers['x-user-id'] as string) || '';
  const isSuperHeader = req.headers['x-user-is-superuser'] === 'true';

  const bodyEmail = (req.body?.email || '').toLowerCase().trim();
  const bodyIsSuper = req.body?.isSuperUser === true;

  const foundUser = db.users.find(
    u =>
      (emailHeader && u.email.toLowerCase() === emailHeader) ||
      (userIdHeader && u.id === userIdHeader) ||
      (bodyEmail && u.email.toLowerCase() === bodyEmail)
  );

  const isSuperUser = Boolean(
    superUserEmails.includes(emailHeader) ||
      superUserEmails.includes(bodyEmail) ||
      isSuperHeader ||
      bodyIsSuper ||
      (foundUser && (foundUser.isSuperUser || foundUser.role === 'SUPER_ADMIN' || superUserEmails.includes(foundUser.email.toLowerCase())))
  );

  if (!isSuperUser) {
    return res.status(403).json({
      success: false,
      status: 'OFFLINE',
      isSuperUser: false,
      testedAt: new Date().toISOString(),
      responseTimeMs: Date.now() - startTime,
      message: 'Acesso Negado: O teste de conexão com o banco de dados é um recurso de diagnóstico EXCLUSIVO do Super Usuário (Desenvolvedor).',
    });
  }

  // 1. Test PostgreSQL Pool Connection
  let pgResult: {
    configured: boolean;
    connected: boolean;
    latencyMs?: number;
    databaseName?: string;
    serverVersion?: string;
    tablesCount?: number;
    existingTables?: string[];
    totalRowsCount?: number;
    error?: string | null;
  } = {
    configured: hasSqlConfig,
    connected: false,
    error: null,
  };

  if (hasSqlConfig && pool) {
    const pgStart = Date.now();
    try {
      // Ensure tables exist
      await ensurePostgresSchema();

      // Query ping & metadata
      const pingRes = await pool.query('SELECT 1 as ping, current_database() as db_name, version() as pg_version, NOW() as server_now');
      const pgLatency = Date.now() - pgStart;

      // Query tables count & names
      const tablesRes = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name ASC
      `);

      const tableNames = tablesRes.rows.map((r: any) => r.table_name);

      // Query row counts in core tables safely
      let totalRows = 0;
      for (const t of ['tenants', 'users', 'patients', 'sessions', 'packages', 'anamneses', 'evolutions', 'signatures']) {
        if (tableNames.includes(t)) {
          try {
            const countRes = await pool.query(`SELECT COUNT(*) as cnt FROM "${t}"`);
            totalRows += parseInt(countRes.rows[0]?.cnt || '0', 10);
          } catch (_) {}
        }
      }

      pgResult = {
        configured: true,
        connected: true,
        latencyMs: pgLatency,
        databaseName: pingRes.rows[0]?.db_name || 'postgres',
        serverVersion: pingRes.rows[0]?.pg_version?.split(',')[0] || 'PostgreSQL 15',
        tablesCount: tableNames.length,
        existingTables: tableNames,
        totalRowsCount: totalRows,
        error: null,
      };
    } catch (pgErr: any) {
      pgResult = {
        configured: true,
        connected: false,
        latencyMs: Date.now() - pgStart,
        error: pgErr?.message || 'Falha ao conectar com o pool PostgreSQL',
      };
    }
  } else {
    pgResult = {
      configured: false,
      connected: false,
      error: 'Variáveis de conexão PostgreSQL (DATABASE_URL) não configuradas no ambiente.',
    };
  }

  // 2. Test Supabase Direct REST API Connectivity
  const supabaseUrl = 'https://bvggeztgmorusfkedsbj.supabase.co';
  const supabaseAnonKey = 'sb_publishable_xhWUFn_vVcVsV1KpLqPBKQ_duFVj-tV';
  let supabaseResult: {
    configured: boolean;
    connected: boolean;
    url?: string;
    error?: string | null;
  } = {
    configured: Boolean(supabaseUrl && supabaseAnonKey),
    connected: false,
    url: supabaseUrl,
    error: null,
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const resp = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseAnonKey}`, {
      method: 'GET',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (resp.ok || resp.status === 200 || resp.status === 404 || resp.status === 401) {
      supabaseResult.connected = true;
    } else {
      supabaseResult.error = `HTTP ${resp.status} ${resp.statusText}`;
    }
  } catch (sbErr: any) {
    supabaseResult.connected = false;
    supabaseResult.error = sbErr?.name === 'AbortError' ? 'Timeout de conexão ao Supabase (> 6s)' : sbErr?.message || 'Erro ao conectar ao endpoint Supabase';
  }

  // 3. Test Local Atomic JSON Storage
  let fileSizeKb = 0;
  try {
    if (fs.existsSync(DB_FILE)) {
      const stats = fs.statSync(DB_FILE);
      fileSizeKb = Math.round(stats.size / 1024);
    }
  } catch (_) {}

  let snapshotsCount = 0;
  try {
    if (fs.existsSync(BACKUP_DIR)) {
      snapshotsCount = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith('snapshot-') && f.endsWith('.json')).length;
    }
  } catch (_) {}

  const localStoreResult = {
    status: 'HEALTHY' as const,
    recordsCount: {
      tenants: db.tenants.length,
      users: db.users.length,
      patients: db.patients.length,
      sessions: db.sessions.length,
      packages: db.packages.length,
      anamneses: db.anamneses.length,
      evolutions: db.evolutions.length,
      signatures: db.signatures.length,
      documents: db.documentFiles.length,
      auditLogs: db.auditLogs.length,
    },
    snapshotsCount,
    databaseFileSizeKb: fileSizeKb,
  };

  const totalResponseTimeMs = Date.now() - startTime;

  // Determine overall status
  const isOnline = (pgResult.connected && supabaseResult.connected) || pgResult.connected;
  const isDegraded = !pgResult.connected && (supabaseResult.connected || localStoreResult.recordsCount.patients > 0);
  const status: 'ONLINE' | 'DEGRADED' | 'OFFLINE' = isOnline ? 'ONLINE' : isDegraded ? 'DEGRADED' : 'OFFLINE';

  const message = isOnline
    ? `Conexão com o Banco de Dados Relacional PostgreSQL & Supabase estabelecida com sucesso (${pgResult.latencyMs || totalResponseTimeMs}ms). Todas as tabelas e persistência estão ativas!`
    : isDegraded
    ? `Conexão com PostgreSQL em modo de contingência local. Persistência atômica em disco ativa com ${localStoreResult.recordsCount.patients} pacientes e ${snapshotsCount} snapshots.`
    : `Falha na conexão com o banco remoto: ${pgResult.error || 'Verifique as credenciais no .env'}`;

  // Audit log the diagnostic test
  try {
    logAudit(
      db.tenants[0]?.id || 'tenant-1',
      userIdHeader || foundUser?.id || 'sys-super',
      foundUser?.name || emailHeader || 'Super Usuário',
      'SUPER_ADMIN',
      'TEST_DB_CONNECTION',
      'DATABASE',
      'database-engine',
      req.ip || '127.0.0.1',
      status === 'OFFLINE' ? 'FAILURE' : 'SUCCESS',
      `Diagnóstico de banco de dados executado pelo Super Usuário. Status: ${status}. Tempo de resposta: ${totalResponseTimeMs}ms.`
    );
  } catch (_) {}

  return res.json({
    success: status !== 'OFFLINE',
    status,
    testedAt: new Date().toISOString(),
    responseTimeMs: totalResponseTimeMs,
    isSuperUser: true,
    message,
    details: {
      postgresql: pgResult,
      supabase: supabaseResult,
      localStorageStore: localStoreResult,
    },
  });
};

app.get('/api/system/test-db-connection', handleTestDbConnection);
app.post('/api/system/test-db-connection', handleTestDbConnection);

// -------------------------------------------------------------
// VITE / STATIC SERVING
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[FisioPro DB] Server running with WebSockets & persistent database on port ${PORT}`);
  });
}

startServer();
