import { Session, SessionPackage } from '../types';

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
  clinicName: string = 'Clínica de Terapias Integradas'
): string {
  const effectiveOrigin = origin || (typeof window !== 'undefined' ? window.location.origin : 'https://clinica.app');
  const targetSessionId = session.id;

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
  return `${effectiveOrigin}/?sessao=${encodeURIComponent(targetSessionId)}&d=${encoded}#validar-sessao=${encodeURIComponent(targetSessionId)}`;
}

// Helper to generate Package Signoff URL with embedded self-contained payload
export function createPackageValidationUrl(
  origin: string,
  pkg: SessionPackage,
  allSessions: Session[] = [],
  clinicName: string = 'Clínica de Terapias Integradas'
): string {
  const effectiveOrigin = origin || (typeof window !== 'undefined' ? window.location.origin : 'https://clinica.app');
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
  return `${effectiveOrigin}/?pacote=${encodeURIComponent(pkg.id)}&d=${encoded}#validar-pacote=${encodeURIComponent(pkg.id)}`;
}
