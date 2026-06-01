import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { BillingService } from '../../../core/services/billing.service';

@Component({
  selector: 'app-condo-receipt',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatTableModule, MatIconModule,
    MatButtonModule, MatSelectModule, MatFormFieldModule
  ],
  templateUrl: './condo-receipt.component.html',
  styles: [`
    ::ng-deep .hide-subscript .mat-mdc-form-field-subscript-wrapper {
        display: none;
    }
  `]
})
export class CondoReceiptComponent implements OnInit {
  private billingService = inject(BillingService);

  displayedColumns: string[] = ['code', 'description', 'totalAmount', 'share'];

  availablePeriods = signal<any[]>([]);
  selectedPeriod = signal<string>(''); // Formato: 'apartmentId-month-year'

  receiptData = signal<any[]>([]);

  // Datos dinámicos para la cabecera
  currentApt = signal<string>('...');
  currentAlicuota = signal<number>(0);
  currentPeriodName = signal<string>('...');

  monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  ngOnInit() {
    this.loadPeriods();
  }

  loadPeriods() {
    this.billingService.getOwnerReceiptPeriods().subscribe({
      next: (res: any) => {
        // Formateamos para el selector (Ej: "Apt 1B - Marzo 2026")
        const periods = res.data.map((p: any) => ({
          value: `${p.apartmentId}-${p.month}-${p.year}`,
          name: `Apt ${p.apartmentNumber} - ${this.monthNames[p.month - 1]} ${p.year}`,
          monthName: `${this.monthNames[p.month - 1]} ${p.year}`
        }));

        this.availablePeriods.set(periods);

        // Auto-seleccionar el primero
        if (periods.length > 0) {
          this.selectedPeriod.set(periods[0].value);
          this.onPeriodChange(periods[0].value, periods[0].monthName);
        }
      },
      error: (err) => console.error("Error al cargar periodos", err)
    });
  }

  onPeriodChange(value: string, monthName?: string) {
    this.selectedPeriod.set(value);
    const [apartmentId, month, year] = value.split('-');

    // Si viene del HTML, buscamos el nombre del mes
    if (!monthName) {
      const found = this.availablePeriods().find(p => p.value === value);
      monthName = found ? found.monthName : `${month}-${year}`;
    }

    this.currentPeriodName.set(monthName!);
    this.loadReceiptDetail(Number(apartmentId), Number(month), Number(year));
  }

  loadReceiptDetail(apartmentId: number, month: number, year: number) {
    this.billingService.getOwnerReceiptDetail(apartmentId, month, year).subscribe({
      next: (res: any) => {
        const data = res.data;
        const alicuota = Number(res.alicuota);

        this.currentAlicuota.set(alicuota * 100); // Para mostrar en porcentaje
        this.currentApt.set(res.apartmentNumber);

        if (data.length > 0) {
          // 1. Cálculos de Montos Base
          const totalCommon = data.reduce((acc: number, curr: any) => acc + Number(curr.totalAmount), 0);
          const reservePercentage = 0.15; // 15% Fondo de Reserva
          const reserveFund = totalCommon * reservePercentage;
          const grandTotal = totalCommon + reserveFund;

          // 2. Cálculos de la Cuota Parte (Share = Monto Base * Alícuota)
          const shareCommon = totalCommon * alicuota;
          const shareReserve = reserveFund * alicuota;
          const shareGrandTotal = grandTotal * alicuota;

          // 3. Mapear datos agregando la cuota individual
          const mappedData = data.map((d: any) => ({
            ...d,
            share: Number(d.totalAmount) * alicuota,
            isTotal: false
          }));

          // 4. Inyectar las filas matemáticas (Totales y Subtotales)
          const formattedData = [
            ...mappedData,
            { code: '', description: 'TOTAL GASTOS COMUNES:', totalAmount: totalCommon, share: shareCommon, isTotal: true },
            { code: 'FDO', description: `FONDO DE RESERVA (${reservePercentage * 100}%)`, totalAmount: reserveFund, share: shareReserve, isTotal: false },
            { code: '', description: 'TOTAL FONDOS:', totalAmount: reserveFund, share: shareReserve, isTotal: true },
            { code: '', description: 'TOTAL FONDOS Y GASTOS COMUNES:', totalAmount: grandTotal, share: shareGrandTotal, isTotal: true },
            { code: '', description: 'TOTAL RECIBO A PAGAR:', totalAmount: null, share: shareGrandTotal, isTotal: true, isFinal: true }
          ];

          this.receiptData.set(formattedData);
        } else {
          this.receiptData.set([]);
        }
      },
      error: (err) => console.error("Error al cargar recibo", err)
    });
  }

  printReceipt() {
    window.print();
  }
}