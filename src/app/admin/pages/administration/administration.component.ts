import { animate, keyframes, style, transition, trigger } from '@angular/animations';
import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Router, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap, tap } from 'rxjs';

import { SaasService, SaaSAdmin } from '../../../core/services/saas.service';
import { AdminService } from '../../../core/services/admin.service';
import { ConfigSaasModalComponent } from '../../../modals/config-saas-modal/config-saas-modal.component';
import {
  RegisterSaasPaymentModalComponent
} from '../../../modals/register-saas-payment-modal/register-saas-payment-modal.component';
import { DateOnlyPipe } from '../../../shared/date-only.pipe';

function saasPaginatorLabels(): MatPaginatorIntl {
  const intl = new MatPaginatorIntl();
  intl.itemsPerPageLabel = 'Clientes por página';
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
  selector: 'app-administration',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    RouterLink,
    DateOnlyPipe
  ],
  providers: [{ provide: MatPaginatorIntl, useValue: saasPaginatorLabels() }],
  templateUrl: './administration.component.html',
  styleUrl: './administration.component.scss',
  animations: [
    trigger('statCardIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(22px) scale(0.94)' }),
        animate(
          '420ms {{ delay }}ms cubic-bezier(0.22, 1, 0.36, 1)',
          style({ opacity: 1, transform: 'translateY(0) scale(1)' })
        )
      ], { params: { delay: 0 } })
    ]),
    trigger('statValuePop', [
      transition('* => *', [
        animate(
          '320ms cubic-bezier(0.22, 1, 0.36, 1)',
          keyframes([
            style({ transform: 'scale(1)', opacity: 1, offset: 0 }),
            style({ transform: 'scale(1.12)', opacity: 0.92, offset: 0.45 }),
            style({ transform: 'scale(1)', opacity: 1, offset: 1 })
          ])
        )
      ])
    ])
  ]
})
export class AdministrationComponent implements OnInit {
  private saasService = inject(SaasService);
  private adminService = inject(AdminService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  adminsList = signal<SaaSAdmin[]>([]);
  collectedThisMonthFromApi = signal<number | null>(null);
  loading = signal(true);
  loadError = signal<string | null>(null);

  searchQuery = signal('');
  selectedStatus = signal<'ALL' | 'PAID' | 'PENDING' | 'OVERDUE'>('ALL');
  pageIndex = signal(0);
  pageSize = signal(10);

  displayedColumns = ['client', 'scope', 'plan', 'status', 'debt', 'amounts', 'actions'];

  filteredAdmins = computed(() => {
    let data = this.adminsList();

    if (this.selectedStatus() !== 'ALL') {
      data = data.filter((a) => a.currentPeriod.status === this.selectedStatus());
    }

    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      data = data.filter(
        (a) =>
          a.name.toLowerCase().includes(query) ||
          a.email.toLowerCase().includes(query) ||
          a.scopeName?.toLowerCase().includes(query)
      );
    }

    return this.sortByLastPayment(data);
  });

  paginatedAdmins = computed(() => {
    const rows = this.filteredAdmins();
    const start = this.pageIndex() * this.pageSize();
    return rows.slice(start, start + this.pageSize());
  });

  /** Clientes que sí entran en MRR / cobrado / por cobrar */
  billableAdmins = computed(() =>
    this.adminsList().filter((a) => this.includeInMetrics(a))
  );

  totalMRR = computed(() =>
    this.billableAdmins().reduce((acc, admin) => acc + admin.billingConfig.feeAmount, 0)
  );

  collectedThisMonth = computed(() => {
    const fromApi = this.collectedThisMonthFromApi();
    if (fromApi != null) return fromApi;
    return this.billableAdmins()
      .filter((a) => a.currentPeriod.status === 'PAID')
      .reduce((acc, admin) => acc + admin.billingConfig.feeAmount, 0);
  });

  pendingCollection = computed(() =>
    this.billableAdmins().reduce(
      (acc, admin) => acc + (admin.openInvoices?.totalAmount ?? 0),
      0
    )
  );

  clientCount = computed(() => this.adminsList().length);

  billableCount = computed(() => this.billableAdmins().length);

  testClientCount = computed(() =>
    this.adminsList().filter((a) => this.isTestClient(a)).length
  );

  overdueCount = computed(
    () =>
      this.billableAdmins().filter(
        (a) =>
          a.currentPeriod.status === 'OVERDUE' ||
          ((a.openInvoices?.count ?? 0) > 0 &&
            a.nextOpenInvoice?.status === 'OVERDUE')
      ).length
  );

  openInvoiceCount(admin: SaaSAdmin): number {
    return admin.openInvoices?.count ?? 0;
  }

  openInvoiceTotal(admin: SaaSAdmin): number {
    return admin.openInvoices?.totalAmount ?? 0;
  }

  canRegisterPayment(admin: SaaSAdmin): boolean {
    if (this.isTestClient(admin) && admin.hasSubscription === false) return false;
    return this.openInvoiceCount(admin) > 0;
  }

