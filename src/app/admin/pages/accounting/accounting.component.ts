import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { AdminService } from '../../../core/services/admin.service';
import { AdminBuilding } from '../buildings/admin-building.model';
import {
  AccountingDemoBundle,
  AccountingScopeMode
} from './condominium-accounting.model';
import { buildCondominiumAccountingDemo, CONDO_CHART } from './condominium-accounting.demo';

@Component({
  selector: 'app-accounting',
  standalone: true,
  imports: [
    DecimalPipe,
    NgClass,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTabsModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatChipsModule
  ],
  templateUrl: './accounting.component.html',
  styleUrl: './accounting.component.scss'
})
export class AccountingComponent implements OnInit {
  private adminService = inject(AdminService);
  private snackBar = inject(MatSnackBar);

  loading = signal(false);
  buildings = signal<AdminBuilding[]>([]);
  complexes = signal<{ id: number; name: string }[]>([]);

  scopeMode = signal<AccountingScopeMode>('BUILDING');
  selectedBuildingId = signal<number | null>(null);
  selectedComplexId = signal<number | null>(null);
  selectedMonth = signal(new Date().getMonth() + 1);
  selectedYear = signal(new Date().getFullYear());

  demo = signal<AccountingDemoBundle | null>(null);

  journalColumns = ['date', 'entryNo', 'account', 'description', 'debit', 'credit', 'voucher'];
  ledgerColumns = ['code', 'name', 'debit', 'credit', 'balance'];
  chartColumns = ['code', 'name', 'type', 'group'];

  monthOptions = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];

  yearOptions = computed(() => {
    const y = new Date().getFullYear();
    return [y, y - 1, y - 2];
  });

  buildingsInComplex = computed(() => {
    const cid = this.selectedComplexId();
    if (cid == null) return [];
    return this.buildings().filter((b) => b.complexId === cid);
  });

  statCards = computed(() => {
    const d = this.demo();
    if (!d) return [];
    return [
      {
        id: 'in',
        variant: 'emerald',
        icon: 'south_west',
        chip: 'Ingresos',
        value: d.totals.income,
        sub: 'Cuotas y multas'
      },
      {
        id: 'out',
        variant: 'rose',
        icon: 'north_east',
        chip: 'Gastos',
        value: d.totals.expenses,
        sub: 'Gasto común + reserva'
      },
      {
        id: 'net',
        variant: 'blue',
        icon: 'account_balance',
        chip: 'Resultado',
        value: d.totals.netResult,
        sub: 'Periodo'
      },
      {
        id: 'bank',
        variant: 'teal',
        icon: 'savings',
        chip: 'Disponible',
        value: d.totals.cashAndBanks,
        sub: 'Bancos USD/Bs.'
      },
      {
        id: 'res',
        variant: 'amber',
        icon: 'shield',
        chip: 'Fondo reserva',
        value: d.totals.reserveFund,
        sub: 'Patrimonio restringido'
      }
    ];
  });

  ngOnInit() {
    this.loadCatalog();
  }

  loadCatalog() {
    this.loading.set(true);
    this.adminService.getBuildings({}).subscribe({
      next: (res) => {
        const rows = (res.data ?? []) as AdminBuilding[];
        this.buildings.set(rows);
        const cx = (res.complexes ?? []).map((c: any) => ({ id: Number(c.id), name: c.name }));
        this.complexes.set(cx);
        if (rows.length > 0) {
          this.selectedBuildingId.set(rows[0].id);
        }
        if (cx.length > 0) {
          this.selectedComplexId.set(cx[0].id);
        }
        this.regenerateDemo();
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('No se pudo cargar edificios/conjuntos', 'Cerrar', { duration: 3500 });
      }
    });
  }

  onScopeModeChange(mode: AccountingScopeMode) {
    this.scopeMode.set(mode);
    this.regenerateDemo();
  }

  onBuildingChange(id: number) {
    this.selectedBuildingId.set(id);
    this.regenerateDemo();
  }

  onComplexChange(id: number) {
    this.selectedComplexId.set(id);
    this.regenerateDemo();
  }

  onPeriodChange() {
    this.regenerateDemo();
  }

  regenerateDemo() {
    const mode = this.scopeMode();
    const month = this.selectedMonth();
    const year = this.selectedYear();

    if (mode === 'BUILDING') {
      const id = this.selectedBuildingId();
      const b = this.buildings().find((x) => x.id === id);
      if (!b) {
        this.demo.set(null);
        return;
      }
      const label = `${b.name}${b.complexName ? ` · ${b.complexName}` : ''}`;
      this.demo.set(
        buildCondominiumAccountingDemo(`b-${b.id}`, label, month, year, b.totalApartments || 24)
      );
      return;
    }

    const cid = this.selectedComplexId();
    const group = this.buildings().filter((b) => b.complexId === cid);
    const complex = this.complexes().find((c) => c.id === cid);
    const units = group.reduce((acc, b) => acc + (b.totalApartments || 0), 0) || 48;
    const label = complex?.name ?? 'Conjunto residencial';
    this.demo.set(
      buildCondominiumAccountingDemo(`c-${cid ?? 0}`, `${label} (${group.length} edificios)`, month, year, units)
    );
  }

  printReport() {
    window.print();
  }

  exportCsvHint() {
    this.snackBar.open(
      'Demo: en producción exportar Libro Diario y estados a Excel/PDF para asamblea.',
      'Cerrar',
      { duration: 4000 }
    );
  }

  protected readonly chartOfAccounts = CONDO_CHART;
}
