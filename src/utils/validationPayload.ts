import { Session, SessionPackage, Patient, Tenant, User } from '../types';

export interface DecodedSessionPayload {
  sid: string;
  pid: string;
  pname: string;
  patId?: string;
  pcount: number;
  pcomp: number;
  snum: number;
  title: string;
  proc: string;
  cname: string;
  prof: string;
  date: string;
  sessList?: Array<{
    num: number;
    status: string;
    isCurrent?: boolean;
    hasSig?: boolean;
  }>;
}

export interface DecodedPackagePayload {
  pid: string;
  pname: string;
  patId?: string;
  pcount: number;
  pcomp: number;
  title: string;
  proc: string;
  cname: string;
  prof: string;
  price?: number;
  date: string;
  sessList?: Array<{
    num: number;
    status: string;
    hasSig?: boolean;
  }>;
}

export interface DecodedAnamnesisPayload {
  patId?: string;
  pname?: string;
  phone?: string;
  cpf?: string;
  birthDate?: string;
  tid: string;
  cname: string;
  tradeName?: string;
  logoUrl?: string;
  profName?: string;
  profId?: string;
  city?: string;
  state?: string;
  timestamp: string;
}

// Universal Unicode-Safe Base64 encoder
export function encodePayload(data: any): string {
  try {
    const jsonStr = JSON.stringify(data);
    // encodeURIComponent + unescape handle UTF-8 characters like ã, é, õ etc.
    const binaryStr = unescape(encodeURIComponent(jsonStr));
    const base64 = btoa(binaryStr);
    return encodeURIComponent(base64);
  } catch (e) {
    try {
      return encodeURIComponent(btoa(JSON.stringify(data)));
    } catch {
      return '';
    }
  }
}

// Universal Unicode-Safe Base64 decoder
export function decodePayload<T = any>(raw: string): T | null {
  if (!raw) return null;
  try {
    const decodedUrl = decodeURIComponent(raw).trim();
    const binaryStr = atob(decodedUrl);
    const jsonStr = decodeURIComponent(escape(binaryStr));
    return JSON.parse(jsonStr) as T;
  } catch (e1) {
    try {
      const decodedUrl = decodeURIComponent(raw).trim();
      const jsonStr = atob(decodedUrl);
      return JSON.parse(jsonStr) as T;
    } catch (e2) {
      try {
        const jsonStr = atob(raw);
        return JSON.parse(jsonStr) as T;
      } catch {
        return null;
      }
    }
  }
}

// Helper to generate Session Validation URL with embedded self-contained payload
export function createSessionValidationUrl(
  origin: string,
  session: Session,
  pkg?: SessionPackage | null,
  allSessions: Session[] = [],
  clinicName: string = 'Clínica de Terapias Integradas',
  options?: { short?: boolean }
): string {
  const effectiveOrigin = origin || (typeof window !== 'undefined' ? window.location.origin : 'https://clinica.app');
  const targetSessionId = session.id;

  if (options?.short !== false) {
    return `${effectiveOrigin}/?sessao=${encodeURIComponent(targetSessionId)}`;
  }

  const pkgSessions = allSessions.filter(s => pkg && s.packageId === pkg.id);
  const totalCount = pkg?.sessionCount || Math.max(session.sessionNumber, pkgSessions.length || 4);

  const sessList = Array.from({ length: totalCount }, (_, i) => {
    const num = i + 1;
    const existing = pkgSessions.find(s => s.sessionNumber === num);
    const isPast = num < session.sessionNumber;
    const isCurrent = num === session.sessionNumber;

    let status = existing ? existing.status : (isPast ? 'COMPLETED' : isCurrent ? (session.status || 'COMPLETED') : 'PENDING');
    let hasSig = existing ? !!existing.clientSignatureUrl : isPast;

    return {
      num,
      status,
      isCurrent,
      hasSig,
    };
  });

  const payload: DecodedSessionPayload = {
    sid: targetSessionId,
    pid: pkg?.id || session.packageId || 'pkg-default',
    pname: session.patientName || pkg?.patientName || 'Cliente / Paciente',
    patId: session.patientId || pkg?.patientId || 'pat-1',
    pcount: totalCount,
    pcomp: pkg?.completedCount || Math.max(0, session.sessionNumber - 1),
    snum: session.sessionNumber || 1,
    title: pkg?.title || 'Pacote de Sessões de Tratamento',
    proc: (session.procedures && session.procedures[0]) || pkg?.treatmentType || 'Massoterapia Clínica',
    cname: clinicName || 'Clínica de Terapias Integradas',
    prof: session.professionalName || pkg?.professionalName || 'Profissional',
    date: session.scheduledDate || session.attendedAt || new Date().toISOString().split('T')[0],
    sessList,
  };

  const encoded = encodePayload(payload);
  return `${effectiveOrigin}/?sessao=${encodeURIComponent(targetSessionId)}&d=${encoded}`;
}

