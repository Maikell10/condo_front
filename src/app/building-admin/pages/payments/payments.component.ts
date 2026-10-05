import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { DecimalPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService } from '../../../core/services/payment.service';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DateOnlyPipe } from '../../../shared/date-only.pipe';
import {
  ConfirmActionDialogComponent,
  ConfirmActionDialogData
} from '../../../shared/confirm-action-dialog/confirm-action-dialog.component';

function spanishPaginator(): MatPaginatorIntl {
  const intl = new MatPaginatorIntl();
  intl.itemsPerPageLabel = 'Pagos por página';
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
  selector: 'app-payments-admin',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDividerModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatDialogModule,
    DecimalPipe,
    NgClass,
    DateOnlyPipe
  ],
  providers: [{ provide: MatPaginatorIntl, useValue: spanishPaginator() }],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.scss'
})
export class PaymentsComponent implements OnInit {
  private paymentService = inject(PaymentService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  payments = signal<any[]>([]);
  loading = signal(false);

  searchQuery = signal('');
  selectedStatus = signal('ALL');
  pageIndex = signal(0);
  pageSize = signal(20);

  displayedColumns = [
    'apartment',
    'owner',
    'amount',
    'date',
    'status',
    'method',
    'actions'
  ];

  filteredPayments = computed(() => {
    let data = this.payments();
    const status = this.selectedStatus();
    const query = this.searchQuery().trim().toLowerCase();

    if (status !== 'ALL') {
      data = data.filter((p) => p.status === status);
    }

    if (query) {
      data = data.filter((p) => {
        const apt = String(p.apartment ?? '').toLowerCase();
        const building = String(p.buildingName ?? '').toLowerCase();
        const owner = String(p.ownerName ?? '').toLowerCase();
        const ref = String(p.reference ?? '').toLowerCase();
        return (
          apt.includes(query) ||
          building.includes(query) ||
          owner.includes(query) ||
          ref.includes(query)
        );
      });
    }

    return data;
  });

  pagedPayments = computed(() => {
    const rows = this.filteredPayments();
    const size = this.pageSize();
    const maxPage = Math.max(0, Math.ceil(rows.length / size) - 1);
    const page = Math.min(this.pageIndex(), maxPage);
    return rows.slice(page * size, page * size + size);
  });

  paidCount = computed(
    () => this.payments().filter((p) => p.status === 'APPROVED').length
  );
  pendingCount = computed(
    () => this.payments().filter((p) => p.status === 'PENDING_APPROVAL').length
  );
  rejectedCount = computed(
    () => this.payments().filter((p) => p.status === 'REJECTED').length
  );

  totalCollected = computed(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return this.payments().reduce((acc, p) => {
      const paymentDate = new Date(p.date || p.payment_date);
      const isApproved = p.status === 'APPROVED';
      const isThisMonth =
        paymentDate.getMonth() === currentMonth &&
        paymentDate.getFullYear() === currentYear;

      if (isApproved && isThisMonth) {
        return acc + Number(p.amount);
      }
      return acc;
    }, 0);
  });

