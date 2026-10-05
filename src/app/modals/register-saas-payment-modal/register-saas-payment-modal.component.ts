import { Component, Inject, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  SaaSAdmin,
  SaasInvoice,
  SaasService
} from '../../core/services/saas.service';
import { DateOnlyPipe } from '../../shared/date-only.pipe';

export type RegisterSaasPaymentModalResult = {
  invoice_id: number;
  amount_paid: number;
  payment_method: string;
  reference_number: string;
  payment_date: string;
  notes?: string;
};

@Component({
  selector: 'app-register-saas-payment-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DateOnlyPipe
  ],
  template: `
    <div class="p-2">
      <div class="flex justify-between items-center mb-2">
        <h2 mat-dialog-title class="m-0 font-black text-gray-800 text-xl">Registrar pago SaaS</h2>
        <button mat-icon-button type="button" (click)="dialogRef.close()" class="text-gray-400">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content>
        <p class="text-sm text-gray-500 mt-0 mb-4">
          Cliente: <strong class="text-teal-700">{{ data.name }}</strong>
          <span class="text-gray-400"> · #{{ data.id }}</span>
        </p>

        @if (loading()) {
          <div class="flex justify-center py-8">
            <mat-spinner diameter="36"></mat-spinner>
          </div>
        } @else if (loadError()) {
          <p class="text-amber-800 bg-amber-50 rounded-lg p-3 text-sm">{{ loadError() }}</p>
        } @else if (!openInvoices().length) {
          <p class="text-gray-600 text-sm">No hay facturas pendientes o en mora para este cliente.</p>
        } @else {
          <form [formGroup]="form" class="flex flex-col gap-1">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Factura a pagar</mat-label>
              <mat-select formControlName="invoice_id" (selectionChange)="onInvoiceChange()">
                @for (inv of openInvoices(); track inv.id) {
                  <mat-option [value]="inv.id">
                    {{ periodLabel(inv) }} · {{ inv.fee_amount | number:'1.2-2' }} {{ inv.currency }}
                    · {{ statusLabel(inv.status) }}
                    · vence {{ inv.due_date | dateOnly }}
                  </mat-option>
                }
              </mat-select>
              <mat-hint>Orden: la más antigua primero (recomendado FIFO).</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Monto recibido</mat-label>
              <input matInput type="number" formControlName="amount_paid" step="0.01" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Método</mat-label>
              <mat-select formControlName="payment_method">
                <mat-option value="Zelle / Transferencia">Zelle / Transferencia</mat-option>
                <mat-option value="Efectivo">Efectivo</mat-option>
                <mat-option value="Pago móvil">Pago móvil</mat-option>
                <mat-option value="Otro">Otro</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Referencia</mat-label>
              <input matInput formControlName="reference_number" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Fecha de pago</mat-label>
              <input matInput type="date" formControlName="payment_date" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Notas (opcional)</mat-label>
              <textarea matInput rows="2" formControlName="notes"></textarea>
            </mat-form-field>
          </form>
        }
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="pt-2">
        <button mat-button type="button" (click)="dialogRef.close()">Cancelar</button>
        <button mat-flat-button color="primary" class="font-bold"
          [disabled]="form.invalid || loading() || !openInvoices().length"
          (click)="submit()">
          <mat-icon>payments</mat-icon>
          Registrar pago
        </button>
      </mat-dialog-actions>
    </div>
  `
})
export class RegisterSaasPaymentModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private saasService = inject(SaasService);

  loading = signal(true);
  loadError = signal<string | null>(null);
  openInvoices = signal<SaasInvoice[]>([]);

  form: FormGroup = this.fb.group({
    invoice_id: [null as number | null, Validators.required],
    amount_paid: [0, [Validators.required, Validators.min(0.01)]],
    payment_method: ['Zelle / Transferencia', Validators.required],
    reference_number: ['', Validators.required],
    payment_date: [this.todayYmd(), Validators.required],
    notes: ['']
  });

  constructor(
    public dialogRef: MatDialogRef<RegisterSaasPaymentModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SaaSAdmin
  ) {}

  ngOnInit(): void {
    this.saasService.getAdminInvoices(this.data.id).subscribe({
      next: (res) => {
        const list = (res.data ?? []).filter((i) =>
          i.status === 'PENDING' || i.status === 'OVERDUE'
        );
        list.sort((a, b) => {
          if (a.period_year !== b.period_year) return a.period_year - b.period_year;
          return a.period_month - b.period_month;
        });
        this.openInvoices.set(list);
        if (list.length) {
          const first = list[0];
          this.form.patchValue({
            invoice_id: first.id,
            amount_paid: first.fee_amount
          });
        }
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('No se pudieron cargar las facturas abiertas.');
        this.loading.set(false);
      }
    });
  }

  periodLabel(inv: SaasInvoice): string {
    return `${String(inv.period_month).padStart(2, '0')}/${inv.period_year}`;
  }

  statusLabel(status: string): string {
    if (status === 'OVERDUE') return 'En mora';
    if (status === 'PENDING') return 'Pendiente';
    return status;
  }

  onInvoiceChange(): void {
    const id = this.form.get('invoice_id')?.value;
    const inv = this.openInvoices().find((i) => i.id === id);
    if (inv) {
      this.form.patchValue({ amount_paid: inv.fee_amount });
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.dialogRef.close({
      invoice_id: v.invoice_id,
      amount_paid: Number(v.amount_paid),
      payment_method: v.payment_method,
      reference_number: v.reference_number,
      payment_date: v.payment_date,
      notes: v.notes || undefined
    } satisfies RegisterSaasPaymentModalResult);
  }

  private todayYmd(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
