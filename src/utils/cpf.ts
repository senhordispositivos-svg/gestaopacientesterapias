/**
 * Mathematical validation for Brazilian CPF (Cadastro de Pessoas Físicas)
 */
export function validateCPF(cpf: string | null | undefined): boolean {
  if (!cpf || typeof cpf !== 'string') return false;
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return false;

  // Reject sequences of identical digits (e.g., 111.111.111-11)
  if (/^(\d)\1{10}$/.test(clean)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean.charAt(i), 10) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(9), 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean.charAt(i), 10) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(10), 10)) return false;

  return true;
}

/**
 * Mathematical validation for Brazilian CNPJ
 */
export function validateCNPJ(cnpj: string | null | undefined): boolean {
  if (!cnpj || typeof cnpj !== 'string') return false;
  const clean = cnpj.replace(/\D/g, '');
  if (clean.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(clean)) return false;

  let size = clean.length - 2;
  let numbers = clean.substring(0, size);
  const digits = clean.substring(size);
  let sum = 0;
  let pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0), 10)) return false;

  size = size + 1;
  numbers = clean.substring(0, size);
  sum = 0;
  pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1), 10)) return false;

  return true;
}

/**
 * Formats digits to CPF mask: 000.000.000-00
 */
export function formatCPF(value: string | null | undefined): string {
  if (!value || typeof value !== 'string') return '-';
  const cleanDigits = value.replace(/\D/g, '');
  if (!cleanDigits) return '-';
  const digits = cleanDigits.slice(0, 11);
  if (digits.length < 11) {
    return digits;
  }
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

/**
 * Formats digits to CNPJ mask: 00.000.000/0001-00
 */
export function formatCNPJ(value: string | null | undefined): string {
  if (!value || typeof value !== 'string') return '-';
  const cleanDigits = value.replace(/\D/g, '');
  if (!cleanDigits) return '-';
  const digits = cleanDigits.slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

/**
 * Formats phone/WhatsApp: (00) 00000-0000 or (00) 0000-0000
 */
export function formatPhone(value: string | null | undefined): string {
  if (!value || typeof value !== 'string') return '-';
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (!digits) return '-';
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

/**
 * Formats CEP: 00000-000
 */
export function formatCEP(value: string | null | undefined): string {
  if (!value || typeof value !== 'string') return '-';
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (!digits) return '-';
  return digits.replace(/^(\d{5})(\d)/, '$1-$2');
}
