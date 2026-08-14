import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL_BASE } from '../constants';

export interface SaaSAdmin {
    id: number;
    name: string;
    email: string;
    scope: 'COMPLEX' | 'SINGLE';
    scopeName: string;
    billingConfig: {
        feeAmount: number;
        currency: string;
        localCurrency: string;
        exchangeRate: number;
    };
    currentPeriod: {
        month: string;
        status: 'PAID' | 'PENDING' | 'OVERDUE';
        dueDate: string;
        paymentDate?: string;
    };
}

@Injectable({
    providedIn: 'root'
})
export class SaasService {
    private http = inject(HttpClient);
    // Asegúrate de que esta URL coincida con tu enrutador principal, por ej. /api/saas
    private readonly API_URL = API_URL_BASE + '/api/saas';

    // 1. Obtener listado para el Dashboard
    getDashboard(): Observable<{ success: boolean, data: SaaSAdmin[] }> {
        return this.http.get<{ success: boolean, data: SaaSAdmin[] }>(`${this.API_URL}/dashboard`);
    }

    // 2. Actualizar configuración de cobro de un administrador
    updateSubscription(payload: { admin_id: number, fee_amount: number, currency: string, local_currency: string, due_days: number }): Observable<any> {
        return this.http.post(`${this.API_URL}/subscription`, payload);
    }

    // 3. Registrar un pago
    registerPayment(payload: { admin_id: number, amount_paid: number, payment_method: string, reference_number: string, payment_date: string, notes?: string }): Observable<any> {
        return this.http.post(`${this.API_URL}/payment`, payload);
    }

    // 4. Obtener el historial de pagos de un administrador
    getPaymentHistory(adminId: number): Observable<any> {
        return this.http.get(`${this.API_URL}/history/${adminId}`);
    }
}