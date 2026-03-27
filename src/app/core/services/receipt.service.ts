import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Exportamos la interfaz desde aquí para tenerla centralizada
export interface Receipt {
    id: number;
    fecha: string;
    monto: number;
    paid: number;
    deuda: number;
    saldo: number;
}

interface ApiResponse {
    message: string;
    data: Receipt[];
}

@Injectable({
    providedIn: 'root'
})
export class ReceiptService {
    private http = inject(HttpClient);
    private readonly API_URL = 'https://condoback.vercel.app/api/receipts';

    getPendingReceipts(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.API_URL}/pending`);
    }
}