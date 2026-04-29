import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL_BASE } from '../constants';

@Injectable({ providedIn: 'root' })
export class ContractService {
    private http = inject(HttpClient);
    private readonly API_URL = API_URL_BASE + '/api/contracts';

    getBuildingContracts(buildingId: number): Observable<{ data: any[] }> {
        return this.http.get<{ data: any[] }>(`${this.API_URL}/${buildingId}`);
    }

    createContract(contract: any): Observable<any> {
        return this.http.post(`${this.API_URL}`, contract);
    }
}