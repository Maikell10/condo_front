import { Component, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon'; // ImportMatIconRegistry para custom SVG
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ReceiptPreviewDialogComponent } from '../../../modals/receipt-preview-dialog/receipt-preview-dialog.component';

// Interfaz para la data harcodeada del recibo complejo
interface HardcodedCondoReceipt {
    issueDate: string;
    monthYear: string;
    accumulatedDebt: number;
    totalBill: number;
    lineItems: { code: string; concept: string; commonExpense: number; individualShare: number }[];
    reserves: { concept: string; commonExpense: number; individualShare: number }[];
    quota: string;
}

@Component({
    selector: 'app-paid-receipts',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatTableModule,
        MatIconModule,
        MatButtonModule,
        MatChipsModule,
        MatTooltipModule,
        MatSelectModule,
        MatFormFieldModule,
        CurrencyPipe, // Importante para formatear montos harcodeados
        MatDialogModule
    ],
    template: `
    <div class="p-6 space-y-6 max-w-7xl mx-auto pb-12">
        
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div>
                <div class="flex items-center gap-2 text-emerald-600 mb-1">
                    <mat-icon class="scale-75">verified</mat-icon>
                    <span class="text-xs font-bold uppercase tracking-wider">Historial de Solvencia</span>
                </div>
                <h1 class="text-2xl font-black text-gray-900 tracking-tight m-0">Recibos Pagados</h1>
                <p class="text-gray-500 mt-1 text-sm">Consulta y descarga tus comprobantes de pago anteriores.</p>
            </div>

            <div class="flex items-center gap-3">
                <mat-form-field appearance="outline" class="w-32 hide-subscript">
                    <mat-label>Año</mat-label>
                    <mat-select [value]="'2026'">
                        <mat-option value="2026">2026</mat-option>
                        <mat-option value="2025">2025</mat-option>
                    </mat-select>
                </mat-form-field>
                
                <button mat-stroked-button class="h-[52px] px-6 rounded-xl font-bold border-gray-200">
                    <mat-icon class="mr-2">download</mat-icon>
                    Exportar Todo
                </button>
            </div>
        </div>

        <mat-card class="overflow-hidden border-none shadow-xl rounded-2xl bg-white premium-card">
            <div class="overflow-x-auto">
                <table mat-table [dataSource]="paidHistory()" class="w-full">

                    <ng-container matColumnDef="period">
                        <th mat-header-cell *matHeaderCellDef class="font-bold text-gray-500 uppercase text-[11px] py-5 pl-6">Período</th>
                        <td mat-cell *matCellDef="let row" class="pl-6 font-bold text-gray-700"> {{ row.period }} </td>
                    </ng-container>

                    <ng-container matColumnDef="amount">
                        <th mat-header-cell *matHeaderCellDef class="font-bold text-gray-500 uppercase text-[11px]">Monto Pagado</th>
                        <td mat-cell *matCellDef="let row" class="font-medium text-gray-900"> 
                            {{ row.amount | currency:'Bs. ':'symbol':'1.2-2' }} 
                        </td>
                    </ng-container>

                    <ng-container matColumnDef="status">
                        <th mat-header-cell *matHeaderCellDef class="font-bold text-gray-500 uppercase text-[11px] text-center">Estado</th>
                        <td mat-cell *matCellDef="let row" class="text-center"> 
                            <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-700">
                                {{ row.status }}
                            </span>
                        </td>
                    </ng-container>

                    <ng-container matColumnDef="actions">
                        <th mat-header-cell *matHeaderCellDef class="font-bold text-gray-500 uppercase text-[11px] text-right pr-6">Acciones</th>
                        <td mat-cell *matCellDef="let row" class="text-right pr-6 whitespace-nowrap">
                            <button mat-icon-button color="primary" matTooltip="Ver Detalle" class="mr-1">
                                <mat-icon>visibility</mat-icon>
                            </button>
                            <button mat-icon-button class="text-indigo-600" matTooltip="Descargar Recibo" (click)="downloadReceipt(row)">
                                <mat-icon>picture_as_pdf</mat-icon>
                            </button>
                            <button mat-icon-button class="text-gray-400" matTooltip="Imprimir">
                                <mat-icon>print</mat-icon>
                            </button>
                        </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="displayedColumns" class="bg-gray-50/50"></tr>
                    <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="hover:bg-gray-50/50 transition-colors"></tr>
                </table>
            </div>
        </mat-card>

    </div>
  `,
    styles: [`
    ::ng-deep .hide-subscript .mat-mdc-form-field-subscript-wrapper {
        display: none;
    }
  `]
})
export class PaidReceiptsComponent {
    displayedColumns: string[] = ['period', 'amount', 'status', 'actions'];
    private dialog = inject(MatDialog)


