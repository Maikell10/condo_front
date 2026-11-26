import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule, DecimalPipe, NgClass } from '@angular/common';
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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { SelectionModel } from '@angular/cdk/collections';

import { ReceiptService, Receipt } from '../../../core/services/receipt.service';
import { PaymentService } from '../../../core/services/payment.service';
import { AuthService } from '../../../core/services/auth.service';
import { ApartmentService } from '../../../core/services/apartment.service';
import { OwnerDataLoaderComponent } from '../../shared/owner-data-loader/owner-data-loader.component';
import { ownerPaymentStatusLabel } from '../../shared/owner-payment-status';

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
    CommonModule,
    DecimalPipe,
    NgClass,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTabsModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    RouterLink,
    OwnerDataLoaderComponent
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' }
  ],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.scss'
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
  private snackBar = inject(MatSnackBar);

  readonly paymentStatusLabel = ownerPaymentStatusLabel;

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
    amountLocal: ['', [Validators.required, Validators.min(0.01)]],
    operationType: ['same_bank', Validators.required],
    /** Oculto en UI (sección C); se rellena con el correo del usuario logueado. */
    email: ['', [Validators.required, Validators.email]],
  });

  selectedBankId = toSignal(this.paymentForm.get('bankAccount')!.valueChanges, { initialValue: null });

  formAmountLocal = toSignal(this.paymentForm.get('amountLocal')!.valueChanges, { initialValue: 0 });

  selectedBankDetails = computed(() => {
    const id = this.selectedBankId();
    if (!id) return null;
    return this.banks().find(b => b.id === id || b.id === Number(id) || String(b.id) === String(id));
  });

  montoReportadoVES = computed(() => Number(this.formAmountLocal()) || 0);

  montoEquivalenteUSD = computed(() => {
    const rate = this.tasaDelDia();
    if (!rate) return 0;
    return this.montoReportadoVES() / rate;
  });

  selectedTotalVes = computed(() => this.totalSelected() * this.tasaDelDia());

  unitLabel = computed(() => {
    const code = this.authService.userSignal()?.ownerCode;
    return code?.trim() ? `Unidad ${code}` : '';
  });

  pendingReviewCount = computed(
    () => this.recentPayments().filter((p) => p.status === 'PENDING_APPROVAL').length
  );

  recentPaymentsSorted = computed(() =>
    [...this.recentPayments()].sort(
      (a, b) =>
        new Date(b.payment_date ?? b.created_at ?? 0).getTime() -
        new Date(a.payment_date ?? a.created_at ?? 0).getTime()
    )
  );

  recentPaymentsPreview = computed(() => this.recentPaymentsSorted().slice(0, 3));

  hasMoreRecentPayments = computed(() => this.recentPaymentsSorted().length > 3);

  isSolvent = computed(() => this.totalDebt() <= 0.001 && this.receipts().length === 0);

  statCards = computed(() => {
    const ves = this.totalSelected() * this.tasaDelDia();
    return [
      {
        id: 'debt',
        variant: 'rose',
        icon: 'account_balance_wallet',
        chip: 'Deuda total',
        value: `$${this.totalDebt().toFixed(2)}`,
        sub: 'Recibos con saldo pendiente'
      },
      {
        id: 'selected',
        variant: 'violet',
        icon: 'playlist_add_check',
        chip: 'Seleccionado',
        value: `$${this.totalSelected().toFixed(2)}`,
        sub: this.totalSelected() > 0 ? `≈ Bs. ${ves.toFixed(2)} a tasa BCV` : 'Marca los recibos que pagarás'
      },
      {
        id: 'receipts',
        variant: 'indigo',
        icon: 'receipt_long',
        chip: 'Recibos',
        value: String(this.receipts().length),
        sub: `${this.selection.selected.length} marcados en esta sesión`
      },
      {
        id: 'review',
        variant: 'amber',
        icon: 'hourglass_top',
        chip: 'En revisión',
        value: String(this.pendingReviewCount()),
        sub: 'Reportes esperando validación'
      }
    ] as const;
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
    this.paymentForm.get('amountLocal')!.valueChanges.subscribe((vesRaw) => {
      const rate = this.tasaDelDia();
      const ves = Number(vesRaw) || 0;
      const usd = rate > 0 ? ves / rate : 0;
      this.paymentForm.patchValue(
        { amount: usd > 0 ? parseFloat(usd.toFixed(2)) : '' },
        { emitEvent: false }
      );
    });
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

        if (this.selection.selected.length) {
          this.calculateTotal();
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

  copyAccountNumber(value: string | undefined) {
    if (!value) return;
    navigator.clipboard?.writeText(value).then(
      () =>
        this.snackBar.open('Número de cuenta copiado', 'Listo', {
          duration: 2800,
          horizontalPosition: 'end',
          verticalPosition: 'bottom'
        }),
      () => this.snackBar.open('No se pudo copiar. Selecciónala manualmente.', 'Cerrar', { duration: 4000 })
    );
  }

  scrollToReportForm() {
    document.getElementById('formulario-pago')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  toggleSelection(row: Receipt) {
    this.selection.toggle(row);
    this.calculateTotal();
  }

  calculateTotal() {
    const total = this.selection.selected.reduce((acc, curr) => acc + (curr.monto - curr.paid), 0);
    this.totalSelected.set(total);
    const rate = this.tasaDelDia();
    const ves = total * rate;
    this.paymentForm.patchValue({
      amountLocal: total > 0 && rate > 0 ? parseFloat(ves.toFixed(2)) : ''
    });
    if (total <= 0) {
      this.paymentForm.patchValue({ amount: '' }, { emitEvent: false });
    }
  }

  onSubmit() {
    const userEmail = this.authService.userSignal()?.email;
    if (userEmail && !this.paymentForm.get('email')?.value) {
      this.paymentForm.patchValue({ email: userEmail }, { emitEvent: false });
    }

    if (this.paymentForm.valid && this.totalSelected() > 0 && !this.isSubmitting()) {
      this.isSubmitting.set(true);

      const rawData = this.paymentForm.getRawValue();
      const formattedDate = new Date(rawData.operationDate).toISOString().split('T')[0];

      const amountLocalClean = parseFloat(Number(rawData.amountLocal).toFixed(2));
      const amountUsd = parseFloat(Number(rawData.amount).toFixed(2));

      const payload = {
        ...rawData,
        amount: amountUsd,
        operationDate: formattedDate,
        currency: 'USD',
        exchangeRate: this.tasaDelDia(),
        amountLocal: amountLocalClean
      };

      this.paymentService.reportPayment(payload).subscribe({
        next: (res) => {
          this.snackBar.open(res.message || 'Reporte enviado correctamente', 'Cerrar', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'bottom'
          });
          this.resetUI();
          this.refreshData(false);
          this.isSubmitting.set(false);
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'Error al enviar reporte', 'Cerrar', {
            duration: 6000,
            horizontalPosition: 'end',
            verticalPosition: 'bottom'
          });
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