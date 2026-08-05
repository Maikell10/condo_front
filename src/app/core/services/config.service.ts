import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL_BASE } from '../constants';

@Injectable({ providedIn: 'root' })
export class ConfigService {
    private http = inject(HttpClient);
    private readonly API_URL = API_URL_BASE + '/api/settings';

    getAdminSettings() {
        return this.http.get<any>(`${this.API_URL}/building_admin`);
    }

    updateAdminSettings(payload: any) {
        return this.http.put<any>(`${this.API_URL}/building_admin`, payload);
    }
}