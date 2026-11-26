import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe, NgClass } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { ReceiptService, Receipt } from '../../../core/services/receipt.service';
import { PaymentService } from '../../../core/services/payment.service';
import { BillingService } from '../../../core/services/billing.service';
import { OwnerDataLoaderComponent } from '../../shared/owner-data-loader/owner-data-loader.component';
import { ownerPaymentStatusLabel } from '../../shared/owner-payment-status';

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [
    CurrencyPipe,
    DecimalPipe,
    NgClass,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule,
    RouterLink,
    OwnerDataLoaderComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private receiptService = inject(ReceiptService);
  private paymentService = inject(PaymentService);
  private billingService = inject(BillingService);
  private snackBar = inject(MatSnackBar);

  readonly paymentStatusLabel = ownerPaymentStatusLabel;

  loading = signal(true);
  owner = signal<{
    name: string;
    building: string;
    unit: string;
    aliquot: number;
  } | null>(null);

  financialStatus = signal({
    currentDebt: 0,
    status: 'UP_TO_DATE' as 'UP_TO_DATE' | 'DEBT',
    pendingReceipts: 0
  });

  lastPayment = signal<{ amount: number; date: string; method?: string }>({
    amount: 0,
    date: 'N/A'
  });

  pendingReceipts = signal<Receipt[]>([]);
  recentReports = signal<any[]>([]);
  exchangeRate = signal<number | null>(null);
  exchangeRateDate = signal<string>('');
  latestPeriod = signal<{ label: string; amount?: number; status?: string } | null>(null);

  isInDebt = computed(() => this.financialStatus().status === 'DEBT');

  paymentsInReview = computed(
    () => this.recentReports().filter((p) => p.status === 'PENDING_APPROVAL').length
  );

  recentReportsPreview = computed(() =>
    [...this.recentReports()]
      .sort(
        (a, b) =>
          new Date(b.payment_date ?? b.created_at ?? 0).getTime() -
          new Date(a.payment_date ?? a.created_at ?? 0).getTime()
      )
      .slice(0, 3)
  );

  pendingPreview = computed(() => this.pendingReceipts().slice(0, 4));

  statCards = computed(() => {
    const rate = this.exchangeRate();
    return [
      {
        id: 'debt',
        variant: this.isInDebt() ? 'rose' : 'emerald',
        icon: this.isInDebt() ? 'warning_amber' : 'verified',
        chip: this.isInDebt() ? 'Tu deuda' : 'Estado',
        value: this.isInDebt()
          ? `$${this.financialStatus().currentDebt.toFixed(2)}`
          : 'Al día',
        sub: this.isInDebt()
          ? `${this.financialStatus().pendingReceipts} recibo(s) pendiente(s)`
          : 'Sin saldos abiertos'
      },
      {
        id: 'receipts',
        variant: 'indigo',
        icon: 'receipt_long',
        chip: 'Recibos',
        value: String(this.financialStatus().pendingReceipts),
        sub: 'Por liquidar'
      },
      {
        id: 'review',
        variant: 'amber',
        icon: 'hourglass_top',
        chip: 'En revisión',
        value: String(this.paymentsInReview()),
        sub: 'Reportes de pago'
      },
      {
        id: 'rate',
        variant: 'violet',
        icon: 'currency_exchange',
        chip: 'Tasa BCV',
        value: rate ? `Bs. ${rate.toFixed(2)}` : '—',
        sub: this.exchangeRateDate() ? `Valor ${this.exchangeRateDate()}` : 'USD del día'
      }
    ] as const;
  });

  quickLinks = [
    { route: '/owner/payments', icon: 'payments', label: 'Pagar', accent: 'indigo' },
    { route: '/owner/condo-receipt', icon: 'receipt', label: 'Mi recibo', accent: 'blue' },
    { route: '/owner/paid-receipts', icon: 'task_alt', label: 'Pagados', accent: 'emerald' },
    { route: '/owner/building-expenses', icon: 'apartment', label: 'Gastos', accent: 'violet' },
    { route: '/owner/pending-receipts', icon: 'groups', label: 'Morosidad', accent: 'rose' },
    { route: '/owner/polls', icon: 'how_to_vote', label: 'Encuestas', accent: 'purple' }
  ] as const;

  ngOnInit() {
    this.loadDashboardData();
  }

  refresh() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.loading.set(true);

    forkJoin({
      dashboard: this.dashboardService.getOwnerDashboard().pipe(catchError(() => of(null))),
      receipts: this.receiptService.getPendingReceipts().pipe(catchError(() => of({ data: [] }))),
      payments: this.paymentService.getRecentPayments().pipe(catchError(() => of({ data: [] }))),
      rate: this.paymentService.getLatestExchangeRate().pipe(catchError(() => of(null))),
      periods: this.billingService.getOwnerReceiptPeriods().pipe(catchError(() => of({ data: [] })))
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe(({ dashboard, receipts, payments, rate, periods }) => {
        if (dashboard) {
          this.owner.set(dashboard.owner);
          this.financialStatus.set(dashboard.financialStatus);
          this.lastPayment.set(dashboard.lastPayment ?? { amount: 0, date: 'N/A' });
        } else {
          const u = this.auth.userSignal();
          this.owner.set({
            name: u?.name ?? 'Propietario',
            building: 'Tu edificio',
            unit: u?.ownerCode ?? '—',
            aliquot: 0
          });
          this.snackBar.open('Carga parcial: no se obtuvo el resumen principal', 'Cerrar', { duration: 4000 });
        }

        const receiptRows = (receipts as { data?: Receipt[] }).data ?? [];
        this.pendingReceipts.set(receiptRows);

        const pendingFromList = receiptRows.length;
        if (pendingFromList > 0) {
          this.financialStatus.update((s) => ({
            ...s,
            pendingReceipts: Math.max(s.pendingReceipts, pendingFromList)
          }));
        }

        this.recentReports.set((payments as { data?: any[] }).data ?? []);

        const rateRes = rate as { success?: boolean; data?: { rate?: number; rate_date?: string } } | null;
        if (rateRes?.success && rateRes.data?.rate) {
          this.exchangeRate.set(Number(rateRes.data.rate));
          const raw = rateRes.data.rate_date?.split('T')[0] ?? '';
          this.exchangeRateDate.set(raw);
        }

        const periodRows = (periods as { data?: any[] }).data ?? [];
        if (periodRows.length > 0) {
          const p = periodRows[0];
          this.latestPeriod.set({
            label: p.monthName ?? p.period ?? 'Último periodo',
            amount: p.amount != null ? Number(p.amount) : undefined,
            status: p.status
          });
        } else {
          this.latestPeriod.set(null);
        }
      });
  }

  receiptBalance(row: Receipt): number {
    return Number(row.monto) - Number(row.paid || 0);
  }
}