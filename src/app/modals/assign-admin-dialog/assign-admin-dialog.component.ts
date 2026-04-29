import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-assign-admin-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title class="font-black text-gray-800">Asignar Administrador</h2>
    
    <mat-dialog-content>
      <p class="text-sm text-gray-500 mb-4">
        Edificio: <strong class="text-indigo-600">{{ data.buildingName }}</strong>
      </p>

      <form [formGroup]="form" class="flex flex-col mt-2 min-w-[350px]">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Correo del Administrador</mat-label>
          <input matInput formControlName="email" type="email" placeholder="ejemplo@latitud.com">
          <mat-hint>El usuario debe estar registrado previamente en el sistema.</mat-hint>
          <mat-error *ngIf="form.get('email')?.hasError('email')">Correo inválido</mat-error>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="pb-4 pr-4">
      <button mat-button mat-dialog-close class="text-gray-500">Cancelar</button>
      <button mat-flat-button color="primary" class="rounded-xl shadow-md" 
              [disabled]="form.invalid" (click)="save()">
        Asignar
      </button>
    </mat-dialog-actions>
  `
})
export class AssignAdminDialogComponent {
  private fb = inject(FormBuilder);
  dialogRef = inject(MatDialogRef<AssignAdminDialogComponent>);
  data = inject(MAT_DIALOG_DATA); // Recibe { buildingId, buildingName, currentEmail }

  form = this.fb.group({
    email: [this.data.currentEmail || '', [Validators.required, Validators.email]]
  });

  save() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value.email);
    }
  }
}