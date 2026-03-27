import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DashboardService {
    private http = inject(HttpClient);
    private readonly API_URL = 'https://condoback.vercel.app/api/dashboard';

    getStats(buildingId: number): Observable<any> {
        return this.http.get(`${this.API_URL}/stats/${buildingId}`);
    }
}