import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  SaasInvoice,
  SaasPaymentRecord,
  SaasService,
  SaaSAdmin
} from '../../../core/services/saas.service';
import { DateOnlyPipe } from '../../../shared/date-only.pipe';
import { SaasInvoicePrintService } from '../../../core/services/saas-invoice-print.service';

@Component({
  selector: 'app-saas-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
    DateOnlyPipe
  ],
  templateUrl: './saas-history.component.html',
  styleUrl: './saas-history.component.scss'
})
export class SaasHistoryComponent implements OnInit {
  private saasService = inject(SaasService);
  private invoicePrint = inject(SaasInvoicePrintService);
  private snackBar = inject(MatSnackBar);
  private route = inject(ActivatedRoute);

  clients = signal<SaaSAdmin[]>([]);
  rows = signal<SaasPaymentRecord[]>([]);
  invoices = signal<SaasInvoice[]>([]);
  selectedAdminId = signal<number | 'ALL'>('ALL');
  loading = signal(true);
  invoicesLoading = signal(false);
  loadError = signal<string | null>(null);
  invoicesError = signal<string | null>(null);

  displayedColumns = ['date', 'client', 'period', 'amount', 'method', 'reference'];
  invoiceColumns = ['period', 'issue', 'due', 'amount', 'status', 'paidOn', 'pdf'];

  filteredRows = computed(() => {
    const adminId = this.selectedAdminId();
    const list = this.rows();
    if (adminId === 'ALL') return list;
    return list.filter((r) => r.admin_id === adminId);
  });

  ngOnInit(): void {
    const param = this.route.snapshot.queryParamMap.get('adminId');
    if (param) {
      const id = Number(param);
      if (!Number.isNaN(id)) {
        this.selectedAdminId.set(id);
      }
    }

    this.saasService.getDashboard().subscribe({
      next: (res) => {
        if (res.success) {
          this.clients.set(res.data ?? []);
        }
      }
    });

    this.loadHistory();
    this.loadInvoices();
  }

  onAdminFilterChange(value: number | 'ALL'): void {
    this.selectedAdminId.set(value);
    this.loadHistory();
    this.loadInvoices();
  }

  loadHistory(): void {
    this.loading.set(true);
    this.loadError.set(null);
    const adminId = this.selectedAdminId();
    const requestAdminId = adminId === 'ALL' ? undefined : adminId;

    this.saasService.getAllPaymentHistory(requestAdminId).subscribe({
      next: (res) => {
        this.rows.set(res.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set('No se pudo cargar el historial de pagos SaaS.');
      }
    });
  }

  clientScopeLabel(row: SaasPaymentRecord): string {
    return row.complex_name || row.building_name || '—';
  }

  periodLabel(row: SaasPaymentRecord): string {
    return `${String(row.period_month).padStart(2, '0')}/${row.period_year}`;
  }

  invoicePeriodLabel(row: SaasInvoice): string {
    return `${String(row.period_month).padStart(2, '0')}/${row.period_year}`;
  }

  invoiceStatusLabel(status: string): string {
    switch (status) {
      case 'PAID':
        return 'Pagada';
      case 'PENDING':
        return 'Pendiente';
      case 'OVERDUE':
        return 'En mora';
      default:
        return status;
    }
  }

  printInvoice(inv: SaasInvoice): void {
    this.saasService.getInvoiceDocument(inv.id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.invoicePrint.openPrintablePdf(res.data);
        }
      },
      error: () =>
        this.snackBar.open('No se pudo generar la factura PDF', 'Cerrar', {
          duration: 4000
        })
    });
  }

  invoicePdfTooltip(inv: SaasInvoice): string {
    return inv.status === 'PAID'
      ? 'Descargar / imprimir factura pagada'
      : 'Descargar / imprimir factura por cobrar';
  }

  loadInvoices(): void {
    const adminId = this.selectedAdminId();
    if (adminId === 'ALL') {
      this.invoices.set([]);
      this.invoicesError.set(null);
      return;
    }

    this.invoicesLoading.set(true);
    this.invoicesError.set(null);
    this.saasService.getAdminInvoices(adminId).subscribe({
      next: (res) => {
        this.invoices.set(res.data ?? []);
        this.invoicesLoading.set(false);
      },
      error: () => {
        this.invoicesLoading.set(false);
        this.invoicesError.set('No se pudieron cargar las facturas del cliente.');
      }
    });
  }
}
