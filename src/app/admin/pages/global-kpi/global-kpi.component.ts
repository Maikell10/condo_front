import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminService } from '../../../core/services/admin.service';
import { SaasService, SaaSAdmin, SaasPaymentRecord } from '../../../core/services/saas.service';
import { AdminBuilding } from '../buildings/admin-building.model';
import { AdminUsersStats } from '../users/admin-user.model';

interface Slice {
  label: string;
  value: number;
  color: string;
}

interface MonthPoint {
  label: string;
  amount: number;
  x: number;
  y: number;
}

@Component({
  selector: 'app-global-kpi',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './global-kpi.component.html',
  styleUrl: './global-kpi.component.scss'
})
export class GlobalKpiComponent implements OnInit {
  private admin = inject(AdminService);
  private saas = inject(SaasService);

  loading = signal(true);
  loadError = signal('');

  buildings = signal<AdminBuilding[]>([]);
  userStats = signal<AdminUsersStats | null>(null);
  saasAdmins = signal<SaaSAdmin[]>([]);
  collectedThisMonth = signal(0);
  payments = signal<SaasPaymentRecord[]>([]);

  activeBuildings = computed(() => this.buildings().filter(b => b.status === 'ACTIVE').length);
  inactiveBuildings = computed(() => this.buildings().filter(b => b.status === 'INACTIVE').length);
  totalApartments = computed(() => this.buildings().reduce((sum, b) => sum + Number(b.totalApartments || 0), 0));
  withoutAdmin = computed(() => this.buildings().filter(b => !b.adminEmail).length);
  complexCount = computed(() => new Set(this.buildings().map(b => b.complexId).filter(id => id != null)).size);

  roleSlices = computed<Slice[]>(() => {
    const stats = this.userStats();
    if (!stats) return [];
    return [
      { label: 'Propietarios', value: stats.owners, color: '#1d4ed8' },
      { label: 'Admins de edificio', value: stats.buildingAdmins, color: '#0f766e' },
      { label: 'Super admin', value: stats.superAdmins, color: '#b45309' }
    ].filter(s => s.value > 0);
  });

  roleTotal = computed(() => this.roleSlices().reduce((sum, s) => sum + s.value, 0));

  saasSlices = computed<Slice[]>(() => {
    const counts = { PAID: 0, PENDING: 0, OVERDUE: 0, OTHER: 0 };
    for (const admin of this.saasAdmins()) {
      const status = admin.currentPeriod?.status;
      if (status === 'PAID' || status === 'PENDING' || status === 'OVERDUE') counts[status] += 1;
      else counts.OTHER += 1;
    }
    return [
      { label: 'Al día', value: counts.PAID, color: '#0f766e' },
      { label: 'Pendiente', value: counts.PENDING, color: '#b45309' },
      { label: 'Vencido', value: counts.OVERDUE, color: '#be123c' },
      { label: 'Sin factura', value: counts.OTHER, color: '#94a3b8' }
    ].filter(s => s.value > 0);
  });

  saasTotal = computed(() => this.saasSlices().reduce((sum, s) => sum + s.value, 0));

  mrr = computed(() =>
    this.saasAdmins()
      .filter(a => a.includeInMetrics !== false && a.currentPeriod?.status !== 'INACTIVE')
      .reduce((sum, a) => sum + Number(a.billingConfig?.feeAmount || 0), 0)
  );

  openPortfolio = computed(() =>
    this.saasAdmins().reduce((sum, a) => sum + Number(a.openInvoices?.totalAmount || 0), 0)
  );

  chartCurrency = computed(() => {
    const totals = new Map<string, number>();
    for (const payment of this.payments()) {
      const code = payment.currency || 'USD';
      totals.set(code, (totals.get(code) || 0) + Number(payment.amount_paid || 0));
    }
    let best = 'USD';
    let max = -1;
    for (const [code, amount] of totals) {
      if (amount > max) {
        best = code;
        max = amount;
      }
    }
    return best;
  });

