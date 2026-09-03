import { db, pool, hasSqlConfig } from './index.ts';
import * as schema from './schema.ts';
import {
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
  AuditLog,
} from '../types/index.ts';

let _schemaInitialized = false;

export async function ensurePostgresSchema(): Promise<boolean> {
  if (!hasSqlConfig || !pool) return false;
  if (_schemaInitialized) return true;

  try {
    // Quick test query to ensure pool is responding
    await pool.query('SELECT 1');

    const ddl = `
      CREATE TABLE IF NOT EXISTS tenants (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        trade_name TEXT,
        corporate_name TEXT,
        doc_type TEXT,
        document_number TEXT,
        email TEXT,
        phone TEXT,
        cep TEXT,
        address TEXT,
        number TEXT,
        complement TEXT,
        neighborhood TEXT,
        city TEXT,
        state TEXT,
        country TEXT,
        logo_url TEXT,
        primary_color TEXT,
        secondary_color TEXT,
        theme_mode TEXT,
        custom_header TEXT,
        public_page_title TEXT,
        support_email TEXT,
        support_phone TEXT,
        creator_name TEXT,
        whatsapp_config JSONB,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL,
        access_mode TEXT NOT NULL,
        specialty TEXT,
        council_type TEXT,
        council_number TEXT,
        phone TEXT,
        active BOOLEAN DEFAULT TRUE NOT NULL,
        avatar_url TEXT,
        is_super_user BOOLEAN DEFAULT FALSE,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        email TEXT,
        cpf TEXT,
        rg TEXT,
        gender TEXT,
        phone TEXT NOT NULL,
        whatsapp TEXT,
        profession TEXT,
        birth_date TEXT,
        cep TEXT,
        street TEXT,
        number TEXT,
        complement TEXT,
        neighborhood TEXT,
        city TEXT,
        state TEXT,
        reference_point TEXT,
        notes TEXT,
        photo_url TEXT,
        avatar_url TEXT,
        assigned_professional_id TEXT,
        assigned_professional_name TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT
      );

      CREATE TABLE IF NOT EXISTS anamneses (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        health_history JSONB,
        treatments JSONB,
        habits JSONB,
        evaluation JSONB,
        responsibility_term_accepted BOOLEAN,
        patient_signature_url TEXT,
        city TEXT,
        state TEXT,
        signed_at TEXT,
        signed_by_ip TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS packages (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        patient_name TEXT,
        professional_id TEXT,
        professional_name TEXT,
        title TEXT NOT NULL,
        treatment_type TEXT,
        session_count INTEGER NOT NULL,
        completed_count INTEGER NOT NULL,
        price INTEGER NOT NULL,
        validity_date TEXT,
        status TEXT NOT NULL,
        client_signature_url TEXT,
        client_confirmed_at TEXT,
        signed_term_url TEXT,
        signed_at TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        package_id TEXT REFERENCES packages(id) ON DELETE SET NULL,
        is_single_session BOOLEAN,
        price INTEGER,
        patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        patient_name TEXT NOT NULL,
        professional_id TEXT NOT NULL,
        professional_name TEXT NOT NULL,
        session_number INTEGER NOT NULL,
        scheduled_date TEXT NOT NULL,
        scheduled_time TEXT NOT NULL,
        status TEXT NOT NULL,
        blood_pressure TEXT,
        si_notes TEXT,
        procedures JSONB,
        evolution_text TEXT,
        attended_at TEXT,
        client_signature_url TEXT,
        client_confirmed_at TEXT,
        client_confirmed_ip TEXT,
        validation_token TEXT,
        token_expires_at TEXT,
        token_used_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS evolutions (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        session_id TEXT REFERENCES sessions(id) ON DELETE SET NULL,
        professional_id TEXT,
        professional_name TEXT,
        date TEXT NOT NULL,
        procedures JSONB,
        notes TEXT NOT NULL,
        blood_pressure TEXT,
        version INTEGER DEFAULT 1,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS public_tokens (
        id TEXT PRIMARY KEY,
        token TEXT NOT NULL,
        tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        session_id TEXT NOT NULL,
        patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        expires_at TEXT NOT NULL,
        used_at TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        user_name TEXT NOT NULL,
        user_role TEXT,
        action TEXT NOT NULL,
        entity TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        ip_address TEXT,
        result TEXT,
        details TEXT NOT NULL,
        timestamp TEXT
      );

      CREATE TABLE IF NOT EXISTS document_files (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        uploaded_by_user_id TEXT,
        uploaded_by_name TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_type TEXT,
        file_size INTEGER,
        file_url TEXT NOT NULL,
        category TEXT NOT NULL,
        notes TEXT,
        uploaded_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS signatures (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        patient_name TEXT,
        document_type TEXT NOT NULL,
        document_id TEXT,
        reference_id TEXT,
        signature_url TEXT NOT NULL,
        signed_by_name TEXT,
        signed_at TEXT NOT NULL,
        ip_address TEXT NOT NULL,
        hash TEXT NOT NULL
      );
    `;

    await pool.query(ddl);
    _schemaInitialized = true;
    return true;
  } catch (err: unknown) {
    const msg = (err as Error)?.message || String(err);
    console.warn('[PostgreSQL Bootstrap] Informação sobre inicialização de tabelas:', msg);
    return false;
  }
}

