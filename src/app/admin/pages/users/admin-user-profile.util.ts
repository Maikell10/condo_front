export type DocType = 'V' | 'E';
export type UserSex = 'M' | 'F';

const PHONE_VE_LOCAL_RE = /^\d{10}$/;

export function parseStoredCedula(stored: string | null | undefined): {
  docType: DocType;
  docNumber: string;
} {
  if (!stored?.trim()) {
    return { docType: 'V', docNumber: '' };
  }
  const compact = stored.trim().replace(/\s/g, '');
  const match = compact.match(/^([VE])[-.]?([\d.]+)$/i);
  if (match) {
    return {
      docType: match[1].toUpperCase() as DocType,
      docNumber: match[2].replace(/\D/g, '')
    };
  }
  const digitsOnly = compact.replace(/\D/g, '');
  if (digitsOnly) {
    return { docType: 'V', docNumber: digitsOnly };
  }
  return { docType: 'V', docNumber: '' };
}

export function formatStoredCedula(
  docType: DocType | string | null | undefined,
  docNumber: string | null | undefined
): string | null {
  const type = (docType === 'E' ? 'E' : 'V') as DocType;
  const digits = (docNumber ?? '').replace(/\D/g, '');
  if (!digits) return null;
  return `${type}${digits}`;
}

export function parseStoredPhone(stored: string | null | undefined): {
  countryCode: '+58';
  local: string;
} {
  if (!stored?.trim()) {
    return { countryCode: '+58', local: '' };
  }
  const digits = stored.replace(/\D/g, '');
  if (digits.startsWith('58') && digits.length >= 12) {
    return { countryCode: '+58', local: digits.slice(2, 12) };
  }
  if (digits.length === 10) {
    return { countryCode: '+58', local: digits };
  }
  if (digits.length > 10) {
    return { countryCode: '+58', local: digits.slice(-10) };
  }
  return { countryCode: '+58', local: digits };
}

export function formatStoredPhone(
  countryCode: string | null | undefined,
  local: string | null | undefined
): string | null {
  const code = countryCode === '+58' ? '+58' : '+58';
  const digits = (local ?? '').replace(/\D/g, '').slice(0, 10);
  if (!digits) return null;
  if (!PHONE_VE_LOCAL_RE.test(digits)) return null;
  return `${code}${digits}`;
}

export function parseIsoDate(value: string | null | undefined): Date | null {
  if (!value?.trim()) return null;
  const m = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const date = new Date(y, mo, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo || date.getDate() !== d) {
    return null;
  }
  return date;
}

export function toIsoDate(value: Date | null | undefined): string | null {
  if (!value || Number.isNaN(value.getTime())) return null;
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, '0');
  const d = String(value.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatPhoneForDisplay(stored: string | null | undefined): string {
  const { countryCode, local } = parseStoredPhone(stored);
  if (!local) return '';
  return `${countryCode} ${local}`;
}
