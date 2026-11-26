import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

export interface NewContractDialogData {
  isComplex?: boolean;
  buildingsList?: { id: number; name: string; code?: string }[];
  currentSelection?: number | 'ALL';
}

function endAfterStart(group: AbstractControl): ValidationErrors | null {
  const start = group.get('startDate')?.value as Date | null;
  const end = group.get('endDate')?.value as Date | null;
  if (!start || !end) return null;
  return end < start ? { beforeStart: true } : null;
}

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
    MatButtonModule,
    MatSelectModule,
    MatIconModule
  ],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'es-ES' }],
  templateUrl: './new-contract-dialog.component.html',
  styleUrl: './new-contract-dialog.component.scss'
})
export class NewContractDialogComponent {
  private fb = inject(FormBuilder);
  private data = inject<NewContractDialogData>(MAT_DIALOG_DATA, { optional: true });
  readonly dialogRef = inject(MatDialogRef<NewContractDialogComponent>);

  readonly buildingsList = signal(this.data?.buildingsList ?? []);

  readonly showBuildingField = () =>
    !!this.data?.isComplex && this.buildingsList().length > 0;

  contractForm: FormGroup = this.buildForm();

  private buildForm(): FormGroup {
    const initialBuilding =
      this.data?.currentSelection !== 'ALL' && this.data?.currentSelection != null
        ? this.data.currentSelection
        : null;

    const buildingValidators = this.showBuildingField() ? [Validators.required] : [];

    return this.fb.group(
      {
        buildingId: [initialBuilding, buildingValidators],
        provider: ['', Validators.required],
        service: ['', Validators.required],
        monthlyCost: ['', [Validators.required, Validators.min(0.01)]],
        startDate: [new Date(), Validators.required],
        endDate: ['', Validators.required]
      },
      { validators: endAfterStart }
    );
  }

  close(): void {
    this.dialogRef.close();
  }

  save(): void {
    this.contractForm.markAllAsTouched();
    if (this.contractForm.invalid) return;

    const raw = { ...this.contractForm.value };
    if (!this.showBuildingField()) {
      delete raw.buildingId;
    }
    this.dialogRef.close(raw);
  }
}