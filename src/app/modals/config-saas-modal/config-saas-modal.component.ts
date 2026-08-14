import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-config-saas-modal',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule
  ],
  template: `
    <div class="p-2">
      <div class="flex justify-between items-center mb-4">
        <h2 mat-dialog-title class="m-0 font-black text-gray-800 text-xl">Configurar Tarifa SaaS</h2>
        <button mat-icon-button (click)="dialogRef.close()" class="text-gray-400">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content>
        <p class="text-sm text-gray-500 mb-6 mt-0">
          Ajusta los parámetros de cobro mensual para el administrador: <br>
          <strong class="text-indigo-600">{{ data.name }}</strong>
        </p>

        <form [formGroup]="configForm" class="flex flex-col gap-2">
          
          <div class="flex gap-4">
            <!-- Monto -->
            <mat-form-field appearance="outline" class="flex-1">
              <mat-label>Tarifa Mensual</mat-label>
              <input matInput type="number" formControlName="feeAmount" placeholder="0.00" step="0.01">
              <mat-error *ngIf="configForm.get('feeAmount')?.hasError('required')">El monto es requerido</mat-error>
              <mat-error *ngIf="configForm.get('feeAmount')?.hasError('min')">Debe ser mayor o igual a 0</mat-error>
            </mat-form-field>

            <!-- Moneda -->
            <mat-form-field appearance="outline" class="w-1/3">
              <mat-label>Moneda</mat-label>
              <mat-select formControlName="currency">
                <mat-option value="USD">USD ($)</mat-option>
                <mat-option value="EUR">EUR (€)</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <!-- Días de gracia (due_days) -->
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Días para Vencimiento (Desde el día 1)</mat-label>
            <input matInput type="number" formControlName="dueDays" placeholder="Ej: 5">
            <mat-icon matSuffix class="text-gray-400 mr-2">calendar_today</mat-icon>
            <mat-hint>Si pones 5, la factura vence el día 5 de cada mes.</mat-hint>
            <mat-error *ngIf="configForm.get('dueDays')?.hasError('required')">Requerido</mat-error>
            <mat-error *ngIf="configForm.get('dueDays')?.hasError('min')">Mínimo 1 día</mat-error>
            <mat-error *ngIf="configForm.get('dueDays')?.hasError('max')">Máximo 31 días</mat-error>
          </mat-form-field>

        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="pt-4">
        <button mat-button (click)="dialogRef.close()" class="text-gray-600 font-bold">Cancelar</button>
        <button mat-flat-button color="primary" class="font-bold rounded-lg px-6" 
                [disabled]="configForm.invalid" 
                (click)="save()">
          <mat-icon>save</mat-icon> Guardar Cambios
        </button>
      </mat-dialog-actions>
    </div>
  `
})
export class ConfigSaasModalComponent {
  private fb = inject(FormBuilder);

  configForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<ConfigSaasModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    // Inicializamos el formulario con los datos actuales del administrador
    this.configForm = this.fb.group({
      feeAmount: [data.billingConfig?.feeAmount || 0, [Validators.required, Validators.min(0)]],
      currency: [data.billingConfig?.currency || 'USD', Validators.required],
      dueDays: [data.due_days || 5, [Validators.required, Validators.min(1), Validators.max(31)]]
    });
  }

  save() {
    if (this.configForm.valid) {
      this.dialogRef.close(this.configForm.value);
    }
  }
}