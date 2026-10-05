import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE, DateAdapter } from '@angular/material/core';
import { MatTabsModule } from '@angular/material/tabs';
import { SelectionModel } from '@angular/cdk/collections';

import { ReceiptService, Receipt } from '../../../core/services/receipt.service';
import { PaymentService } from '../../../core/services/payment.service';
import { AuthService } from '../../../core/services/auth.service';
import { ApartmentService } from '../../../core/services/apartment.service';
import { OwnerDataLoaderComponent } from '../../shared/owner-data-loader/owner-data-loader.component';

export interface Movement {
  fecha: string;
  detalle: string;
  monto: number;
  status: string;
}

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, MatTableModule,
    MatCheckboxModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatRadioModule, MatButtonModule, MatIconModule, MatDatepickerModule,
    MatNativeDateModule, MatTabsModule, OwnerDataLoaderComponent
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' }
  ],
  templateUrl: './payments.component.html',
})
export class PaymentsComponent implements OnInit {
  maxDate: Date = new Date();
  isSubmitting = signal<boolean>(false);
  pageLoading = signal(true);

  private fb = inject(FormBuilder);
  private receiptService = inject(ReceiptService);
  private paymentService = inject(PaymentService);
  private authService = inject(AuthService);
  private apartmentService = inject(ApartmentService);
  private dateAdapter = inject(DateAdapter);

  // --- SIGNALS ORIGINALES ---
  receipts = signal<Receipt[]>([]);
  recentPayments = signal<any[]>([]);
  movements = signal<Movement[]>([]);
  totalDebt = signal<number>(0);
  totalSelected = signal<number>(0);
  banks = signal<any[]>([]);

  // 🔥 NUEVAS SIGNALS PARA TASA DE CAMBIO
  tasaDelDia = signal<number>(1);
  fechaTasa = signal<string>('');

  paymentForm: FormGroup = this.fb.group({
    bankAccount: ['', Validators.required],
    operationDate: ['', Validators.required],
    referenceNumber: ['', [Validators.required, Validators.minLength(6)]],
    amount: ['', [Validators.required, Validators.min(0.1)]],
    operationType: ['same_bank', Validators.required],
    email: ['', [Validators.required, Validators.email]],
  });

  selectedBankId = toSignal(this.paymentForm.get('bankAccount')!.valueChanges, { initialValue: null });

  // Escuchamos el monto que el usuario teclea para calcular los Bs. en tiempo real
  formAmount = toSignal(this.paymentForm.get('amount')!.valueChanges, { initialValue: 0 });

  selectedBankDetails = computed(() => {
    const id = this.selectedBankId();
    if (!id) return null;
    return this.banks().find(b => b.id === id || b.id === Number(id) || String(b.id) === String(id));
  });

  // 🔥 CÁLCULO REACTIVO DE BOLÍVARES
  montoTransferirVES = computed(() => {
    const amountUSD = Number(this.formAmount()) || 0;
    return amountUSD * this.tasaDelDia();
  });

  selection = new SelectionModel<Receipt>(true, []);
  displayedColumns: string[] = ['select', 'fecha', 'monto', 'pagado', 'deuda', 'saldo'];
  displayedColumnsMovements: string[] = ['fecha', 'detalle', 'monto', 'status'];

  constructor() {
    this.dateAdapter.setLocale('es-ES');
  }

  ngOnInit() {
    const user = this.authService.userSignal();
    if (user) this.paymentForm.patchValue({ email: user.email });
    this.refreshData(true);
  }

  refreshData(initial = false) {
    if (initial) {
      this.pageLoading.set(true);
    }
    const buildingId = Number(this.authService.userSignal()?.buildingId);

    forkJoin({
      rate: this.paymentService.getLatestExchangeRate().pipe(catchError(() => of(null))),
      receipts: this.receiptService.getPendingReceipts().pipe(catchError(() => of({ data: [] }))),
      payments: this.paymentService.getRecentPayments().pipe(catchError(() => of({ data: [] }))),
      banks: buildingId
        ? this.apartmentService.getBankAccounts(buildingId).pipe(catchError(() => of({ data: [] })))
        : of({ data: [] })
    })
      .pipe(finalize(() => this.pageLoading.set(false)))
      .subscribe(({ rate, receipts, payments, banks }) => {
        const rateRes = rate as any;
        if (rateRes?.success && rateRes.data) {
          this.tasaDelDia.set(Number(rateRes.data.rate));
          const rawDate = rateRes.data.rate_date ? rateRes.data.rate_date.split('T')[0] : '';
          this.fechaTasa.set(rawDate);
        }

        const receiptRows = (receipts as any).data ?? [];
        const sanitized = receiptRows.map((r: Receipt) => ({
          ...r,
          monto: Number(r.monto) || 0,
          paid: Number(r.paid) || 0
        }));
        this.receipts.set(sanitized);
        this.totalDebt.set(sanitized.reduce((acc: number, curr: Receipt) => acc + (curr.monto - curr.paid), 0));

        const paymentRows = (payments as any).data ?? [];
        this.recentPayments.set(paymentRows);
        this.movements.set(
          paymentRows
            .filter((p: any) => p.status === 'APPROVED')
            .map((p: any) => ({
              fecha: p.payment_date,
              detalle: `Pago Verificado - Ref: ${p.reference}`,
              monto: p.amount,
              status: p.status
            }))
        );

        this.banks.set((banks as any).data ?? []);
      });
  }

  toggleSelection(row: Receipt) {
    this.selection.toggle(row);
    this.calculateTotal();
  }

  calculateTotal() {
    const total = this.selection.selected.reduce((acc, curr) => acc + (curr.monto - curr.paid), 0);
    this.totalSelected.set(total);
    this.paymentForm.patchValue({ amount: total > 0 ? total.toFixed(2) : '' });
  }

  onSubmit() {
    if (this.paymentForm.valid && this.totalSelected() > 0 && !this.isSubmitting()) {
      this.isSubmitting.set(true);

      const rawData = this.paymentForm.getRawValue();
      const formattedDate = new Date(rawData.operationDate).toISOString().split('T')[0];

      // 🔥 Redondeo limpio a 2 decimales para los Bolívares
      const amountLocalClean = parseFloat(this.montoTransferirVES().toFixed(2));

      // 🔥 PAYLOAD BIMONETARIO PARA EL BACKEND
      const payload = {
        ...rawData,
        operationDate: formattedDate,
        currency: 'USD',
        exchangeRate: this.tasaDelDia(),
        amountLocal: amountLocalClean // Enviamos cuánto fue exactamente en Bs.
      };

      this.paymentService.reportPayment(payload).subscribe({
        next: (res) => {
          alert(res.message);
          this.resetUI();
          this.refreshData(false);
          this.isSubmitting.set(false);
        },
        error: (err) => {
          alert(err.error?.message || 'Error al enviar reporte');
          this.isSubmitting.set(false);
        }
      });
    }
  }

  private resetUI() {
    const user = this.authService.userSignal();
    this.paymentForm.reset({ operationType: 'same_bank', email: user?.email || '' });
    this.selection.clear();
    this.totalSelected.set(0);
  }
}