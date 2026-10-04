export const API_URL_BASE = 'https://condoback.vercel.app'
//export const API_URL_BASE = 'http://localhost:3000'

/** URL pública del SPA (QR y enlaces compartibles). */
export const PUBLIC_SITE_URL = 'https://www.condominioaunclic.online';

export function vcardPublicPath(id: number | string): string {
  return `/vcard/${id}`;
}

export function vcardPublicUrl(id: number | string): string {
  return `${PUBLIC_SITE_URL}${vcardPublicPath(id)}`;
}