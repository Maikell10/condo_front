import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL_BASE } from '../constants';

@Injectable({ providedIn: 'root' })
export class DashboardService {
    private http = inject(HttpClient);
    private readonly API_URL = API_URL_BASE + '/api/dashboard';

    getStats(buildingId: number): Observable<any> {
        return this.http.get(`${this.API_URL}/stats/${buildingId}`);
    }
}