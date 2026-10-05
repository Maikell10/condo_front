import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { BillingService } from '../../../core/services/billing.service';
import { ReceiptPreviewDialogComponent } from '../../../modals/receipt-preview-dialog/receipt-preview-dialog.component';
import { OwnerDataLoaderComponent } from '../../shared/owner-data-loader/owner-data-loader.component';

function spanishPaginator(): MatPaginatorIntl {
  const intl = new MatPaginatorIntl();
  intl.itemsPerPageLabel = 'Recibos por página';
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
  selector: 'app-paid-receipts',
  standalone: true,
  imports: [
    CurrencyPipe,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatPaginatorModule,
    OwnerDataLoaderComponent
  ],
  providers: [{ provide: MatPaginatorIntl, useValue: spanishPaginator() }],
  templateUrl: './paid-receipts.component.html',
  styleUrl: './paid-receipts.component.scss'
})
export class PaidReceiptsComponent implements OnInit {
  private billingService = inject(BillingService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  displayedColumns: string[] = ['period', 'amount', 'status', 'actions'];
  paidHistory = signal<any[]>([]);
  loading = signal(false);
  searchQuery = signal('');
  pageIndex = signal(0);
  pageSize = signal(10);

  showPageLoader = computed(() => this.loading() && this.paidHistory().length === 0);

  totalPaid = computed(() =>
    this.paidHistory().reduce((acc, r) => acc + Number(r.amount || 0), 0)
  );
  receiptCount = computed(() => this.paidHistory().length);
  lastReceipt = computed(() => this.paidHistory()[0] ?? null);

  filteredReceipts = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const rows = this.paidHistory();
    if (!q) return rows;
    return rows.filter((r) => String(r.period ?? '').toLowerCase().includes(q));
  });

  pagedReceipts = computed(() => {
    const rows = this.filteredReceipts();
    const size = this.pageSize();
    const maxPage = Math.max(0, Math.ceil(rows.length / size) - 1);
    const page = Math.min(this.pageIndex(), maxPage);
    return rows.slice(page * size, page * size + size);
  });

  statCards = computed(() => [
    {
      id: 'count',
      variant: 'emerald',
      icon: 'receipt_long',
      chip: 'Recibos',
      value: String(this.receiptCount()),
      sub: 'Periodos pagados'
    },
    {
      id: 'total',
      variant: 'teal',
      icon: 'payments',
      chip: 'Total pagado',
      value: this.formatMoney(this.totalPaid()),
      sub: 'Histórico acumulado'
    },
    {
      id: 'last',
      variant: 'indigo',
      icon: 'history',
      chip: 'Último periodo',
      value: this.lastReceipt()?.period ?? '—',
      sub: this.lastReceipt() ? this.formatMoney(this.lastReceipt()!.amount) : 'Sin datos'
    },
    {
      id: 'view',
      variant: 'slate',
      icon: 'filter_alt',
      chip: 'En tabla',
      value: String(this.filteredReceipts().length),
      sub: this.searchQuery() ? 'Con búsqueda' : 'Todos'
    }
  ]);

  ngOnInit() {
    this.loadPaidHistory();
  }

  loadPaidHistory() {
    this.loading.set(true);
    this.billingService.getPaidReceipts().subscribe({
      next: (res: any) => {
        const formatted = (res.data ?? []).map((r: any) => ({
          id: r.id,
          period: r.period,
          amount: Number(r.amount),
          status: 'PAGADO',
          raw: r
        }));
        this.paidHistory.set(formatted);
        this.pageIndex.set(0);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('No se pudo cargar el historial', 'Cerrar', { duration: 3500 });
      }
    });
  }

  refreshList() {
    this.loadPaidHistory();
  }

  onSearchChange(value: string) {
    this.searchQuery.set(value);
    this.pageIndex.set(0);
  }

  onPage(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  private formatMoney(value: number): string {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  downloadReceipt(row: any) {
    const raw = row.raw;
    const apartmentId = raw.apartment_id || raw.apartmentId;

    let month = new Date().getMonth() + 1;
    let year = new Date().getFullYear();

    let formattedIssueDate = 'N/A';
    if (raw.issueDate || raw.issue_date) {
      const dateStr = raw.issueDate || raw.issue_date;
      const dateObj = new Date(dateStr);
      const day = String(dateObj.getUTCDate()).padStart(2, '0');
      const mo = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
      const yr = dateObj.getUTCFullYear();

      formattedIssueDate = `${day}-${mo}-${yr}`;
      month = dateObj.getUTCMonth() + 1;
      year = yr;
    }

    this.billingService.getOwnerReceiptDetail(apartmentId, month, year).subscribe({
      next: (res: any) => {
        const data = res.data || [];
        const rawAlicuota = Number(res.alicuota) || (raw.alicuota ? Number(raw.alicuota) : 0);
        const formattedQuota = Number((rawAlicuota * 100).toFixed(4)).toString() + '%';

        const totalCommon = data.reduce((acc: number, curr: any) => acc + Number(curr.totalAmount), 0);
        const finalTotalCommon = totalCommon > 0 ? totalCommon : Number(raw.amount) / rawAlicuota;
        const finalBill = Number(raw.amount) || 0;

        const lineItems =
          data.length > 0
            ? data.map((d: any) => ({
                concept: d.description || d.code,
                commonExpense: Number(d.totalAmount),
                individualShare: Number(d.totalAmount) * rawAlicuota
              }))
            : [
                {
                  concept: 'Cuota de Condominio',
                  commonExpense: finalTotalCommon,
                  individualShare: finalBill
                }
              ];

        const receiptData = {
          buildingName: raw.buildingName || raw.building_name || 'Edificio Principal',
          unit: raw.apartment || raw.apartment_number || raw.apartmentNumber || res.apartmentNumber || 'N/A',
          issueDate: formattedIssueDate,
          monthYear: row.period || `${month}-${year}`,
          ownerName: raw.ownerName || raw.owner_name || 'Propietario',
          quota: formattedQuota,
          lineItems,
          totalGastoComun: finalTotalCommon,
          totalGastoIndividual: finalBill,
          totalBill: finalBill,
          accessCode: raw.access_code || raw.accessCode || res.access_code || 'PENDIENTE',
          status: raw.status || row.status || 'PENDING'
        };

        this.dialog.open(ReceiptPreviewDialogComponent, {
          width: '900px',
          maxWidth: '95vw',
          data: receiptData
        });
      },
      error: (err) => {
        console.error('Error al cargar detalle del recibo', err);
        this.snackBar.open('No se pudo cargar el detalle del recibo', 'Cerrar', { duration: 4000 });
      }
    });
  }
}
