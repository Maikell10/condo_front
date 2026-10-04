import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL_BASE } from '../constants';
import { AdminUsersListResponse } from '../../admin/pages/users/admin-user.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
    private http = inject(HttpClient);
    private readonly API_URL = API_URL_BASE + '/api/admin';

    getUsers(filters?: {
        page?: number;
        limit?: number;
        search?: string;
        role?: string;
        status?: string;
    }): Observable<AdminUsersListResponse> {
        let params = new HttpParams();
        if (filters?.page != null) {
            params = params.set('page', String(filters.page));
        }
        if (filters?.limit != null) {
            params = params.set('limit', String(filters.limit));
        }
        if (filters?.search?.trim()) {
            params = params.set('search', filters.search.trim());
        }
        if (filters?.role && filters.role !== 'ALL') {
            params = params.set('role', filters.role);
        }
        if (filters?.status && filters.status !== 'ALL') {
            params = params.set('status', filters.status);
        }
        return this.http.get<AdminUsersListResponse>(`${this.API_URL}/users`, { params });
    }

    updateStatus(id: number, status: string): Observable<any> {
        return this.http.patch(`${this.API_URL}/users/${id}/status`, { status });
    }

    createUser(data: any): Observable<any> {
        return this.http.post(`${this.API_URL}/users`, data);
    }

    updateUser(id: number, data: any): Observable<any> {
        return this.http.put(`${this.API_URL}/users/${id}`, data);
    }

    getBuildings(filters?: {
        search?: string;
        status?: string;
        complexId?: string;
    }): Observable<{ data: any[]; complexes?: any[] }> {
        let params = new HttpParams();
        if (filters?.search?.trim()) {
            params = params.set('search', filters.search.trim());
        }
        if (filters?.status && filters.status !== 'ALL') {
            params = params.set('status', filters.status);
        }
        if (filters?.complexId && filters.complexId !== 'ALL') {
            params = params.set('complexId', filters.complexId);
        }
        return this.http.get<{ data: any[]; complexes?: any[] }>(`${this.API_URL}/buildings`, { params });
    }

    updateBuildingStatus(id: number, status: string): Observable<any> {
        return this.http.patch(`${this.API_URL}/buildings/${id}/status`, { status });
    }

    /** Activa o suspende todos los edificios del conjunto y sus administradores. */
    updateComplexStatus(complexId: number, status: 'ACTIVE' | 'INACTIVE'): Observable<any> {
        return this.http.patch(`${this.API_URL}/complexes/${complexId}/status`, { status });
    }

    createBuilding(data: any): Observable<any> {
        return this.http.post(`${this.API_URL}/buildings`, data);
    }

    updateBuilding(id: number, data: any): Observable<any> {
        return this.http.put(`${this.API_URL}/buildings/${id}`, data);
    }

    assignBuildingAdmin(buildingId: number, email: string): Observable<any> {
        return this.http.patch(`${this.API_URL}/buildings/${buildingId}/admin`, { email });
    }

    getDashboardStats(): Observable<any> {
        return this.http.get(`${this.API_URL}/dashboard-stats`);
    }

    importComplexData(formData: FormData) {
        // Apunta a la ruta exacta donde configuraste tu multer en Node.js
        return this.http.post(`${API_URL_BASE}/api/building/import-complex-data`, formData);
    }
}