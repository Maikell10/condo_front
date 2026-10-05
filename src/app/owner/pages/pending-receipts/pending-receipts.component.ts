import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CurrencyPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { AuthService } from '../../../core/services/auth.service';
import { BillingService } from '../../../core/services/billing.service';
import { OwnerDataLoaderComponent } from '../../shared/owner-data-loader/owner-data-loader.component';

interface PendingSummaryRow {
  unit: string;
  owner?: string;
  receipts: number;
  debt: number;
  isMe?: boolean;
  isTotal?: boolean;
}

function spanishPaginator(): MatPaginatorIntl {
  const intl = new MatPaginatorIntl();
  intl.itemsPerPageLabel = 'Unidades por página';
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
  selector: 'app-pending-receipts',
  standalone: true,
  imports: [
    CurrencyPipe,
    NgClass,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatPaginatorModule,
    OwnerDataLoaderComponent
  ],
  providers: [{ provide: MatPaginatorIntl, useValue: spanishPaginator() }],
  templateUrl: './pending-receipts.component.html',
  styleUrl: './pending-receipts.component.scss'
})
export class PendingReceiptsComponent implements OnInit {
  private authService = inject(AuthService);
  private billingService = inject(BillingService);
  private snackBar = inject(MatSnackBar);

  displayedColumns: string[] = ['unit', 'receipts', 'debt'];

  rows = signal<PendingSummaryRow[]>([]);
  loading = signal(false);
  searchQuery = signal('');
  pageIndex = signal(0);
  pageSize = signal(10);

  buildingLabel = computed(() => {
    const u = this.authService.userSignal() as { buildingName?: string } | null;
    return u?.buildingName?.trim() || 'Tu edificio';
  });

  myUnitHint = computed(() => {
    const u = this.authService.userSignal();
    return (u?.username || u?.name || '').trim();
  });

  showPageLoader = computed(() => this.loading() && this.rows().length === 0);

  totalDebt = computed(() => this.rows().reduce((acc, r) => acc + Number(r.debt || 0), 0));
  totalReceipts = computed(() => this.rows().reduce((acc, r) => acc + Number(r.receipts || 0), 0));
  unitsInDebt = computed(() => this.rows().length);

  filteredTotalDebt = computed(() =>
    this.filteredRows().reduce((acc, r) => acc + Number(r.debt || 0), 0)
  );
  filteredTotalReceipts = computed(() =>
    this.filteredRows().reduce((acc, r) => acc + Number(r.receipts || 0), 0)
  );

  filteredRows = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const list = this.rows();
    if (!q) return list;
    return list.filter(
      (r) =>
        String(r.unit ?? '').toLowerCase().includes(q) ||
        String(r.owner ?? '').toLowerCase().includes(q)
    );
  });

  pagedRows = computed(() => {
    const rows = this.filteredRows();
    const size = this.pageSize();
    const maxPage = Math.max(0, Math.ceil(rows.length / size) - 1);
    const page = Math.min(this.pageIndex(), maxPage);
    return rows.slice(page * size, page * size + size);
  });

  tableRows = computed(() => {
    const page = this.pagedRows();
    if (this.rows().length === 0) return [];
    if (page.length === 0) return [];
    return [
      ...page,
      {
        unit: '',
        receipts: this.filteredTotalReceipts(),
        debt: this.filteredTotalDebt(),
        isTotal: true
      }
    ];
  });

  isSolvent = computed(() => !this.loading() && this.rows().length === 0);

  statCards = computed(() => [
    {
      id: 'debt',
      variant: 'rose',
      icon: 'money_off',
      chip: 'Deuda total',
      value: this.formatMoney(this.totalDebt()),
      sub: this.buildingLabel()
    },
    {
      id: 'receipts',
      variant: 'red',
      icon: 'receipt',
      chip: 'Recibos vencidos',
      value: String(this.totalReceipts()),
      sub: 'En todo el edificio'
    },
    {
      id: 'units',
      variant: 'orange',
      icon: 'apartment',
      chip: 'Unidades en mora',
      value: String(this.unitsInDebt()),
      sub: 'Con saldo pendiente'
    },
    {
      id: 'view',
      variant: 'slate',
      icon: 'filter_alt',
      chip: 'En tabla',
      value: String(this.filteredRows().length),
      sub: this.searchQuery() ? 'Con búsqueda' : 'Todas'
    }
  ]);

  ngOnInit() {
    this.loadPendingSummary();
  }

  loadPendingSummary() {
    const buildingId = Number(this.authService.userSignal()?.buildingId);
    if (!buildingId) return;

    this.loading.set(true);
    this.billingService.getPendingSummary(buildingId).subscribe({
      next: (res: any) => {
        const hint = this.myUnitHint().toLowerCase();
        const data: PendingSummaryRow[] = (res.data ?? []).map((row: any) => ({
          unit: String(row.unit ?? ''),
          owner: row.owner,
          receipts: Number(row.receipts),
          debt: Number(row.debt),
          isMe: hint.length > 0 && String(row.unit ?? '').toLowerCase() === hint.toLowerCase()
        }));
        data.sort((a, b) => a.unit.localeCompare(b.unit, undefined, { numeric: true }));
        this.rows.set(data);
        this.pageIndex.set(0);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('No se pudo cargar el resumen de morosidad', 'Cerrar', { duration: 3500 });
      }
    });
  }

  refresh() {
    this.loadPendingSummary();
  }

  onSearchChange(value: string) {
    this.searchQuery.set(value);
    this.pageIndex.set(0);
  }

  onPage(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  printSummary() {
    if (this.rows().length === 0) {
      this.snackBar.open('No hay deudas que imprimir', 'Cerrar', { duration: 3000 });
      return;
    }
    window.print();
  }

  rowClass(row: PendingSummaryRow) {
    if (row.isTotal) return 'row-total';
    if (row.isMe) return 'row-mine';
    return 'row-hover';
  }

  isTotalRow(row: PendingSummaryRow) {
    return !!row.isTotal;
  }

  private formatMoney(value: number): string {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
