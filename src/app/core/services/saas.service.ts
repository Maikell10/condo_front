import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL_BASE } from '../constants';
import type { SaasInvoiceDocumentPayload } from './saas-invoice-print.service';

export interface SaaSAdmin {
    id: number;
    name: string;
    email: string;
    accountStatus?: 'ACTIVE' | 'INACTIVE' | string;
    subscriptionStatus?: string;
    isTestAccount?: boolean;
    /** false para cuentas testing o users.status INACTIVE — no sumar en MRR/KPIs */
    includeInMetrics?: boolean;
    hasSubscription?: boolean;
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
        status: 'PAID' | 'PENDING' | 'OVERDUE' | 'INACTIVE' | 'NONE';
        dueDate?: string | null;
        paymentDate?: string | null;
    };
    /** Facturas PENDING/OVERDUE acumuladas */
    openInvoices?: {
        count: number;
        totalAmount: number;
        currency: string;
    };
    /** Próxima factura FIFO (la más antigua sin pagar) */
    nextOpenInvoice?: {
        id: number;
        periodMonth: number;
        periodYear: number;
        feeAmount: number;
        currency: string;
        dueDate?: string | null;
        status: string;
    } | null;
    /** Último pago SaaS registrado (cualquier factura) */
    lastPaymentDate?: string | null;
    /** Total histórico de facturas SaaS */
    totalInvoices?: number;
}

export interface SaasInvoice {
    id: number;
    admin_id: number;
    period_month: number;
    period_year: number;
    fee_amount: number;
    currency: string;
    issue_date: string;
    due_date: string;
    status: 'PENDING' | 'OVERDUE' | 'PAID' | string;
    payment_date?: string | null;
}

@Injectable({
    providedIn: 'root'
})
export class SaasService {
    private http = inject(HttpClient);
    // Asegúrate de que esta URL coincida con tu enrutador principal, por ej. /api/saas
    private readonly API_URL = API_URL_BASE + '/api/saas';

    // 1. Obtener listado para el Dashboard
    getDashboard(): Observable<{
        success: boolean;
        data: SaaSAdmin[];
        stats?: { collectedThisMonth?: number };
    }> {
        return this.http.get<{
            success: boolean;
            data: SaaSAdmin[];
            stats?: { collectedThisMonth?: number };
        }>(`${this.API_URL}/dashboard`);
    }

    getInvoiceDocument(invoiceId: number): Observable<{
        success: boolean;
        data: SaasInvoiceDocumentPayload;
    }> {
        return this.http.get<{ success: boolean; data: SaasInvoiceDocumentPayload }>(
            `${this.API_URL}/invoice-document/${invoiceId}`
        );
    }

    // 2. Actualizar configuración de cobro de un administrador
    updateSubscription(payload: { admin_id: number, fee_amount: number, currency: string, local_currency: string, due_days: number }): Observable<any> {
        return this.http.post(`${this.API_URL}/subscription`, payload);
    }

    // 3. Registrar un pago
    registerPayment(payload: {
        admin_id: number;
        invoice_id?: number;
        amount_paid: number;
        payment_method: string;
        reference_number: string;
        payment_date: string;
        notes?: string;
    }): Observable<{
        success: boolean;
        message?: string;
        data?: {
            invoice_id: number;
            period_month: number;
            period_year: number;
            amount_paid: number;
            currency: string;
        };
    }> {
        return this.http.post<{
            success: boolean;
            message?: string;
            data?: {
                invoice_id: number;
                period_month: number;
                period_year: number;
                amount_paid: number;
                currency: string;
            };
        }>(`${this.API_URL}/payment`, payload);
    }

    getAdminInvoices(adminId: number): Observable<{ success: boolean; data: SaasInvoice[] }> {
        return this.http.get<{ success: boolean; data: SaasInvoice[] }>(
            `${this.API_URL}/invoices/${adminId}`
        );
    }

    // 4. Obtener el historial de pagos de un administrador
    getPaymentHistory(adminId: number): Observable<{ success: boolean; data: SaasPaymentRecord[] }> {
        return this.http.get<{ success: boolean; data: SaasPaymentRecord[] }>(
            `${this.API_URL}/history/${adminId}`
        );
    }

    getAllPaymentHistory(adminId?: number): Observable<{ success: boolean; data: SaasPaymentRecord[] }> {
        const url =
            adminId != null
                ? `${this.API_URL}/history?admin_id=${adminId}`
                : `${this.API_URL}/history`;
        return this.http.get<{ success: boolean; data: SaasPaymentRecord[] }>(url);
    }
}

export interface SaasPaymentRecord {
    id: number;
    admin_id: number;
    amount_paid: number;
    payment_method: string;
    reference_number?: string | null;
    payment_date: string;
    notes?: string | null;
    period_month: number;
    period_year: number;
    currency: string;
    admin_name?: string;
    admin_email?: string;
    complex_name?: string | null;
    building_name?: string | null;
}