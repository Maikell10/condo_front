import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE, NativeDateAdapter, DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';

import { BillingService } from '../../../core/services/billing.service';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { AdminPaymentModalComponent } from '../../modal/admin-payment-modal/admin-payment-modal.component';

class CustomDateAdapter extends NativeDateAdapter {
  override format(date: Date, displayFormat: Object): string {
    if (displayFormat === 'input') {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
    return super.format(date, displayFormat);
  }
}

@Component({
  selector: 'app-statements',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatCardModule, MatButtonModule,
    MatIconModule, MatSelectModule, MatTooltipModule, MatDividerModule,
    MatInputModule, MatFormFieldModule, MatDatepickerModule, MatNativeDateModule,
    FormsModule, ReactiveFormsModule
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' },
    { provide: DateAdapter, useClass: CustomDateAdapter },
    {
      provide: MAT_DATE_FORMATS,
      useValue: {
        parse: { dateInput: 'input' },
        display: { dateInput: 'input', monthYearLabel: 'shortMonths', dateA11yLabel: 'input', monthYearA11yLabel: 'shortMonths' }
      }
    }
  ],
  templateUrl: './statements.component.html'
})
export class StatementsComponent implements OnInit {
  private billingService = inject(BillingService);
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private dialog = inject(MatDialog);

  isComplex = computed(() => !!this.authService.userSignal()?.complexId);
  buildingsList = signal<any[]>([]);
  selectedBuildingId = signal<number | 'ALL'>('ALL');

  receipts = signal<any[]>([]);

  searchQuery = signal<string>('');
  filterMode = signal<'description' | 'date'>('description');
  selectedDescription = signal<string>('ALL');
  selectedStatus = signal<'ALL' | 'PAID' | 'PENDING' | 'PARTIAL'>('ALL');

  dateRange = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null)
  });
  startDate = signal<Date | null>(null);
  endDate = signal<Date | null>(null);

  uniqueDescriptions = computed(() => {
    const all = this.receipts().map(r => r.description).filter(Boolean);
    return [...new Set(all)];
  });

  displayedColumns = computed(() => {
    const baseCols = ['issueDate', 'apartment', 'ownerName', 'description', 'amount', 'paid', 'balance', 'status', 'actions'];
    if (this.isComplex() && this.selectedBuildingId() === 'ALL') {
      return ['buildingName', ...baseCols];
    }
    return baseCols;
  });

  filteredReceipts = computed(() => {
    let data = this.receipts().map(r => {
      // 1. Matemática de centavos para evitar arrastre de decimales fantasma
      const amountCents = Math.round(Number(r.amount || 0) * 100);
      const paidCents = Math.round(Number(r.paid || 0) * 100);
      const balanceCents = amountCents - paidCents;

      const amount = amountCents / 100;
      const paid = paidCents / 100;
      const balance = balanceCents / 100;

      let status = r.status;
      if (balanceCents <= 0) {
        status = 'PAID';
      } else if (paidCents > 0) {
        status = 'PARTIAL';
      }

      return { ...r, amount, paid, balance, status };
    });

    const currentStatus = this.selectedStatus();
    if (currentStatus !== 'ALL') {
      data = data.filter(r => r.status === currentStatus);
    }

    if (this.filterMode() === 'description') {
      const desc = this.selectedDescription();
      if (desc !== 'ALL') {
        data = data.filter(r => r.description === desc);
      }
    } else if (this.filterMode() === 'date') {
      const start = this.startDate();
      const end = this.endDate();
      if (start && end) {
        const endOfDay = new Date(end);
        endOfDay.setHours(23, 59, 59, 999);

        data = data.filter(r => {
          const pDate = r.payment_date || r.paymentDate;
          const targetDateToFilter = pDate ? pDate : r.issueDate;

          if (!targetDateToFilter) return false;

          const dateString = targetDateToFilter.split('T')[0];
          const parts = dateString.split('-');
          const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));

          return d >= start && d <= endOfDay;
        });
      }
    }

    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      data = data.filter(r =>
        r.apartment?.toString().toLowerCase().includes(q) ||
        r.ownerName?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
      );
    }

    return data;
  });

  // --- FUNCIÓN AUXILIAR DE SUMA EXACTA ---
  private sumExact(data: any[], field: string): number {
    const sumInCents = data.reduce((acc, item) => {
      return acc + Math.round(Number(item[field] || 0) * 100);
    }, 0);
    return sumInCents / 100;
  }

  // --- KPIs CALCULADOS CON EXACTITUD ---
  totalExpected = computed(() => this.sumExact(this.filteredReceipts(), 'amount'));
  totalCollected = computed(() => this.sumExact(this.filteredReceipts(), 'paid'));
  totalPending = computed(() => this.sumExact(this.filteredReceipts(), 'balance'));

  collectionRate = computed(() => {
    const expected = this.totalExpected();
    if (expected === 0) return 0;
    return Math.round((this.totalCollected() / expected) * 100);
  });

  ngOnInit() {
    this.initView();
  }

  initView() {
    const user = this.authService.userSignal();
    if (user?.complexId) {
      this.dashboardService.getBuildingsByComplex().subscribe({
        next: (res: any) => {
          this.buildingsList.set(res.data);
          this.selectedBuildingId.set('ALL');
          this.loadStatements();
        }
      });
    } else if (user?.buildingId) {
      this.selectedBuildingId.set(Number(user.buildingId));
      this.loadStatements();
    }
  }

  onBuildingChange(buildingId: number | 'ALL') {
    this.selectedBuildingId.set(buildingId);
    this.receipts.set([]);
    this.loadStatements();
  }

  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
  }

  clearFilters() {
    this.searchQuery.set('');
    this.selectedDescription.set('ALL');
    this.selectedStatus.set('ALL');
    this.dateRange.reset();
    this.startDate.set(null);
    this.endDate.set(null);
  }

  loadStatements() {
    const buildingId = this.selectedBuildingId();
    const complexId = this.authService.userSignal()?.complexId;

    const payload = buildingId === 'ALL'
      ? { isComplex: true, complexId: complexId }
      : { isComplex: false, buildingId: buildingId };

    this.billingService.getStatements(payload).subscribe({
      next: (res: any) => this.receipts.set(res.data),
      error: (err) => console.error(err)
    });
  }

  sendReminder(receipt: any) {
    alert(`Aviso de cobro enviado a: ${receipt.ownerName || 'Propietario'} (Apt: ${receipt.apartment})`);
  }

  openPaymentModal(receipt: any) {
    const currentBuildingId = this.selectedBuildingId() !== 'ALL'
      ? this.selectedBuildingId()
      : (receipt.building_id || receipt.buildingId);

    const dialogData = {
      ...receipt,
      building_id: currentBuildingId,
      buildingId: currentBuildingId,
      complex_id: this.authService.userSignal()?.complexId
    };

    const dialogRef = this.dialog.open(AdminPaymentModalComponent, {
      width: '500px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(success => {
      if (success) {
        this.loadStatements();
      }
    });
  }
}