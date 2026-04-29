import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-bank-account-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDividerModule],
  template: `
    <h2 mat-dialog-title class="font-black text-gray-800">
      {{ isEdit ? 'Editar Cuenta' : 'Nueva Cuenta Bancaria' }}
    </h2>
    
    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-4 mt-2 min-w-[400px]">
        
        <mat-form-field appearance="outline">
          <mat-label>Nombre del Banco</mat-label>
          <input matInput formControlName="bank_name" placeholder="Ej: Banco Mercantil">
        </mat-form-field>

        <div class="grid grid-cols-2 gap-4">
            <mat-form-field appearance="outline">
                <mat-label>Tipo de Cuenta</mat-label>
                <mat-select formControlName="account_type">
                    <mat-option value="CORRIENTE">Corriente</mat-option>
                    <mat-option value="AHORRO">Ahorro</mat-option>
                    <mat-option value="EXTRANJERA">Dólares / Extranjera</mat-option>
                </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
                <mat-label>Número de Cuenta</mat-label>
                <input matInput formControlName="account_number" placeholder="20 dígitos" maxlength="20">
            </mat-form-field>
        </div>

        <mat-divider class="my-2"></mat-divider>

        <mat-form-field appearance="outline">
          <mat-label>Nombre del Titular</mat-label>
          <input matInput formControlName="holder_name" placeholder="Ej: Condominio Residencias Indiana">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Identificación (RIF / Cédula)</mat-label>
          <input matInput formControlName="holder_id" placeholder="Ej: J-29626110-5">
        </mat-form-field>

      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="pb-4 pr-4">
      <button mat-button mat-dialog-close class="text-gray-500">Cancelar</button>
      <button mat-flat-button color="primary" class="rounded-xl shadow-md" 
              [disabled]="form.invalid" (click)="save()">
        {{ isEdit ? 'Actualizar Cuenta' : 'Registrar Cuenta' }}
      </button>
    </mat-dialog-actions>
  `
})
export class BankAccountDialogComponent {
  private fb = inject(FormBuilder);
  dialogRef = inject(MatDialogRef<BankAccountDialogComponent>);
  data = inject(MAT_DIALOG_DATA, { optional: true });

  isEdit = !!this.data;

  form = this.fb.group({
    bank_name: [this.data?.bank_name || '', Validators.required],
    account_number: [this.data?.account_number || '', [Validators.required, Validators.minLength(10)]],
    account_type: [this.data?.account_type || 'CORRIENTE', Validators.required],
    holder_name: [this.data?.holder_name || '', Validators.required],
    holder_id: [this.data?.holder_id || '', Validators.required]
  });

  save() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}