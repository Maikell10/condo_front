export type AdminUserRole = 'SUPER_ADMIN' | 'BUILDING_ADMIN' | 'OWNER';

export interface AdminUserOwnedApartment {
  id: number;
  number: string;
  buildingName: string;
  buildingCode?: string;
}

export interface AdminUserRow {
  id: number;
  name: string;
  email: string;
  cedula?: string | null;
  phone?: string | null;
  sex?: 'M' | 'F' | null;
  birthDate?: string | null;
  role: AdminUserRole | string;
  status: string;
  buildingName?: string | null;
  apartmentCount?: number;
  ownedUnitsSummary?: string | null;
  ownedApartments?: AdminUserOwnedApartment[];
}

export interface AdminUsersListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminUsersStats {
  total: number;
  active: number;
  inactive: number;
  superAdmins: number;
  buildingAdmins: number;
  owners: number;
}

export interface AdminUsersListResponse {
  data: AdminUserRow[];
  meta: AdminUsersListMeta;
  stats: AdminUsersStats;
}

export interface AdminUserDetailResponse {
  data: AdminUserRow;
}

const PLACEHOLDER_EMAIL_RE = /^sin-correo-.+@condominio\.local$/i;

/** Correo real para UI; oculta placeholders de importación. */
export function displayUserEmail(
  email: string | null | undefined,
  role?: string
): string {
  if (!email) return '';
  if (role === 'OWNER' && PLACEHOLDER_EMAIL_RE.test(email)) return '';
  return email;
}

export function isOwnerPlaceholderEmail(email: string | null | undefined): boolean {
  return !!email && PLACEHOLDER_EMAIL_RE.test(email);
}
