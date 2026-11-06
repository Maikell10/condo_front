import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL_BASE } from '../constants';

@Injectable({
    providedIn: 'root'
})
export class PaymentService {
    private http = inject(HttpClient);
    private readonly API_URL = API_URL_BASE + '/api/payments';

    reportPayment(paymentData: any): Observable<any> {
        return this.http.post(this.API_URL, paymentData);
    }

    getRecentPayments(): Observable<{ data: any[] }> {
        return this.http.get<{ data: any[] }>(`${this.API_URL}/recent`);
    }

    getBuildingPayments(): Observable<{ data: any[] }> {
        return this.http.get<{ data: any[] }>(`${this.API_URL}/building-admin`);
    }

    approvePayment(id: number): Observable<any> {
        // MySQL/Node suelen devolver un objeto con un mensaje, no un array
        return this.http.patch<any>(`${this.API_URL}/${id}/approve`, {});
    }

    rejectPayment(id: number): Observable<any> {
        // MySQL/Node suelen devolver un objeto con un mensaje, no un array
        return this.http.patch<any>(`${this.API_URL}/${id}/reject`, {});
    }

    getLatestExchangeRate() {
        return this.http.get<any>(`${API_URL_BASE}/api/tasa/get_tasa/usd`);
    }

    /** Super Admin: tasa USD con id, fechas de BD (p. ej. updated_at). */
    getExchangeRateAdmin() {
        return this.http.get<any>(`${API_URL_BASE}/api/tasa/admin/usd`);
    }

    /** Super Admin: guardar manualmente la única fila USD. */
    updateExchangeRateUsd(payload: { rate: number; rate_date: string }) {
        return this.http.put<any>(`${API_URL_BASE}/api/tasa/admin/usd`, payload);
    }

    /** Super Admin: scrape BCV y actualizar BD. */
    refreshExchangeRateFromBcv() {
        return this.http.post<any>(`${API_URL_BASE}/api/tasa/admin/refresh-bcv`, {});
    }
}