import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE, DateAdapter } from '@angular/material/core';
import { MatRadioModule } from '@angular/material/radio'; // 🔥 Importante para los radio buttons
import { MatIconModule } from '@angular/material/icon';

import { BillingService } from '../../../core/services/billing.service';
import { ApartmentService } from '../../../core/services/apartment.service';
import { PaymentService } from '../../../core/services/payment.service'; // 🔥 Inyectamos para pedir la tasa

@Component({
  selector: 'app-admin-payment-modal',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule, MatRadioModule, MatIconModule
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' }
  ],
  template: `
    <div class="flex justify-between items-center pr-4">
        <h2 mat-dialog-title class="font-black text-gray-800 m-0">Registrar Pago Recibido</h2>
    </div>
    
    <mat-dialog-content class="space-y-4 pt-4">
      
      <!-- RESUMEN DE DEUDA -->
      <div class="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-4 flex justify-between items-center">
        <div>
            <p class="text-[10px] uppercase text-indigo-400 font-bold tracking-widest m-0">Apt: {{ data.apartment }}</p>
            <p class="text-sm text-indigo-900 font-bold m-0">{{ data.ownerName || 'Sin asignar' }}</p>
        </div>
        <div class="text-right">
            <p class="text-[10px] uppercase text-indigo-400 font-bold tracking-widest m-0">Deuda Total</p>
            <p class="text-xl text-indigo-700 font-black m-0">\${{ data.balance }}</p>
        </div>
      </div>

      <!-- 🔥 TIPO DE PAGO (BANCARIO VS EFECTIVO) -->
      <div class="border rounded-xl p-3 border-gray-200 bg-gray-50 flex items-center justify-center mb-2">
        <mat-radio-group [(ngModel)]="paymentMode" class="flex gap-6">
          <mat-radio-button value="bank" color="primary" class="font-medium text-gray-700">Transferencia / Bs.</mat-radio-button>
          <mat-radio-button value="cash" color="primary" class="font-medium text-emerald-700">Efectivo ($)</mat-radio-button>
        </mat-radio-group>
      </div>

      <!-- 🔥 CINTILLO INFORMATIVO DE TASA (Solo visible si es bancario) -->
      <div *ngIf="paymentMode === 'bank'" class="flex justify-between items-center bg-slate-800 text-white p-3 rounded-lg shadow-inner mb-4">
          <div class="flex items-center gap-2">
              <mat-icon class="text-amber-400 scale-75">trending_up</mat-icon>
              <span class="text-xs font-medium">Tasa BCV:</span>
          </div>
          <span class="font-mono text-sm font-black text-amber-400">Bs. {{ tasaDelDia() | number:'1.2-4' }}</span>
      </div>

      <!-- 🔥 CAMPOS BANCARIOS (Se ocultan si es Efectivo) -->
      <ng-container *ngIf="paymentMode === 'bank'">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Cuenta Receptora (Ingreso real)</mat-label>
            <mat-select [(ngModel)]="payment.bankAccountId" required>
              <mat-option *ngFor="let bank of banks()" [value]="bank.id">
                {{ bank.bank_name }} - {{ bank.account_number }}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <div class="grid grid-cols-2 gap-4">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Tipo de Operación</mat-label>
              <mat-select [(ngModel)]="payment.operationType" required>
                <mat-option value="same_bank">Mismo Banco</mat-option>
                <mat-option value="other_bank">Otro Banco</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Referencia</mat-label>
              <input matInput [(ngModel)]="payment.reference" placeholder="Ej. 123456" required>
            </mat-form-field>
          </div>
      </ng-container>

      <!-- 🔥 ALERTA PARA EFECTIVO -->
      <div *ngIf="paymentMode === 'cash'" class="bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-start gap-2 mb-4">
          <mat-icon class="text-emerald-500 scale-90">info</mat-icon>
          <p class="text-xs text-emerald-800 font-medium m-0 mt-0.5">El pago se registrará directamente en dólares. <strong>Solo se permiten montos con números enteros.</strong></p>
      </div>

      <!-- CAMPOS COMUNES -->
      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Monto a Pagar ($)</mat-label>
              <!-- Si es efectivo forzamos paso de 1 en 1 para evitar decimales con flechas -->
              <input matInput type="number" [(ngModel)]="payment.amount" required [step]="paymentMode === 'cash' ? 1 : 0.01">
            </mat-form-field>
            
            <!-- Calculadora en tiempo real para Bs (Solo visible si es bancario) -->
            <div *ngIf="paymentMode === 'bank' && payment.amount > 0" class="text-[11px] text-gray-600 bg-gray-100 px-2 py-1.5 rounded-md -mt-4 text-right border border-gray-200">
                Eq: <strong class="font-mono text-indigo-700">Bs. {{ (payment.amount * tasaDelDia()) | number:'1.2-2' }}</strong>
            </div>
        </div>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Fecha del Pago</mat-label>
          <input matInput [matDatepicker]="picker" [(ngModel)]="payment.paymentDate" required [max]="maxDate" readonly (click)="picker.open()">
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>
      </div>

    </mat-dialog-content>
    
    <mat-dialog-actions align="end" class="pb-4 pr-4">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" (click)="submit()" 
              [disabled]="isSubmitDisabled()">
        Procesar Pago
      </button>
    </mat-dialog-actions>
  `
})
export class AdminPaymentModalComponent implements OnInit {
  maxDate: Date = new Date();

