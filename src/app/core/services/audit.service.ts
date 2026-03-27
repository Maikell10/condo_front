// src/app/core/services/audit.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AuditService {
    private http = inject(HttpClient);
    private readonly API_URL = 'https://condoback.vercel.app/api/audit';

    /**
     * Obtiene los logs de auditoría aplicando los filtros seleccionados.
     * @param filters Objeto con user, action, module y date.
     */
    getLogs(filters: any): Observable<{ data: any[] }> {
        let params = new HttpParams();

        // Iteramos los filtros para añadirlos solo si tienen valor
        Object.keys(filters).forEach(key => {
            if (filters[key]) {
                params = params.append(key, filters[key]);
            }
        });

        return this.http.get<{ data: any[] }>(this.API_URL, { params });
    }
}