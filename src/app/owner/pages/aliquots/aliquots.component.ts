import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-aliquots',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatIconModule, MatButtonModule],
  template: `
    <div class="p-6 space-y-6 max-w-7xl mx-auto pb-12">
        
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div>
                <div class="flex items-center gap-2 text-indigo-600 mb-1">
                    <mat-icon class="scale-75">pie_chart</mat-icon>
                    <span class="text-xs font-bold uppercase tracking-wider">Distribución de Copropiedad</span>
                </div>
                <h1 class="text-2xl font-black text-gray-900 tracking-tight m-0">Tabla de Alícuotas</h1>
                <p class="text-gray-500 mt-1 text-sm">Porcentaje de participación legal de cada unidad en el edificio.</p>
            </div>

            <button mat-flat-button color="primary" class="h-12 px-6 rounded-xl font-bold shadow-md">
                <mat-icon class="mr-2">description</mat-icon> Descargar Documento
            </button>
        </div>

        <mat-card class="overflow-hidden border-none shadow-xl rounded-2xl bg-white premium-card">
            <div class="overflow-x-auto">
                <table mat-table [dataSource]="aliquots()" class="w-full">

                    <ng-container matColumnDef="unit">
                        <th mat-header-cell *matHeaderCellDef class="font-bold text-gray-500 uppercase text-[11px] py-4 pl-6">Unidad</th>
                        <td mat-cell *matCellDef="let row" class="pl-6 font-mono font-bold" 
                            [ngClass]="row.isMe ? 'text-indigo-600' : 'text-gray-500'"> 
                            {{ row.unit }} 
                        </td>
                    </ng-container>

                    <ng-container matColumnDef="owner">
                        <th mat-header-cell *matHeaderCellDef class="font-bold text-gray-500 uppercase text-[11px]">Propietario</th>
                        <td mat-cell *matCellDef="let row" 
                            [ngClass]="row.isMe ? 'font-black text-gray-900' : 'font-medium text-gray-700'"> 
                            {{ row.owner }} 
                            <span *ngIf="row.isMe" class="ml-2 text-[9px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full uppercase">Mí Unidad</span>
                        </td>
                    </ng-container>

                    <ng-container matColumnDef="area">
                        <th mat-header-cell *matHeaderCellDef class="font-bold text-gray-500 uppercase text-[11px] text-center">Área (m²)</th>
                        <td mat-cell *matCellDef="let row" class="text-center font-medium text-gray-600"> 
                            {{ row.area | number:'1.2-2' }} m²
                        </td>
                    </ng-container>

                    <ng-container matColumnDef="percentage">
                        <th mat-header-cell *matHeaderCellDef class="font-bold text-gray-500 uppercase text-[11px] text-right pr-6">Alícuota</th>
                        <td mat-cell *matCellDef="let row" class="text-right pr-6 font-black"
                            [ngClass]="row.isMe ? 'text-indigo-600 text-lg' : 'text-gray-800'"> 
                            {{ row.percentage | number:'1.6-6' }} %
                        </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="displayedColumns" class="bg-gray-50/50"></tr>
                    <tr mat-row *matRowDef="let row; columns: displayedColumns;" 
                        [ngClass]="{'bg-indigo-50/40': row.isMe, 'hover:bg-gray-50/50 transition-colors': !row.isMe}">
                    </tr>
                </table>
            </div>
        </mat-card>

        <div class="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-sm">
            <mat-icon>info</mat-icon>
            <p>La suma total de las alícuotas del edificio debe ser exactamente <strong>100.000000%</strong>.</p>
        </div>
    </div>
  `
})
export class AliquotsComponent {
  displayedColumns: string[] = ['unit', 'owner', 'area', 'percentage'];

  // Data simulada basada en tus unidades anteriores
  aliquots = signal([
    { unit: 'PH', owner: 'BENITO SCIAMANNA Y SRA', area: 180.50, percentage: 17.950000, isMe: true },
    { unit: '011', owner: 'YADIRA J. MENDEZ', area: 95.20, percentage: 8.500000, isMe: false },
    { unit: '041', owner: 'JOSE NICOLAS MILLAN RODRIGUEZ', area: 110.00, percentage: 9.800000, isMe: false },
    { unit: '061', owner: 'GRUPO MARO', area: 105.40, percentage: 9.400000, isMe: false },
    { unit: '081', owner: 'JOSÉ LUIS GONZÁLEZ', area: 88.00, percentage: 7.900000, isMe: false },
  ]);
}