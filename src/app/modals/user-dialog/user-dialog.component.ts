import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-user-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title class="font-black tracking-tight text-gray-800">
      {{ isEdit ? 'Editar Usuario' : 'Registrar Nuevo Usuario' }}
    </h2>
    
    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-4 mt-2 min-w-[350px]">
        
        <mat-form-field appearance="outline">
          <mat-label>Nombre Completo</mat-label>
          <input matInput formControlName="name" placeholder="Ej: Juan Pérez">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Correo Electrónico</mat-label>
          <input matInput formControlName="email" type="email" placeholder="juan@correo.com">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Rol en el Sistema</mat-label>
          <mat-select formControlName="role">
            <mat-option value="OWNER">Propietario</mat-option>
            <mat-option value="BUILDING_ADMIN">Admin. de Edificio</mat-option>
            <mat-option value="SUPER_ADMIN">Super Administrador</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" *ngIf="!isEdit">
          <mat-label>Contraseña Temporal</mat-label>
          <input matInput formControlName="password" type="password">
          <mat-hint>El usuario podrá cambiarla luego</mat-hint>
        </mat-form-field>

      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="pb-4 pr-4">
      <button mat-button mat-dialog-close class="text-gray-500">Cancelar</button>
      <button mat-flat-button color="primary" class="rounded-xl shadow-md" 
              [disabled]="form.invalid" (click)="save()">
        {{ isEdit ? 'Guardar Cambios' : 'Registrar Usuario' }}
      </button>
    </mat-dialog-actions>
  `
})
export class UserDialogComponent {
  private fb = inject(FormBuilder);
  dialogRef = inject(MatDialogRef<UserDialogComponent>);
  data = inject(MAT_DIALOG_DATA, { optional: true });

  isEdit = !!this.data;

  form = this.fb.group({
    name: [this.data?.name || '', Validators.required],
    email: [this.data?.email || '', [Validators.required, Validators.email]],
    role: [this.data?.role || 'OWNER', Validators.required],
    // Si es edición, no validamos la contraseña. Si es nuevo, es obligatoria.
    password: ['', this.isEdit ? [] : [Validators.required, Validators.minLength(6)]]
  });

  save() {
    if (this.form.valid) {
      // Si estamos editando, eliminamos el campo password del objeto que enviamos al backend
      const formData = { ...this.form.value };
      if (this.isEdit) delete formData.password;

      this.dialogRef.close(formData);
    }
  }
}