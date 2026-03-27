export type UserRole = 'SUPER_ADMIN' | 'BUILDING_ADMIN' | 'OWNER';

export interface User {
    id: string;
    name: string;
    email: string;
    username?: string;
    role: UserRole;
    buildingId?: string;
    apartmentId?: string;
    ownerCode?: string;
}