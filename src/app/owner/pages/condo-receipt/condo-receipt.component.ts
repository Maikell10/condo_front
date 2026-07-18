import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog, MatDialogModule } from '@angular/material/dialog'; // 🔥 Agregado
import { BillingService } from '../../../core/services/billing.service';
import { ReceiptPreviewDialogComponent } from '../../../modals/receipt-preview-dialog/receipt-preview-dialog.component';


@Component({
  selector: 'app-condo-receipt',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatTableModule, MatIconModule,
    MatButtonModule, MatSelectModule, MatFormFieldModule, MatDialogModule
  ],
  templateUrl: './condo-receipt.component.html',
  styles: [`
    ::ng-deep .hide-subscript .mat-mdc-form-field-subscript-wrapper {
        display: none;
    }
  `]
})
export class CondoReceiptComponent implements OnInit {
  private billingService = inject(BillingService);
  private dialog = inject(MatDialog); // 🔥 Inyectamos el Modal

  displayedColumns: string[] = ['code', 'description', 'totalAmount', 'share'];

  availablePeriods = signal<any[]>([]);
  selectedPeriod = signal<string>('');

  receiptData = signal<any[]>([]);

  // Señales de soporte para guardar la metadata del recibo seleccionado
  currentApt = signal<string>('...');
  currentAlicuota = signal<number>(0);
  currentPeriodName = signal<string>('...');
  currentPeriodMeta = signal<any>(null); // 🔥 Guarda toda la info del dropdown
  currentReceiptMeta = signal<any>(null); // 🔥 Guarda la info extra del detalle

  monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  ngOnInit() {
    this.loadPeriods();
  }

  loadPeriods() {
    this.billingService.getOwnerReceiptPeriods().subscribe({
      next: (res: any) => {
        const periods = res.data.map((p: any) => {

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
            formattedIssueDate: formattedIssueDate,

            // 🔥 CAPTURAMOS EL STATUS EXPLÍCITAMENTE
            status: p.status
          };
        });

        this.availablePeriods.set(periods);

        if (periods.length > 0) {
          this.selectedPeriod.set(periods[0].value);
          this.onPeriodChange(periods[0].value);
        }
      },
      error: (err) => console.error("Error al cargar periodos", err)
    });
  }

  onPeriodChange(value: string) {
    this.selectedPeriod.set(value);
    const [apartmentId, month, year] = value.split('-');

    // Guardamos el objeto completo del periodo seleccionado
    const found = this.availablePeriods().find(p => p.value === value);
    this.currentPeriodMeta.set(found);
    this.currentPeriodName.set(found ? found.monthName : `${month}-${year}`);

    this.loadReceiptDetail(Number(apartmentId), Number(month), Number(year));
  }

  loadReceiptDetail(apartmentId: number, month: number, year: number) {
    this.billingService.getOwnerReceiptDetail(apartmentId, month, year).subscribe({
      next: (res: any) => {
        this.currentReceiptMeta.set(res); // 🔥 Guardamos data extra

        const data = res.data;
        const alicuota = Number(res.alicuota);

        this.currentAlicuota.set(alicuota * 100);
        this.currentApt.set(res.apartmentNumber);

        if (data.length > 0) {
          const totalCommon = data.reduce((acc: number, curr: any) => acc + Number(curr.totalAmount), 0);
          const reservePercentage = 0.0; // Cambiar a 0.15 si usas fondo de reserva activo
          const reserveFund = totalCommon * reservePercentage;
          const grandTotal = totalCommon + reserveFund;

          const shareCommon = totalCommon * alicuota;
          const shareReserve = reserveFund * alicuota;
          const shareGrandTotal = grandTotal * alicuota;

          const mappedData = data.map((d: any) => ({
            ...d,
            share: Number(d.totalAmount) * alicuota,
            isTotal: false
          }));

          const formattedData = [
            ...mappedData,
            { code: '', description: 'TOTAL GASTOS COMUNES:', totalAmount: totalCommon, share: shareCommon, isTotal: true },
            { code: '', description: 'TOTAL RECIBO A PAGAR:', totalAmount: null, share: shareCommon, isTotal: true, isFinal: true }
          ];

          this.receiptData.set(formattedData);
        } else {
          this.receiptData.set([]);
        }
      },
      error: (err) => console.error("Error al cargar recibo", err)
    });
  }

  // 🔥 NUEVA FUNCIÓN PARA ABRIR EL MODAL
  printReceipt() {
    const period = this.currentPeriodMeta();
    const meta = this.currentReceiptMeta();

    if (!period || this.receiptData().length === 0) {
      alert("No hay datos cargados para imprimir.");
      return;
    }

    // 1. Extraemos solo los items facturados (sin las sumatorias)
    const lineItems = this.receiptData().filter(r => !r.isTotal).map(r => ({
      concept: r.description,
      commonExpense: r.totalAmount,
      individualShare: r.share
    }));

    // 2. Buscamos los totales calculados
    const totalsRow = this.receiptData().find(r => r.isFinal);
    const finalBill = totalsRow ? totalsRow.share : 0;

    const commonTotalRow = this.receiptData().find(r => r.isTotal && !r.isFinal);
    const finalTotalCommon = commonTotalRow ? commonTotalRow.totalAmount : 0;

    // 3. Armamos el Payload idéntico al de administración
    const payload = {
      buildingName: meta?.buildingName || period?.buildingName || 'Edificio Principal',
      unit: this.currentApt(),
      issueDate: period?.formattedIssueDate || 'N/A',
      monthYear: this.currentPeriodName(),
      ownerName: meta?.ownerName || period?.ownerName || 'Propietario',
      quota: (this.currentAlicuota()).toFixed(4) + '%',
      lineItems: lineItems,
      totalGastoComun: finalTotalCommon,
      totalGastoIndividual: finalBill,
      totalBill: period?.amount || finalBill, // Toma el monto total crudo si existe
      accessCode: meta?.access_code || period?.access_code || 'PENDIENTE',

      // 🔥 STATUS DINÁMICO DE LA BD (PAGADO o PENDIENTE)
      status: period?.status || meta?.status || 'PENDING'
    };

    console.log(meta, period)

    // 4. Abrimos el modal
    this.dialog.open(ReceiptPreviewDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      data: payload
    });
  }
}