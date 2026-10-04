export interface AdminBuilding {
  id: number;
  code: string;
  name: string;
  status: string;
  address?: string | null;
  complexId?: number | null;
  complexName?: string | null;
  complexAddress?: string | null;
  adminEmail?: string | null;
  adminName?: string | null;
  /** users.status del admin del edificio o del conjunto */
  adminStatus?: string | null;
  totalApartments: number;
}

export interface AdminComplexSummary {
  id: number;
  name: string;
  address?: string | null;
  buildingCount: number;
}

export interface BuildingComplexGroup {
  key: string;
  complexId: number | null;
  complexName: string;
  complexAddress?: string | null;
  buildings: AdminBuilding[];
}
