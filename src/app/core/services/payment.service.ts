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
}