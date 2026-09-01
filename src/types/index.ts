export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'PROFESSIONAL' | 'RECEPTIONIST';
export type AccessMode = 'INDIVIDUAL' | 'COMPREHENSIVE';
export type ThemeMode = 'light' | 'dark' | 'system';
export type DocType = 'CPF' | 'CNPJ';

export interface Tenant {
  id: string;
  name: string;
  tradeName: string;
  corporateName: string;
  docType: DocType;
  documentNumber: string;
  email: string;
  phone: string;
  cep: string;
  address: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  country: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  themeMode: ThemeMode;
  customHeader?: string;
  publicPageTitle?: string;
  supportEmail?: string;
  supportPhone?: string;
  creatorName?: string;
  whatsappConfig?: {
    token?: string;
    phoneNumberId?: string;
    status: 'CONFIGURED' | 'NOT_CONFIGURED';
  };
  createdAt: string;
}

export interface User {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  accessMode: AccessMode;
  specialty?: string;
  councilType?: string;
  councilNumber?: string;
  phone?: string;
  active: boolean;
  avatarUrl?: string;
  isSuperUser?: boolean;
  createdAt: string;
}

export interface Patient {
  id: string;
  tenantId: string;
  name: string;
  email?: string;
  cpf: string;
  rg?: string;
  gender?: 'Masculino' | 'Feminino' | 'Outro' | string;
  phone: string;
  whatsapp: string;
  profession: string;
  birthDate: string;
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  referencePoint?: string;
  notes?: string;
  photoUrl?: string;
  avatarUrl?: string;
  assignedProfessionalId?: string;
  assignedProfessionalName?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface HealthHistory {
  fumante: boolean;
  diabetes: boolean;
  epilepsia: boolean;
  varizes: boolean;
  trombose: boolean;
  cancerEmTratamento: boolean;
  historicoCancer: boolean;
  cardiopatia: boolean;
  artrite: boolean;
  fibromialgia: boolean;
  protese: boolean;
  osteoporose: boolean;
  hipertensao: boolean;
  hipotensao: boolean;
  doencaPeleContagiosa: boolean;
  menstruacaoNormal: boolean;
  alergias: boolean;
  ansiedade: boolean;
  depressao: boolean;
  observacoes?: string;
}

export interface MedicalTreatments {
  tratamentoMedico: boolean;
  medicamentos: boolean;
  fisioterapia: boolean;
  outroTratamento: boolean;
  observacoes?: string;
}

export interface Habits {
  bebidaAlcoolica: boolean;
  dormeBem: boolean;
  atividadeFisica: boolean;
  jaRealizouMassoterapia: boolean;
  observacoes?: string;
}

export interface MassotherapyEvaluation {
  hasCurrentMedicalCondition?: boolean;
  currentMedicalConditionDescription?: string;
  hasRecentSurgeries?: boolean;
  recentSurgeriesDescription?: string;
  hasKnownAllergies?: boolean;
  knownAllergiesDescription?: string;
  isPregnantOrBreastfeeding?: boolean;
  hasHadMassageBefore?: boolean;
  massageFrequency?: string;
  massageType?: string;
  massageResults?: string;
  massageGoals?: string;
  specificBodyAreasToFocus?: string;
  pressurePreference?: 'Leve' | 'Moderada' | 'Firme' | 'Outra' | string;
  pressurePreferenceOther?: string;
  isSmoker?: boolean;
  smokingDailyQuantity?: string;
  drinksAlcohol?: boolean;
  alcoholFrequencyQuantity?: string;
  regularPhysicalActivity?: boolean;
  physicalActivityTypeFrequency?: string;
  diet?: string;
  sleepQuality?: 'Normal' | 'Insônia' | 'Outro' | string;
  sleepQualityDescription?: string;
  sleepOtherDescription?: string;
  additionalObservations?: string;
}

export interface Anamnesis {
  id: string;
  tenantId: string;
  patientId: string;
  healthHistory: HealthHistory;
  treatments: MedicalTreatments;
  habits: Habits;
  evaluation?: MassotherapyEvaluation;
  responsibilityTermAccepted: boolean;
  patientSignatureUrl: string;
  city: string;
  state: string;
  signedAt: string;
  signedByIp: string;
  createdAt: string;
}

export type PackageStatus = 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';

export interface SessionPackage {
  id: string;
  tenantId: string;
  patientId: string;
  patientName: string;
  professionalId: string;
  professionalName: string;
  title: string;
  treatmentType: string;
  sessionCount: number;
  completedCount: number;
  price: number;
  validityDate: string;
  status: PackageStatus;
  clientSignatureUrl?: string;
  clientConfirmedAt?: string;
  signedTermUrl?: string;
  signedAt?: string;
  createdAt: string;
}

export type SessionStatus = 'PENDING' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Session {
  id: string;
  tenantId: string;
  packageId?: string;
  isSingleSession?: boolean;
  price?: number;
  patientId: string;
  patientName: string;
  professionalId: string;
  professionalName: string;
  sessionNumber: number;
  scheduledDate: string;
  scheduledTime: string;
  status: SessionStatus;
  bloodPressure?: string;
  siNotes?: string;
  procedures: string[];
  evolutionText?: string;
  attendedAt?: string;
  clientSignatureUrl?: string;
  clientConfirmedAt?: string;
  clientConfirmedIp?: string;
  validationToken?: string;
  tokenExpiresAt?: string;
  tokenUsedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ClinicalEvolution {
  id: string;
  tenantId: string;
  patientId: string;
  sessionId?: string;
  professionalId?: string;
  professionalName?: string;
  date: string;
  procedures?: string[];
  notes: string;
  bloodPressure?: string;
  version: number;
  createdAt: string;
}

export interface DocumentFile {
  id: string;
  tenantId: string;
  patientId: string;
  uploadedByUserId?: string;
  uploadedByName: string;
  fileName: string;
  fileType?: string;
  fileSize?: number;
  fileUrl: string;
  category: 'PDF' | 'EXAM' | 'ATESTADO' | 'LAUDO' | 'IMAGE' | 'OTHER' | 'OUTROS';
  notes?: string;
  uploadedAt: string;
}

export interface SignatureRecord {
  id: string;
  tenantId: string;
  patientId: string;
  patientName?: string;
  documentType: 'ANAMNESIS' | 'SESSION_CONFIRMATION' | 'RESPONSIBILITY_TERM' | 'ANAMNESE' | 'SESSAO' | 'PACOTE';
  documentId?: string;
  referenceId?: string;
  signatureUrl: string;
  signedByName?: string;
  signedAt: string;
  ipAddress: string;
  hash: string;
}

export interface PublicValidationToken {
  id: string;
  token: string;
  tenantId: string;
  sessionId: string;
  patientId: string;
  createdAt: string;
  expiresAt: string;
  usedAt?: string;
  ipUsed?: string;
}

export interface WhatsAppMessage {
  id: string;
  tenantId: string;
  recipientPhone: string;
  recipientName: string;
  messageType: 'SESSION_VALIDATION' | 'BIRTHDAY' | 'REMINDER';
  content: string;
  status: 'SENT' | 'FAILED' | 'PENDING_SIMULATION';
  sentAt: string;
  validationUrl?: string;
}

export interface AuditLog {
  id: string;
  tenantId: string;
  userId: string;
  userName: string;
  userRole?: Role;
  action: string;
  targetResource?: string;
  resourceId?: string;
  entity?: string;
  entityId?: string;
  ipAddress?: string;
  timestamp: string;
  result?: 'SUCCESS' | 'FAILURE';
  details?: string;
}

export interface DashboardMetrics {
  totalPatients: number;
  sessionsToday: number;
  sessionsPending: number;
  activePackages: number;
  upcomingBirthdays: Patient[];
  recentSessions: Session[];
}

export type RealtimeEntityType = 'patients' | 'sessions' | 'packages' | 'anamneses' | 'tenants' | 'users' | 'evolutions' | 'documents' | 'signatures' | 'all';
export type RealtimeActionType = 'create' | 'update' | 'delete' | 'sync';

export interface RealtimeEvent {
  type: string;
  tenantId: string;
  entity: RealtimeEntityType;
  action: RealtimeActionType;
  payload?: any;
  id?: string;
  timestamp: string;
}

export type RealtimeConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'fallback_sse';

export interface DbConnectionTestResult {
  success: boolean;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  testedAt: string;
  responseTimeMs: number;
  message: string;
  isSuperUser: boolean;
  details: {
    postgresql: {
      configured: boolean;
      connected: boolean;
      latencyMs?: number;
      databaseName?: string;
      serverVersion?: string;
      tablesCount?: number;
      existingTables?: string[];
      totalRowsCount?: number;
      error?: string | null;
    };
    supabase: {
      configured: boolean;
      connected: boolean;
      url?: string;
      error?: string | null;
    };
    localStorageStore: {
      status: 'HEALTHY' | 'EMPTY' | 'UNAVAILABLE';
      recordsCount: {
        tenants: number;
        users: number;
        patients: number;
        sessions: number;
        packages: number;
        anamneses: number;
        evolutions: number;
        signatures: number;
        documents: number;
        auditLogs: number;
      };
      snapshotsCount: number;
      databaseFileSizeKb?: number;
    };
  };
}

