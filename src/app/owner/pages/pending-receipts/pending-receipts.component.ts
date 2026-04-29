import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-pending-receipts',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatIconModule, MatButtonModule],
  template: `
    <div class="p-6 space-y-6 max-w-7xl mx-auto pb-12">
        
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div>
                <div class="flex items-center gap-2 text-rose-500 mb-1">
                    <mat-icon class="scale-75">warning_amber</mat-icon>
                    <span class="text-xs font-bold uppercase tracking-wider">Estado de Morosidad</span>
                </div>
                <h1 class="text-2xl font-black text-gray-900 tracking-tight m-0">Recibos Pendientes</h1>
                <p class="text-gray-500 mt-1 text-sm">Resumen global de la deuda por apartamento.</p>
            </div>

            <button mat-flat-button color="primary" class="h-12 px-6 rounded-xl font-bold shadow-md">
                <mat-icon class="mr-2">print</mat-icon> Imprimir Resumen
            </button>
        </div>

        <mat-card class="overflow-hidden border-none shadow-xl rounded-2xl bg-white premium-card">
            <div class="overflow-x-auto">
                <table mat-table [dataSource]="summary()" class="w-full">

                    <ng-container matColumnDef="unit">
                        <th mat-header-cell *matHeaderCellDef class="font-bold text-gray-500 uppercase text-[11px] py-4 w-24">Unidad</th>
                        <td mat-cell *matCellDef="let row" class="font-mono text-gray-400 font-bold"> {{ row.unit }} </td>
                    </ng-container>

                    <ng-container matColumnDef="owner">
                        <th mat-header-cell *matHeaderCellDef class="font-bold text-gray-500 uppercase text-[11px]">Propietario</th>
                        <td mat-cell *matCellDef="let row" 
                            [ngClass]="{'font-black text-gray-900': row.isTotal, 'font-medium text-gray-700': !row.isTotal}"> 
                            {{ row.owner }} 
                        </td>
                    </ng-container>

                    <ng-container matColumnDef="receipts">
                        <th mat-header-cell *matHeaderCellDef class="font-bold text-gray-500 uppercase text-[11px] text-center">Recibos</th>
                        <td mat-cell *matCellDef="let row" class="text-center font-medium"
                            [ngClass]="{'font-black text-gray-900': row.isTotal, 'text-gray-600': !row.isTotal}"> 
                            {{ row.receipts }} 
                        </td>
                    </ng-container>

                    <ng-container matColumnDef="debt">
                        <th mat-header-cell *matHeaderCellDef class="font-bold text-gray-500 uppercase text-[11px] text-right pr-6">Deuda Total</th>
                        <td mat-cell *matCellDef="let row" class="text-right pr-6 font-bold"
                            [ngClass]="{'text-rose-600 text-lg': row.isTotal, 'text-rose-500': !row.isTotal && row.debt > 0}"> 
                            {{ row.debt ? (row.debt | currency:'Bs. ':'symbol':'1.2-2') : '' }} 
                        </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="displayedColumns" class="bg-gray-50/50"></tr>
                    <tr mat-row *matRowDef="let row; columns: displayedColumns;" 
                        [ngClass]="{'bg-rose-50/50': row.isTotal, 'hover:bg-gray-50/50 transition-colors': !row.isTotal}">
                    </tr>
                </table>
            </div>
        </mat-card>
    </div>
  `
})
export class PendingReceiptsComponent {
  displayedColumns: string[] = ['unit', 'owner', 'receipts', 'debt'];

  // Data simulada basada en tu sistema anterior
  summary = signal([
    { unit: '011', owner: 'YADIRA J. MENDEZ', receipts: 1, debt: 47431.04, isTotal: false },
    { unit: '041', owner: 'JOSE NICOLAS MILLAN RODRIGUEZ', receipts: 11, debt: 365566.23, isTotal: false },
    { unit: '061', owner: 'GRUPO MARO', receipts: 13, debt: 422169.41, isTotal: false },
    { unit: '081', owner: 'JOSÉ LUIS GONZÁLEZ', receipts: 1, debt: 41424.66, isTotal: false },
    { unit: '', owner: 'TOTALES:', receipts: 26, debt: 876591.34, isTotal: true }
  ]);
}