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
import { BillingService } from '../../../core/services/billing.service';
import { ApartmentService } from '../../../core/services/apartment.service';

@Component({
  selector: 'app-admin-payment-modal',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' }
  ],
  template: `
    <h2 mat-dialog-title class="font-black text-gray-800">Registrar Pago Recibido</h2>
    <mat-dialog-content class="space-y-4 pt-4">
      
      <div class="bg-indigo-50 p-3 rounded-xl border border-indigo-100 mb-4">
        <p class="text-xs text-indigo-800 font-bold m-0">Apt: {{ data.apartment }} | Propietario: {{ data.ownerName || 'N/A' }}</p>
        <p class="text-lg text-indigo-900 font-black m-0">Deuda: \${{ data.balance }}</p>
      </div>

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

      <div class="grid grid-cols-2 gap-4">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Monto a Pagar ($)</mat-label>
          <input matInput type="number" [(ngModel)]="payment.amount" required>
          <mat-hint>Puedes registrar abonos parciales</mat-hint>
        </mat-form-field>

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
              [disabled]="!payment.bankAccountId || !payment.reference || !payment.amount">
        Procesar Pago
      </button>
    </mat-dialog-actions>
  `
})
export class AdminPaymentModalComponent implements OnInit {
  maxDate: Date = new Date();
  private billingService = inject(BillingService);
  private apartmentService = inject(ApartmentService);

  private dateAdapter = inject(DateAdapter);

  banks = signal<any[]>([]);
  payment = {
    bankAccountId: null,
    operationType: 'same_bank',
    reference: '',
    amount: 0,
    paymentDate: new Date()
  };

  constructor(
    public dialogRef: MatDialogRef<AdminPaymentModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any // Recibimos el recibo completo
  ) {
    // Autocompletamos el monto con la deuda total por defecto para comodidad
    this.payment.amount = Number(this.data.balance);

    this.dateAdapter.setLocale('es-ES');
  }

  ngOnInit() {
    // Usamos el buildingId que inyectamos en el backend
    this.apartmentService.getBankAccounts(this.data.buildingId).subscribe({
      next: (res: any) => this.banks.set(res.data)
    });
  }

  submit() {
    const payload = {
      receiptId: this.data.id,
      apartmentId: this.data.apartmentId,
      bankAccountId: String(this.payment.bankAccountId), // Convertimos a string según tu BD
      operationType: this.payment.operationType,
      reference: this.payment.reference,
      amount: this.payment.amount,
      // Formateamos la fecha a YYYY-MM-DD para MySQL
      paymentDate: this.payment.paymentDate.toISOString().split('T')[0]
    };

    this.billingService.registerAdminPayment(payload).subscribe({
      next: (res) => {
        alert(res.message);
        this.dialogRef.close(true); // Cerramos e indicamos éxito
      },
      error: (err) => alert('Error: ' + err.error?.message)
    });
  }
}