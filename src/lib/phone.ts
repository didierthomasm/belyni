// Normaliza teléfonos mexicanos a 10 dígitos nacionales
const MX_COUNTRY_CODE = '52';
const NATIONAL_LENGTH = 10;

function extractNationalDigits(digits: string): string | null {
  if (digits.length === NATIONAL_LENGTH) return digits;
  if (digits.length === 12 && digits.startsWith(MX_COUNTRY_CODE)) return digits.slice(2);
  // Prefijo "1" de celulares (formato anterior a 2019)
  if (digits.length === 13 && digits.startsWith(`${MX_COUNTRY_CODE}1`)) return digits.slice(3);
  return null;
}

export function normalizeMxPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  const national = extractNationalDigits(digits);
  // Ningún número nacional mexicano empieza en 0 o 1 (ej. un dígito faltante lo produce)
  if (national !== null && !/^[01]/.test(national)) return national;
  throw new Error(
    `Número de teléfono inválido: "${raw}". Usa 10 dígitos, por ejemplo 229 225 8060.`,
  );
}

export function isValidMxPhone(raw: string): boolean {
  try {
    normalizeMxPhone(raw);
    return true;
  } catch {
    return false;
  }
}

export function telHref(raw: string): string {
  return `tel:+${MX_COUNTRY_CODE}${normalizeMxPhone(raw)}`;
}

export function formatMxPhone(raw: string): string {
  const d = normalizeMxPhone(raw);
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}
