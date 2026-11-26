import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { PaymentService } from '../../../core/services/payment.service';
import { OwnerDataLoaderComponent } from '../../shared/owner-data-loader/owner-data-loader.component';
import { ownerPaymentStatusLabel } from '../../shared/owner-payment-status';

function spanishPaginator(): MatPaginatorIntl {
  const intl = new MatPaginatorIntl();
  intl.itemsPerPageLabel = 'Reportes por página';
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
  selector: 'app-payment-reports',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    NgClass,
    FormsModule,
    RouterLink,
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
  templateUrl: './payment-reports.component.html',
  styleUrl: './payment-reports.component.scss'
})
export class PaymentReportsComponent implements OnInit {
  private paymentService = inject(PaymentService);
  private snackBar = inject(MatSnackBar);

  displayedColumns: string[] = ['date', 'reference', 'amount', 'amountLocal', 'status'];
  reports = signal<any[]>([]);
  loading = signal(false);
  searchQuery = signal('');
  pageIndex = signal(0);
  pageSize = signal(10);

  paymentStatusLabel = ownerPaymentStatusLabel;

  showPageLoader = computed(() => this.loading() && this.reports().length === 0);

  pendingCount = computed(
    () => this.reports().filter((p) => p.status === 'PENDING_APPROVAL').length
  );
  approvedCount = computed(() => this.reports().filter((p) => p.status === 'APPROVED').length);
  totalReportedUsd = computed(() =>
    this.reports().reduce((acc, p) => acc + (Number(p.amount) || 0), 0)
  );

  filteredReports = computed(() => {
    const q = this.normalizeSearch(this.searchQuery());
    if (!q) return this.reports();
    return this.reports().filter((p) => this.rowSearchText(p).includes(q));
  });

  pagedReports = computed(() => {
    const rows = this.filteredReports();
    const size = this.pageSize();
    const maxPage = Math.max(0, Math.ceil(rows.length / size) - 1);
    const page = Math.min(this.pageIndex(), maxPage);
    return rows.slice(page * size, page * size + size);
  });

  statCards = computed(() => [
    {
      id: 'total',
      variant: 'indigo',
      icon: 'receipt_long',
      chip: 'Total reportes',
      value: String(this.reports().length),
      sub: 'Historial enviado'
    },
    {
      id: 'review',
      variant: 'amber',
      icon: 'hourglass_top',
      chip: 'En revisión',
      value: String(this.pendingCount()),
      sub: 'Pendientes de validar'
    },
    {
      id: 'ok',
      variant: 'emerald',
      icon: 'verified',
      chip: 'Verificados',
      value: String(this.approvedCount()),
      sub: 'Conciliados con el banco'
    },
    {
      id: 'view',
      variant: 'violet',
      icon: 'filter_alt',
      chip: 'En tabla',
      value: String(this.filteredReports().length),
      sub: this.searchQuery() ? 'Con búsqueda' : 'Todos'
    }
  ]);

  ngOnInit() {
    this.loadReports();
  }

  loadReports() {
    this.loading.set(true);
    this.paymentService.getRecentPayments().subscribe({
      next: (res) => {
        this.reports.set(res.data ?? []);
        this.pageIndex.set(0);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('No se pudo cargar el historial de reportes', 'Cerrar', { duration: 4000 });
      }
    });
  }

  onSearchChange(value: string) {
    this.searchQuery.set(value);
    this.pageIndex.set(0);
  }

  onPage(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  operationLabel(type: string | undefined): string {
    if (type === 'same_bank') return 'Mismo banco';
    if (type === 'other_bank') return 'Otro banco';
    return type ?? '—';
  }

  private normalizeSearch(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '');
  }

  private rowSearchText(row: any): string {
    const parts = [
      row.reference,
      row.status,
      row.amount,
      row.amount_local,
      row.payment_date,
      row.created_at,
      row.operation_type,
      this.paymentStatusLabel(row.status).label
    ];
    return this.normalizeSearch(parts.filter(Boolean).join(' '));
  }
}