  statCards = computed(() => [
    {
      id: 'month',
      variant: 'emerald',
      icon: 'payments',
      chip: 'Recaudación del mes',
      value: `$${this.totalCollected().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: 'Pagos aprobados en el calendario'
    },
    {
      id: 'verified',
      variant: 'blue',
      icon: 'verified_user',
      chip: 'Verificados',
      value: String(this.paidCount()),
      sub: 'Histórico aprobado'
    },
    {
      id: 'pending',
      variant: 'amber',
      icon: 'pending_actions',
      chip: 'Cola',
      value: String(this.pendingCount()),
      sub: 'Por revisar'
    },
    {
      id: 'view',
      variant: 'indigo',
      icon: 'filter_alt',
      chip: 'Vista',
      value: String(this.filteredPayments().length),
      sub: `De ${this.payments().length} registros`
    }
  ]);

  ngOnInit() {
    this.loadPayments();
  }

  loadPayments() {
    this.loading.set(true);
    this.paymentService.getBuildingPayments().subscribe({
      next: (res) => {
        this.payments.set(res.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('No se pudo cargar la lista de pagos', 'Cerrar', {
          duration: 4000,
          horizontalPosition: 'end',
          verticalPosition: 'bottom'
        });
      }
    });
  }

  refreshList() {
    this.loadPayments();
  }

  onSearchChange(value: string) {
    this.searchQuery.set(value);
    this.pageIndex.set(0);
  }

  onStatusChange(status: string) {
    this.selectedStatus.set(status);
    this.pageIndex.set(0);
  }

  onPage(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  paymentDate(p: { date?: string; payment_date?: string }): string {
    return p.date || p.payment_date || '';
  }

  approve(p: { id: number; apartment?: string; buildingName?: string; ownerName?: string; amount?: number; reference?: string }) {
    this.openConfirm({
      variant: 'approve',
      title: '¿Verificar este pago?',
      message:
        'Al aprobar, el saldo del propietario se actualizará. Esta acción no se puede deshacer.',
      confirmLabel: 'Sí, verificar',
      cancelLabel: 'Volver',
      highlights: this.paymentHighlights(p)
    }).subscribe((confirmed) => {
      if (!confirmed) return;
      this.paymentService.approvePayment(p.id).subscribe({
        next: () => {
          this.snackBar.open('Pago verificado y procesado con éxito', 'Cerrar', {
            duration: 4000,
            horizontalPosition: 'end',
            verticalPosition: 'bottom'
          });
          this.loadPayments();
        },
        error: (err) => {
          this.snackBar.open('Hubo un error al verificar el pago', 'Cerrar', {
            duration: 4000,
            horizontalPosition: 'end',
            verticalPosition: 'bottom'
          });
          console.error('Error aprobando pago:', err);
        }
      });
    });
  }

  reject(p: { id: number; apartment?: string; buildingName?: string; ownerName?: string; amount?: number; reference?: string }) {
    this.openConfirm({
      variant: 'reject',
      title: '¿Rechazar este pago?',
      message:
        'El propietario verá que su transferencia fue rechazada y la deuda seguirá pendiente.',
      confirmLabel: 'Sí, rechazar',
      cancelLabel: 'Cancelar',
      highlights: this.paymentHighlights(p)
    }).subscribe((confirmed) => {
      if (!confirmed) return;
      this.paymentService.rejectPayment(p.id).subscribe({
        next: () => {
          this.snackBar.open('Pago rechazado', 'Cerrar', {
            duration: 4000,
            horizontalPosition: 'end',
            verticalPosition: 'bottom'
          });
          this.loadPayments();
        },
        error: (err) => {
          this.snackBar.open('Error al rechazar el pago', 'Cerrar', {
            duration: 4000,
            horizontalPosition: 'end',
            verticalPosition: 'bottom'
          });
          console.error('Error rechazando pago:', err);
        }
      });
    });
  }

  private openConfirm(data: ConfirmActionDialogData) {
    return this.dialog
      .open(ConfirmActionDialogComponent, {
        width: '440px',
        maxWidth: '95vw',
        panelClass: 'premium-confirm-dialog',
        autoFocus: 'dialog',
        data
      })
      .afterClosed();
  }

  private paymentHighlights(p: {
    apartment?: string | number;
    buildingName?: string;
    ownerName?: string;
    amount?: number;
    reference?: string;
  }): string[] {
    const lines: string[] = [];
    const unit = this.unitLabel(p);
    if (unit) lines.push(`Unidad: ${unit}`);
    if (p.ownerName) lines.push(`Propietario: ${p.ownerName}`);
    if (p.amount != null && !Number.isNaN(Number(p.amount))) {
      lines.push(`Monto: $${Number(p.amount).toFixed(2)}`);
    }
    if (p.reference) lines.push(`Referencia: ${p.reference}`);
    return lines;
  }

  hasExchange(p: any): boolean {
    const rate = Number(p.exchange_rate || p.exchangeRate);
    return !isNaN(rate) && rate > 1;
  }

  getRate(p: any): number {
    return Number(p.exchange_rate || p.exchangeRate);
  }

  getLocalAmount(p: any): number {
    return Number(p.amount_local || p.amountLocal);
  }

  /** Tipo de transferencia o banco; no mostrar IDs crudos de cuenta (ej. "8"). */
  transferDetail(p: {
    method?: string;
    operationType?: string;
    operation_type?: string;
    bankName?: string;
    bank_name?: string;
  }): string | null {
    const op = String(p.operationType ?? p.operation_type ?? '').toLowerCase();
    if (op.includes('same_bank')) return 'Mismo banco';
    if (op.includes('other_bank')) return 'Otro banco';
    if (op.includes('cash')) return 'Efectivo';

    const method = String(p.method ?? '').trim();
    if (method.includes('same_bank')) return 'Mismo banco';
    if (method.includes('other_bank')) return 'Otro banco';
    if (method.includes('cash')) return 'Efectivo';

    const bankLabel = p.bankName || p.bank_name;
    if (bankLabel) return String(bankLabel);

    if (/^\d+$/.test(method)) {
      return null;
    }

    if (!method) return 'Transferencia';
    return method;
  }

  statusLabel(status: string): string {
    if (status === 'APPROVED') return 'Verificado';
    if (status === 'REJECTED') return 'Rechazado';
    return 'Por revisar';
  }

  statusClass(status: string): string {
    if (status === 'APPROVED') return 'status-pill--approved';
    if (status === 'REJECTED') return 'status-pill--rejected';
    return 'status-pill--pending';
  }

  statusIcon(status: string): string {
    if (status === 'APPROVED') return 'done_all';
    if (status === 'REJECTED') return 'cancel';
    return 'hourglass_empty';
  }

  /** Separa edificio y apto para formar etiqueta tipo 1C-44. */
  unitDisplay(p: {
    apartment?: string | number;
    buildingName?: string;
  }): { number: string; building: string } {
    const building = String(p.buildingName ?? '').trim();
    let apt = String(p.apartment ?? '').trim();

    if (building && apt) {
      const prefix = `${building}-`;
      if (apt.toLowerCase().startsWith(prefix.toLowerCase())) {
        apt = apt.slice(prefix.length);
      }
      return { number: apt, building };
    }

    const dash = apt.indexOf('-');
    if (dash > 0) {
      return {
        building: apt.slice(0, dash).trim(),
        number: apt.slice(dash + 1).trim()
      };
    }

    return { number: apt, building };
  }

  unitLabel(p: { apartment?: string | number; buildingName?: string }): string {
    const { number, building } = this.unitDisplay(p);
    if (building && number) return `${building}-${number}`;
    return number || building || 'Unidad';
  }
}
