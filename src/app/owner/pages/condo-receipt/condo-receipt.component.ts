import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-condo-receipt',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule
  ],
  templateUrl: './condo-receipt.component.html',
  styles: [`
    ::ng-deep .hide-subscript .mat-mdc-form-field-subscript-wrapper {
        display: none;
    }
  `]
})
export class CondoReceiptComponent {
  displayedColumns: string[] = ['code', 'description', 'totalAmount', 'share'];

  // Data simulada fiel a tus capturas
  receiptData = signal([
    { code: '001', description: 'DIF MTTO / LIMPIEZA SR ANTONIO 03 / 2026', totalAmount: 1710.60, share: 307.05, isTotal: false },
    { code: '001', description: 'MTTO / LIMPIEZA SR ANTONIO 04 / 2026 60$', totalAmount: 30600.00, share: 5492.70, isTotal: false },
    { code: '005', description: 'ELECTRICIDAD 03 / 2026', totalAmount: 18999.23, share: 3410.36, isTotal: false },
    { code: '006', description: 'HIDROCAPITAL 03 / 2026', totalAmount: 4027.46, share: 722.93, isTotal: false },
    { code: '008', description: 'DIF MANTENIMIENTO DE ASCENSOR MAR', totalAmount: 3206.10, share: 575.49, isTotal: false },
    { code: '042', description: 'COMISIONES BANCARIAS', totalAmount: 8174.13, share: 1467.26, isTotal: false },
    { code: '040', description: 'GASTOS ADMINISTRATIVOS', totalAmount: 40500.00, share: 7269.75, isTotal: false },

    // Subtotales y Totales
    { code: '', description: 'TOTAL GASTOS COMUNES:', totalAmount: 402384.18, share: 72227.96, isTotal: true },
    { code: '001', description: 'FDO DE RESERVA', totalAmount: 60357.63, share: 10834.19, isTotal: false },
    { code: '', description: 'TOTAL FONDOS:', totalAmount: 60357.63, share: 10834.19, isTotal: true },
    { code: '', description: 'TOTAL FONDOS Y GASTOS COMUNES:', totalAmount: 462741.81, share: 83062.15, isTotal: true },

    // Fila Final
    { code: '', description: 'TOTAL RECIBO A PAGAR:', totalAmount: null, share: 83062.15, isTotal: true, isFinal: true },
  ]);
}