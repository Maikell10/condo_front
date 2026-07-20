import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { PaymentService } from '../../../core/services/payment.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-payments-admin',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDividerModule,
    MatSnackBarModule
  ],
  templateUrl: './payments.component.html',
})
export class PaymentsComponent implements OnInit {
  private paymentService = inject(PaymentService);
  private snackBar = inject(MatSnackBar);

  payments = signal<any[]>([]);
  displayedColumns = ['apartment', 'owner', 'amount', 'date', 'status', 'method', 'actions'];

  searchQuery = signal('');
  selectedStatus = signal('ALL');

  filteredPayments = computed(() => {
    let data = this.payments();
    const status = this.selectedStatus();
    const query = this.searchQuery();

    if (status !== 'ALL') {
      data = data.filter(p => p.status === status);
    }

    if (query) {
      data = data.filter(p =>
        p.apartment?.toString().toLowerCase().includes(query) ||
        p.buildingName?.toLowerCase().includes(query) ||
        p.ownerName?.toLowerCase().includes(query) ||
        p.reference?.toLowerCase().includes(query)
      );
    }

    return data;
  });

  paidCount = computed(() => this.payments().filter(p => p.status === 'APPROVED').length);
  pendingCount = computed(() => this.payments().filter(p => p.status === 'PENDING_APPROVAL').length);

  totalCollected = computed(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return this.payments().reduce((acc, p) => {
      const paymentDate = new Date(p.date || p.payment_date); // Tolerancia a formatos
      const isApproved = p.status === 'APPROVED';
      const isThisMonth = paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;

      if (isApproved && isThisMonth) {
        return acc + Number(p.amount);
      }
      return acc;
    }, 0);
  });

  ngOnInit() { this.loadPayments(); }

  loadPayments() {
    this.paymentService.getBuildingPayments().subscribe(res => this.payments.set(res.data));
  }

  approve(id: number) {
    // Cuadro de confirmación antes de disparar el backend
    const confirmacion = window.confirm(
      '¿Estás seguro de verificar y aprobar este pago?\n\nAl hacerlo, el saldo del propietario se actualizará y esta acción no se puede deshacer.'
    );

    if (confirmacion) {
      this.paymentService.approvePayment(id).subscribe({
        next: () => {
          // Toast elegante de éxito
          this.snackBar.open('✅ Pago verificado y procesado con éxito', 'Cerrar', {
            duration: 4000, // Desaparece en 4 segundos
            horizontalPosition: 'end', // Aparece a la derecha
            verticalPosition: 'bottom', // Aparece abajo
          });

          this.loadPayments(); // Recargamos la tabla
        },
        error: (err) => {
          // Toast elegante de error
          this.snackBar.open('❌ Hubo un error al verificar el pago', 'Cerrar', {
            duration: 4000,
            horizontalPosition: 'end',
            verticalPosition: 'bottom',
          });
          console.error('Error aprobando pago:', err);
        }
      });
    }
  }

  applySearch(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchQuery.set(filterValue.trim().toLowerCase());
  }

  applyStatusFilter(status: string) {
    this.selectedStatus.set(status);
  }

  // 🔥 NUEVAS FUNCIONES AUXILIARES PARA EL RENDERIZADO BIMONETARIO Y VISUAL

  // Determina si debemos mostrar los datos en Bolívares (Tasa distinta a 1)
  hasExchange(p: any): boolean {
    const rate = Number(p.exchange_rate || p.exchangeRate);
    return !isNaN(rate) && rate > 1; // Si es mayor a 1, es una tasa real
  }

  getRate(p: any): number {
    return Number(p.exchange_rate || p.exchangeRate);
  }

  getLocalAmount(p: any): number {
    return Number(p.amount_local || p.amountLocal);
  }

  // Limpia el nombre del método de pago para que no se vea feo el "same_bank"
  formatMethod(method: string): string {
    if (!method) return 'Transferencia';
    if (method.includes('same_bank')) return 'Mismo Banco';
    if (method.includes('other_bank')) return 'Otro Banco';
    return method;
  }
}