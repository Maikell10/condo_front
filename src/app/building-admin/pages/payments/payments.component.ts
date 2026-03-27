import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { PaymentService } from '../../../core/services/payment.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-payments-admin',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,   // Necesario para mat-table, matHeaderRowDef, etc.
    MatIconModule,    // Necesario para mat-icon
    MatButtonModule,  // Para los botones de acción
    MatTooltipModule, // Para el texto flotante al pasar el mouse
    MatChipsModule    // Para los estados (Pagado/Pendiente)
  ],
  templateUrl: './payments.component.html',
})
export class PaymentsComponent implements OnInit {
  private paymentService = inject(PaymentService);

  payments = signal<any[]>([]);
  displayedColumns = ['apartment', 'owner', 'amount', 'date', 'status', 'method', 'actions'];

  // KPIs calculados automáticamente mediante Signals
  paidCount = computed(() => this.payments().filter(p => p.status === 'APPROVED').length);
  pendingCount = computed(() => this.payments().filter(p => p.status === 'PENDING_APPROVAL').length);
  totalCollected = computed(() =>
    this.payments().filter(p => p.status === 'APPROVED')
      .reduce((acc, p) => acc + Number(p.amount), 0)
  );

  ngOnInit() { this.loadPayments(); }

  loadPayments() {
    this.paymentService.getBuildingPayments().subscribe(res => this.payments.set(res.data));
  }

  approve(id: number) {
    this.paymentService.approvePayment(id).subscribe(() => {
      alert('Pago verificado con éxito');
      this.loadPayments(); // Recarga y actualiza KPIs automáticamente
    });
  }
}