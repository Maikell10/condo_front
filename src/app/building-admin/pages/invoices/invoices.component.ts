import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';

import { BillingService } from '../../../core/services/billing.service';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { ConfigService } from '../../../core/services/config.service';

import { AddExpenseModalComponent } from '../../modal/add-expense-modal/add-expense-modal.component';
import { ReportViewModalComponent } from '../../modal/report-view-modal/report-view-modal.component';

function spanishPaginator(): MatPaginatorIntl {
  const intl = new MatPaginatorIntl();
  intl.itemsPerPageLabel = 'Gastos por página';
  intl.nextPageLabel = 'Siguiente';
  intl.previousPageLabel = 'Anterior';
  intl.firstPageLabel = 'Primera página';
  intl.lastPageLabel = 'Última página';
  intl.getRangeLabel = (page, pageSize, length) => {
    if (length === 0 || pageSize === 0) return `0 de ${length}`;
    const start = page * pageSize + 1;
    const end = Math.min((page + 1) * pageSize, length);
    return `${start} – ${end} de ${length}`;
  };
  return intl;
}

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatCardModule, MatButtonModule,
    MatIconModule, MatDialogModule, MatSelectModule, MatTabsModule, MatDividerModule,
    MatFormFieldModule, MatInputModule, MatPaginatorModule, MatTooltipModule
  ],
  providers: [{ provide: MatPaginatorIntl, useValue: spanishPaginator() }],
  templateUrl: './invoices.component.html'
})
export class InvoicesComponent implements OnInit {
  private billingService = inject(BillingService);
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private configService = inject(ConfigService);
  private dialog = inject(MatDialog);

  readonly monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  isComplex = computed(() => !!this.authService.userSignal()?.complexId);
  buildingsList = signal<any[]>([]);

  selectedBuildingId = signal<number | 'ALL'>('ALL');
  currentTabIndex = signal<number>(0);

  invoices = signal<any[]>([]);
  searchQuery = signal('');
  pageIndex = signal(0);
  pageSize = signal(10);

  hasReserveFund = signal<boolean>(false);
  reserveFundPercentage = signal<number>(0);

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

  availablePeriods = this.buildPeriods();
  currentPeriodKey = computed(() => `${this.selectedYear()}-${this.selectedMonth()}`);
  currentPeriodLabel = computed(() => {
    const month = this.monthNames[this.selectedMonth() - 1] || '';
    return `${month} ${this.selectedYear()}`;
  });

  canGoPrev = computed(() => this.periodIndex() > 0);
  canGoNext = computed(() => this.periodIndex() < this.availablePeriods.length - 1);

  filteredInvoices = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const rows = this.invoices();
    if (!query) return rows;

    const compact = query.replace(/\s+/g, '');
    return rows.filter(inv => {
      const haystack = [
        inv.code,
        inv.provider,
        inv.concept_description,
        inv.buildingName,
        inv.type,
        inv.amount
      ].map(v => String(v ?? '').toLowerCase()).join(' ');
      const compactHaystack = haystack.replace(/\s+/g, '');
      return haystack.includes(query) || compactHaystack.includes(compact);
    });
  });

  pagedInvoices = computed(() => {
    const rows = this.filteredInvoices();
    const size = this.pageSize();
    const maxPage = Math.max(0, Math.ceil(rows.length / size) - 1);
    const page = Math.min(this.pageIndex(), maxPage);
    return rows.slice(page * size, page * size + size);
  });

  totalMonth = computed(() => {
    const sumInCents = this.invoices().reduce((acc, inv) => {
      return acc + Math.round(Number(inv.amount || 0) * 100);
    }, 0);
    return sumInCents / 100;
  });

  monthStatus = signal<string>('OPEN');
  canClosePeriod = signal<boolean>(false);
  closedPeriods = signal<any[]>([]);

  ngOnInit() {
    this.initView();
    this.loadAdminConfig();
  }

  loadAdminConfig() {
    this.configService.getAdminSettings().subscribe({
      next: (res: any) => {
        if (res.data) {
          this.hasReserveFund.set(Boolean(res.data.has_reserve_fund));
          this.reserveFundPercentage.set(Number(res.data.reserve_fund_percentage || 0));
        }
      }
    });
  }

  initView() {
    const user = this.authService.userSignal();

    if (user?.complexId) {
      this.dashboardService.getBuildingsByComplex().subscribe({
        next: (res: any) => {
          this.buildingsList.set(res.data);
          this.selectedBuildingId.set('ALL');
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
    this.resetTableView();
    this.refreshCurrentView();
  }

  onPeriodSelect(key: string) {
    const period = this.availablePeriods.find(p => p.key === key);
    if (!period) return;
    this.selectedMonth.set(period.month);
    this.selectedYear.set(period.year);
    this.resetTableView();
    this.refreshCurrentView();
  }

  goPeriod(offset: number) {
    const next = this.availablePeriods[this.periodIndex() + offset];
    if (!next) return;
    this.onPeriodSelect(next.key);
  }

  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
    this.pageIndex.set(0);
  }

  onPage(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
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
    const complexId = this.authService.userSignal()?.complexId;

    const payload = buildingId === 'ALL'
      ? { isComplex: true, complexId: complexId }
      : { isComplex: false, buildingId: buildingId };

    this.billingService.getExpenses(payload, this.selectedMonth(), this.selectedYear()).subscribe({
      next: (res: any) => {
        this.invoices.set(res.data);
        this.monthStatus.set(res.status);
        this.canClosePeriod.set(res.canClose);
        this.pageIndex.set(0);
      }
    });
  }

  loadHistory() {
    const buildingId = this.selectedBuildingId();
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
    if (buildingId === 'ALL' || !buildingId) return;

    const payload = {
      buildingId: buildingId,
      month: this.selectedMonth(),
      year: this.selectedYear()
    };

    const confirmMsg = `¿Deseas cerrar ${this.currentPeriodLabel()}? Se generarán los recibos.`;

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
        this.dialog.open(ReportViewModalComponent, {
          width: '800px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          autoFocus: false,
          data: res
        });
      });
    }
  }

  periodLabel(month: number, year: number): string {
    const name = this.monthNames[Number(month) - 1] || String(month);
    return `${name} ${year}`;
  }

  formatClosedAt(value: string | Date | null | undefined): string {
    if (value == null || value === '') return 'No registrada';
    const raw = String(value).trim();
    // API actual (prod): DATE_FORMAT dd/MM/yyyy — DatePipe lo rompe si el día > 12
    if (/^\d{2}\/\d{2}\/\d{4}/.test(raw)) return raw;
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return 'No registrada';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(parsed.getDate())}/${pad(parsed.getMonth() + 1)}/${parsed.getFullYear()} ${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
  }

  private periodIndex(): number {
    const idx = this.availablePeriods.findIndex(p => p.key === this.currentPeriodKey());
    return idx < 0 ? this.availablePeriods.length - 2 : idx;
  }

  private resetTableView() {
    this.searchQuery.set('');
    this.pageIndex.set(0);
  }

  private buildPeriods() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 24, 1);
    const count = 26;
    const periods: { month: number; year: number; key: string; label: string }[] = [];

    for (let i = 0; i < count; i++) {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
      periods.push({
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        key: `${d.getFullYear()}-${d.getMonth() + 1}`,
        label: `${this.monthNames[d.getMonth()]} ${d.getFullYear()}`
      });
    }

    return periods;
  }
}