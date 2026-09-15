import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { BillingService } from '../../../core/services/billing.service';
import { PaymentService } from '../../../core/services/payment.service';

@Component({
  selector: 'app-kpi',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatButtonModule,
    MatSelectModule, MatFormFieldModule, MatProgressSpinnerModule,
    MatDividerModule, RouterModule
  ],
  templateUrl: './kpi.component.html',
  styleUrl: './kpi.component.scss'
})
export class KpiComponent implements OnInit {
  private auth = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private billingService = inject(BillingService);
  private paymentService = inject(PaymentService);

  readonly months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  isComplex = computed(() => !!this.auth.userSignal()?.complexId);
  buildingsList = signal<any[]>([]);
  selectedBuildingId = signal<number | 'ALL'>('ALL');
  complexName = signal('');
  loading = signal(true);

  kpis = signal({
    totalApartments: 0,
    occupied: 0,
    delinquent: 0,
    monthIncome: 0,
    prevMonthIncome: 0
  });
  collection = signal({
    current: { period: '—', expected: 0, collected: 0, missing: 0, rate: 0 },
    previous: { period: '—', expected: 0, collected: 0, missing: 0, rate: 0 }
  });
  receipts = signal<any[]>([]);
  payments = signal<any[]>([]);

  delinquentRate = computed(() => {
    const { delinquent, occupied } = this.kpis();
    return occupied > 0 ? Math.round((delinquent / occupied) * 100) : 0;
  });

  occupancyRate = computed(() => {
    const { occupied, totalApartments } = this.kpis();
    return totalApartments > 0 ? Math.round((occupied / totalApartments) * 100) : 0;
  });

  incomeDelta = computed(() => {
    const { monthIncome, prevMonthIncome } = this.kpis();
    if (!prevMonthIncome) return monthIncome > 0 ? 100 : 0;
    return Math.round(((monthIncome - prevMonthIncome) / prevMonthIncome) * 100);
  });

  totalDebt = computed(() =>
    this.normalizedReceipts().reduce((sum, r) => sum + (r.balance > 0 ? r.balance : 0), 0)
  );

  totalBilled = computed(() =>
    this.normalizedReceipts().reduce((sum, r) => sum + r.amount, 0)
  );

  totalCollected = computed(() =>
    this.normalizedReceipts().reduce((sum, r) => sum + r.paid, 0)
  );

  pendingPayments = computed(() =>
    this.scopedPayments().filter(p => p.status === 'PENDING_APPROVAL').length
  );

  private normalizedReceipts = computed(() =>
    this.receipts().map(r => {
      const amount = Math.round(Number(r.amount || 0) * 100) / 100;
      const paid = Math.round(Number(r.paid || 0) * 100) / 100;
      const balance = Math.round((amount - paid) * 100) / 100;
      let status = r.status;
      if (balance <= 0) status = 'PAID';
      else if (paid > 0) status = 'PARTIAL';
      else status = 'PENDING';
      return { ...r, amount, paid, balance, status };
    })
  );

  private scopedPayments = computed(() => {
    const buildingId = this.selectedBuildingId();
    const all = this.payments();
    if (buildingId === 'ALL' || !this.isComplex()) return all;
    const name = this.buildingsList().find(b => b.id === buildingId)?.name;
    return name ? all.filter(p => p.buildingName === name) : all;
  });

  debtMix = computed(() => {
    const rows = this.normalizedReceipts();
    const paid = rows.filter(r => r.status === 'PAID').length;
    const partial = rows.filter(r => r.status === 'PARTIAL').length;
    const pending = rows.filter(r => r.status === 'PENDING').length;
    const total = paid + partial + pending;
    return {
      paid, partial, pending, total,
      paidPct: total ? Math.round((paid / total) * 100) : 0,
      partialPct: total ? Math.round((partial / total) * 100) : 0,
      pendingPct: total ? Math.round((pending / total) * 100) : 0,
      gradient: this.conic([
        { color: '#10b981', value: paid },
        { color: '#f59e0b', value: partial },
        { color: '#f43f5e', value: pending }
      ])
    };
  });