  nextInvoiceLabel(admin: SaaSAdmin): string | null {
    const n = admin.nextOpenInvoice;
    if (!n) return null;
    const mm = String(n.periodMonth).padStart(2, '0');
    return `${mm}/${n.periodYear}`;
  }

  lastPaymentSortKey(admin: SaaSAdmin): number {
    const raw = admin.lastPaymentDate;
    if (!raw) return 0;
    const m = String(raw).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return 0;
    return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }

  private sortByLastPayment(list: SaaSAdmin[]): SaaSAdmin[] {
    return [...list].sort((a, b) => {
      const diff = this.lastPaymentSortKey(b) - this.lastPaymentSortKey(a);
      if (diff !== 0) return diff;
      return a.name.localeCompare(b.name, 'es');
    });
  }

  statCards = computed(() => [
    {
      id: 'mrr',
      variant: 'teal',
      icon: 'trending_up',
      chip: 'MRR',
      chipClass: '',
      label: 'Ingreso recurrente',
      value: this.totalMRR(),
      sub: 'Solo activos (sin testing/inactivos)',
      isMoney: true
    },
    {
      id: 'collected',
      variant: 'emerald',
      icon: 'price_check',
      chip: 'Cobrado',
      chipClass: 'stat-card__chip--ok',
      label: 'Cobrado este mes',
      value: this.collectedThisMonth(),
      sub: null,
      isMoney: true
    },
    {
      id: 'pending',
      variant: 'amber',
      icon: 'pending_actions',
      chip: 'Por cobrar',
      chipClass: 'stat-card__chip--warn',
      label: 'Pendiente + mora',
      value: this.pendingCollection(),
      sub: null,
      isMoney: true
    },
    {
      id: 'clients',
      variant: 'slate',
      icon: 'groups',
      chip: 'Cartera',
      chipClass: '',
      label: 'Clientes en cartera',
      value: this.clientCount(),
      sub: `${this.billableCount()} facturables · ${this.testClientCount()} testing`,
      isMoney: false
    }
  ]);

  ngOnInit(): void {
    this.loadDashboard();
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.pageIndex.set(0);
  }

  onStatusChange(value: 'ALL' | 'PAID' | 'PENDING' | 'OVERDUE'): void {
    this.selectedStatus.set(value);
    this.pageIndex.set(0);
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedStatus.set('ALL');
    this.pageIndex.set(0);
  }

  accountStatus(admin: SaaSAdmin): string {
    return admin.accountStatus || 'ACTIVE';
  }

  isTestClient(admin: SaaSAdmin): boolean {
    if (admin.isTestAccount) return true;
    const e = (admin.email || '').trim().toLowerCase();
    return e === 'edificio1@condomanager.com' || e.endsWith('@condomanager.com');
  }

  includeInMetrics(admin: SaaSAdmin): boolean {
    if (admin.includeInMetrics === false) return false;
    if (admin.includeInMetrics === true) return true;
    return this.accountStatus(admin) === 'ACTIVE' && !this.isTestClient(admin);
  }

  toggleAccountStatus(admin: SaaSAdmin): void {
    const current = this.accountStatus(admin);
    const next = current === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const verb = next === 'ACTIVE' ? 'activar' : 'suspender';
    const ok = confirm(
      `¿${verb.charAt(0).toUpperCase() + verb.slice(1)} la cuenta de "${admin.name}" (#${admin.id})?\n\nAfecta el acceso al panel (users.status).`
    );
    if (!ok) return;

    this.adminService.updateStatus(admin.id, next).subscribe({
      next: () => {
        this.snackBar.open(
          `Cuenta ${next === 'ACTIVE' ? 'activada' : 'suspendida'}`,
          'Cerrar',
          { duration: 3000 }
        );
        this.loadDashboard();
      },
      error: () =>
        this.snackBar.open('No se pudo actualizar el estado del usuario', 'Cerrar', {
          duration: 3000
        })
    });
  }

  openClientHistory(admin: SaaSAdmin): void {
    this.router.navigate(['/admin/administration/history'], {
      queryParams: { adminId: admin.id }
    });
  }

  periodStatusLabel(status: string): string {
    switch (status) {
      case 'PAID':
        return 'Solvente';
      case 'PENDING':
        return 'Pendiente';
      case 'OVERDUE':
        return 'En mora';
      case 'INACTIVE':
        return 'Sin periodo (inactivo)';
      case 'NONE':
        return 'Sin factura del mes';
      default:
        return status;
    }
  }

  totalInvoiceCount(admin: SaaSAdmin): number {
    return admin.totalInvoices ?? 0;
  }

