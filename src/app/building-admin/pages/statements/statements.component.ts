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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import * as XLSX from 'xlsx';

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
    FormsModule, ReactiveFormsModule, MatSnackBarModule
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
  private snackBar = inject(MatSnackBar);

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

    // 🔥 Safety check: Find the apartment ID regardless of the backend's naming convention
    const aptId = receipt.apartmentId || receipt.apartment_id;

    if (!aptId) {
      console.warn("Missing apartment ID in receipt data:", receipt);
      // If you absolutely need it, you might have to alert the user or stop the modal,
      // but typically fixing the backend is required if this is truly missing.
    }

    const dialogData = {
      ...receipt,
      apartmentId: aptId, // Force the property to exist
      building_id: currentBuildingId,
      buildingId: currentBuildingId,
      complex_id: this.authService.userSignal()?.complexId
    };

    console.log("Dialog Data Prepared:", dialogData);

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

  exportToExcel() {
    const rows = this.filteredReceipts();
    if (!rows.length) {
      this.snackBar.open('No hay recibos para exportar con los filtros actuales.', 'Cerrar', {
        duration: 3500,
        horizontalPosition: 'end',
        verticalPosition: 'bottom'
      });
      return;
    }

    const generatedAt = this.formatDateTime(new Date());
    const buildingLabel = this.currentBuildingLabel();
    const filterLabel = this.getActiveFiltersLabel();
    const moneyFmt = '"$"#,##0.00';
    const pctFmt = '0.00%';

    const detailHeaders = [
      'N° Recibo',
      'Edificio',
      'Unidad',
      'Propietario',
      'Fecha emisión',
      'Descripción',
      'Monto ($)',
      'Pagado ($)',
      'Deuda ($)',
      '% Cobrado',
      'Estado',
      'Último pago',
      'Días vencidos'
    ];

    const detailRows = rows.map(r => {
      const lastPayment = this.getLastPaymentDate(r);
      const overdue = this.getOverdueDays(r);
      const pct = r.amount > 0 ? r.paid / r.amount : 0;

      return [
        this.getReceiptNumber(r),
        r.buildingName || buildingLabel,
        r.apartment ?? '',
        r.ownerName || 'Sin asignar',
        this.formatDate(r.issueDate || r.issue_date),
        r.description || '',
        Number(r.amount || 0),
        Number(r.paid || 0),
        Number(r.balance || 0),
        pct,
        this.statusLabel(r.status),
        lastPayment ? this.formatDate(lastPayment) : 'Sin pagos',
        overdue
      ];
    });

    const headerBlock = [
      ['ESTADO DE CUENTA — LISTADO CONTABLE DE RECIBOS'],
      ['Reporte de cobranza para conciliación y control de cuentas por cobrar'],
      [],
      ['Vista / Edificio', buildingLabel],
      ['Fecha de generación', generatedAt],
      ['Filtros aplicados', filterLabel],
      ['Recibos incluidos', rows.length],
      [],
      ['RESUMEN CONTABLE'],
      ['Total facturado ($)', 'Total cobrado ($)', 'Cuentas por cobrar ($)', '% Recaudación'],
      [this.totalExpected(), this.totalCollected(), this.totalPending(), this.collectionRate() / 100],
      [],
      ['DETALLE DE RECIBOS'],
      detailHeaders
    ];

    const totalsRow = [
      '',
      '',
      '',
      '',
      '',
      'TOTALES',
      this.totalExpected(),
      this.totalCollected(),
      this.totalPending(),
      this.totalExpected() > 0 ? this.totalCollected() / this.totalExpected() : 0,
      '',
      '',
      ''
    ];

    const detailSheet = XLSX.utils.aoa_to_sheet([...headerBlock, ...detailRows, totalsRow]);
    const lastCol = this.colLetter(detailHeaders.length - 1);
    const tableHeaderRow = headerBlock.length; // 1-based in Excel after aoa
    const firstDataRow = tableHeaderRow + 1;
    const lastDataRow = tableHeaderRow + detailRows.length;
    const totalsExcelRow = lastDataRow + 1;

    detailSheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: detailHeaders.length - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: detailHeaders.length - 1 } }
    ];
    detailSheet['!autofilter'] = {
      ref: `A${tableHeaderRow}:${lastCol}${lastDataRow}`
    };
    detailSheet['!views'] = [{
      state: 'frozen',
      ySplit: tableHeaderRow,
      topLeftCell: `A${firstDataRow}`,
      activeCell: `A${firstDataRow}`
    }];
    detailSheet['!cols'] = [
      { wch: 12 }, { wch: 16 }, { wch: 10 }, { wch: 28 }, { wch: 14 },
      { wch: 24 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 },
      { wch: 12 }, { wch: 14 }, { wch: 14 }
    ];

    this.applyNumberFormat(detailSheet, 11, [0, 1, 2], moneyFmt);
    this.applyNumberFormat(detailSheet, 11, [3], pctFmt);

    for (let r = firstDataRow; r <= totalsExcelRow; r++) {
      this.applyNumberFormat(detailSheet, r, [6, 7, 8], moneyFmt);
      this.applyNumberFormat(detailSheet, r, [9], pctFmt);
    }

    const byUnit = this.buildGroupSheet(
      rows,
      (r) => `${r.buildingName || buildingLabel}|${r.apartment ?? ''}|${r.ownerName || 'Sin asignar'}`,
      ['Edificio', 'Unidad', 'Propietario', 'Recibos', 'Facturado ($)', 'Cobrado ($)', 'Deuda ($)', '% Cobrado'],
      (key, items) => {
        const [edificio, unidad, propietario] = key.split('|');
        const facturado = this.sumExact(items, 'amount');
        const cobrado = this.sumExact(items, 'paid');
        const deuda = this.sumExact(items, 'balance');
        return [
          edificio, unidad, propietario, items.length,
          facturado, cobrado, deuda,
          facturado > 0 ? cobrado / facturado : 0
        ];
      },
      [4, 5, 6],
      [7]
    );

    const byPeriod = this.buildGroupSheet(
      rows,
      (r) => r.description || 'Sin descripción',
      ['Período / Descripción', 'Recibos', 'Facturado ($)', 'Cobrado ($)', 'Deuda ($)', '% Cobrado'],
      (key, items) => {
        const facturado = this.sumExact(items, 'amount');
        const cobrado = this.sumExact(items, 'paid');
        const deuda = this.sumExact(items, 'balance');
        return [
          key, items.length, facturado, cobrado, deuda,
          facturado > 0 ? cobrado / facturado : 0
        ];
      },
      [2, 3, 4],
      [5]
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, detailSheet, 'Estado de Cuenta');
    XLSX.utils.book_append_sheet(wb, byUnit, 'Resumen por Unidad');
    XLSX.utils.book_append_sheet(wb, byPeriod, 'Resumen por Período');

    const stamp = this.formatDate(new Date()).replace(/\//g, '-');
    XLSX.writeFile(wb, `Estado_Cuenta_${stamp}.xlsx`);
  }

  private buildGroupSheet(
    rows: any[],
    keyFn: (row: any) => string,
    headers: string[],
    mapFn: (key: string, items: any[]) => any[],
    moneyCols: number[],
    pctCols: number[]
  ): XLSX.WorkSheet {
    const groups = new Map<string, any[]>();
    for (const row of rows) {
      const key = keyFn(row);
      const list = groups.get(key) || [];
      list.push(row);
      groups.set(key, list);
    }

    const data = [...groups.entries()]
      .map(([key, items]) => mapFn(key, items))
      .sort((a, b) => String(a[0]).localeCompare(String(b[0]), 'es'));

    const aoa = [headers, ...data];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!autofilter'] = { ref: `A1:${this.colLetter(headers.length - 1)}${data.length + 1}` };
    ws['!views'] = [{ state: 'frozen', ySplit: 1, topLeftCell: 'A2', activeCell: 'A2' }];
    ws['!cols'] = headers.map((h, i) => ({ wch: Math.max(14, h.length + 4 + (i === 0 ? 8 : 0)) }));

    const moneyFmt = '"$"#,##0.00';
    const pctFmt = '0.00%';
    for (let r = 2; r <= data.length + 1; r++) {
      this.applyNumberFormat(ws, r, moneyCols, moneyFmt);
      this.applyNumberFormat(ws, r, pctCols, pctFmt);
    }
    return ws;
  }

  private applyNumberFormat(ws: XLSX.WorkSheet, excelRow: number, cols: number[], format: string) {
    for (const col of cols) {
      const cell = ws[`${this.colLetter(col)}${excelRow}`];
      if (cell && typeof cell.v === 'number') {
        cell.t = 'n';
        cell.z = format;
      }
    }
  }

  private colLetter(index: number): string {
    let n = index + 1;
    let s = '';
    while (n > 0) {
      const m = (n - 1) % 26;
      s = String.fromCharCode(65 + m) + s;
      n = Math.floor((n - 1) / 26);
    }
    return s;
  }

  private currentBuildingLabel(): string {
    const id = this.selectedBuildingId();
    if (id === 'ALL') return 'Todos los edificios';
    const building = this.buildingsList().find(b => b.id === id);
    if (building?.name) return building.name;
    const user = this.authService.userSignal();
    return `Edificio ${id}`;
  }

  private getActiveFiltersLabel(): string {
    const parts: string[] = [];

    if (this.filterMode() === 'description') {
      parts.push(
        this.selectedDescription() === 'ALL'
          ? 'Período: Todos'
          : `Período: ${this.selectedDescription()}`
      );
    } else {
      const start = this.startDate();
      const end = this.endDate();
      parts.push(
        start && end
          ? `Fechas: ${this.formatDate(start)} – ${this.formatDate(end)}`
          : 'Fechas: Sin rango'
      );
    }

    parts.push(`Estado: ${this.statusLabel(this.selectedStatus())}`);

    const q = this.searchQuery().trim();
    if (q) parts.push(`Búsqueda: "${q}"`);

    return parts.join(' | ');
  }

  private statusLabel(status: string): string {
    switch (status) {
      case 'PAID': return 'Pagado';
      case 'PENDING': return 'Pendiente';
      case 'PARTIAL': return 'Abono';
      case 'ALL': return 'Todos';
      default: return status || 'N/A';
    }
  }

  private getReceiptNumber(r: any): string | number {
    return r.receiptNumber || r.receipt_number || r.receiptId || r.receipt_id || r.id || '';
  }

  private getLastPaymentDate(r: any): any {
    return r.lastPaymentDate || r.last_payment_date || r.paymentDate || r.payment_date || r.lastPaidAt || null;
  }

  private getOverdueDays(r: any): number | string {
    if (!(r.balance > 0)) return 0;
    const raw = r.issueDate || r.issue_date;
    if (!raw) return '';
    const issue = this.parseDate(raw);
    if (!issue) return '';
    const diff = Math.floor((Date.now() - issue.getTime()) / 86400000);
    return diff > 0 ? diff : 0;
  }

  private parseDate(value: any): Date | null {
    if (!value) return null;
    if (value instanceof Date && !isNaN(value.getTime())) return value;
    const dateString = String(value).split('T')[0];
    const parts = dateString.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  private formatDate(value: any): string {
    const d = this.parseDate(value);
    if (!d) return '';
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}/${d.getFullYear()}`;
  }

  private formatDateTime(value: Date): string {
    const time = value.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
    return `${this.formatDate(value)} ${time}`;
  }

  // openPaymentModal(receipt: any) {
  //   const currentBuildingId = this.selectedBuildingId() !== 'ALL'
  //     ? this.selectedBuildingId()
  //     : (receipt.building_id || receipt.buildingId);

  //   const dialogData = {
  //     ...receipt,
  //     building_id: currentBuildingId,
  //     buildingId: currentBuildingId,
  //     complex_id: this.authService.userSignal()?.complexId
  //   };
  //   console.log(dialogData)

  //   const dialogRef = this.dialog.open(AdminPaymentModalComponent, {
  //     width: '500px',
  //     data: dialogData
  //   });

  //   dialogRef.afterClosed().subscribe(success => {
  //     if (success) {
  //       this.loadStatements();
  //     }
  //   });
  // }
}