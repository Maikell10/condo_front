import { Component, inject, signal, OnInit, computed } from '@angular/core';
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
    MatNativeDateModule, MatTabsModule
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' }
  ],
  templateUrl: './payments.component.html',
})
export class PaymentsComponent implements OnInit {
  maxDate: Date = new Date();

  // 🔥 1. Señal para bloquear el botón y evitar pagos duplicados
  isSubmitting = signal<boolean>(false);

  private fb = inject(FormBuilder);
  private receiptService = inject(ReceiptService);
  private paymentService = inject(PaymentService);
  private authService = inject(AuthService);
  private apartmentService = inject(ApartmentService);

  // 🔥 2. Inyectamos el adaptador de fechas nativo de Angular Material
  private dateAdapter = inject(DateAdapter);

  // --- SIGNALS ---
  receipts = signal<Receipt[]>([]);
  recentPayments = signal<any[]>([]);
  movements = signal<Movement[]>([]);
  totalDebt = signal<number>(0);
  totalSelected = signal<number>(0);
  banks = signal<any[]>([]);

  paymentForm: FormGroup = this.fb.group({
    bankAccount: ['', Validators.required],
    operationDate: ['', Validators.required],
    referenceNumber: ['', [Validators.required, Validators.minLength(6)]],
    amount: ['', [Validators.required, Validators.min(0.1)]],
    operationType: ['same_bank', Validators.required],
    email: ['', [Validators.required, Validators.email]],
  });

  selectedBankId = toSignal(this.paymentForm.get('bankAccount')!.valueChanges, { initialValue: null });

  selectedBankDetails = computed(() => {
    console.log('Recalculando banco. ID actual:', this.selectedBankId()); // ¡Ahora sí verás esto al cambiar!

    const id = this.selectedBankId();
    if (!id) return null;

    // Aseguramos que la comparación de IDs sea del mismo tipo (ej. string === string o number === number)
    return this.banks().find(b => b.id === id || b.id === Number(id) || String(b.id) === String(id));
  });

  // --- TABLAS ---
  selection = new SelectionModel<Receipt>(true, []);
  displayedColumns: string[] = ['select', 'fecha', 'monto', 'pagado', 'deuda', 'saldo'];
  displayedColumnsMovements: string[] = ['fecha', 'detalle', 'monto', 'status'];

  constructor() {
    // 🔥 3. Forzamos el idioma español directamente en el adaptador. ¡Esto arregla el formato!
    this.dateAdapter.setLocale('es-ES');
  }

  ngOnInit() {
    this.refreshData();
    this.loadBuildingBanks();
    const user = this.authService.userSignal();
    if (user) this.paymentForm.patchValue({ email: user.email });
  }

  refreshData() {
    this.loadPendingReceipts();
    this.loadRecentPayments();
  }

  loadBuildingBanks() {
    const buildingId = this.authService.userSignal()?.buildingId;
    if (buildingId) {
      this.apartmentService.getBankAccounts(Number(buildingId)).subscribe({
        next: (res) => {
          // Guardamos los datos reales de la BD
          this.banks.set(res.data);
        },
        error: (err) => console.error("Error al cargar bancos", err)
      });
    }
  }

  loadPendingReceipts() {
    this.receiptService.getPendingReceipts().subscribe({
      next: (res) => {
        const sanitized = res.data.map(r => ({
          ...r,
          monto: Number(r.monto) || 0,
          paid: Number(r.paid) || 0
        }));
        this.receipts.set(sanitized);

        // 🔥 CÁLCULO CRÍTICO: Sumamos solo lo que falta por pagar de cada recibo
        const total = sanitized.reduce((acc, curr) => {
          return acc + (curr.monto - curr.paid);
        }, 0);

        this.totalDebt.set(total); // Aquí aparecerán los $230.50
      }
    });
  }

  loadRecentPayments() {
    this.paymentService.getRecentPayments().subscribe({
      next: (res) => {
        this.recentPayments.set(res.data);
        // Filtramos aprobados para el historial
        const approved = res.data
          .filter((p: any) => p.status === 'APPROVED')
          .map((p: any) => ({
            fecha: p.payment_date,
            detalle: `Pago Verificado - Ref: ${p.reference}`,
            monto: p.amount,
            status: p.status
          }));
        this.movements.set(approved);
      }
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
    // 🔥 4. Validamos que el formulario sea válido Y que NO se esté enviando ya
    if (this.paymentForm.valid && this.totalSelected() > 0 && !this.isSubmitting()) {

      this.isSubmitting.set(true); // Bloqueamos la UI

      const rawData = this.paymentForm.getRawValue();
      const formattedDate = new Date(rawData.operationDate).toISOString().split('T')[0];
      const payload = { ...rawData, operationDate: formattedDate };

      this.paymentService.reportPayment(payload).subscribe({
        next: (res) => {
          alert(res.message);
          this.resetUI();
          this.refreshData();
          this.isSubmitting.set(false); // Desbloqueamos al terminar con éxito
        },
        error: (err) => {
          alert(err.error?.message || 'Error al enviar reporte');
          this.isSubmitting.set(false); // Desbloqueamos si hay error
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