  monthSeries = computed(() => {
    const currency = this.chartCurrency();
    const now = new Date();
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const buckets = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: months[date.getMonth()],
        amount: 0
      };
    });
    for (const payment of this.payments()) {
      if ((payment.currency || 'USD') !== currency) continue;
      const date = new Date(payment.payment_date);
      if (Number.isNaN(date.getTime())) continue;
      const bucket = buckets.find(item => item.key === `${date.getUTCFullYear()}-${date.getUTCMonth()}`);
      if (bucket) bucket.amount += Number(payment.amount_paid || 0);
    }
    return buckets;
  });

  chartPoints = computed<MonthPoint[]>(() => {
    const rows = this.monthSeries();
    const max = Math.max(...rows.map(row => row.amount), 1);
    const width = 640;
    const height = 220;
    const padX = 36;
    const padY = 36;
    return rows.map((row, index) => ({
      label: row.label,
      amount: row.amount,
      x: padX + (index * (width - padX * 2)) / Math.max(rows.length - 1, 1),
      y: height - padY - (row.amount / max) * (height - padY * 2 - 12)
    }));
  });

  areaPath = computed(() => {
    const points = this.chartPoints();
    if (!points.length) return '';
    const line = points.map((point, index) => `${index ? 'L' : 'M'}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
    const last = points[points.length - 1];
    const first = points[0];
    return `${line} L${last.x.toFixed(1)},184 L${first.x.toFixed(1)},184 Z`;
  });

  linePath = computed(() =>
    this.chartPoints().map((point, index) => `${index ? 'L' : 'M'}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ')
  );

  topBuildings = computed(() => {
    const rows = [...this.buildings()]
      .sort((a, b) => Number(b.totalApartments || 0) - Number(a.totalApartments || 0))
      .slice(0, 6);
    const max = Math.max(...rows.map(row => Number(row.totalApartments || 0)), 1);
    return rows.map(row => ({
      name: row.name,
      complex: row.complexName || 'Sin conjunto',
      units: Number(row.totalApartments || 0),
      width: Math.max(4, (Number(row.totalApartments || 0) / max) * 100)
    }));
  });

  ngOnInit() {
    forkJoin({
      buildings: this.admin.getBuildings().pipe(catchError(() => of({ data: [] as AdminBuilding[] }))),
      users: this.admin.getUsers({ page: 1, limit: 1 }).pipe(catchError(() => of(null))),
      saas: this.saas.getDashboard().pipe(catchError(() => of({
        success: false,
        data: [] as SaaSAdmin[],
        stats: { collectedThisMonth: 0 }
      }))),
      payments: this.saas.getAllPaymentHistory().pipe(catchError(() => of({ success: false, data: [] as SaasPaymentRecord[] })))
    }).subscribe({
      next: ({ buildings, users, saas, payments }) => {
        this.buildings.set(buildings.data || []);
        this.userStats.set(users?.stats || null);
        this.saasAdmins.set(saas.data || []);
        this.collectedThisMonth.set(Number(saas.stats?.collectedThisMonth || 0));
        this.payments.set(payments.data || []);
        if (!buildings.data?.length && !users && !saas.data?.length) {
          this.loadError.set('No se pudieron cargar los indicadores.');
        }
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('No se pudieron cargar los indicadores.');
        this.loading.set(false);
      }
    });
  }

  arc(slices: Slice[], index: number): string {
    const total = slices.reduce((sum, slice) => sum + slice.value, 0) || 1;
    const radius = 54;
    const circ = 2 * Math.PI * radius;
    const length = (slices[index].value / total) * circ;
    const before = slices.slice(0, index).reduce((sum, slice) => sum + slice.value, 0);
    const offset = (before / total) * circ;
    return `${length} ${circ - length} ${-offset}`;
  }

  dash(slices: Slice[], index: number): string {
    const parts = this.arc(slices, index).split(' ');
    return `${parts[0]} ${parts[1]}`;
  }

  dashOffset(slices: Slice[], index: number): number {
    return Number(this.arc(slices, index).split(' ')[2]);
  }

  pct(value: number, total: number): number {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }
}
