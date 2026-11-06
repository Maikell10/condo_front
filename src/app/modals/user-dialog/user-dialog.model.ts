import { AdminUserRow } from '../../admin/pages/users/admin-user.model';

export interface OwnerUnitScopeRow {
  apartmentId: number;
  number: string;
  buildingId: number;
  buildingName: string;
}

export interface BuildingAdminOwnerProfileDialogData {
  mode: 'building_admin_profile';
  owner: AdminUserRow;
  unitsInScope: OwnerUnitScopeRow[];
  unitLabel?: string;
}

/** Alta de propietario nuevo y asignación a un apartamento sin dueño (building admin). */
export interface CreateOwnerForApartmentDialogData {
  mode: 'create_owner_for_apartment';
  apartmentId: number;
  unitLabel?: string;
}

export type UserDialogData =
  | AdminUserRow
  | BuildingAdminOwnerProfileDialogData
  | CreateOwnerForApartmentDialogData
  | null;

export function isBuildingAdminProfileDialog(
  data: UserDialogData
): data is BuildingAdminOwnerProfileDialogData {
  return !!data && typeof data === 'object' && 'mode' in data && data.mode === 'building_admin_profile';
}

export function isCreateOwnerForApartmentDialog(
  data: UserDialogData
): data is CreateOwnerForApartmentDialogData {
  return !!data && typeof data === 'object' && 'mode' in data && data.mode === 'create_owner_for_apartment';
}

export interface OwnerEditContextResponse {
  apartmentId: number;
  apartmentNumber: string;
  ownerId: number;
  canEdit: boolean;
  code: string;
  message: string | null;
  unitsInScope: OwnerUnitScopeRow[];
  outsideUnits: OwnerUnitScopeRow[];
  owner?: AdminUserRow;
}
