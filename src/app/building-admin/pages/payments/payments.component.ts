import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { PaymentService } from '../../../core/services/payment.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

// 🔥 Agregamos los módulos necesarios para los filtros
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';

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
    MatFormFieldModule, // <-- Módulos de filtros
    MatInputModule,
    MatSelectModule,
    MatDividerModule
  ],
  templateUrl: './payments.component.html',
})
export class PaymentsComponent implements OnInit {
  private paymentService = inject(PaymentService);

  // La data original (Intacta)
  payments = signal<any[]>([]);
  displayedColumns = ['apartment', 'owner', 'amount', 'date', 'status', 'method', 'actions'];

  // 🔥 1. SEÑALES PARA LOS FILTROS
  searchQuery = signal('');
  selectedStatus = signal('ALL');

  // 🔥 2. COMPUTED PARA LA TABLA (Este es el que alimenta el HTML)
  filteredPayments = computed(() => {
    let data = this.payments();
    const status = this.selectedStatus();
    const query = this.searchQuery();

    // Filtro por Estado (Dropdown)
    if (status !== 'ALL') {
      data = data.filter(p => p.status === status);
    }

    // Filtro por Texto (Buscador)
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

  // KPIs (Se calculan sobre 'payments' original para no perder totales al filtrar)
  paidCount = computed(() => this.payments().filter(p => p.status === 'APPROVED').length);
  pendingCount = computed(() => this.payments().filter(p => p.status === 'PENDING_APPROVAL').length);

  totalCollected = computed(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return this.payments().reduce((acc, p) => {
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

  // 🔥 3. FUNCIONES DE EVENTOS DISPARADAS DESDE EL HTML
  applySearch(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchQuery.set(filterValue.trim().toLowerCase());
  }

  applyStatusFilter(status: string) {
    this.selectedStatus.set(status);
  }
}