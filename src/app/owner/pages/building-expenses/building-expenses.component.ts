import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CurrencyPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { BillingService } from '../../../core/services/billing.service';
import { OwnerDataLoaderComponent } from '../../shared/owner-data-loader/owner-data-loader.component';

interface ExpensePeriod {
  month: number;
  year: number;
  name: string;
  value: string;
}

interface ExpenseRow {
  code: string;
  description: string;
  amount: number;
  isTotal?: boolean;
}

@Component({
  selector: 'app-building-expenses',
  standalone: true,
  imports: [
    CurrencyPipe,
    NgClass,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    OwnerDataLoaderComponent
  ],
  templateUrl: './building-expenses.component.html',
  styleUrl: './building-expenses.component.scss'
})
export class BuildingExpensesComponent implements OnInit {
  private authService = inject(AuthService);
  private billingService = inject(BillingService);
  private snackBar = inject(MatSnackBar);

  displayedColumns: string[] = ['code', 'description', 'amount'];

  availablePeriods = signal<ExpensePeriod[]>([]);
  selectedPeriod = signal('');
  expenseLines = signal<ExpenseRow[]>([]);
  totalCommon = signal(0);
  loadingPeriods = signal(false);
  loadingExpenses = signal(false);
  searchQuery = signal('');

  monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  showPageLoader = computed(
    () => this.loadingPeriods() && this.availablePeriods().length === 0
  );

  buildingLabel = computed(() => {
    const u = this.authService.userSignal() as { buildingName?: string } | null;
    return u?.buildingName?.trim() || 'Tu edificio';
  });

  selectedPeriodLabel = computed(() => {
    const value = this.selectedPeriod();
    const found = this.availablePeriods().find((p) => p.value === value);
    return found?.name ?? '—';
  });

  lineCount = computed(() => this.expenseLines().length);

  filteredLines = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const rows = this.expenseLines();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        String(r.code ?? '').toLowerCase().includes(q) ||
        String(r.description ?? '').toLowerCase().includes(q)
    );
  });

  tableRows = computed(() => {
    const lines = this.filteredLines();
    const total = this.totalCommon();
    if (this.expenseLines().length === 0) return [];
    if (lines.length === 0) return [];
    return [
      ...lines,
      {
        code: '',
        description: 'TOTAL GASTOS COMUNES:',
        amount: total,
        isTotal: true
      }
    ];
  });

  statCards = computed(() => [
    {
      id: 'total',
      variant: 'violet',
      icon: 'account_balance',
      chip: 'Gasto común',
      value: this.formatMoney(this.totalCommon()),
      sub: this.selectedPeriodLabel()
    },
    {
      id: 'lines',
      variant: 'indigo',
      icon: 'receipt',
      chip: 'Conceptos',
      value: String(this.lineCount()),
      sub: 'En el periodo'
    },
    {
      id: 'building',
      variant: 'sky',
      icon: 'apartment',
      chip: 'Edificio',
      value: this.selectedPeriod() ? 'Activo' : '—',
      sub: this.buildingLabel()
    },
    {
      id: 'view',
      variant: 'slate',
      icon: 'filter_alt',
      chip: 'En tabla',
      value: String(this.filteredLines().length),
      sub: this.searchQuery() ? 'Con búsqueda' : 'Todos'
    }
  ]);

  ngOnInit() {
    this.loadPeriods();
  }

  loadPeriods() {
    const buildingId = Number(this.authService.userSignal()?.buildingId);
    if (!buildingId) return;

    this.loadingPeriods.set(true);
    this.billingService.getAvailableExpensePeriods(buildingId).subscribe({
      next: (res: any) => {
        const periods: ExpensePeriod[] = (res.data ?? []).map((p: any) => ({
          month: p.month,
          year: p.year,
          name: `${this.monthNames[p.month - 1]} ${p.year}`,
          value: `${p.month}-${p.year}`
        }));
        this.availablePeriods.set(periods);
        if (periods.length > 0) {
          this.selectedPeriod.set(periods[0].value);
          this.loadExpenses(periods[0].month, periods[0].year);
        } else {
          this.expenseLines.set([]);
          this.totalCommon.set(0);
        }
        this.loadingPeriods.set(false);
      },
      error: () => {
        this.loadingPeriods.set(false);
        this.snackBar.open('No se pudieron cargar los periodos', 'Cerrar', { duration: 3500 });
      }
    });
  }

  refresh() {
    const value = this.selectedPeriod();
    if (!value) {
      this.loadPeriods();
      return;
    }
    const [month, year] = value.split('-');
    this.loadExpenses(Number(month), Number(year));
  }

  onPeriodChange(selectedValue: string) {
    this.selectedPeriod.set(selectedValue);
    this.searchQuery.set('');
    const [month, year] = selectedValue.split('-');
    this.loadExpenses(Number(month), Number(year));
  }

  onSearchChange(value: string) {
    this.searchQuery.set(value);
  }

  loadExpenses(month: number, year: number) {
    const buildingId = Number(this.authService.userSignal()?.buildingId);
    if (!buildingId) return;

    this.loadingExpenses.set(true);
    this.billingService.getExpensesByPeriod(buildingId, month, year).subscribe({
      next: (res: any) => {
        const data = res.data ?? [];
        if (data.length > 0) {
          const total = data.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);
          const lines: ExpenseRow[] = data.map((d: any) => ({
            code: d.code ?? '',
            description: d.description ?? '',
            amount: Number(d.amount)
          }));
          this.expenseLines.set(lines);
          this.totalCommon.set(total);
        } else {
          this.expenseLines.set([]);
          this.totalCommon.set(0);
        }
        this.loadingExpenses.set(false);
      },
      error: () => {
        this.loadingExpenses.set(false);
        this.expenseLines.set([]);
        this.totalCommon.set(0);
        this.snackBar.open('No se pudieron cargar los gastos', 'Cerrar', { duration: 3500 });
      }
    });
  }

  printReport() {
    if (this.expenseLines().length === 0) {
      this.snackBar.open('No hay gastos para imprimir en este periodo', 'Cerrar', { duration: 3000 });
      return;
    }
    window.print();
  }

  private formatMoney(value: number): string {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
