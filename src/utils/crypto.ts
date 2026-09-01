/**
 * Generates a cryptographically random single-use token (hex string)
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      token += chars[array[i] % chars.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return token;
}

/**
 * Generates a SHA-256-like hex signature hash for digital audit trail
 */
export function generateSignatureHash(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  const nowHex = Date.now().toString(16);
  return `SIG-${hex.toUpperCase()}-${nowHex.toUpperCase()}`;
}

/**
 * Format ISO date string to Brazilian Portuguese format (DD/MM/YYYY)
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Format ISO string to Portuguese Date & Time (DD/MM/YYYY às HH:mm)
 */
export function formatDateTime(dateTimeString?: string): string {
  if (!dateTimeString) return '-';
  try {
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return dateTimeString;
    const formattedDate = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
    const formattedTime = new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
    return `${formattedDate} às ${formattedTime}`;
  } catch {
    return dateTimeString;
  }
}

/**
 * Calculates age from birth date string (YYYY-MM-DD)
 */
export function calculateAge(birthDateString?: string): number {
  if (!birthDateString) return 0;
  const today = new Date();
  const birthDate = new Date(birthDateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : 0;
}

/**
 * Checks if a birthdate falls on tomorrow
 */
export function isBirthdayTomorrow(birthDateString?: string): boolean {
  if (!birthDateString) return false;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const birthDate = new Date(birthDateString);
  
  return (
    tomorrow.getDate() === birthDate.getDate() &&
    tomorrow.getMonth() === birthDate.getMonth()
  );
}

/**
 * Checks if a birthdate falls on today
 */
export function isBirthdayToday(birthDateString?: string): boolean {
  if (!birthDateString) return false;
  const today = new Date();
  const birthDate = new Date(birthDateString);
  return (
    today.getDate() === birthDate.getDate() &&
    today.getMonth() === birthDate.getMonth()
  );
}
