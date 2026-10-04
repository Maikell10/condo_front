import { VCardContact, VCardProfile } from './vcard.models';

export type { VCardContact } from './vcard.models';
export type VCardDownloadPayload = VCardContact | VCardProfile;

function escapeVCard(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function normalizeTel(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  return trimmed.replace(/[^\d+]/g, '');
}

function splitName(fullName: string): { family: string; given: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) {
    return { family: '', given: parts[0] ?? '' };
  }
  return {
    family: parts[parts.length - 1],
    given: parts.slice(0, -1).join(' ')
  };
}

function formatRev(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function photoLine(photoDataUrl?: string): string | null {
  if (!photoDataUrl?.startsWith('data:image/')) return null;
  const match = photoDataUrl.match(/^data:image\/(\w+);base64,(.+)$/s);
  if (!match) return null;
  const type = match[1].toUpperCase() === 'JPEG' ? 'JPEG' : match[1].toUpperCase();
  return `PHOTO;ENCODING=b;TYPE=${type}:${match[2]}`;
}

export function buildVCard(contact: VCardDownloadPayload): string {
  const { family, given } = splitName(contact.fullName);
  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'PRODID:-//Condominio A Un Clic//ES',
    `N:${escapeVCard(family)};${escapeVCard(given)};;;`,
    `FN:${escapeVCard(contact.fullName)}`,
    `ORG:${escapeVCard(contact.organization)}`,
    `TITLE:${escapeVCard(contact.title)}`,
    `EMAIL;TYPE=INTERNET,WORK:${contact.email.trim()}`
  ];

  const cell = normalizeTel(contact.cellPhone);
  if (cell) {
    lines.push(`TEL;TYPE=CELL,VOICE:${cell}`);
  }

  const work = contact.workPhone ? normalizeTel(contact.workPhone) : '';
  if (work) {
    lines.push(`TEL;TYPE=WORK,VOICE:${work}`);
  }

  const locality = escapeVCard(contact.addressLocality.trim());
  const country = escapeVCard(contact.addressCountry.trim());
  lines.push(`ADR;TYPE=WORK:;;${locality};;;;${country}`);

  const website = contact.website.trim();
  if (website) {
    lines.push(`URL:${website}`);
  }

  const profile = contact as VCardProfile;
  const photo = photoLine(profile.photoDataUrl);
  if (photo) {
    lines.push(photo);
  }

  const tagline = profile.tagline?.trim();
  const note = contact.note?.trim();
  const noteCombined = [tagline ? `"${tagline}"` : '', note].filter(Boolean).join(' — ');
  if (noteCombined) {
    lines.push(`NOTE:${escapeVCard(noteCombined)}`);
  }

  lines.push('CATEGORIES:Condominios,Administración,SaaS');
  lines.push(`REV:${formatRev(new Date())}`);
  lines.push('END:VCARD');

  return lines.join('\r\n');
}

export function vCardFilename(contact: VCardContact): string {
  const slug = contact.fullName
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${slug || 'contacto'}.vcf`;
}

export function downloadVCard(contact: VCardContact): void {
  const content = buildVCard(contact);
  const blob = new Blob([content], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = vCardFilename(contact);
  anchor.click();
  URL.revokeObjectURL(url);
}
