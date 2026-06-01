import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { BillingService } from '../../../core/services/billing.service';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { AddExpenseModalComponent } from '../../modal/add-expense-modal/add-expense-modal.component';
import { ReportViewModalComponent } from '../../modal/report-view-modal/report-view-modal.component';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatCardModule, MatButtonModule,
    MatIconModule, MatDialogModule, MatSelectModule, MatTabsModule, MatDividerModule
  ],
  templateUrl: './invoices.component.html'
})
export class InvoicesComponent implements OnInit {
  private billingService = inject(BillingService);
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private dialog = inject(MatDialog);

  isComplex = computed(() => !!this.authService.userSignal()?.complexId);
  buildingsList = signal<any[]>([]);

  // 🔥 Ahora inicia en 'ALL'
  selectedBuildingId = signal<number | 'ALL'>('ALL');
  currentTabIndex = signal<number>(0);

  invoices = signal<any[]>([]);

  // 🔥 Columnas dinámicas: Muestra el edificio solo si estamos en vista 'ALL'
  displayedColumns = computed(() => {
    const baseCols = ['code', 'provider', 'amount', 'date', 'type', 'actions'];
    if (this.isComplex() && this.selectedBuildingId() === 'ALL') {
      return ['buildingName', ...baseCols];
    }
    return baseCols;
  });

  currentDate = new Date();
  selectedMonth = signal<number>(this.currentDate.getMonth() === 0 ? 12 : this.currentDate.getMonth());
  selectedYear = signal<number>(this.currentDate.getMonth() === 0 ? this.currentDate.getFullYear() - 1 : this.currentDate.getFullYear());

  totalMonth = computed(() => this.invoices().reduce((acc, inv) => acc + Number(inv.amount), 0));
  monthStatus = signal<string>('OPEN');
  canClosePeriod = signal<boolean>(false);
  closedPeriods = signal<any[]>([]);

  ngOnInit() {
    this.initView();
  }

  initView() {
    const user = this.authService.userSignal();

    if (user?.complexId) {
      this.dashboardService.getBuildingsByComplex().subscribe({
        next: (res: any) => {
          this.buildingsList.set(res.data);
          this.selectedBuildingId.set('ALL'); // Comienza viendo todo
          this.refreshCurrentView();
        }
      });
    } else if (user?.buildingId) {
      this.selectedBuildingId.set(Number(user.buildingId));
      this.refreshCurrentView();
    }
  }

  onBuildingChange(buildingId: number | 'ALL') {
    this.selectedBuildingId.set(buildingId);
    this.invoices.set([]);
    this.closedPeriods.set([]);
    this.refreshCurrentView();
  }

  onPeriodChange() {
    this.refreshCurrentView();
  }

  onTabChange(index: number) {
    this.currentTabIndex.set(index);
    this.refreshCurrentView();
  }

  refreshCurrentView() {
    if (this.currentTabIndex() === 0) {
      this.loadExpenses();
    } else {
      this.loadHistory();
    }
  }

  loadExpenses() {
    const buildingId = this.selectedBuildingId();
    // NOTA: Tu billingService debe poder manejar 'ALL' enviando el complexId al backend
    const complexId = this.authService.userSignal()?.complexId;

    const payload = buildingId === 'ALL'
      ? { isComplex: true, complexId: complexId }
      : { isComplex: false, buildingId: buildingId };

    // Llama a tu servicio pasándole la info
    this.billingService.getExpenses(payload, this.selectedMonth(), this.selectedYear()).subscribe({
      next: (res: any) => {
        this.invoices.set(res.data);
        this.monthStatus.set(res.status);
        this.canClosePeriod.set(res.canClose);
      }
    });
  }

  loadHistory() {
    const buildingId = this.selectedBuildingId();
    // Solo cargamos el histórico si hay UN edificio seleccionado. No se cierra el mes globalmente.
    if (buildingId !== 'ALL') {
      this.billingService.getClosedPeriods(buildingId).subscribe({
        next: (res: any) => this.closedPeriods.set(res.data),
        error: (err: any) => console.error(err)
      });
    }
  }

  openAddExpenseModal() {
    const dialogRef = this.dialog.open(AddExpenseModalComponent, {
      width: '550px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // 🔥 Aquí enviamos 'ALL' o el ID numérico
        const payload = {
          ...result,
          buildingId: this.selectedBuildingId(),
          complexId: this.authService.userSignal()?.complexId
        };

        this.billingService.addExpense(payload).subscribe({
          next: (res: any) => {
            alert(res.message || 'Gasto registrado con éxito.');
            this.loadExpenses();
          },
          error: (err: any) => alert('Error: ' + err.error?.message)
        });
      }
    });
  }

  closeMonth() {
    const buildingId = this.selectedBuildingId();
    if (buildingId === 'ALL' || !buildingId) return; // Validación de seguridad extra

    const payload = {
      buildingId: buildingId,
      month: this.selectedMonth(),
      year: this.selectedYear()
    };

    const confirmMsg = `¿Deseas cerrar el mes ${this.selectedMonth()}/${this.selectedYear()}? Se generarán los recibos.`;

    if (confirm(confirmMsg)) {
      this.billingService.generateBilling(payload).subscribe({
        next: (res: any) => {
          alert(res.message);
          this.loadExpenses();
        },
        error: (err: any) => alert('Error en facturación: ' + err.error?.message)
      });
    }
  }

  deleteExpense(id: number) {
    if (confirm('¿Estás seguro de eliminar este gasto?')) {
      this.billingService.deleteExpense(id).subscribe({
        next: () => {
          alert('Gasto eliminado');
          this.loadExpenses();
        }
      });
    }
  }

  viewReport(period: any) {
    const buildingId = this.selectedBuildingId();
    if (buildingId !== 'ALL') {
      this.billingService.getMonthlyReport(buildingId, period.month, period.year).subscribe((res: any) => {
        this.dialog.open(ReportViewModalComponent, { width: '800px', data: res });
      });
    }
  }
}