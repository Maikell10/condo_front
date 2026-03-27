import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminService {
    private http = inject(HttpClient);
    private readonly API_URL = 'https://condoback.vercel.app/api/admin';

    getUsers(): Observable<{ data: any[] }> {
        return this.http.get<{ data: any[] }>(`${this.API_URL}/users`);
    }

    updateStatus(id: number, status: string): Observable<any> {
        return this.http.patch(`${this.API_URL}/users/${id}/status`, { status });
    }

    getBuildings(): Observable<{ data: any[] }> {
        return this.http.get<{ data: any[] }>(`${this.API_URL}/buildings`);
    }

    updateBuildingStatus(id: number, status: string): Observable<any> {
        return this.http.patch(`${this.API_URL}/buildings/${id}/status`, { status });
    }
}