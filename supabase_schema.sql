-- ==============================================================================
-- SCRIPT OFICIAL E COMPLETO PARA CRIAÇÃO DO BANCO DE DADOS NO SUPABASE (POSTGRESQL)
-- SISTEMA CLÍNICO & GESTÃO DE PACIENTES / TERAPIAS PRO
-- ==============================================================================

-- 1. Habilitar extensões úteis (se aplicável)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 2. TABELA: tenants (Clínicas e Configurações de Marca / Multi-empresa)
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 3. TABELA: users (Profissionais, Terapeutas, Médicos, Recepcionistas e Admins)
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 4. TABELA: patients (Prontuário e Cadastro Completo de Pacientes)
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 5. TABELA: anamneses (Fichas de Anamnese, Histórico de Saúde e Termo de Consentimento)
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 6. TABELA: packages (Pacotes de Tratamento e Sessões Contratadas)
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 7. TABELA: sessions (Atendimentos, Agendamentos e Validações Digitais)
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 8. TABELA: evolutions (Evoluções Clínicas e Registro Diário por Sessão)
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 9. TABELA: public_tokens (Tokens de Validação e Assinatura Pública)
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 10. TABELA: audit_logs (Trilha de Auditoria LGPD e Registro de Ações)
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 11. TABELA: document_files (Documentos, Exames, Laudos e Anexos Clínicos)
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 12. TABELA: signatures (Assinaturas Digitais Criptografadas com Hash e IP)
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 13. ÍNDICES DE ALTA PERFORMANCE PARA O SUPABASE
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_patients_tenant ON patients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_patients_deleted ON patients(deleted_at);
CREATE INDEX IF NOT EXISTS idx_sessions_tenant ON sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sessions_patient ON sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_sessions_scheduled_date ON sessions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_packages_tenant ON packages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_packages_patient ON packages(patient_id);
CREATE INDEX IF NOT EXISTS idx_evolutions_patient ON evolutions(patient_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_public_tokens_token ON public_tokens(token);

-- ------------------------------------------------------------------------------
-- 14. CARGA INICIAL PADRÃO (Clínica e Usuários Administradores Master)
-- ------------------------------------------------------------------------------
INSERT INTO tenants (
  id,
  name,
  trade_name,
  corporate_name,
  doc_type,
  document_number,
  email,
  phone,
  city,
  state,
  created_at
) VALUES (
  'tenant-demo-1',
  'Clínica de Terapias Integradas',
  'Clínica Fisio & Terapia Integrada',
  'Fisio & Terapia Integrada LTDA',
  'CNPJ',
  '12.345.678/0001-90',
  'contato@fisioterapia.com.br',
  '(11) 99999-8888',
  'São Paulo',
  'SP',
  NOW()::TEXT
) ON CONFLICT (id) DO NOTHING;

INSERT INTO users (
  id,
  tenant_id,
  name,
  email,
  role,
  access_mode,
  active,
  is_super_user,
  created_at
) VALUES 
  ('user-master-1', 'tenant-demo-1', 'osaiasbrito', 'osaiasbrito@gmail.com', 'ADMIN', 'FULL', true, true, NOW()::TEXT),
  ('user-master-2', 'tenant-demo-1', 'senhordispositivos', 'senhordispositivos@gmail.com', 'ADMIN', 'FULL', true, true, NOW()::TEXT)
ON CONFLICT (id) DO NOTHING;
