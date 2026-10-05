import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CurrencyPipe, DecimalPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BillingService } from '../../../core/services/billing.service';
import { ReceiptPreviewDialogComponent } from '../../../modals/receipt-preview-dialog/receipt-preview-dialog.component';
import { OwnerDataLoaderComponent } from '../../shared/owner-data-loader/owner-data-loader.component';

@Component({
  selector: 'app-condo-receipt',
  standalone: true,
  imports: [
    CurrencyPipe,
    DecimalPipe,
    NgClass,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    OwnerDataLoaderComponent
  ],
  templateUrl: './condo-receipt.component.html',
  styleUrl: './condo-receipt.component.scss'
})
export class CondoReceiptComponent implements OnInit {
  private billingService = inject(BillingService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  displayedColumns: string[] = ['code', 'description', 'totalAmount', 'share'];

  availablePeriods = signal<any[]>([]);
  selectedPeriod = signal('');
  receiptData = signal<any[]>([]);
  loadingPeriods = signal(false);
  loadingDetail = signal(false);
  searchQuery = signal('');

  currentApt = signal('—');
  currentAlicuota = signal(0);
  currentPeriodName = signal('—');
  currentPeriodMeta = signal<any>(null);
  currentReceiptMeta = signal<any>(null);

  monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  showPageLoader = computed(
    () => this.loadingPeriods() && this.availablePeriods().length === 0
  );

  detailLines = computed(() => this.receiptData().filter((r) => !r.isTotal));

  totalCommon = computed(() => {
    const row = this.receiptData().find((r) => r.isTotal && !r.isFinal);
    return row?.totalAmount ?? 0;
  });

  amountDue = computed(() => {
    const row = this.receiptData().find((r) => r.isFinal);
    return row?.share ?? 0;
  });

  receiptStatus = computed(() => {
    const period = this.currentPeriodMeta();
    const meta = this.currentReceiptMeta();
    const raw = (period?.status || meta?.status || 'PENDING').toString().toUpperCase();
    if (raw.includes('PAID') || raw.includes('PAG')) return 'PAID';
    return 'PENDING';
  });

  statusLabel = computed(() => (this.receiptStatus() === 'PAID' ? 'Pagado' : 'Pendiente'));

  filteredLines = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const lines = this.detailLines();
    if (!q) return lines;
    return lines.filter(
      (r) =>
        String(r.code ?? '').toLowerCase().includes(q) ||
        String(r.description ?? '').toLowerCase().includes(q)
    );
  });

  tableRows = computed(() => {
    if (this.receiptData().length === 0) return [];
    if (this.searchQuery()) return this.filteredLines();
    return this.receiptData();
  });

  statCards = computed(() => [
    {
      id: 'due',
      variant: 'blue',
      icon: 'payments',
      chip: 'Tu recibo',
      value: this.formatMoney(this.amountDue()),
      sub: this.currentPeriodName()
    },
    {
      id: 'common',
      variant: 'indigo',
      icon: 'account_balance',
      chip: 'Gasto común',
      value: this.formatMoney(Number(this.totalCommon())),
      sub: 'Total del edificio'
    },
    {
      id: 'quota',
      variant: 'emerald',
      icon: 'percent',
      chip: 'Alícuota',
      value: `${this.currentAlicuota().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}%`,
      sub: `Unidad ${this.currentApt()}`
    },
    {
      id: 'status',
      variant: 'amber',
      icon: 'verified',
      chip: 'Estado',
      value: this.statusLabel(),
      sub: `${this.detailLines().length} conceptos`
    }
  ]);

  ngOnInit() {
    this.loadPeriods();
  }

  loadPeriods() {
    this.loadingPeriods.set(true);
    this.billingService.getOwnerReceiptPeriods().subscribe({
      next: (res: any) => {
        const periods = (res.data ?? []).map((p: any) => {
          let formattedIssueDate = 'N/A';
          const rawDate = p.issueDate || p.issue_date || p.created_at;
          if (rawDate) {
            const d = new Date(rawDate);
            const day = String(d.getUTCDate()).padStart(2, '0');
            const mo = String(d.getUTCMonth() + 1).padStart(2, '0');
            formattedIssueDate = `${day}-${mo}-${d.getUTCFullYear()}`;
          }

          return {
            ...p,
            value: `${p.apartmentId}-${p.month}-${p.year}`,
            name: `Apt ${p.apartmentNumber} - ${this.monthNames[p.month - 1]} ${p.year}`,
            monthName: `${this.monthNames[p.month - 1]} ${p.year}`,
            formattedIssueDate,
            status: p.status
          };
        });

        this.availablePeriods.set(periods);

        if (periods.length > 0) {
          this.selectedPeriod.set(periods[0].value);
          this.onPeriodChange(periods[0].value);
        } else {
          this.receiptData.set([]);
        }
        this.loadingPeriods.set(false);
      },
      error: () => {
        this.loadingPeriods.set(false);
        this.snackBar.open('No se pudieron cargar tus recibos', 'Cerrar', { duration: 3500 });
      }
    });
  }

  refresh() {
    const value = this.selectedPeriod();
    if (value) {
      this.onPeriodChange(value);
    } else {
      this.loadPeriods();
    }
  }

  onPeriodChange(value: string) {
    this.selectedPeriod.set(value);
    this.searchQuery.set('');
    const parts = value.split('-');
    const year = Number(parts.pop());
    const month = Number(parts.pop());
    const apartmentId = Number(parts.join('-'));

    const found = this.availablePeriods().find((p) => p.value === value);
    this.currentPeriodMeta.set(found);
    this.currentPeriodName.set(found ? found.monthName : `${month}-${year}`);

    this.loadReceiptDetail(apartmentId, month, year);
  }

  onSearchChange(value: string) {
    this.searchQuery.set(value);
  }

  loadReceiptDetail(apartmentId: number, month: number, year: number) {
    this.loadingDetail.set(true);
    this.billingService.getOwnerReceiptDetail(apartmentId, month, year).subscribe({
      next: (res: any) => {
        this.currentReceiptMeta.set(res);

        const data = res.data ?? [];
        const alicuota = Number(res.alicuota);

        this.currentAlicuota.set(alicuota * 100);
        this.currentApt.set(res.apartmentNumber ?? '—');

        if (data.length > 0) {
          const totalCommon = data.reduce((acc: number, curr: any) => acc + Number(curr.totalAmount), 0);
          const shareCommon = totalCommon * alicuota;

          const mappedData = data.map((d: any) => ({
            ...d,
            share: Number(d.totalAmount) * alicuota,
            isTotal: false
          }));

          const formattedData = [
            ...mappedData,
            {
              code: '',
              description: 'TOTAL GASTOS COMUNES:',
              totalAmount: totalCommon,
              share: shareCommon,
              isTotal: true
            },
            {
              code: '',
              description: 'TOTAL RECIBO A PAGAR:',
              totalAmount: null,
              share: shareCommon,
              isTotal: true,
              isFinal: true
            }
          ];

          this.receiptData.set(formattedData);
        } else {
          this.receiptData.set([]);
        }
        this.loadingDetail.set(false);
      },
      error: () => {
        this.loadingDetail.set(false);
        this.receiptData.set([]);
        this.snackBar.open('No se pudo cargar el desglose del recibo', 'Cerrar', { duration: 3500 });
      }
    });
  }

  openReceiptPreview() {
    const period = this.currentPeriodMeta();
    const meta = this.currentReceiptMeta();

    if (!period || this.receiptData().length === 0) {
      this.snackBar.open('No hay datos para ver el recibo', 'Cerrar', { duration: 3000 });
      return;
    }

    const lineItems = this.receiptData()
      .filter((r) => !r.isTotal)
      .map((r) => ({
        concept: r.description,
        commonExpense: r.totalAmount,
        individualShare: r.share
      }));

    const totalsRow = this.receiptData().find((r) => r.isFinal);
    const finalBill = totalsRow ? totalsRow.share : 0;

    const commonTotalRow = this.receiptData().find((r) => r.isTotal && !r.isFinal);
    const finalTotalCommon = commonTotalRow ? commonTotalRow.totalAmount : 0;

    const payload = {
      buildingName: meta?.buildingName || period?.buildingName || 'Edificio Principal',
      unit: this.currentApt(),
      issueDate: period?.formattedIssueDate || 'N/A',
      monthYear: this.currentPeriodName(),
      ownerName: meta?.ownerName || period?.ownerName || 'Propietario',
      quota: this.currentAlicuota().toFixed(4) + '%',
      lineItems,
      totalGastoComun: finalTotalCommon,
      totalGastoIndividual: finalBill,
      totalBill: period?.amount || finalBill,
      accessCode: meta?.access_code || period?.access_code || 'PENDIENTE',
      status: period?.status || meta?.status || 'PENDING'
    };

    this.dialog.open(ReceiptPreviewDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      data: payload
    });
  }

  private formatMoney(value: number): string {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
