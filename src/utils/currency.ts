/**
 * Brazilian Real Currency & Accounting Formatting Helpers
 */

/**
 * Formats numbers or numeric strings into Brazilian Accounting currency format: "R$ 500,00"
 */
export function formatCurrencyAccounting(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return 'R$ 0,00';
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^\d,-]/g, '').replace(',', '.')) : value;
  if (isNaN(num)) return 'R$ 0,00';
  return num.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formats raw typed digits into live Brazilian Real currency string:
 * e.g. "5" -> "R$ 0,05", "500" -> "R$ 5,00", "50000" -> "R$ 500,00"
 */
export function formatCurrencyInput(value: string | number): string {
  if (typeof value === 'number') {
    return formatCurrencyAccounting(value);
  }
  const cleanDigits = value.replace(/\D/g, '');
  if (!cleanDigits) return 'R$ 0,00';
  const cents = parseInt(cleanDigits, 10);
  const realValue = cents / 100;
  return realValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Parses a currency string like "R$ 500,00" or raw string into a numeric float value (e.g. 500)
 */
export function parseCurrencyInput(value: string | number): number {
  if (typeof value === 'number') return value;
  const cleanDigits = value.replace(/\D/g, '');
  if (!cleanDigits) return 0;
  return parseInt(cleanDigits, 10) / 100;
}
