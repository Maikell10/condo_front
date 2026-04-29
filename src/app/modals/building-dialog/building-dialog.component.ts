import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-building-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    <h2 mat-dialog-title class="font-black italic text-gray-800">
      {{ isEdit ? 'Editar Edificio' : 'Nuevo Edificio' }}
    </h2>
    
    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-4 mt-2 min-w-[350px]">
        
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Código</mat-label>
          <input matInput formControlName="code" placeholder="Ej: RES-01">
          <mat-error *ngIf="form.get('code')?.hasError('required')">El código es obligatorio</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Nombre del Edificio</mat-label>
          <input matInput formControlName="name" placeholder="Ej: Residencias El Sol">
          <mat-error *ngIf="form.get('name')?.hasError('required')">El nombre es obligatorio</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Dirección</mat-label>
          <textarea matInput formControlName="address" rows="3" placeholder="Dirección completa..."></textarea>
        </mat-form-field>

      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="pb-4 pr-4">
      <button mat-button mat-dialog-close class="text-gray-500">Cancelar</button>
      <button mat-flat-button color="primary" class="rounded-xl shadow-md" 
              [disabled]="form.invalid" (click)="save()">
        {{ isEdit ? 'Actualizar' : 'Guardar' }}
      </button>
    </mat-dialog-actions>
  `
})
export class BuildingDialogComponent {
  private fb = inject(FormBuilder);
  dialogRef = inject(MatDialogRef<BuildingDialogComponent>);

  // Usamos { optional: true } por si abrimos el modal en modo "Crear" (sin datos)
  data = inject(MAT_DIALOG_DATA, { optional: true });

  isEdit = !!this.data;

  form = this.fb.group({
    name: [this.data?.name || '', Validators.required],
    code: [this.data?.code || '', Validators.required],
    address: [this.data?.address || '']
  });

  save() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value); // Enviamos los datos del form al componente padre
    }
  }
}