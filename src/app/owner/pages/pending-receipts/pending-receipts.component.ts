import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../core/services/auth.service';
import { BillingService } from '../../../core/services/billing.service'; // Ajusta al servicio que uses

@Component({
    selector: 'app-pending-receipts',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatTableModule, MatIconModule, MatButtonModule],
    templateUrl: './pending-receipts.component.html'
})
export class PendingReceiptsComponent implements OnInit {
    private authService = inject(AuthService);
    private billingService = inject(BillingService);

    displayedColumns: string[] = ['unit', 'owner', 'receipts', 'debt'];
    summary = signal<any[]>([]);

    ngOnInit() {
        this.loadPendingSummary();
    }

    loadPendingSummary() {
        const user = this.authService.userSignal();
        const buildingId = Number(user?.buildingId);

        if (buildingId) {
            this.billingService.getPendingSummary(buildingId).subscribe({
                next: (res: any) => {
                    const data = res.data;

                    if (data.length > 0) {
                        // Calculamos los totales
                        const totalReceipts = data.reduce((acc: number, curr: any) => acc + Number(curr.receipts), 0);
                        const totalDebt = data.reduce((acc: number, curr: any) => acc + Number(curr.debt), 0);

                        // Agregamos la fila de totales al final del arreglo
                        data.push({
                            unit: '',
                            owner: 'TOTALES:',
                            receipts: totalReceipts,
                            debt: totalDebt,
                            isTotal: true
                        });
                    }

                    this.summary.set(data);
                },
                error: (err) => console.error("Error al cargar morosidad", err)
            });
        }
    }

    printSummary() {
        window.print();
    }
}