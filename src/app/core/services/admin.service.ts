import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL_BASE } from '../constants';

@Injectable({ providedIn: 'root' })
export class AdminService {
    private http = inject(HttpClient);
    private readonly API_URL = API_URL_BASE + '/api/admin';

    getUsers(): Observable<{ data: any[] }> {
        return this.http.get<{ data: any[] }>(`${this.API_URL}/users`);
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

    getBuildings(): Observable<{ data: any[] }> {
        return this.http.get<{ data: any[] }>(`${this.API_URL}/buildings`);
    }

    updateBuildingStatus(id: number, status: string): Observable<any> {
        return this.http.patch(`${this.API_URL}/buildings/${id}/status`, { status });
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
}