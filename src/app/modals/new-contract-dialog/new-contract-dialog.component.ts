import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-new-contract-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title class="font-bold text-gray-800 border-b pb-2">Registrar Contrato de Servicio</h2>
    
    <mat-dialog-content class="pt-4">
      <form [formGroup]="contractForm" class="flex flex-col gap-4">
        
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Proveedor / Empresa</mat-label>
          <input matInput formControlName="provider" placeholder="Ej: Ascensores Caracas C.A.">
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Descripción del Servicio</mat-label>
          <input matInput formControlName="service" placeholder="Ej: Mantenimiento mensual preventivo">
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Monto Mensual Fijo ($)</mat-label>
          <input matInput type="number" formControlName="monthlyCost" placeholder="0.00">
          <span matPrefix class="mr-1">$</span>
        </mat-form-field>

        <div class="grid grid-cols-2 gap-4">
          <mat-form-field appearance="outline">
            <mat-label>Fecha de Inicio</mat-label>
            <input matInput [matDatepicker]="startPicker" formControlName="startDate">
            <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
            <mat-datepicker #startPicker></mat-datepicker>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Fecha de Vencimiento</mat-label>
            <input matInput [matDatepicker]="endPicker" formControlName="endDate">
            <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
            <mat-datepicker #endPicker></mat-datepicker>
          </mat-form-field>
        </div>

      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="p-4 border-t">
      <button mat-button (click)="dialogRef.close()">Cancelar</button>
      <button mat-flat-button color="primary" 
              class="px-6"
              [disabled]="contractForm.invalid" 
              (click)="save()">
        Guardar Contrato
      </button>
    </mat-dialog-actions>
  `
})
export class NewContractDialogComponent {
  private fb = inject(FormBuilder);
  public dialogRef = inject(MatDialogRef<NewContractDialogComponent>);

  contractForm: FormGroup = this.fb.group({
    provider: ['', Validators.required],
    service: ['', Validators.required],
    monthlyCost: ['', [Validators.required, Validators.min(1)]],
    startDate: [new Date(), Validators.required],
    endDate: ['', Validators.required]
  });

  save() {
    if (this.contractForm.valid) {
      this.dialogRef.close(this.contractForm.value);
    }
  }
}