    // Datos simulados generales de la tabla
    paidHistory = signal([
        { period: '03-2026', amount: 83062.15, status: 'PAGADO' },
        { period: '02-2026', amount: 80194.39, status: 'PAGADO' }, // Corresponde al recibo Indiana hardcodeado
        { period: '01-2026', amount: 48033.92, status: 'PAGADO' },
        { period: '12-2025', amount: 36009.55, status: 'PAGADO' },
        { period: '11-2025', amount: 36258.50, status: 'PAGADO' },
        { period: '10-2025', amount: 32951.05, status: 'PAGADO' },
        { period: '09-2025', amount: 38320.74, status: 'PAGADO' },
        { period: '08-2025', amount: 15661.80, status: 'PAGADO' },
        { period: '07-2025', amount: 15774.65, status: 'PAGADO' },
        { period: '06-2025', amount: 17429.18, status: 'PAGADO' },
        { period: '05-2025', amount: 15896.05, status: 'PAGADO' },
        { period: '04-2025', amount: 11187.64, status: 'PAGADO' },
    ]);

    constructor() { }

    /**
     * Genera el recibo Indiana J-296261105 02-2026 premium harcodeado
     */
    downloadReceipt(paidMonthData: any) {
        // Aquí preparamos la data exacta del Aviso de Cobro Indiana
        const mockData = {
            buildingName: 'RESIDENCIAS INDIANA',
            ownerName: 'BENITO SCIAMANNA Y SRA',
            unit: 'PH',
            issueDate: '09-03-2026',
            monthYear: '02-2026',
            quota: '17,95000000',
            totalBill: 80194.39,
            totalGastoComun: 388491.67,
            totalGastoIndividual: 69734.25,
            totalFondosComun: 58273.75,
            totalFondosIndividual: 10460.14,
            lineItems: [
                { concept: 'DIF MTTO/LIMPIEZA SR ANTONIO 02/2026', commonExpense: 843.00, individualShare: 151.32 },
                { concept: 'MTTO/LIMPIEZA SR ANTONIO 03/2026 60$', commonExpense: 26400.00, individualShare: 4738.80 },
                { concept: 'ELECTRICIDAD 02/2026', commonExpense: 16849.74, individualShare: 3024.53 },
                { concept: 'HIDROCAPITAL 02/2026', commonExpense: 3966.01, individualShare: 711.90 },
                { concept: 'PROVISIÓN MANTENIMIENTO DE ASCENSOR MAR 85$ + IVA', commonExpense: 45400.00, individualShare: 8149.30 },
                { concept: 'PROVISIÓN SUM/INST 02 CONTACTORES/DISPLAY 450.08$ 1/2', commonExpense: 207100.00, individualShare: 37174.45 },
                { concept: 'PROVISION MTTO Y RECARGA DE EXTINTORES 95€ 2/2', commonExpense: 42736.70, individualShare: 7671.24 },
                { concept: 'GASTOS ADMINISTRATIVOS', commonExpense: 34500.00, individualShare: 6192.75 },
                { concept: 'I.V.A.', commonExpense: 5520.00, individualShare: 990.84 },
                { concept: 'COMISIONES BANCARIAS', commonExpense: 5176.22, individualShare: 929.13 }
            ]
        };

        // <--- ABRIR EL MODAL --->
        this.dialog.open(ReceiptPreviewDialogComponent, {
            width: '900px', // Ancho suficiente para ver el formato A4
            maxWidth: '95vw',
            maxHeight: '90vh',
            data: mockData // Le pasamos los datos al Modal
        });
    }
}