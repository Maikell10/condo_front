import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ContractService {
    private http = inject(HttpClient);
    private readonly API_URL = 'https://condoback.vercel.app/api/contracts';

    getBuildingContracts(buildingId: number): Observable<{ data: any[] }> {
        return this.http.get<{ data: any[] }>(`${this.API_URL}/${buildingId}`);
    }

    createContract(contract: any): Observable<any> {
        return this.http.post(`${this.API_URL}`, contract);
    }
}