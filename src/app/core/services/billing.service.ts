import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interfaz para la respuesta de la generación
interface BillingResponse {
    message: string;
}

@Injectable({
    providedIn: 'root'
})
export class BillingService {
    private http = inject(HttpClient);
    private readonly API_URL = 'https://condoback.vercel.app/api/billing';

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
    getBuildingExpenses(buildingId: number, month: number, year: number): Observable<{ data: any[] }> {
        // Pasamos el mes y año como parámetros en la URL
        return this.http.get<{ data: any[] }>(
            `${this.API_URL}/expenses/${buildingId}?month=${month}&year=${year}`
        );
    }

    /**
     * Registra un nuevo gasto (Factura) del edificio
     */
    addExpense(expenseData: any): Observable<any> {
        return this.http.post(`${this.API_URL}/expenses`, expenseData);
    }

    getConcepts(): Observable<{ data: any[] }> {
        // Usaremos la ruta que definimos en concept.routes.js
        return this.http.get<{ data: any[] }>(`https://condoback.vercel.app/api/concepts`);
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
}