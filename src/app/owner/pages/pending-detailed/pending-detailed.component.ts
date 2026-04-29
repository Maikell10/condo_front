import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-pending-detailed',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatIconModule, MatButtonModule],
  template: `
    <div class="p-6 space-y-6 max-w-7xl mx-auto pb-12">
        
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div>
                <div class="flex items-center gap-2 text-indigo-500 mb-1">
                    <mat-icon class="scale-75">format_list_bulleted</mat-icon>
                    <span class="text-xs font-bold uppercase tracking-wider">Desglose Financiero</span>
                </div>
                <h1 class="text-2xl font-black text-gray-900 tracking-tight m-0">Recibos Pendientes Detallado</h1>
                <p class="text-gray-500 mt-1 text-sm">Desglose mes a mes de la deuda por apartamento.</p>
            </div>

            <button mat-flat-button color="primary" class="h-12 px-6 rounded-xl font-bold shadow-md">
                <mat-icon class="mr-2">print</mat-icon> Imprimir Detalle
            </button>
        </div>

        <mat-card class="overflow-hidden border-none shadow-xl rounded-2xl bg-white premium-card">
            <div class="overflow-x-auto">
                <table mat-table [dataSource]="detailed()" class="w-full">

                    <ng-container matColumnDef="unit">
                        <th mat-header-cell *matHeaderCellDef class="font-bold text-gray-500 uppercase text-[11px] py-4 w-24">Unidad</th>
                        <td mat-cell *matCellDef="let row" class="font-mono text-gray-900 font-bold" 
                            [ngClass]="{'bg-gray-50/50': row.isHeader, 'bg-rose-50/50': row.isGrandTotal}"> 
                            {{ row.isGrandTotal ? '' : row.unit }} 
                        </td>
                    </ng-container>

                    <ng-container matColumnDef="owner">
                        <th mat-header-cell *matHeaderCellDef class="font-bold text-gray-500 uppercase text-[11px]">Propietario</th>
                        <td mat-cell *matCellDef="let row" class="font-bold" 
                            [ngClass]="{
                                'text-gray-800 bg-gray-50/50': row.isHeader && !row.isGrandTotal, 
                                'text-gray-900 bg-rose-50/50 uppercase tracking-widest text-right pr-4': row.isGrandTotal
                            }"> 
                            {{ row.owner }} 
                        </td>
                    </ng-container>

                    <ng-container matColumnDef="receipt">
                        <th mat-header-cell *matHeaderCellDef class="font-bold text-gray-500 uppercase text-[11px] text-center">Recibos / Período</th>
                        <td mat-cell *matCellDef="let row" class="text-center font-medium"
                            [ngClass]="{
                                'font-black text-indigo-900 bg-gray-50/50': row.isHeader && !row.isGrandTotal, 
                                'text-gray-500 text-xs': !row.isHeader && !row.isGrandTotal,
                                'font-black text-gray-900 bg-rose-50/50': row.isGrandTotal
                            }"> 
                            {{ row.receipt }} 
                        </td>
                    </ng-container>

                    <ng-container matColumnDef="debt">
                        <th mat-header-cell *matHeaderCellDef class="font-bold text-gray-500 uppercase text-[11px] text-right pr-6">Deuda</th>
                        <td mat-cell *matCellDef="let row" class="text-right pr-6 font-bold"
                            [ngClass]="{
                                'text-rose-600 bg-gray-50/50': row.isHeader && !row.isGrandTotal, 
                                'text-rose-400 font-normal': !row.isHeader && !row.isGrandTotal,
                                'text-rose-600 text-lg bg-rose-50/50': row.isGrandTotal
                            }"> 
                            {{ row.debt | currency:'Bs. ':'symbol':'1.2-2' }} 
                        </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="displayedColumns" class="bg-gray-100/50 border-b-2 border-gray-200"></tr>
                    <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="hover:bg-gray-50/30 transition-colors"></tr>
                </table>
            </div>
        </mat-card>
    </div>
  `
})
export class PendingDetailedComponent {
  displayedColumns: string[] = ['unit', 'owner', 'receipt', 'debt'];

  detailed = signal([
    { unit: '011', owner: 'YADIRA J. MENDEZ', receipt: '1', debt: 47431.04, isHeader: true, isGrandTotal: false },
    { unit: '', owner: '', receipt: '03-2026', debt: 47431.04, isHeader: false, isGrandTotal: false },

    { unit: '041', owner: 'JOSE NICOLAS MILLAN RODRIGUEZ', receipt: '11', debt: 365566.23, isHeader: true, isGrandTotal: false },
    { unit: '', owner: '', receipt: '05-2025', debt: 5541.23, isHeader: false, isGrandTotal: false },
    { unit: '', owner: '', receipt: '06-2025', debt: 14902.36, isHeader: false, isGrandTotal: false },
    { unit: '', owner: '', receipt: '07-2025', debt: 15172.60, isHeader: false, isGrandTotal: false },
    { unit: '', owner: '', receipt: '08-2025', debt: 14149.85, isHeader: false, isGrandTotal: false },
    { unit: '', owner: '', receipt: '09-2025', debt: 36007.69, isHeader: false, isGrandTotal: false },

    { unit: '061', owner: 'GRUPO MARO', receipt: '13', debt: 422169.41, isHeader: true, isGrandTotal: false },
    { unit: '', owner: '', receipt: '03-2025', debt: 6001.25, isHeader: false, isGrandTotal: false },
    { unit: '', owner: '', receipt: '04-2025', debt: 6520.48, isHeader: false, isGrandTotal: false },

    { unit: '081', owner: 'JOSÉ LUIS GONZÁLEZ', receipt: '1', debt: 41424.66, isHeader: true, isGrandTotal: false },
    { unit: '', owner: '', receipt: '03-2026', debt: 41424.66, isHeader: false, isGrandTotal: false },

    // NUEVA FILA DE TOTALES
    { unit: '', owner: 'TOTALES:', receipt: '26', debt: 876591.34, isHeader: false, isGrandTotal: true }
  ]);
}