// Helper to generate Package Signoff URL with embedded self-contained payload
export function createPackageValidationUrl(
  origin: string,
  pkg: SessionPackage,
  allSessions: Session[] = [],
  clinicName: string = 'Clínica de Terapias Integradas',
  options?: { short?: boolean }
): string {
  const effectiveOrigin = origin || (typeof window !== 'undefined' ? window.location.origin : 'https://clinica.app');
  
  if (options?.short !== false) {
    return `${effectiveOrigin}/?pacote=${encodeURIComponent(pkg.id)}`;
  }

  const pkgSessions = allSessions.filter(s => s.packageId === pkg.id);
  const totalCount = pkg.sessionCount || Math.max(pkgSessions.length, 5);

  const sessList = Array.from({ length: totalCount }, (_, i) => {
    const num = i + 1;
    const existing = pkgSessions.find(s => s.sessionNumber === num);
    return {
      num,
      status: existing ? existing.status : 'COMPLETED',
      hasSig: existing ? !!existing.clientSignatureUrl : true,
    };
  });

  const payload: DecodedPackagePayload = {
    pid: pkg.id,
    pname: pkg.patientName || 'Cliente / Paciente',
    patId: pkg.patientId,
    pcount: totalCount,
    pcomp: pkg.completedCount || totalCount,
    title: pkg.title || 'Pacote de Sessões',
    proc: pkg.treatmentType || 'Massoterapia Clínica',
    cname: clinicName || 'Clínica de Terapias Integradas',
    prof: pkg.professionalName || 'Profissional',
    price: pkg.price || 0,
    date: pkg.validityDate || new Date().toISOString().split('T')[0],
    sessList,
  };

  const encoded = encodePayload(payload);
  return `${effectiveOrigin}/?pacote=${encodeURIComponent(pkg.id)}&d=${encoded}`;
}

// Helper to generate public Anamnesis / Intake Form URL with optional clean short format
export function createAnamnesisValidationUrl(
  origin: string,
  tenant: Partial<Tenant> | null | undefined,
  patient?: Partial<Patient> | null,
  professional?: Partial<User> | null,
  options?: { short?: boolean; includePayload?: boolean }
): string {
  const effectiveOrigin = origin || (typeof window !== 'undefined' ? window.location.origin : 'https://clinica.app');
  
  // Clean short token (either patient ID or a clean random token)
  let token = patient?.id;
  if (!token) {
    const rand = Math.random().toString(36).substring(2, 8);
    token = `f-${rand}`;
  }

  // By default, generate an ultra-clean short URL (fits in 1 line on WhatsApp, ~45-55 chars)
  if (options?.short !== false && !options?.includePayload) {
    return `${effectiveOrigin}/?ficha=${encodeURIComponent(token)}`;
  }

  const payload: DecodedAnamnesisPayload = {
    patId: patient?.id || undefined,
    pname: patient?.name || '',
    phone: patient?.phone || patient?.whatsapp || '',
    cpf: patient?.cpf || '',
    birthDate: patient?.birthDate || '',
    tid: tenant?.id || 'tenant-demo-1',
    cname: tenant?.name || 'Clínica de Fisioterapia & Terapias',
    tradeName: tenant?.tradeName || tenant?.name || 'Clínica de Fisioterapia & Terapias',
    logoUrl: tenant?.logoUrl || undefined,
    profName: professional?.name || patient?.assignedProfessionalName || 'Equipe Terapêutica',
    profId: professional?.id || patient?.assignedProfessionalId || undefined,
    city: patient?.city || tenant?.city || '',
    state: patient?.state || tenant?.state || '',
    timestamp: new Date().toISOString(),
  };

  const encoded = encodePayload(payload);
  return `${effectiveOrigin}/?ficha=${encodeURIComponent(token)}&d=${encoded}`;
}

// Helper to generate formatted WhatsApp message for Anamnesis Intake
export function formatAnamnesisWhatsAppMessage(
  clinicName: string,
  patientName?: string,
  url: string = '',
  _professionalName?: string
): string {
  const greetingName = patientName && patientName.trim() ? patientName.trim().split(' ')[0] : 'tudo bem';
  const effectiveClinic = clinicName || 'Clínica';

  return `Olá ${greetingName}! 👋

Para garantir a sua máxima segurança clínica e personalizarmos seu atendimento na *${effectiveClinic}*, solicitamos o preenchimento *obrigatório* da sua *Ficha de Cadastro & Anamnese de Saúde*.

⚠️ *Importante:* O preenchimento de todas as perguntas de saúde (respondendo *Sim* ou *Não*) e a *Assinatura Digital* com o dedo no final são *obrigatórios* para liberação e validação do seu atendimento clínico.

É 100% digital, seguro e rápido:

📝 *Acesse sua Ficha Obrigatória de Anamnese:*
${url}

Ao finalizar e assinar, seu cadastro será sincronizado diretamente no prontuário eletrônico da clínica! ✨`;
}
