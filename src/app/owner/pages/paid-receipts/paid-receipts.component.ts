import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BillingService } from '../../../core/services/billing.service';
import { ReceiptPreviewDialogComponent } from '../../../modals/receipt-preview-dialog/receipt-preview-dialog.component';

@Component({
    selector: 'app-paid-receipts',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatTableModule, MatIconModule, MatButtonModule, MatDialogModule, CurrencyPipe],
    templateUrl: './paid-receipts.component.html'
})
export class PaidReceiptsComponent implements OnInit {
    private billingService = inject(BillingService);
    private dialog = inject(MatDialog);

    displayedColumns: string[] = ['period', 'amount', 'status', 'actions'];
    paidHistory = signal<any[]>([]);

    ngOnInit() {
        this.loadPaidHistory();
    }

    loadPaidHistory() {
        this.billingService.getPaidReceipts().subscribe({
            next: (res: any) => {
                // Mapeamos los datos de BD al formato que espera tu tabla
                const formatted = res.data.map((r: any) => ({
                    id: r.id,
                    period: r.period,
                    amount: Number(r.amount),
                    status: 'PAGADO', // Como el query filtra status = PAID
                    raw: r // Guardamos la data cruda por si la necesita el modal
                }));
                this.paidHistory.set(formatted);
            }
        });
    }

    downloadReceipt(row: any) {
        const raw = row.raw;
        const apartmentId = raw.apartment_id || raw.apartmentId;

        let month = new Date().getMonth() + 1;
        let year = new Date().getFullYear();

        // Formateo de fecha: Convertimos "2026-06-01T00:00:00.000Z" a "01-06-2026"
        let formattedIssueDate = 'N/A';
        if (raw.issueDate || raw.issue_date) {
            const dateStr = raw.issueDate || raw.issue_date;
            const dateObj = new Date(dateStr);
            // El 'Z' indica UTC, al crear el Date puede haber desfase horario, 
            // usamos getUTCDate() para asegurar que caiga en el día correcto
            const day = String(dateObj.getUTCDate()).padStart(2, '0');
            const mo = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
            const yr = dateObj.getUTCFullYear();

            formattedIssueDate = `${day}-${mo}-${yr}`;

            // Actualizamos month y year para la petición al backend
            month = dateObj.getUTCMonth() + 1;
            year = yr;
        }

        this.billingService.getOwnerReceiptDetail(apartmentId, month, year).subscribe({
            next: (res: any) => {
                const data = res.data || [];
                const rawAlicuota = Number(res.alicuota) || (raw.alicuota ? Number(raw.alicuota) : 0);

                // Formateo de Alícuota: Ej: 0.025 -> "2.5" (quitando ceros innecesarios a la derecha)
                const formattedQuota = Number((rawAlicuota * 100).toFixed(4)).toString() + '%';

                // 🔥 MATEMÁTICAS CORREGIDAS: 
                // Sumamos el Total Común de los lineItems.
                const totalCommon = data.reduce((acc: number, curr: any) => acc + Number(curr.totalAmount), 0);

                // Si el backend no mandó desglose (data.length === 0), asumimos que el total común 
                // es el monto total facturado (raw.amount) dividido entre la alícuota.
                const finalTotalCommon = totalCommon > 0 ? totalCommon : (Number(raw.amount) / rawAlicuota);

                // El monto final a pagar siempre será exactamente el que reporta la tabla principal (Ej: 5.98)
                const finalBill = Number(raw.amount) || 0;

                const lineItems = data.length > 0 ? data.map((d: any) => ({
                    concept: d.description || d.code,
                    commonExpense: Number(d.totalAmount),
                    individualShare: Number(d.totalAmount) * rawAlicuota
                })) : [{
                    concept: 'Cuota de Condominio',
                    commonExpense: finalTotalCommon,
                    individualShare: finalBill
                }];

                const receiptData = {
                    buildingName: raw.buildingName || raw.building_name || 'Edificio Principal',
                    unit: raw.apartment || raw.apartment_number || raw.apartmentNumber || res.apartmentNumber || 'N/A',
                    issueDate: formattedIssueDate,
                    monthYear: row.period || `${month}-${year}`,
                    ownerName: raw.ownerName || raw.owner_name || 'Propietario',
                    quota: formattedQuota,
                    lineItems: lineItems,
                    totalGastoComun: finalTotalCommon,
                    totalGastoIndividual: finalBill,
                    totalBill: finalBill,
                    accessCode: raw.access_code || raw.accessCode || res.access_code || 'PENDIENTE'
                };

                this.dialog.open(ReceiptPreviewDialogComponent, {
                    width: '900px',
                    maxWidth: '95vw',
                    data: receiptData
                });
            },
            error: (err) => {
                console.error("Error al cargar detalle del recibo", err);
                alert("No se pudo cargar el desglose detallado de este recibo.");
            }
        });
    }
}