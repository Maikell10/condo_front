import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApartmentService } from '../../../core/services/apartment.service';
import { AuthService } from '../../../core/services/auth.service';
import { AdminUserOwnedApartment, AdminUserRow, displayUserEmail } from '../../../admin/pages/users/admin-user.model';
import {
  formatStoredCedula,
  formatStoredPhone,
  parseIsoDate,
  parseStoredCedula,
  parseStoredPhone,
  toIsoDate
} from '../../../admin/pages/users/admin-user-profile.util';
import { OwnerDataLoaderComponent } from '../../shared/owner-data-loader/owner-data-loader.component';

function optionalEmail(control: AbstractControl): ValidationErrors | null {
  const value = (control.value ?? '').trim();
  if (!value) return null;
  return Validators.email(control);
}

function phoneLocalValidator(control: AbstractControl): ValidationErrors | null {
  const digits = (control.value ?? '').replace(/\D/g, '');
  if (!digits) return null;
  return digits.length === 10 ? null : { phoneLength: true };
}

@Component({
  selector: 'app-owner-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatSnackBarModule,
    OwnerDataLoaderComponent
  ],
  templateUrl: './owner-profile.component.html',
  styleUrl: './owner-profile.component.scss'
})
export class OwnerProfileComponent implements OnInit {
  @Input() presentation: 'page' | 'dialog' = 'page';
  @Output() saved = new EventEmitter<void>();
  private fb = inject(FormBuilder);
  private apartments = inject(ApartmentService);
  private auth = inject(AuthService);
  private snack = inject(MatSnackBar);

  loading = signal(true);
  saving = signal(false);
  loadError = signal('');
  units = signal<AdminUserOwnedApartment[]>([]);

  readonly maxBirthDate = new Date();
  readonly minBirthDate = new Date(1900, 0, 1);
  birthPickerStartAt = new Date(1985, 0, 1);
  touchUi = typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches;

  form = this.fb.group({
    name: ['', Validators.required],
    docType: ['V'],
    docNumber: ['', Validators.pattern(/^\d*$/)],
    phoneCountry: ['+58'],
    phoneLocal: ['', phoneLocalValidator],
    email: ['', optionalEmail],
    sex: [''],
    birthDate: [null as Date | null]
  });

  ngOnInit(): void {
    this.apartments.getMyProfile().subscribe({
      next: (res) => {
        this.applyProfile(res.data);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loadError.set(err.error?.message || 'No se pudieron cargar tus datos.');
        this.loading.set(false);
      }
    });
  }

  onDigitsInput(event: Event, controlName: 'docNumber' | 'phoneLocal', maxLen: number): void {
    const input = event.target as HTMLInputElement;
    const cleaned = input.value.replace(/\D/g, '').slice(0, maxLen);
    if (input.value !== cleaned) {
      input.value = cleaned;
    }
    this.form.get(controlName)?.setValue(cleaned);
    this.form.get(controlName)?.markAsTouched();
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const phone = formatStoredPhone(raw.phoneCountry, raw.phoneLocal);
    if (raw.phoneLocal?.replace(/\D/g, '') && !phone) {
      this.form.get('phoneLocal')?.setErrors({ phoneLength: true });
      return;
    }

    this.saving.set(true);
    this.apartments.updateMyProfile({
      name: raw.name,
      email: (raw.email ?? '').trim(),
      cedula: formatStoredCedula(raw.docType, raw.docNumber),
      phone,
      sex: raw.sex === 'M' || raw.sex === 'F' ? raw.sex : null,
      birthDate: toIsoDate(raw.birthDate)
    }).subscribe({
      next: (res) => {
        this.applyProfile(res.data);
        this.auth.patchStoredUser({
          name: res.data.name,
          email: displayUserEmail(res.data.email, 'OWNER')
        });
        this.saving.set(false);
        this.snack.open('Datos guardados', 'Cerrar', { duration: 3000 });
        this.saved.emit();
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.snack.open(err.error?.message || 'No se pudieron guardar los datos', 'Cerrar', { duration: 4000 });
      }
    });
  }

  private applyProfile(row: AdminUserRow): void {
    const cedula = parseStoredCedula(row.cedula);
    const phone = parseStoredPhone(row.phone);
    const birthDate = parseIsoDate(row.birthDate ?? null);
    if (birthDate) this.birthPickerStartAt = birthDate;
    this.units.set(row.ownedApartments ?? []);
    this.form.patchValue({
      name: row.name || '',
      docType: cedula.docType,
      docNumber: cedula.docNumber,
      phoneCountry: phone.countryCode,
      phoneLocal: phone.local,
      email: displayUserEmail(row.email, 'OWNER'),
      sex: row.sex ?? '',
      birthDate
    });
  }
}