  private billingService = inject(BillingService);
  private apartmentService = inject(ApartmentService);
  private paymentService = inject(PaymentService); // 🔥 Para consultar la tasa
  private dateAdapter = inject(DateAdapter);

  banks = signal<any[]>([]);

  // 🔥 Señales para la Tasa de Cambio
  tasaDelDia = signal<number>(1);
  fechaTasa = signal<string>('');

  // Controla la vista del modal
  paymentMode = 'bank'; // 'bank' | 'cash'

  payment = {
    bankAccountId: null,
    operationType: 'same_bank',
    reference: '',
    amount: 0,
    paymentDate: new Date()
  };

  constructor(
    public dialogRef: MatDialogRef<AdminPaymentModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.payment.amount = Number(this.data.balance);
    this.dateAdapter.setLocale('es-ES');
  }

  ngOnInit() {
    // 1. Cargar bancos
    this.apartmentService.getBankAccounts(this.data.buildingId).subscribe({
      next: (res: any) => this.banks.set(res.data)
    });

    // 2. 🔥 Cargar la Tasa de Cambio Oficial
    this.paymentService.getLatestExchangeRate().subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.tasaDelDia.set(Number(res.data.rate));
          const rawDate = res.data.rate_date ? res.data.rate_date.split('T')[0] : '';
          this.fechaTasa.set(rawDate);
        }
      },
      error: (err) => console.error("Error al cargar la tasa", err)
    });
  }

  // Validación dinámica del botón Submit dependiendo del tipo de pago
  isSubmitDisabled(): boolean {
    if (!this.payment.amount || this.payment.amount <= 0) return true;

    if (this.paymentMode === 'bank') {
      return !this.payment.bankAccountId || !this.payment.reference;
    }

    // Si es cash, el amount ya fue validado arriba, los demás campos no importan
    return false;
  }

  submit() {
    // 🔥 VALIDACIÓN ESTRICTA DE EFECTIVO (Solo enteros)
    if (this.paymentMode === 'cash') {
      if (!Number.isInteger(this.payment.amount)) {
        alert('❌ Error: Los pagos en efectivo solo aceptan montos con números enteros (sin decimales).');
        return; // Cortamos la ejecución
      }
    }

    // 🔥 PREPARAMOS LOS DATOS SEGÚN EL MODO
    const isCash = this.paymentMode === 'cash';

    const finalBankAccountId = isCash ? '' : String(this.payment.bankAccountId);
    const finalOpType = isCash ? 'cash' : this.payment.operationType;
    const finalReference = isCash ? 'EFECTIVO' : this.payment.reference;

    // Configuración Bimonetaria
    const finalCurrency = isCash ? 'USD' : 'VES';
    const finalRate = isCash ? 1.0000 : this.tasaDelDia();

    // Si es cash es 1:1, si es banco calculamos los Bs reales
    const finalAmountLocal = isCash ? this.payment.amount : parseFloat((this.payment.amount * this.tasaDelDia()).toFixed(2));

    const payload = {
      receiptId: this.data.id,
      apartmentId: this.data.apartmentId,
      bankAccountId: finalBankAccountId,
      operationType: finalOpType,
      reference: finalReference,
      amount: this.payment.amount, // El valor neto que descuenta la deuda
      paymentDate: this.payment.paymentDate.toISOString().split('T')[0],

      // 🔥 Nuevos campos
      currency: finalCurrency,
      exchangeRate: finalRate,
      amountLocal: finalAmountLocal
    };

    this.billingService.registerAdminPayment(payload).subscribe({
      next: (res) => {
        alert(res.message);
        this.dialogRef.close(true);
      },
      error: (err) => alert('Error: ' + err.error?.message)
    });
  }
}