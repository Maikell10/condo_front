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
        // Aquí cargarías la data real del recibo usando el ID del recibo (row.id)
        // Por ahora, integré tu lógica de modal para que funcione al hacer clic
        this.dialog.open(ReceiptPreviewDialogComponent, {
            width: '900px',
            maxWidth: '95vw',
            data: { /* Aquí pasas la data real obtenida de otro endpoint de detalle */ }
        });
    }
}