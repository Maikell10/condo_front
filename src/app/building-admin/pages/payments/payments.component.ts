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
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatChipsModule
  ],
  templateUrl: './payments.component.html',
})
export class PaymentsComponent implements OnInit {
  private paymentService = inject(PaymentService);

  payments = signal<any[]>([]);
  displayedColumns = ['apartment', 'owner', 'amount', 'date', 'status', 'method', 'actions'];

  // KPIs
  paidCount = computed(() => this.payments().filter(p => p.status === 'APPROVED').length);
  pendingCount = computed(() => this.payments().filter(p => p.status === 'PENDING_APPROVAL').length);

  // 🔥 CORRECCIÓN: Filtra por estado APROBADO y que pertenezca al MES ACTUAL
  totalCollected = computed(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return this.payments().reduce((acc, p) => {
      // Necesitamos convertir la fecha que viene de Node (ej. "2026-06-14") a un objeto Date
      const paymentDate = new Date(p.date);

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
    this.paymentService.approvePayment(id).subscribe(() => {
      alert('Pago verificado con éxito');
      this.loadPayments();
    });
  }
}