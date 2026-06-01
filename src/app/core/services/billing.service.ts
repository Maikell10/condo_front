import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL_BASE } from '../constants';

// Interfaz para la respuesta de la generación
interface BillingResponse {
    message: string;
}

@Injectable({
    providedIn: 'root'
})
export class BillingService {
    private http = inject(HttpClient);
    private readonly API_URL = API_URL_BASE + '/api/billing';

    /**
 * Dispara el proceso de facturación mensual (Cierre de mes)
 * @param payload Objeto con buildingId, month y year
 */
    generateBilling(payload: { buildingId: number; month: number; year: number }): Observable<BillingResponse> {
        // Enviamos el objeto completo al backend para cerrar el periodo exacto
        return this.http.post<BillingResponse>(`${this.API_URL}/generate`, payload);
    }

    /**
     * Obtiene los gastos registrados para el edificio en el mes actual
     * (Para alimentar la tabla de la vista de Facturas)
     */
    getExpenses(payload: any, month: number, year: number): Observable<any> {

        // Si estamos en la vista de Conjunto ("Todos los Edificios")
        if (payload.isComplex) {
            // Mandamos 'ALL' en la ruta y el complexId como parámetro de consulta
            return this.http.get(`${this.API_URL}/expenses/ALL?complexId=${payload.complexId}&month=${month}&year=${year}`);
        }
        // Si estamos en la vista de Edificio Individual
        else {
            return this.http.get(`${this.API_URL}/expenses/${payload.buildingId}?month=${month}&year=${year}`);
        }
    }

    // Obtiene los recibos / estados de cuenta
    getStatements(payload: any): Observable<any> {
        if (payload.isComplex) {
            return this.http.get(`${this.API_URL}/statements/ALL?complexId=${payload.complexId}`);
        } else {
            return this.http.get(`${this.API_URL}/statements/${payload.buildingId}`);
        }
    }

    /**
     * Registra un nuevo gasto (Factura) del edificio
     */
    addExpense(expenseData: any): Observable<any> {
        return this.http.post(`${this.API_URL}/expenses`, expenseData);
    }

    getConcepts(): Observable<{ data: any[] }> {
        // Usaremos la ruta que definimos en concept.routes.js
        return this.http.get<{ data: any[] }>(`${API_URL_BASE}/api/concepts`);
    }

    deleteExpense(id: number): Observable<any> {
        return this.http.delete(`${this.API_URL}/expenses/${id}`);
    }

    getClosedPeriods(buildingId: number): Observable<{ data: any[] }> {
        return this.http.get<{ data: any[] }>(`${this.API_URL}/periods/${buildingId}`);
    }

    // En billing.service.ts...
    getMonthlyReport(buildingId: number, month: number, year: number): Observable<any> {
        return this.http.get(`${this.API_URL}/report/${buildingId}?month=${month}&year=${year}`);
    }

    // Enviar el pago
    registerAdminPayment(payload: any): Observable<any> {
        return this.http.post(`${this.API_URL}/statements/pay`, payload);
    }

    getPendingSummary(buildingId: number): Observable<any> {
        return this.http.get(`${this.API_URL}/building/${buildingId}/pending-summary`);
    }

    getPendingDetailed(buildingId: number): Observable<any> {
        return this.http.get(`${this.API_URL}/building/${buildingId}/pending-detailed`);
    }

    getAvailableExpensePeriods(buildingId: number): Observable<any> {
        return this.http.get(`${this.API_URL}/building/${buildingId}/expense-periods`);
    }

    getExpensesByPeriod(buildingId: number, month: number, year: number): Observable<any> {
        return this.http.get(`${this.API_URL}/building/${buildingId}/expenses-by-period?month=${month}&year=${year}`);
    }

    getOwnerReceiptPeriods(): Observable<any> {
        return this.http.get(`${this.API_URL}/owner/receipt-periods`);
    }

    getOwnerReceiptDetail(apartmentId: number, month: number, year: number): Observable<any> {
        return this.http.get(`${this.API_URL}/owner/receipt-detail/${apartmentId}?month=${month}&year=${year}`);
    }

    getPaidReceipts(): Observable<any> {
        return this.http.get(`${this.API_URL}/owner/paid-receipts`);
    }
}