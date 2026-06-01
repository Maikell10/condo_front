import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../core/services/auth.service';
import { BillingService } from '../../../core/services/billing.service';

@Component({
    selector: 'app-pending-detailed',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatTableModule, MatIconModule, MatButtonModule],
    templateUrl: './pending-detailed.component.html'
})
export class PendingDetailedComponent implements OnInit {
    private authService = inject(AuthService);
    private billingService = inject(BillingService);

    displayedColumns: string[] = ['unit', 'owner', 'receipt', 'debt'];
    detailed = signal<any[]>([]);

    ngOnInit() {
        this.loadPendingDetailed();
    }

    loadPendingDetailed() {
        const user = this.authService.userSignal();
        const buildingId = Number(user?.buildingId);

        if (buildingId) {
            this.billingService.getPendingDetailed(buildingId).subscribe({
                next: (res: any) => {
                    const rawData = res.data;
                    const formattedData: any[] = [];

                    let grandTotalDebt = 0;
                    let grandTotalReceipts = 0;

                    // 1. Agrupar recibos por apartamento
                    const groupedByUnit = rawData.reduce((acc: any, curr: any) => {
                        if (!acc[curr.unit]) {
                            acc[curr.unit] = {
                                owner: curr.owner || 'Sin propietario asignado',
                                receipts: [],
                                totalDebt: 0
                            };
                        }
                        acc[curr.unit].receipts.push(curr);
                        acc[curr.unit].totalDebt += Number(curr.debt);

                        // Sumar a los grandes totales
                        grandTotalDebt += Number(curr.debt);
                        grandTotalReceipts++;

                        return acc;
                    }, {});

                    // 2. Construir el arreglo plano para la tabla de Angular Material
                    Object.keys(groupedByUnit).forEach(unit => {
                        const group = groupedByUnit[unit];

                        // Fila Cabecera del Apartamento
                        formattedData.push({
                            unit: unit,
                            owner: group.owner,
                            receipt: group.receipts.length.toString(),
                            debt: group.totalDebt,
                            isHeader: true,
                            isGrandTotal: false
                        });

                        // Filas de Detalle de los Recibos
                        group.receipts.forEach((r: any) => {
                            formattedData.push({
                                unit: '',
                                owner: '',
                                receipt: r.description || r.period, // Muestra "Condominio 1/2026" o el periodo
                                debt: Number(r.debt),
                                isHeader: false,
                                isGrandTotal: false
                            });
                        });
                    });

                    // 3. Fila del Gran Total Final (Solo si hay datos)
                    if (formattedData.length > 0) {
                        formattedData.push({
                            unit: '',
                            owner: 'TOTALES:',
                            receipt: grandTotalReceipts.toString(),
                            debt: grandTotalDebt,
                            isHeader: false,
                            isGrandTotal: true
                        });
                    }

                    this.detailed.set(formattedData);
                },
                error: (err) => console.error("Error al cargar detalle", err)
            });
        }
    }

    printDetail() {
        window.print();
    }
}