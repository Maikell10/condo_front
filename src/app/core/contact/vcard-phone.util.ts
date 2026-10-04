export function telHref(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : '';
}

export function whatsAppHref(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('0')) {
    digits = digits.replace(/^0+/, '');
  }
  return digits ? `https://wa.me/${digits}` : '';
}
