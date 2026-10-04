export interface VCardContact {
  fullName: string;
  organization: string;
  title: string;
  email: string;
  cellPhone: string;
  workPhone?: string;
  addressLocality: string;
  addressCountry: string;
  website: string;
  note?: string;
}

export type VCardUsage =
  | 'OFICIAL'
  | 'VENTAS_CAMPO'
  | 'DEMO_CLIENTE'
  | 'EVENTO'
  | 'SOPORTE';

export interface VCardSocialLinks {
  linkedin?: string;
  instagram?: string;
  tiktok?: string;
  github?: string;
  behance?: string;
}

export interface VCardProfile extends VCardContact {
  tagline?: string;
  photoDataUrl?: string;
  social?: VCardSocialLinks;
}

export interface StoredVCard {
  id: number;
  label: string;
  usage: VCardUsage;
  contact: VCardProfile;
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const VCARD_USAGE_LABELS: Record<VCardUsage, string> = {
  OFICIAL: 'Marca oficial',
  VENTAS_CAMPO: 'Ventas en campo',
  DEMO_CLIENTE: 'Post-demo',
  EVENTO: 'Feria / evento',
  SOPORTE: 'Soporte comercial'
};

export const VCARD_USAGE_HINTS: Record<VCardUsage, string> = {
  OFICIAL: 'Tarjeta pública con QR — ideal para material impreso y ferias.',
  VENTAS_CAMPO: 'Tu foto y datos directos; el QR lleva a la misma vista en el móvil del cliente.',
  DEMO_CLIENTE: 'Incluye tagline o nota con el siguiente paso tras la demo.',
  EVENTO: 'Versión lista para tarjeta física: escaneo → /vcard/id.',
  SOPORTE: 'Canal de seguimiento post-venta separado de ventas.'
};
