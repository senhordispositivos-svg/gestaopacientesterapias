import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
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
} from '../types';

export const supabaseDirectApi = {
  isEnabled: () => isSupabaseConfigured,

  // Tenants
  async getTenants(): Promise<Tenant[]> {
    const { data, error } = await supabase.from('tenants').select('*');
    if (error) throw error;
    return (data || []).map((t: Record<string, unknown>) => ({
      id: t.id as string,
      name: t.name as string,
      tradeName: t.trade_name as string,
      corporateName: t.corporate_name as string,
      docType: t.doc_type as 'CPF' | 'CNPJ',
      documentNumber: t.document_number as string,
      email: t.email as string,
      phone: t.phone as string,
      cep: t.cep as string,
      address: t.address as string,
      number: t.number as string,
      complement: t.complement as string,
      neighborhood: t.neighborhood as string,
      city: t.city as string,
      state: t.state as string,
      country: t.country as string,
      logoUrl: t.logo_url as string,
      primaryColor: t.primary_color as string,
      secondaryColor: t.secondary_color as string,
      themeMode: t.theme_mode as 'light' | 'dark',
      customHeader: t.custom_header as string,
      publicPageTitle: t.public_page_title as string,
      supportEmail: t.support_email as string,
      supportPhone: t.support_phone as string,
      creatorName: t.creator_name as string,
      whatsappConfig: t.whatsapp_config as Tenant['whatsappConfig'],
      createdAt: t.created_at as string,
    }));
  },

  async updateTenant(tenant: Partial<Tenant> & { id: string }): Promise<Tenant> {
    const payload: Record<string, unknown> = {};
    if (tenant.name !== undefined) payload.name = tenant.name;
    if (tenant.tradeName !== undefined) payload.trade_name = tenant.tradeName;
    if (tenant.corporateName !== undefined) payload.corporate_name = tenant.corporateName;
    if (tenant.docType !== undefined) payload.doc_type = tenant.docType;
    if (tenant.documentNumber !== undefined) payload.document_number = tenant.documentNumber;
    if (tenant.email !== undefined) payload.email = tenant.email;
    if (tenant.phone !== undefined) payload.phone = tenant.phone;
    if (tenant.cep !== undefined) payload.cep = tenant.cep;
    if (tenant.address !== undefined) payload.address = tenant.address;
    if (tenant.number !== undefined) payload.number = tenant.number;
    if (tenant.complement !== undefined) payload.complement = tenant.complement;
    if (tenant.neighborhood !== undefined) payload.neighborhood = tenant.neighborhood;
    if (tenant.city !== undefined) payload.city = tenant.city;
    if (tenant.state !== undefined) payload.state = tenant.state;
    if (tenant.country !== undefined) payload.country = tenant.country;
    if (tenant.logoUrl !== undefined) payload.logo_url = tenant.logoUrl;
    if (tenant.primaryColor !== undefined) payload.primary_color = tenant.primaryColor;
    if (tenant.secondaryColor !== undefined) payload.secondary_color = tenant.secondaryColor;
    if (tenant.themeMode !== undefined) payload.theme_mode = tenant.themeMode;
    if (tenant.customHeader !== undefined) payload.custom_header = tenant.customHeader;
    if (tenant.publicPageTitle !== undefined) payload.public_page_title = tenant.publicPageTitle;
    if (tenant.supportEmail !== undefined) payload.support_email = tenant.supportEmail;
    if (tenant.supportPhone !== undefined) payload.support_phone = tenant.supportPhone;
    if (tenant.creatorName !== undefined) payload.creator_name = tenant.creatorName;
    if (tenant.whatsappConfig !== undefined) payload.whatsapp_config = tenant.whatsappConfig;

    const { data, error } = await supabase
      .from('tenants')
      .update(payload)
      .eq('id', tenant.id)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as Tenant;
  },

  // Patients
  async getPatients(tenantId: string): Promise<Patient[]> {
    let query = supabase
      .from('patients')
      .select('*')
      .is('deleted_at', null);

    if (tenantId && tenantId !== 'tenant-demo-1') {
      query = query.or(`tenant_id.eq.${tenantId},tenant_id.eq.tenant-demo-1`);
    } else if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []).map((p: Record<string, unknown>) => ({
      id: p.id as string,
      tenantId: p.tenant_id as string,
      name: p.name as string,
      email: p.email as string,
      cpf: p.cpf as string,
      rg: p.rg as string,
      gender: p.gender as Patient['gender'],
      phone: p.phone as string,
      whatsapp: p.whatsapp as string,
      profession: p.profession as string,
      birthDate: p.birth_date as string,
      cep: p.cep as string,
      street: p.street as string,
      number: p.number as string,
      complement: p.complement as string,
      neighborhood: p.neighborhood as string,
      city: p.city as string,
      state: p.state as string,
      referencePoint: p.reference_point as string,
      notes: p.notes as string,
      photoUrl: p.photo_url as string,
      avatarUrl: p.avatar_url as string,
      assignedProfessionalId: p.assigned_professional_id as string,
      assignedProfessionalName: p.assigned_professional_name as string,
      createdAt: p.created_at as string,
      updatedAt: p.updated_at as string,
      deletedAt: p.deleted_at as string | undefined,
    }));
  },

  async upsertPatient(patient: Patient): Promise<Patient> {
    const id = patient.id || `pat-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();
    const row = {
      id,
      tenant_id: patient.tenantId || 'tenant-demo-1',
      name: patient.name,
      email: patient.email || null,
      cpf: patient.cpf || null,
      rg: patient.rg || null,
      gender: patient.gender || null,
      phone: patient.phone || '',
      whatsapp: patient.whatsapp || null,
      profession: patient.profession || null,
      birth_date: patient.birthDate || null,
      cep: patient.cep || null,
      street: patient.street || null,
      number: patient.number || null,
      complement: patient.complement || null,
      neighborhood: patient.neighborhood || null,
      city: patient.city || null,
      state: patient.state || null,
      reference_point: patient.referencePoint || null,
      notes: patient.notes || null,
      photo_url: patient.photoUrl || null,
      avatar_url: patient.avatarUrl || null,
      assigned_professional_id: patient.assignedProfessionalId || null,
      assigned_professional_name: patient.assignedProfessionalName || null,
      created_at: patient.createdAt || now,
      updated_at: now,
      deleted_at: null,
    };

    try {
      const { error } = await supabase.from('patients').upsert(row);
      if (error) {
        console.warn('Supabase upsertPatient warning, attempting insert fallback:', error);
        await supabase.from('patients').insert(row);
      }
    } catch (e) {
      console.warn('Supabase upsertPatient failed:', e);
    }
    return { ...patient, id };
  },

  async createPatient(patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): Promise<Patient> {
    const id = `pat-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();
    const row = {
      id,
      tenant_id: patient.tenantId,
      name: patient.name,
      email: patient.email || null,
      cpf: patient.cpf || null,
      rg: patient.rg || null,
      gender: patient.gender || null,
      phone: patient.phone,
      whatsapp: patient.whatsapp || null,
      profession: patient.profession || null,
      birth_date: patient.birthDate || null,
      cep: patient.cep || null,
      street: patient.street || null,
      number: patient.number || null,
      complement: patient.complement || null,
      neighborhood: patient.neighborhood || null,
      city: patient.city || null,
      state: patient.state || null,
      reference_point: patient.referencePoint || null,
      notes: patient.notes || null,
      photo_url: patient.photoUrl || null,
      avatar_url: patient.avatarUrl || null,
      assigned_professional_id: patient.assignedProfessionalId || null,
      assigned_professional_name: patient.assignedProfessionalName || null,
      created_at: now,
      updated_at: now,
    };

    const { error } = await supabase.from('patients').insert(row);
    if (error) throw error;
    return { ...patient, id, createdAt: now, updatedAt: now };
  },

  async updatePatient(id: string, updates: Partial<Patient>): Promise<Patient> {
    const now = new Date().toISOString();
    const payload: Record<string, unknown> = { updated_at: now };
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.email !== undefined) payload.email = updates.email;
    if (updates.cpf !== undefined) payload.cpf = updates.cpf;
    if (updates.rg !== undefined) payload.rg = updates.rg;
    if (updates.gender !== undefined) payload.gender = updates.gender;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.whatsapp !== undefined) payload.whatsapp = updates.whatsapp;
    if (updates.profession !== undefined) payload.profession = updates.profession;
    if (updates.birthDate !== undefined) payload.birth_date = updates.birthDate;
    if (updates.cep !== undefined) payload.cep = updates.cep;
    if (updates.street !== undefined) payload.street = updates.street;
    if (updates.number !== undefined) payload.number = updates.number;
    if (updates.complement !== undefined) payload.complement = updates.complement;
    if (updates.neighborhood !== undefined) payload.neighborhood = updates.neighborhood;
    if (updates.city !== undefined) payload.city = updates.city;
    if (updates.state !== undefined) payload.state = updates.state;
    if (updates.referencePoint !== undefined) payload.reference_point = updates.referencePoint;
    if (updates.notes !== undefined) payload.notes = updates.notes;
    if (updates.photoUrl !== undefined) payload.photo_url = updates.photoUrl;
    if (updates.avatarUrl !== undefined) payload.avatar_url = updates.avatarUrl;
    if (updates.assignedProfessionalId !== undefined) payload.assigned_professional_id = updates.assignedProfessionalId;
    if (updates.assignedProfessionalName !== undefined) payload.assigned_professional_name = updates.assignedProfessionalName;

    const { error } = await supabase.from('patients').update(payload).eq('id', id);
    if (error) throw error;

    const { data } = await supabase.from('patients').select('*').eq('id', id).single();
    return data as unknown as Patient;
  },

  async deletePatient(id: string): Promise<boolean> {
    const { error } = await supabase.from('patients').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
    return true;
  },

  // Users
  async getUsers(tenantId: string): Promise<User[]> {
    const { data, error } = await supabase.from('users').select('*').eq('tenant_id', tenantId);
    if (error) throw error;
    return (data || []).map((u: Record<string, unknown>) => ({
      id: u.id as string,
      tenantId: u.tenant_id as string,
      name: u.name as string,
      email: u.email as string,
      role: u.role as User['role'],
      accessMode: u.access_mode as User['accessMode'],
      specialty: u.specialty as string,
      councilType: u.council_type as string,
      councilNumber: u.council_number as string,
      phone: u.phone as string,
      active: u.active as boolean,
      avatarUrl: u.avatar_url as string,
      isSuperUser: u.is_super_user as boolean,
      createdAt: u.created_at as string,
    }));
  },

  // Sessions
  async getSessions(tenantId: string): Promise<Session[]> {
    const { data, error } = await supabase.from('sessions').select('*').eq('tenant_id', tenantId);
    if (error) throw error;
    return (data || []).map((s: Record<string, unknown>) => ({
      id: s.id as string,
      tenantId: s.tenant_id as string,
      packageId: s.package_id as string,
      isSingleSession: s.is_single_session as boolean,
      price: s.price as number,
      patientId: s.patient_id as string,
      patientName: s.patient_name as string,
      professionalId: s.professional_id as string,
      professionalName: s.professional_name as string,
      sessionNumber: s.session_number as number,
      scheduledDate: s.scheduled_date as string,
      scheduledTime: s.scheduled_time as string,
      status: s.status as Session['status'],
      bloodPressure: s.blood_pressure as string,
      siNotes: s.si_notes as string,
      procedures: s.procedures as string[],
      evolutionText: s.evolution_text as string,
      attendedAt: s.attended_at as string,
      clientSignatureUrl: s.client_signature_url as string,
      clientConfirmedAt: s.client_confirmed_at as string,
      clientConfirmedIp: s.client_confirmed_ip as string,
      validationToken: s.validation_token as string,
      tokenExpiresAt: s.token_expires_at as string,
      tokenUsedAt: s.token_used_at as string,
      createdAt: s.created_at as string,
      updatedAt: s.updated_at as string,
    }));
  },

  async createSession(session: Omit<Session, 'id' | 'createdAt'>): Promise<Session> {
    const id = `sess-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();
    const row = {
      id,
      tenant_id: session.tenantId,
      package_id: session.packageId || null,
      is_single_session: session.isSingleSession || false,
      price: session.price || null,
      patient_id: session.patientId,
      patient_name: session.patientName,
      professional_id: session.professionalId,
      professional_name: session.professionalName,
      session_number: session.sessionNumber,
      scheduled_date: session.scheduledDate,
      scheduled_time: session.scheduledTime,
      status: session.status,
      blood_pressure: session.bloodPressure || null,
      si_notes: session.siNotes || null,
      procedures: session.procedures || null,
      evolution_text: session.evolutionText || null,
      attended_at: session.attendedAt || null,
      client_signature_url: session.clientSignatureUrl || null,
      client_confirmed_at: session.clientConfirmedAt || null,
      client_confirmed_ip: session.clientConfirmedIp || null,
      validation_token: session.validationToken || null,
      token_expires_at: session.tokenExpiresAt || null,
      token_used_at: session.tokenUsedAt || null,
      created_at: now,
      updated_at: now,
    };

    const { error } = await supabase.from('sessions').insert(row);
    if (error) throw error;
    return { ...session, id, createdAt: now, updatedAt: now };
  },

  async updateSession(id: string, updates: Partial<Session>): Promise<Session> {
    const now = new Date().toISOString();
    const payload: Record<string, unknown> = { updated_at: now };
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.scheduledDate !== undefined) payload.scheduled_date = updates.scheduledDate;
    if (updates.scheduledTime !== undefined) payload.scheduled_time = updates.scheduledTime;
    if (updates.bloodPressure !== undefined) payload.blood_pressure = updates.bloodPressure;
    if (updates.evolutionText !== undefined) payload.evolution_text = updates.evolutionText;
    if (updates.procedures !== undefined) payload.procedures = updates.procedures;
    if (updates.clientSignatureUrl !== undefined) payload.client_signature_url = updates.clientSignatureUrl;
    if (updates.clientConfirmedAt !== undefined) payload.client_confirmed_at = updates.clientConfirmedAt;
    if (updates.attendedAt !== undefined) payload.attended_at = updates.attendedAt;

    const { error } = await supabase.from('sessions').update(payload).eq('id', id);
    if (error) throw error;

    const { data } = await supabase.from('sessions').select('*').eq('id', id).single();
    return data as unknown as Session;
  },

  // Packages
  async getPackages(tenantId: string): Promise<SessionPackage[]> {
    const { data, error } = await supabase.from('packages').select('*').eq('tenant_id', tenantId);
    if (error) throw error;
    return (data || []).map((pkg: Record<string, unknown>) => ({
      id: pkg.id as string,
      tenantId: pkg.tenant_id as string,
      patientId: pkg.patient_id as string,
      patientName: pkg.patient_name as string,
      professionalId: pkg.professional_id as string,
      professionalName: pkg.professional_name as string,
      title: pkg.title as string,
      treatmentType: pkg.treatment_type as string,
      sessionCount: pkg.session_count as number,
      completedCount: pkg.completed_count as number,
      price: pkg.price as number,
      validityDate: pkg.validity_date as string,
      status: pkg.status as SessionPackage['status'],
      clientSignatureUrl: pkg.client_signature_url as string,
      clientConfirmedAt: pkg.client_confirmed_at as string,
      signedTermUrl: pkg.signed_term_url as string,
      signedAt: pkg.signed_at as string,
      createdAt: pkg.created_at as string,
    }));
  },

  async createPackage(pkg: Omit<SessionPackage, 'id' | 'createdAt'>): Promise<SessionPackage> {
    const id = `pkg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();
    const row = {
      id,
      tenant_id: pkg.tenantId,
      patient_id: pkg.patientId,
      patient_name: pkg.patientName || null,
      professional_id: pkg.professionalId || null,
      professional_name: pkg.professionalName || null,
      title: pkg.title,
      treatment_type: pkg.treatmentType || null,
      session_count: pkg.sessionCount,
      completed_count: pkg.completedCount,
      price: pkg.price,
      validity_date: pkg.validityDate || null,
      status: pkg.status,
      client_signature_url: pkg.clientSignatureUrl || null,
      client_confirmed_at: pkg.clientConfirmedAt || null,
      signed_term_url: pkg.signedTermUrl || null,
      signed_at: pkg.signedAt || null,
      created_at: now,
    };

    const { error } = await supabase.from('packages').insert(row);
    if (error) throw error;
    return { ...pkg, id, createdAt: now };
  },

  // Anamneses
  async getAnamneses(tenantId: string, patientId?: string): Promise<Anamnesis[]> {
    let query = supabase.from('anamneses').select('*').eq('tenant_id', tenantId);
    if (patientId) query = query.eq('patient_id', patientId);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((a: Record<string, unknown>) => ({
      id: a.id as string,
      tenantId: a.tenant_id as string,
      patientId: a.patient_id as string,
      healthHistory: a.health_history as Anamnesis['healthHistory'],
      treatments: a.treatments as Anamnesis['treatments'],
      habits: a.habits as Anamnesis['habits'],
      evaluation: a.evaluation as Anamnesis['evaluation'],
      responsibilityTermAccepted: a.responsibility_term_accepted as boolean,
      patientSignatureUrl: a.patient_signature_url as string,
      city: a.city as string,
      state: a.state as string,
      signedAt: a.signed_at as string,
      signedByIp: a.signed_by_ip as string,
      createdAt: a.created_at as string,
    }));
  },

  async saveAnamnesis(anamnesis: Omit<Anamnesis, 'id' | 'createdAt'> & { id?: string }): Promise<Anamnesis> {
    const id = anamnesis.id || `anam-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();
    const row = {
      id,
      tenant_id: anamnesis.tenantId,
      patient_id: anamnesis.patientId,
      health_history: anamnesis.healthHistory || null,
      treatments: anamnesis.treatments || null,
      habits: anamnesis.habits || null,
      evaluation: anamnesis.evaluation || null,
      responsibility_term_accepted: anamnesis.responsibilityTermAccepted || false,
      patient_signature_url: anamnesis.patientSignatureUrl || null,
      city: anamnesis.city || null,
      state: anamnesis.state || null,
      signed_at: anamnesis.signedAt || null,
      signed_by_ip: anamnesis.signedByIp || null,
      created_at: now,
    };

    const { error } = await supabase.from('anamneses').upsert(row);
    if (error) throw error;
    return { ...anamnesis, id, createdAt: now };
  },

  // Evolutions
  async getEvolutions(tenantId: string, patientId: string): Promise<ClinicalEvolution[]> {
    const { data, error } = await supabase
      .from('evolutions')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('patient_id', patientId);
    if (error) throw error;
    return (data || []).map((e: Record<string, unknown>) => ({
      id: e.id as string,
      tenantId: e.tenant_id as string,
      patientId: e.patient_id as string,
      sessionId: e.session_id as string,
      professionalId: e.professional_id as string,
      professionalName: e.professional_name as string,
      date: e.date as string,
      procedures: e.procedures as string[],
      notes: e.notes as string,
      bloodPressure: e.blood_pressure as string,
      version: e.version as number,
      createdAt: e.created_at as string,
    }));
  },

  async createEvolution(evo: Omit<ClinicalEvolution, 'id' | 'createdAt'>): Promise<ClinicalEvolution> {
    const id = `evo-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();
    const row = {
      id,
      tenant_id: evo.tenantId,
      patient_id: evo.patientId,
      session_id: evo.sessionId || null,
      professional_id: evo.professionalId || null,
      professional_name: evo.professionalName || null,
      date: evo.date,
      procedures: evo.procedures || null,
      notes: evo.notes,
      blood_pressure: evo.bloodPressure || null,
      version: evo.version || 1,
      created_at: now,
    };

    const { error } = await supabase.from('evolutions').insert(row);
    if (error) throw error;
    return { ...evo, id, createdAt: now };
  },

  // Signatures
  async createSignature(sig: Omit<SignatureRecord, 'id'>): Promise<SignatureRecord> {
    const id = `sig-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const row = {
      id,
      tenant_id: sig.tenantId,
      patient_id: sig.patientId,
      patient_name: sig.patientName || null,
      document_type: sig.documentType,
      document_id: sig.documentId || null,
      reference_id: sig.referenceId || null,
      signature_url: sig.signatureUrl,
      signed_by_name: sig.signedByName || null,
      signed_at: sig.signedAt,
      ip_address: sig.ipAddress,
      hash: sig.hash,
    };

    const { error } = await supabase.from('signatures').insert(row);
    if (error) throw error;
    return { ...sig, id };
  },
};
