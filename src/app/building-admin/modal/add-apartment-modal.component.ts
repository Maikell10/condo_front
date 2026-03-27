import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-add-apartment-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
    template: `
    <h2 mat-dialog-title class="font-bold text-gray-800">Registrar Nuevo Apartamento</h2>
    <mat-dialog-content class="pt-2">
      <form [formGroup]="aptForm" class="flex flex-col gap-4">
        
        <mat-form-field appearance="outline">
          <mat-label>Número / Identificador</mat-label>
          <input matInput formControlName="number" placeholder="Ej: PH-1, 12-A...">
          <mat-error>El número es obligatorio</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Alícuota (Copropiedad)</mat-label>
          <input matInput type="number" formControlName="alicuota" placeholder="0.0520">
          <span matSuffix class="pr-3">%</span>
          <mat-hint>Ingrese el valor decimal (ej: 0.05 para 5%)</mat-hint>
        </mat-form-field>

      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="p-4 border-t">
      <button mat-button (click)="dialogRef.close()">Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="aptForm.invalid" (click)="save()">
        Crear Unidad
      </button>
    </mat-dialog-actions>
  `
})
export class AddApartmentModalComponent {
    private fb = inject(FormBuilder);
    public dialogRef = inject(MatDialogRef<AddApartmentModalComponent>);

    aptForm: FormGroup = this.fb.group({
        number: ['', Validators.required],
        alicuota: ['', [Validators.required, Validators.min(0.0001)]]
    });

    save() {
        if (this.aptForm.valid) {
            this.dialogRef.close(this.aptForm.value);
        }
    }
}