export async function loadAllFromPostgres() {
  if (!hasSqlConfig || !db) return null;

  try {
    const ready = await ensurePostgresSchema();
    if (!ready) return null;

    const [
      tenantsList,
      usersList,
      patientsList,
      anamnesesList,
      packagesList,
      sessionsList,
      evolutionsList,
      publicTokensList,
      auditLogsList,
      documentFilesList,
      signaturesList,
    ] = await Promise.all([
      db.select().from(schema.tenants),
      db.select().from(schema.users),
      db.select().from(schema.patients),
      db.select().from(schema.anamneses),
      db.select().from(schema.packages),
      db.select().from(schema.sessions),
      db.select().from(schema.evolutions),
      db.select().from(schema.publicTokens),
      db.select().from(schema.auditLogs),
      db.select().from(schema.documentFiles),
      db.select().from(schema.signatures),
    ]);

    return {
      tenants: tenantsList as unknown as Tenant[],
      users: usersList as unknown as User[],
      patients: patientsList as unknown as Patient[],
      anamneses: anamnesesList as unknown as Anamnesis[],
      packages: packagesList as unknown as SessionPackage[],
      sessions: sessionsList as unknown as Session[],
      evolutions: evolutionsList as unknown as ClinicalEvolution[],
      publicTokens: publicTokensList as unknown as PublicValidationToken[],
      auditLogs: auditLogsList as unknown as AuditLog[],
      documentFiles: documentFilesList as unknown as DocumentFile[],
      signatures: signaturesList as unknown as SignatureRecord[],
    };
  } catch (err: unknown) {
    const message = (err as Error)?.message || String(err);
    console.warn('[Supabase PostgreSQL] Info de sincronização relacional:', message);
    return null;
  }
}

