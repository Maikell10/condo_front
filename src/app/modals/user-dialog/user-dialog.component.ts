import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { AdminService } from '../../core/services/admin.service';
import { AdminUserRow, displayUserEmail } from '../../admin/pages/users/admin-user.model';
import {
  formatStoredCedula,
  formatStoredPhone,
  parseIsoDate,
  parseStoredCedula,
  parseStoredPhone,
  toIsoDate
} from '../../admin/pages/users/admin-user-profile.util';
import {
  BuildingAdminOwnerProfileDialogData,
  isBuildingAdminProfileDialog,
  OwnerUnitScopeRow,
  UserDialogData
} from './user-dialog.model';

function emailValidatorForRole(control: AbstractControl): ValidationErrors | null {
  const role = control.parent?.get('role')?.value;
  const value = (control.value ?? '').trim();
  if (role === 'OWNER' || role == null) {
    if (!value) return null;
    return Validators.email(control);
  }
  if (!value) {
    return { required: true };
  }
  return Validators.email(control);
}

function phoneLocalValidator(control: AbstractControl): ValidationErrors | null {
  const digits = (control.value ?? '').replace(/\D/g, '');
  if (!digits) return null;
  return digits.length === 10 ? null : { phoneLength: true };
}

function resolveAdminRow(data: UserDialogData): AdminUserRow | null {
  if (!data) return null;
  if (isBuildingAdminProfileDialog(data)) return data.owner;
  return data;
}

@Component({
  selector: 'app-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule
  ],
  templateUrl: './user-dialog.component.html',
  styleUrl: './user-dialog.component.scss'
})
export class UserDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private adminService = inject(AdminService);
  dialogRef = inject(MatDialogRef<UserDialogComponent>);
  data = inject(MAT_DIALOG_DATA, { optional: true }) as UserDialogData;

  profileMode = isBuildingAdminProfileDialog(this.data);
  profileUnitLabel = isBuildingAdminProfileDialog(this.data) ? this.data.unitLabel : undefined;

  private adminRow: AdminUserRow | null = resolveAdminRow(this.data);

  isEdit = this.profileMode || !!this.adminRow?.id;
  dialogTitle = this.profileMode
    ? 'Editar propietario'
    : this.isEdit
      ? 'Editar Usuario'
      : 'Registrar Nuevo Usuario';

  loadingUnits = signal(false);
  ownedUnits = signal<{ id: number; number: string; buildingName: string }[]>([]);

  readonly maxBirthDate = new Date();
  readonly minBirthDate = new Date(1900, 0, 1);
  birthPickerStartAt = new Date(1985, 0, 1);
  touchUi = typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches;

  private initialCedula = parseStoredCedula(this.adminRow?.cedula);
  private initialPhone = parseStoredPhone(this.adminRow?.phone);

  form = this.fb.group({
    name: [this.adminRow?.name || '', Validators.required],
    docType: [this.initialCedula.docType],
    docNumber: [this.initialCedula.docNumber, Validators.pattern(/^\d*$/)],
    phoneCountry: [this.initialPhone.countryCode],
    phoneLocal: [this.initialPhone.local, phoneLocalValidator],
    email: [
      displayUserEmail(this.adminRow?.email, this.adminRow?.role ?? 'OWNER'),
      [emailValidatorForRole]
    ],
    sex: [this.adminRow?.sex ?? ''],
    birthDate: [parseIsoDate(this.adminRow?.birthDate ?? null), []],
    role: [this.adminRow?.role || 'OWNER', Validators.required],
    password: ['', this.isEdit ? [] : [Validators.required, Validators.minLength(6)]]
  });

  ngOnInit(): void {
    const birth = this.form.get('birthDate')?.value;
    if (birth instanceof Date && !Number.isNaN(birth.getTime())) {
      this.birthPickerStartAt = birth;
    }

    if (!this.profileMode) {
      this.form.get('role')?.valueChanges.subscribe(() => {
        this.form.get('email')?.updateValueAndValidity();
      });
    }

    if (this.profileMode) {
      const profileData = this.data as BuildingAdminOwnerProfileDialogData;
      this.ownedUnits.set(
        profileData.unitsInScope.map((u: OwnerUnitScopeRow) => ({
          id: u.apartmentId,
          number: u.number,
          buildingName: u.buildingName
        }))
      );
      return;
    }

    if (this.isEdit && this.adminRow?.id) {
      this.loadingUnits.set(this.adminRow.role === 'OWNER');
      this.adminService.getUserById(this.adminRow.id).subscribe({
        next: (res) => {
          const row = res.data;
          if (row.role === 'OWNER') {
            this.ownedUnits.set(row.ownedApartments ?? []);
          }
          const cedula = parseStoredCedula(row.cedula);
          const phone = parseStoredPhone(row.phone);
          const birthDate = parseIsoDate(row.birthDate ?? null);
          if (birthDate) {
            this.birthPickerStartAt = birthDate;
          }
          this.form.patchValue({
            docType: cedula.docType,
            docNumber: cedula.docNumber,
            phoneCountry: phone.countryCode,
            phoneLocal: phone.local,
            email: displayUserEmail(row.email, row.role),
            sex: row.sex ?? '',
            birthDate
          });
          this.loadingUnits.set(false);
        },
        error: () => this.loadingUnits.set(false)
      });
    }
  }

  onDigitsInput(event: Event, controlName: 'docNumber' | 'phoneLocal', maxLen: number): void {
    const input = event.target as HTMLInputElement;
    const cleaned = input.value.replace(/\D/g, '').slice(0, maxLen);
    if (input.value !== cleaned) {
      input.value = cleaned;
    }
    this.form.get(controlName)?.setValue(cleaned, { emitEvent: true });
    this.form.get(controlName)?.markAsTouched();
  }

  save(): void {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const cedula = formatStoredCedula(raw.docType, raw.docNumber);
    const phone = formatStoredPhone(raw.phoneCountry, raw.phoneLocal);

    if (raw.phoneLocal?.replace(/\D/g, '') && !phone) {
      this.form.get('phoneLocal')?.setErrors({ phoneLength: true });
      return;
    }

    const payload: Record<string, unknown> = {
      name: raw.name,
      email: (raw.email ?? '').trim(),
      cedula,
      phone,
      sex: raw.sex === 'M' || raw.sex === 'F' ? raw.sex : null,
      birthDate: toIsoDate(raw.birthDate)
    };

    if (!this.profileMode) {
      payload['role'] = raw.role;
      if (!this.isEdit && raw.password) {
        payload['password'] = raw.password;
      }
    }

    this.dialogRef.close(payload);
  }
}
