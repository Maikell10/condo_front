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

import { SaasService, SaaSAdmin } from '../../../core/services/saas.service';
import { ConfigSaasModalComponent } from '../../../modals/config-saas-modal/config-saas-modal.component';

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
    MatPaginatorModule
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
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  adminsList = signal<SaaSAdmin[]>([]);
  loading = signal(true);
  loadError = signal<string | null>(null);

  searchQuery = signal('');
  selectedStatus = signal<'ALL' | 'PAID' | 'PENDING' | 'OVERDUE'>('ALL');
  pageIndex = signal(0);
  pageSize = signal(10);

  displayedColumns = ['client', 'scope', 'plan', 'status', 'amounts', 'actions'];

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

    return data;
  });

  paginatedAdmins = computed(() => {
    const rows = this.filteredAdmins();
    const start = this.pageIndex() * this.pageSize();
    return rows.slice(start, start + this.pageSize());
  });

  totalMRR = computed(() =>
    this.adminsList().reduce((acc, admin) => acc + admin.billingConfig.feeAmount, 0)
  );

  collectedThisMonth = computed(() =>
    this.adminsList()
      .filter((a) => a.currentPeriod.status === 'PAID')
      .reduce((acc, admin) => acc + admin.billingConfig.feeAmount, 0)
  );

  pendingCollection = computed(() =>
    this.adminsList()
      .filter((a) => a.currentPeriod.status !== 'PAID')
      .reduce((acc, admin) => acc + admin.billingConfig.feeAmount, 0)
  );

  clientCount = computed(() => this.adminsList().length);

  overdueCount = computed(
    () => this.adminsList().filter((a) => a.currentPeriod.status === 'OVERDUE').length
  );

  statCards = computed(() => [
    {
      id: 'mrr',
      variant: 'teal',
      icon: 'trending_up',
      chip: 'MRR',
      chipClass: '',
      label: 'Ingreso recurrente',
      value: this.totalMRR(),
      sub: 'Suma de tarifas mensuales',
      isMoney: true
    },
    {
      id: 'collected',
      variant: 'emerald',
      icon: 'price_check',
      chip: 'Cobrado',
      chipClass: 'stat-card__chip--ok',
      label: 'Este mes (solventes)',
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
      label: 'Clientes activos',
      value: this.clientCount(),
      sub: this.overdueCount() ? `${this.overdueCount()} en mora` : 'Sin mora',
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

  periodStatusLabel(status: string): string {
    switch (status) {
      case 'PAID':
        return 'Solvente';
      case 'PENDING':
        return 'Pendiente';
      case 'OVERDUE':
        return 'En mora';
      default:
        return status;
    }
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.saasService.getDashboard().subscribe({
      next: (res) => {
        if (res.success) {
          this.adminsList.set(res.data ?? []);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set('No se pudo cargar la cartera SaaS. Intenta de nuevo.');
        this.snackBar.open('Error al conectar con la base de datos', 'Cerrar', { duration: 3000 });
      }
    });
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
    const confirmPayment = confirm(
      `¿Confirmas que recibiste el pago de ${admin.billingConfig.feeAmount} ${admin.billingConfig.currency} de ${admin.name}?`
    );

    if (!confirmPayment) return;

    const payload = {
      admin_id: admin.id,
      amount_paid: admin.billingConfig.feeAmount,
      payment_method: 'Zelle / Transferencia',
      reference_number: `REF-${Date.now()}`,
      payment_date: new Date().toISOString().split('T')[0],
      notes: 'Pago registrado desde el Dashboard SaaS'
    };

    this.saasService.registerPayment(payload).subscribe({
      next: () => {
        this.snackBar.open('Pago registrado con éxito', 'Cerrar', { duration: 3000 });
        this.loadDashboard();
      },
      error: (err) => alert(err.error?.message || 'Error al procesar el pago')
    });
  }

  openHistoryModal(admin: SaaSAdmin): void {
    this.saasService.getPaymentHistory(admin.id).subscribe({
      next: (res) => {
        console.log(`Historial de ${admin.name}:`, res.data);
        alert(
          `Se encontraron ${res.data.length} pagos en el historial. Revisa la consola para detalles.`
        );
      }
    });
  }
}