export async function syncStoreToPostgres(store: {
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
}) {
  if (!hasSqlConfig || !db) return;

  try {
    const ready = await ensurePostgresSchema();
    if (!ready) return;

    const validTenantIds = new Set(store.tenants.map(t => t.id));
    validTenantIds.add('tenant-demo-1');

    const validPatientIds = new Set<string>();

    // 1. Tenants
    for (const t of store.tenants) {
      try {
        await db
          .insert(schema.tenants)
          .values({
            id: t.id,
            name: t.name,
            tradeName: t.tradeName || null,
            corporateName: t.corporateName || null,
            docType: t.docType || null,
            documentNumber: t.documentNumber || null,
            email: t.email || null,
            phone: t.phone || null,
            cep: t.cep || null,
            address: t.address || null,
            number: t.number || null,
            complement: t.complement || null,
            neighborhood: t.neighborhood || null,
            city: t.city || null,
            state: t.state || null,
            country: t.country || null,
            logoUrl: t.logoUrl || null,
            primaryColor: t.primaryColor || null,
            secondaryColor: t.secondaryColor || null,
            themeMode: t.themeMode || null,
            customHeader: t.customHeader || null,
            publicPageTitle: t.publicPageTitle || null,
            supportEmail: t.supportEmail || null,
            supportPhone: t.supportPhone || null,
            creatorName: t.creatorName || null,
            whatsappConfig: t.whatsappConfig || null,
            createdAt: t.createdAt || new Date().toISOString(),
          })
          .onConflictDoUpdate({
            target: schema.tenants.id,
            set: {
              name: t.name,
              tradeName: t.tradeName || null,
              corporateName: t.corporateName || null,
              docType: t.docType || null,
              documentNumber: t.documentNumber || null,
              email: t.email || null,
              phone: t.phone || null,
              cep: t.cep || null,
              address: t.address || null,
              number: t.number || null,
              complement: t.complement || null,
              neighborhood: t.neighborhood || null,
              city: t.city || null,
              state: t.state || null,
              country: t.country || null,
              logoUrl: t.logoUrl || null,
              primaryColor: t.primaryColor || null,
              secondaryColor: t.secondaryColor || null,
              themeMode: t.themeMode || null,
              customHeader: t.customHeader || null,
              publicPageTitle: t.publicPageTitle || null,
              supportEmail: t.supportEmail || null,
              supportPhone: t.supportPhone || null,
              creatorName: t.creatorName || null,
              whatsappConfig: t.whatsappConfig || null,
            },
          });
      } catch (tErr) {
        console.warn(`[PostgreSQL] Tenant sync warning (${t.id}):`, tErr);
      }
    }

    // 2. Users
    for (const u of store.users) {
      if (u.tenantId && !validTenantIds.has(u.tenantId)) {
        continue;
      }
      try {
        await db
          .insert(schema.users)
          .values({
            id: u.id,
            tenantId: u.tenantId,
            name: u.name,
            email: u.email,
            role: u.role,
            accessMode: u.accessMode,
            specialty: u.specialty || null,
            councilType: u.councilType || null,
            councilNumber: u.councilNumber || null,
            phone: u.phone || null,
            active: u.active ?? true,
            avatarUrl: u.avatarUrl || null,
            isSuperUser: Boolean(u.isSuperUser),
            createdAt: u.createdAt || new Date().toISOString(),
          })
          .onConflictDoUpdate({
            target: schema.users.id,
            set: {
              name: u.name,
              email: u.email,
              role: u.role,
              accessMode: u.accessMode,
              specialty: u.specialty || null,
              councilType: u.councilType || null,
              councilNumber: u.councilNumber || null,
              phone: u.phone || null,
              active: u.active ?? true,
              avatarUrl: u.avatarUrl || null,
              isSuperUser: Boolean(u.isSuperUser),
            },
          });
      } catch (uErr) {
        console.warn(`[PostgreSQL] User sync warning (${u.id}):`, uErr);
      }
    }

    // 3. Patients
    for (const p of store.patients) {
      if (p.tenantId && !validTenantIds.has(p.tenantId)) {
        continue;
      }
      try {
        await db
          .insert(schema.patients)
          .values({
            id: p.id,
            tenantId: p.tenantId,
            name: p.name,
            email: p.email || null,
            cpf: p.cpf || null,
            rg: p.rg || null,
            gender: p.gender || null,
            phone: p.phone,
            whatsapp: p.whatsapp || null,
            profession: p.profession || null,
            birthDate: p.birthDate || null,
            cep: p.cep || null,
            street: p.street || null,
            number: p.number || null,
            complement: p.complement || null,
            neighborhood: p.neighborhood || null,
            city: p.city || null,
            state: p.state || null,
            referencePoint: p.referencePoint || null,
            notes: p.notes || null,
            photoUrl: p.photoUrl || null,
            avatarUrl: p.avatarUrl || null,
            assignedProfessionalId: p.assignedProfessionalId || null,
            assignedProfessionalName: p.assignedProfessionalName || null,
            createdAt: p.createdAt || new Date().toISOString(),
            updatedAt: p.updatedAt || new Date().toISOString(),
            deletedAt: p.deletedAt || null,
          })
          .onConflictDoUpdate({
            target: schema.patients.id,
            set: {
              name: p.name,
              email: p.email || null,
              cpf: p.cpf || null,
              rg: p.rg || null,
              gender: p.gender || null,
              phone: p.phone,
              whatsapp: p.whatsapp || null,
              profession: p.profession || null,
              birthDate: p.birthDate || null,
              cep: p.cep || null,
              street: p.street || null,
              number: p.number || null,
              complement: p.complement || null,
              neighborhood: p.neighborhood || null,
              city: p.city || null,
              state: p.state || null,
              referencePoint: p.referencePoint || null,
              notes: p.notes || null,
              photoUrl: p.photoUrl || null,
              avatarUrl: p.avatarUrl || null,
              assignedProfessionalId: p.assignedProfessionalId || null,
              assignedProfessionalName: p.assignedProfessionalName || null,
              updatedAt: p.updatedAt || new Date().toISOString(),
              deletedAt: p.deletedAt || null,
            },
          });
        validPatientIds.add(p.id);
      } catch (pErr) {
        console.warn(`[PostgreSQL] Patient sync warning (${p.id}):`, pErr);
      }
    }

    // 4. Packages
    for (const pkg of store.packages) {
      if (!pkg.patientId || !validPatientIds.has(pkg.patientId) || !validTenantIds.has(pkg.tenantId)) {
        continue;
      }
      try {
        await db
          .insert(schema.packages)
          .values({
            id: pkg.id,
            tenantId: pkg.tenantId,
            patientId: pkg.patientId,
            patientName: pkg.patientName || null,
            professionalId: pkg.professionalId || null,
            professionalName: pkg.professionalName || null,
            title: pkg.title,
            treatmentType: pkg.treatmentType || null,
            sessionCount: pkg.sessionCount,
            completedCount: pkg.completedCount,
            price: pkg.price,
            validityDate: pkg.validityDate || null,
            status: pkg.status,
            clientSignatureUrl: pkg.clientSignatureUrl || null,
            clientConfirmedAt: pkg.clientConfirmedAt || null,
            signedTermUrl: pkg.signedTermUrl || null,
            signedAt: pkg.signedAt || null,
            createdAt: pkg.createdAt || new Date().toISOString(),
          })
          .onConflictDoUpdate({
            target: schema.packages.id,
            set: {
              patientName: pkg.patientName || null,
              professionalId: pkg.professionalId || null,
              professionalName: pkg.professionalName || null,
              title: pkg.title,
              treatmentType: pkg.treatmentType || null,
              sessionCount: pkg.sessionCount,
              completedCount: pkg.completedCount,
              price: pkg.price,
              validityDate: pkg.validityDate || null,
              status: pkg.status,
              clientSignatureUrl: pkg.clientSignatureUrl || null,
              clientConfirmedAt: pkg.clientConfirmedAt || null,
              signedTermUrl: pkg.signedTermUrl || null,
              signedAt: pkg.signedAt || null,
            },
          });
      } catch (pkgErr) {
        console.warn(`[PostgreSQL] Package sync warning (${pkg.id}):`, pkgErr);
      }
    }

    // 5. Sessions
    for (const s of store.sessions) {
      if (!s.patientId || !validPatientIds.has(s.patientId) || !validTenantIds.has(s.tenantId)) {
        continue;
      }
      try {
        await db
          .insert(schema.sessions)
          .values({
            id: s.id,
            tenantId: s.tenantId,
            packageId: s.packageId || null,
            isSingleSession: s.isSingleSession ?? false,
            price: s.price ?? null,
            patientId: s.patientId,
            patientName: s.patientName,
            professionalId: s.professionalId,
            professionalName: s.professionalName,
            sessionNumber: s.sessionNumber,
            scheduledDate: s.scheduledDate,
            scheduledTime: s.scheduledTime,
            status: s.status,
            bloodPressure: s.bloodPressure || null,
            siNotes: s.siNotes || null,
            procedures: s.procedures || null,
            evolutionText: s.evolutionText || null,
            attendedAt: s.attendedAt || null,
            clientSignatureUrl: s.clientSignatureUrl || null,
            clientConfirmedAt: s.clientConfirmedAt || null,
            clientConfirmedIp: s.clientConfirmedIp || null,
            validationToken: s.validationToken || null,
            tokenExpiresAt: s.tokenExpiresAt || null,
            tokenUsedAt: s.tokenUsedAt || null,
            createdAt: s.createdAt || new Date().toISOString(),
            updatedAt: s.updatedAt || null,
          })
          .onConflictDoUpdate({
            target: schema.sessions.id,
            set: {
              packageId: s.packageId || null,
              isSingleSession: s.isSingleSession ?? false,
              price: s.price ?? null,
              patientName: s.patientName,
              professionalId: s.professionalId,
              professionalName: s.professionalName,
              sessionNumber: s.sessionNumber,
              scheduledDate: s.scheduledDate,
              scheduledTime: s.scheduledTime,
              status: s.status,
              bloodPressure: s.bloodPressure || null,
              siNotes: s.siNotes || null,
              procedures: s.procedures || null,
              evolutionText: s.evolutionText || null,
              attendedAt: s.attendedAt || null,
              clientSignatureUrl: s.clientSignatureUrl || null,
              clientConfirmedAt: s.clientConfirmedAt || null,
              clientConfirmedIp: s.clientConfirmedIp || null,
              validationToken: s.validationToken || null,
              tokenExpiresAt: s.tokenExpiresAt || null,
              tokenUsedAt: s.tokenUsedAt || null,
              updatedAt: s.updatedAt || null,
            },
          });
      } catch (sErr) {
        console.warn(`[PostgreSQL] Session sync warning (${s.id}):`, sErr);
      }
    }

    // 6. Anamneses
    for (const a of store.anamneses) {
      if (!a.patientId || !validPatientIds.has(a.patientId) || !validTenantIds.has(a.tenantId)) {
        continue;
      }
      try {
        await db
          .insert(schema.anamneses)
          .values({
            id: a.id,
            tenantId: a.tenantId,
            patientId: a.patientId,
            healthHistory: a.healthHistory || null,
            treatments: a.treatments || null,
            habits: a.habits || null,
            evaluation: a.evaluation || null,
            responsibilityTermAccepted: a.responsibilityTermAccepted ?? false,
            patientSignatureUrl: a.patientSignatureUrl || null,
            city: a.city || null,
            state: a.state || null,
            signedAt: a.signedAt || null,
            signedByIp: a.signedByIp || null,
            createdAt: a.createdAt || new Date().toISOString(),
          })
          .onConflictDoUpdate({
            target: schema.anamneses.id,
            set: {
              healthHistory: a.healthHistory || null,
              treatments: a.treatments || null,
              habits: a.habits || null,
              evaluation: a.evaluation || null,
              responsibilityTermAccepted: a.responsibilityTermAccepted ?? false,
              patientSignatureUrl: a.patientSignatureUrl || null,
              city: a.city || null,
              state: a.state || null,
              signedAt: a.signedAt || null,
              signedByIp: a.signedByIp || null,
            },
          });
      } catch (aErr) {
        console.warn(`[PostgreSQL] Anamnesis sync warning (${a.id}):`, aErr);
      }
    }

    // 7. Evolutions
    for (const e of store.evolutions) {
      if (!e.patientId || !validPatientIds.has(e.patientId) || !validTenantIds.has(e.tenantId)) {
        continue;
      }
      try {
        await db
          .insert(schema.evolutions)
          .values({
            id: e.id,
            tenantId: e.tenantId,
            patientId: e.patientId,
            sessionId: e.sessionId || null,
            professionalId: e.professionalId || null,
            professionalName: e.professionalName || null,
            date: e.date,
            procedures: e.procedures || null,
            notes: e.notes,
            bloodPressure: e.bloodPressure || null,
            version: e.version || 1,
            createdAt: e.createdAt || new Date().toISOString(),
          })
          .onConflictDoUpdate({
            target: schema.evolutions.id,
            set: {
              sessionId: e.sessionId || null,
              professionalId: e.professionalId || null,
              professionalName: e.professionalName || null,
              date: e.date,
              procedures: e.procedures || null,
              notes: e.notes,
              bloodPressure: e.bloodPressure || null,
              version: e.version || 1,
            },
          });
      } catch (eErr) {
        console.warn(`[PostgreSQL] Evolution sync warning (${e.id}):`, eErr);
      }
    }

    // 8. Signatures
    for (const sig of store.signatures) {
      if (!sig.patientId || !validPatientIds.has(sig.patientId) || !validTenantIds.has(sig.tenantId)) {
        continue;
      }
      try {
        await db
          .insert(schema.signatures)
          .values({
            id: sig.id,
            tenantId: sig.tenantId,
            patientId: sig.patientId,
            patientName: sig.patientName || null,
            documentType: sig.documentType,
            documentId: sig.documentId || null,
            referenceId: sig.referenceId || null,
            signatureUrl: sig.signatureUrl,
            signedByName: sig.signedByName || null,
            signedAt: sig.signedAt,
            ipAddress: sig.ipAddress,
            hash: sig.hash,
          })
          .onConflictDoUpdate({
            target: schema.signatures.id,
            set: {
              patientName: sig.patientName || null,
              signatureUrl: sig.signatureUrl,
              signedByName: sig.signedByName || null,
              signedAt: sig.signedAt,
              ipAddress: sig.ipAddress,
              hash: sig.hash,
            },
          });
      } catch (sigErr) {
        console.warn(`[PostgreSQL] Signature sync warning (${sig.id}):`, sigErr);
      }
    }

    // 9. Document Files
    for (const doc of store.documentFiles) {
      if (!doc.patientId || !validPatientIds.has(doc.patientId) || !validTenantIds.has(doc.tenantId)) {
        continue;
      }
      try {
        await db
          .insert(schema.documentFiles)
          .values({
            id: doc.id,
            tenantId: doc.tenantId,
            patientId: doc.patientId,
            uploadedByUserId: doc.uploadedByUserId || null,
            uploadedByName: doc.uploadedByName,
            fileName: doc.fileName,
            fileType: doc.fileType || null,
            fileSize: doc.fileSize || null,
            fileUrl: doc.fileUrl,
            category: doc.category,
            notes: doc.notes || null,
            uploadedAt: doc.uploadedAt,
          })
          .onConflictDoUpdate({
            target: schema.documentFiles.id,
            set: {
              uploadedByName: doc.uploadedByName,
              fileName: doc.fileName,
              fileType: doc.fileType || null,
              fileSize: doc.fileSize || null,
              fileUrl: doc.fileUrl,
              category: doc.category,
              notes: doc.notes || null,
            },
          });
      } catch (docErr) {
        console.warn(`[PostgreSQL] Document file sync warning (${doc.id}):`, docErr);
      }
    }
  } catch (error) {
    console.error('[PostgreSQL] Async sync error:', error);
  }
}
