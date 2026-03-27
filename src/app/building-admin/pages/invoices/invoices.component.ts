// invoices.component.ts completo

import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select'; // 🔥 Añadido
import { BillingService } from '../../../core/services/billing.service';
import { AuthService } from '../../../core/services/auth.service';
import { AddExpenseModalComponent } from '../../modal/add-expense-modal/add-expense-modal.component';
import { MatTabsModule } from '@angular/material/tabs';
import { ReportViewModalComponent } from '../../modal/report-view-modal/report-view-modal.component';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatCardModule, MatButtonModule,
    MatIconModule, MatDialogModule, MatSelectModule, MatTabsModule
  ],
  templateUrl: './invoices.component.html'
})
export class InvoicesComponent implements OnInit {
  private billingService = inject(BillingService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);

  user = this.authService.userSignal;
  invoices = signal<any[]>([]);
  displayedColumns: string[] = ['code', 'provider', 'amount', 'date', 'type', 'actions'];

  // 🔥 Gestión de Periodos
  currentDate = new Date();
  // Por defecto, miramos el mes anterior (que es el que suele estar pendiente)
  selectedMonth = signal<number>(this.currentDate.getMonth() === 0 ? 12 : this.currentDate.getMonth());
  selectedYear = signal<number>(this.currentDate.getMonth() === 0 ? this.currentDate.getFullYear() - 1 : this.currentDate.getFullYear());

  totalMonth = computed(() => this.invoices().reduce((acc, inv) => acc + Number(inv.amount), 0));

  monthStatus = signal<string>('OPEN');
  canClosePeriod = signal<boolean>(false);

  closedPeriods = signal<any[]>([]);

  ngOnInit() {
    this.loadExpenses();
  }

  loadExpenses() {
    const buildingId = this.user()?.buildingId;
    if (buildingId) {
      this.billingService.getBuildingExpenses(
        Number(buildingId),
        this.selectedMonth(),
        this.selectedYear()
      ).subscribe({
        next: (res: any) => {
          this.invoices.set(res.data);
          this.monthStatus.set(res.status); // 🔥 'OPEN' o 'CLOSED'
          this.canClosePeriod.set(res.canClose); // 🔥 Define si el botón se habilita
        }
      });
    }
  }

  // Se ejecuta al cambiar de mes en el dropdown
  onPeriodChange() {
    this.loadExpenses();
  }

  openAddExpenseModal() {
    const dialogRef = this.dialog.open(AddExpenseModalComponent, {
      width: '550px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const buildingId = this.user()?.buildingId;
        const payload = { ...result, buildingId: Number(buildingId) };
        this.billingService.addExpense(payload).subscribe({
          next: () => {
            alert('Gasto registrado con éxito.');
            this.loadExpenses();
          },
          error: (err) => alert('Error: ' + err.error?.message)
        });
      }
    });
  }

  closeMonth() {
    const buildingId = this.user()?.buildingId;
    if (!buildingId) return;

    const payload = {
      buildingId: Number(buildingId),
      month: this.selectedMonth(),
      year: this.selectedYear()
    };

    const confirmMsg = `¿Deseas cerrar el mes ${this.selectedMonth()}/${this.selectedYear()}? Se generarán los recibos.`;

    if (confirm(confirmMsg)) {
      this.billingService.generateBilling(payload).subscribe({
        next: (res) => {
          alert(res.message);
          this.loadExpenses(); // Esto refrescará el status a 'CLOSED'
        },
        error: (err) => alert('Error en facturación: ' + err.error?.message)
      });
    }
  }

  // Se llama cuando el usuario cambia a la pestaña de Histórico
  loadHistory() {
    const buildingId = this.user()?.buildingId;
    if (buildingId) {
      this.billingService.getClosedPeriods(Number(buildingId)).subscribe({
        next: (res) => this.closedPeriods.set(res.data),
        error: (err) => console.error('Error al cargar historial', err)
      });
    }
  }

  deleteExpense(id: number) {
    if (this.monthStatus() === 'CLOSED') {
      alert('Este periodo está cerrado. No se permiten modificaciones.');
      return;
    }

    if (confirm('¿Estás seguro de eliminar este gasto?')) {
      this.billingService.deleteExpense(id).subscribe({
        next: () => {
          alert('Gasto eliminado');
          this.loadExpenses(); // Recarga la tabla
        },
        error: (err) => alert(err.error?.message || 'Error al eliminar')
      });
    }
  }

  // Función para cargar el historial cuando cambias de pestaña
  onTabChange(index: number) {
    if (index === 1) { // Si la pestaña es 'Histórico'
      this.loadHistory();
    }
  }

  viewReport(period: any) {
    const buildingId = this.user()?.buildingId;
    this.billingService.getMonthlyReport(Number(buildingId), period.month, period.year).subscribe(res => {
      this.dialog.open(ReportViewModalComponent, {
        width: '800px',
        data: res
      });
    });
  }
}