export function ownerPaymentStatusLabel(status: string): { label: string; pill: string } {
  if (status === 'PENDING_APPROVAL') return { label: 'En revisión', pill: 'review' };
  if (status === 'APPROVED') return { label: 'Verificado', pill: 'approved' };
  if (status === 'REJECTED') return { label: 'Rechazado', pill: 'rejected' };
  return { label: status, pill: 'pending' };
}