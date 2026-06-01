import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AuthService } from '../../../core/services/auth.service';
import { BillingService } from '../../../core/services/billing.service';

@Component({
  selector: 'app-building-expenses',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatIconModule, MatButtonModule, MatSelectModule, MatFormFieldModule],
  templateUrl: './building-expenses.component.html'
})
export class BuildingExpensesComponent implements OnInit {
  private authService = inject(AuthService);
  private billingService = inject(BillingService);

  displayedColumns: string[] = ['code', 'description', 'amount'];

  availablePeriods = signal<any[]>([]);
  selectedPeriod = signal<string>(''); // Guardará el formato "MM-YYYY"
  expenses = signal<any[]>([]);

  // Array para convertir número de mes a texto
  monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  ngOnInit() {
    this.loadPeriods();
  }

  loadPeriods() {
    const buildingId = Number(this.authService.userSignal()?.buildingId);

    if (buildingId) {
      this.billingService.getAvailableExpensePeriods(buildingId).subscribe({
        next: (res: any) => {
          // Mapeamos para agregar el nombre del mes y un value combinando "MM-YYYY"
          const periods = res.data.map((p: any) => ({
            month: p.month,
            year: p.year,
            name: `${this.monthNames[p.month - 1]} ${p.year}`,
            value: `${p.month}-${p.year}`
          }));

          this.availablePeriods.set(periods);

          // Si hay periodos, auto-seleccionamos el primero (el más reciente)
          if (periods.length > 0) {
            this.selectedPeriod.set(periods[0].value);
            this.loadExpenses(periods[0].month, periods[0].year);
          }
        },
        error: (err) => console.error("Error al cargar periodos", err)
      });
    }
  }

  onPeriodChange(selectedValue: string) {
    this.selectedPeriod.set(selectedValue);
    const [month, year] = selectedValue.split('-');
    this.loadExpenses(Number(month), Number(year));
  }

  loadExpenses(month: number, year: number) {
    const buildingId = Number(this.authService.userSignal()?.buildingId);

    if (buildingId) {
      this.billingService.getExpensesByPeriod(buildingId, month, year).subscribe({
        next: (res: any) => {
          const data = res.data;

          if (data.length > 0) {
            // 1. Sumamos todas las facturas reales (Gastos Comunes)
            const totalCommon = data.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);

            // 2. Calculamos el Fondo de Reserva (15% basado en tu ejemplo)
            // Nota: Si en el futuro cada edificio tiene un % distinto, puedes traer esta variable desde el backend.
            const reservePercentage = 0.15;
            const reserveFund = totalCommon * reservePercentage;

            // 3. Calculamos el Gran Total a recaudar
            const grandTotal = totalCommon + reserveFund;

            // 4. Inyectamos las filas de resumen tal cual tu diseño
            const formattedData = [
              ...data, // Los gastos originales de la base de datos
              {
                code: '',
                description: 'TOTAL GASTOS COMUNES:',
                amount: totalCommon,
                isTotal: true
              },
              {
                code: 'FDO',
                description: `FONDO DE RESERVA (${reservePercentage * 100}%)`,
                amount: reserveFund,
                isTotal: false
              },
              {
                code: '',
                description: 'TOTAL FONDOS:',
                amount: reserveFund,
                isTotal: true
              },
              {
                code: '',
                description: 'TOTAL FONDOS Y GASTOS COMUNES:',
                amount: grandTotal,
                isTotal: true
              }
            ];

            this.expenses.set(formattedData);
          } else {
            this.expenses.set([]); // Si no hay datos, limpiamos la tabla
          }
        },
        error: (err) => console.error("Error al cargar gastos", err)
      });
    }
  }

  printReport() {
    window.print();
  }
}