  debtDisplay(admin: SaaSAdmin): {
    kind: 'open' | 'ok' | 'muted';
    label: string;
  } {
    if (this.openInvoiceCount(admin) > 0) {
      return { kind: 'open', label: '' };
    }
    if (this.accountStatus(admin) !== 'ACTIVE') {
      return { kind: 'muted', label: 'Sin cobranza (inactivo)' };
    }
    if (this.isTestClient(admin) && admin.hasSubscription === false) {
      return { kind: 'muted', label: 'Testing — sin facturación' };
    }
    if (this.totalInvoiceCount(admin) === 0) {
      if (admin.totalInvoices === undefined && admin.lastPaymentDate) {
        return { kind: 'ok', label: 'Al día' };
      }
      return { kind: 'muted', label: 'Sin facturas emitidas' };
    }
    return { kind: 'ok', label: 'Al día' };
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.saasService
      .getDashboard()
      .pipe(
        tap((res) => {
          if (res.success && res.stats?.collectedThisMonth != null) {
            this.collectedThisMonthFromApi.set(res.stats.collectedThisMonth);
          } else {
            this.collectedThisMonthFromApi.set(null);
          }
        }),
        switchMap((res) => {
          const base = res.success ? (res.data ?? []) : [];
          return this.attachMissingTestAdmins(base);
        }),
        catchError(() => {
          this.loadError.set('No se pudo cargar la cartera SaaS. Intenta de nuevo.');
          this.collectedThisMonthFromApi.set(null);
          this.snackBar.open('Error al conectar con la base de datos', 'Cerrar', {
            duration: 3000
          });
          return of([] as SaaSAdmin[]);
        })
      )
      .subscribe({
        next: (merged) => {
          this.adminsList.set(this.sortByLastPayment(merged));
          this.loading.set(false);
        }
      });
  }

  /** edificio1@condomanager.com suele existir en users pero no en saas_subscriptions */
  private attachMissingTestAdmins(list: SaaSAdmin[]) {
    const hasDemo = list.some(
      (a) => a.email?.trim().toLowerCase() === 'edificio1@condomanager.com'
    );
    if (hasDemo) {
      return of(list);
    }

    return this.adminService
      .getUsers({ search: 'edificio1@condomanager.com', limit: 10 })
      .pipe(
        map((res) => {
          const extra: SaaSAdmin[] = [];
          for (const u of res.data ?? []) {
            if (u.role !== 'BUILDING_ADMIN') continue;
            const email = String(u.email || '').trim().toLowerCase();
            if (email !== 'edificio1@condomanager.com' && !email.endsWith('@condomanager.com')) {
              continue;
            }
            if (list.some((a) => a.id === u.id)) continue;
            extra.push(this.userRowToTestSaasAdmin(u));
          }
          return this.sortByLastPayment([...list, ...extra]);
        }),
        catchError(() => of(list))
      );
  }

  private userRowToTestSaasAdmin(u: {
    id: number;
    name: string;
    email: string;
    status?: string;
    buildingName?: string | null;
  }): SaaSAdmin {
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      accountStatus: u.status || 'ACTIVE',
      isTestAccount: true,
      includeInMetrics: false,
      hasSubscription: false,
      scope: 'SINGLE',
      scopeName: u.buildingName || 'Cuenta demo / pruebas',
      billingConfig: {
        feeAmount: 0,
        currency: 'USD',
        localCurrency: 'BS',
        exchangeRate: 1
      },
      currentPeriod: {
        month: new Date()
          .toLocaleString('es-ES', { month: 'long', year: 'numeric' })
          .toUpperCase(),
        status: 'PAID'
      },
      totalInvoices: 0
    };
  }

  openConfigModal(admin: SaaSAdmin): void {
    const dialogRef = this.dialog.open(ConfigSaasModalComponent, {
      width: '450px',
      disableClose: true,
      data: admin
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;
      const payload = {
        admin_id: admin.id,
        fee_amount: result.feeAmount,
        currency: result.currency,
        local_currency: admin.billingConfig.localCurrency || 'BS',
        due_days: result.dueDays
      };

      this.saasService.updateSubscription(payload).subscribe({
        next: () => {
          this.snackBar.open('Configuración actualizada correctamente', 'Cerrar', { duration: 3000 });
          this.loadDashboard();
        },
        error: () =>
          this.snackBar.open('Error al actualizar la configuración', 'Cerrar', { duration: 3000 })
      });
    });
  }

  registerSaaSPayment(admin: SaaSAdmin): void {
    const dialogRef = this.dialog.open(RegisterSaasPaymentModalComponent, {
      width: '520px',
      maxWidth: '95vw',
      disableClose: true,
      data: admin
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;

      this.saasService
        .registerPayment({
          admin_id: admin.id,
          invoice_id: result.invoice_id,
          amount_paid: result.amount_paid,
          payment_method: result.payment_method,
          reference_number: result.reference_number,
          payment_date: result.payment_date,
          notes: result.notes
        })
        .subscribe({
          next: (res) => {
            this.snackBar.open(
              res.message || 'Pago registrado con éxito',
              'Cerrar',
              { duration: 5000 }
            );
            this.loadDashboard();
          },
          error: (err) =>
            this.snackBar.open(
              err.error?.message || 'Error al procesar el pago',
              'Cerrar',
              { duration: 5000 }
            )
        });
    });
  }

}
