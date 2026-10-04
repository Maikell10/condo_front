export type AdminUserRole = 'SUPER_ADMIN' | 'BUILDING_ADMIN' | 'OWNER';

export interface AdminUserRow {
  id: number;
  name: string;
  email: string;
  role: AdminUserRole | string;
  status: string;
  buildingName?: string | null;
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