  occupancyGradient = computed(() => {
    const { occupied, totalApartments } = this.kpis();
    const vacant = Math.max(totalApartments - occupied, 0);
    return this.conic([
      { color: '#6366f1', value: occupied },
      { color: '#e2e8f0', value: vacant }
    ]);
  });

  paymentMix = computed(() => {
    const approved = this.scopedPayments().filter(p => p.status === 'APPROVED');
    const cash = approved.filter(p => p.reference === 'EFECTIVO').length;
    const bank = Math.max(approved.length - cash, 0);
    return {
      cash, bank, total: approved.length,
      cashPct: approved.length ? Math.round((cash / approved.length) * 100) : 0,
      bankPct: approved.length ? Math.round((bank / approved.length) * 100) : 0,
      gradient: this.conic([
        { color: '#10b981', value: cash },
        { color: '#6366f1', value: bank }
      ])
    };
  });

  periodBars = computed(() => {
    const groups = new Map<string, { billed: number; collected: number; date: string }>();
    for (const r of this.normalizedReceipts()) {
      const key = r.description || 'Sin periodo';
      const current = groups.get(key) || { billed: 0, collected: 0, date: r.issueDate || '' };
      current.billed += r.amount;
      current.collected += r.paid;
      if (r.issueDate && r.issueDate > current.date) current.date = r.issueDate;
      groups.set(key, current);
    }

    const rows = [...groups.entries()]
      .map(([label, value]) => ({ label: this.shortPeriod(label), ...value }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-8);

    const max = Math.max(...rows.map(r => Math.max(r.billed, r.collected)), 1);
    return rows.map(r => ({
      ...r,
      billedH: Math.max(6, (r.billed / max) * 100),
      collectedH: Math.max(6, (r.collected / max) * 100)
    }));
  });

  monthlyPayments = computed(() => {
    const now = new Date();
    const buckets: { key: string; label: string; amount: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: `${this.months[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
        amount: 0
      });
    }

    for (const p of this.scopedPayments()) {
      if (p.status !== 'APPROVED') continue;
      const raw = p.date || p.payment_date;
      if (!raw) continue;
      const date = new Date(raw);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const bucket = buckets.find(b => b.key === key);
      if (bucket) bucket.amount += Number(p.amount || 0);
    }

    const max = Math.max(...buckets.map(b => b.amount), 1);
    return buckets.map(b => ({
      ...b,
      height: Math.max(b.amount > 0 ? 8 : 4, (b.amount / max) * 100)
    }));
  });

  topDebtors = computed(() => {
    const map = new Map<string, { apartment: string; ownerName: string; buildingName: string; balance: number }>();
    for (const r of this.normalizedReceipts()) {
      if (r.balance <= 0) continue;
      const key = `${r.buildingName || ''}-${r.apartment}`;
      const current = map.get(key) || {
        apartment: r.apartment,
        ownerName: r.ownerName || 'Sin asignar',
        buildingName: r.buildingName || '',
        balance: 0
      };
      current.balance += r.balance;
      map.set(key, current);
    }

    const list = [...map.values()].sort((a, b) => b.balance - a.balance).slice(0, 8);
    const max = list[0]?.balance || 1;
    return list.map(item => ({ ...item, width: Math.max(8, (item.balance / max) * 100) }));
  });

  insights = computed(() => {
    const notes: { icon: string; tone: string; text: string }[] = [];
    const pending = this.pendingPayments();
    const rate = this.collection().current.rate;
    const delta = this.incomeDelta();
    const delinquent = this.delinquentRate();

    if (pending > 0) {
      notes.push({
        icon: 'pending_actions',
        tone: 'amber',
        text: `Hay ${pending} pago${pending === 1 ? '' : 's'} por validar. Eso retrasa la conciliación de la deuda.`
      });
    }
    if (rate > 0 && rate < 70) {
      notes.push({
        icon: 'trending_down',
        tone: 'rose',
        text: `La recaudación de ${this.collection().current.period} está en ${rate}%. Conviene priorizar morosos.`
      });
    } else if (rate >= 90) {
      notes.push({
        icon: 'verified',
        tone: 'emerald',
        text: `${this.collection().current.period} va muy bien: ${rate}% recaudado.`
      });
    }
    if (delta !== 0) {
      notes.push({
        icon: delta > 0 ? 'arrow_upward' : 'arrow_downward',
        tone: delta > 0 ? 'emerald' : 'rose',
        text: `Los ingresos de caja ${delta > 0 ? 'subieron' : 'bajaron'} ${Math.abs(delta)}% vs. el mes anterior.`
      });
    }
    if (delinquent >= 20) {
      notes.push({
        icon: 'warning_amber',
        tone: 'rose',
        text: `${this.kpis().delinquent} unidades en morosidad (${delinquent}% de las ocupadas).`
      });
    }
    if (!notes.length) {
      notes.push({
        icon: 'insights',
        tone: 'indigo',
        text: 'No hay alertas críticas. Revisa las gráficas para ver la evolución de pagos y deudas.'
      });
    }
    return notes.slice(0, 4);
  });

  ngOnInit() {
    this.dashboardService.getComplexInfo().subscribe({
      next: (res: any) => this.complexName.set(res.data?.name || ''),
      error: () => this.complexName.set('')
    });

    const user = this.auth.userSignal();
    if (user?.complexId) {
      this.dashboardService.getBuildingsByComplex().subscribe({
        next: (res: any) => {
          this.buildingsList.set(res.data || []);
          this.selectedBuildingId.set('ALL');
          this.loadData();
        },
        error: () => this.loadData()
      });
    } else {
      this.selectedBuildingId.set(user?.buildingId ? Number(user.buildingId) : 'ALL');
      this.loadData();
    }
  }

  onBuildingChange(buildingId: number | 'ALL') {
    this.selectedBuildingId.set(buildingId);
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    const buildingId = this.selectedBuildingId();
    const complexId = this.auth.userSignal()?.complexId;
    const urlParam = buildingId === 'ALL' ? `ALL?complexId=${complexId}` : `${buildingId}`;
    const statementsPayload = buildingId === 'ALL'
      ? { isComplex: true, complexId }
      : { isComplex: false, buildingId };

    forkJoin({
      stats: this.dashboardService.getStats(urlParam),
      statements: this.billingService.getStatements(statementsPayload),
      payments: this.paymentService.getBuildingPayments()
    }).subscribe({
      next: ({ stats, statements, payments }) => {
        this.kpis.set({
          totalApartments: stats.kpis?.totalApartments || 0,
          occupied: stats.kpis?.occupied || 0,
          delinquent: stats.kpis?.delinquent || 0,
          monthIncome: Number(stats.kpis?.monthIncome || 0),
          prevMonthIncome: Number(stats.kpis?.prevMonthIncome || 0)
        });
        if (stats.collection) {
          this.collection.set({
            current: stats.collection.current || this.collection().current,
            previous: stats.collection.previous || this.collection().previous
          });
        }
        this.receipts.set(statements.data || []);
        this.payments.set(payments.data || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private shortPeriod(label: string): string {
    return String(label || '').replace(/^condominio\s+/i, '').trim() || label;
  }

  private conic(slices: { color: string; value: number }[]): string {
    const total = slices.reduce((sum, s) => sum + s.value, 0);
    if (!total) return 'conic-gradient(#e2e8f0 0 100%)';
    let cursor = 0;
    const parts = slices.map(s => {
      const start = cursor;
      cursor += (s.value / total) * 100;
      return `${s.color} ${start}% ${cursor}%`;
    });
    return `conic-gradient(${parts.join(', ')})`;
  }
}
