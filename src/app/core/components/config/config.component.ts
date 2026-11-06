import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '../../../core/services/auth.service';
import { ConfigService } from '../../../core/services/config.service';
import { PaymentService } from '../../../core/services/payment.service';

@Component({
  selector: 'app-config',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, MatSlideToggleModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule,
    MatDividerModule, MatSnackBarModule, MatRadioModule
  ],
  templateUrl: './config.component.html'
})
export class ConfigComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private configService = inject(ConfigService);
  private paymentService = inject(PaymentService);
  private snackBar = inject(MatSnackBar);

  role = computed(() => this.authService.userSignal()?.role);
  isSubmitting = signal(false);

  exchangeRateLoading = signal(false);
  exchangeRateSaving = signal(false);
  exchangeRateRefreshing = signal(false);
  exchangeRateRow = signal<{
    id?: number;
    currency?: string;
    rate: number;
    rate_date: string;
    updated_at?: string | null;
    created_at?: string | null;
  } | null>(null);
  exchangeRateEditing = signal(false);

  exchangeRateForm: FormGroup = this.fb.group({
    rate: ['', [Validators.required, Validators.min(0.000001)]],
    rate_date: ['', [Validators.required]]
  });

  // Formulario para BUILDING_ADMIN
  reserveForm: FormGroup = this.fb.group({
    hasReserveFund: [false],
    reserveFundPercentage: [{ value: 0, disabled: true }, [Validators.required, Validators.min(0.1), Validators.max(100)]],
    expenseSplitMode: ['BY_BUILDING']
  });

  // Formularios Demo para SUPER_ADMIN
  superAdminForm: FormGroup = this.fb.group({
    maintenanceMode: [false],
    strictAudit: [true],
    globalNotifications: [true]
  });

  ngOnInit() {
    if (this.role() === 'BUILDING_ADMIN') {
      this.loadSettings();
      this.setupFormReactivity();
    }
    if (this.role() === 'SUPER_ADMIN') {
      this.loadExchangeRateAdmin();
    }
  }

  // Activa o desactiva el input numérico según el estado del toggle
  setupFormReactivity() {
    this.reserveForm.get('hasReserveFund')?.valueChanges.subscribe(isEnabled => {
      const percentageControl = this.reserveForm.get('reserveFundPercentage');
      if (isEnabled) {
        percentageControl?.enable();
      } else {
        percentageControl?.disable();
        percentageControl?.setValue(0);
      }
    });
  }

  loadSettings() {
    this.configService.getAdminSettings().subscribe({
      next: (res) => {
        if (res.data) {
          const hasFund = Boolean(res.data.has_reserve_fund);
          this.reserveForm.patchValue({
            hasReserveFund: hasFund,
            reserveFundPercentage: res.data.reserve_fund_percentage || 0,
            expenseSplitMode: res.data.expense_split_mode === 'BY_APARTMENT' ? 'BY_APARTMENT' : 'BY_BUILDING'
          });
        }
      }
    });
  }

  saveSettings() {
    if (this.reserveForm.invalid) return;

    this.isSubmitting.set(true);
    const payload = this.reserveForm.getRawValue(); // gets values even if disabled

    this.configService.updateAdminSettings(payload).subscribe({
      next: () => {
        this.snackBar.open('✅ Configuración guardada correctamente', 'Cerrar', { duration: 3000 });
        this.isSubmitting.set(false);
      },
      error: () => {
        this.snackBar.open('❌ Error al guardar la configuración', 'Cerrar', { duration: 3000 });
        this.isSubmitting.set(false);
      }
    });
  }

  saveSuperAdminDemo() {
    this.snackBar.open('🔧 Preferencias globales actualizadas (Modo Demo)', 'Cerrar', { duration: 3000 });
  }

  loadExchangeRateAdmin() {
    this.exchangeRateLoading.set(true);
    this.paymentService.getExchangeRateAdmin().subscribe({
      next: (res) => {
        this.exchangeRateLoading.set(false);
        if (res?.success && res.data) {
          this.patchExchangeRow(res.data);
        } else {
          this.exchangeRateRow.set(null);
        }
      },
      error: () => {
        this.exchangeRateLoading.set(false);
        this.snackBar.open('❌ No se pudo cargar la tasa USD', 'Cerrar', { duration: 4000 });
      }
    });
  }

  private patchExchangeRow(data: Record<string, unknown>) {
    const rate = Number(data['rate']);
    const rateDate = String(data['rate_date'] ?? '');
    if (Number.isNaN(rate) || !rateDate) {
      this.exchangeRateRow.set(null);
      return;
    }
    this.exchangeRateRow.set({
      id: data['id'] != null ? Number(data['id']) : undefined,
      currency: data['currency'] != null ? String(data['currency']) : 'USD',
      rate,
      rate_date: rateDate,
      updated_at: data['updated_at'] != null ? String(data['updated_at']) : null,
      created_at: data['created_at'] != null ? String(data['created_at']) : null
    });
  }

  startEditExchangeRate() {
    const row = this.exchangeRateRow();
    const today = new Date().toISOString().slice(0, 10);
    if (row) {
      this.exchangeRateForm.patchValue({
        rate: row.rate,
        rate_date: (row.rate_date ?? '').toString().slice(0, 10)
      });
    } else {
      this.exchangeRateForm.reset({ rate: '', rate_date: today });
    }
    this.exchangeRateEditing.set(true);
  }

  cancelEditExchangeRate() {
    this.exchangeRateEditing.set(false);
  }

  saveExchangeRate() {
    if (this.exchangeRateForm.invalid) return;
    const raw = this.exchangeRateForm.getRawValue();
    const rate = Number(raw.rate);
    const rate_date = String(raw.rate_date ?? '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(rate_date)) {
      this.snackBar.open('❌ La fecha de la tasa debe ser YYYY-MM-DD', 'Cerrar', { duration: 4000 });
      return;
    }
    this.exchangeRateSaving.set(true);
    this.paymentService
      .updateExchangeRateUsd({ rate, rate_date })
      .subscribe({
        next: (res) => {
          this.exchangeRateSaving.set(false);
          this.exchangeRateEditing.set(false);
          if (res?.data) {
            this.patchExchangeRow(res.data);
          }
          this.snackBar.open('✅ Tasa guardada', 'Cerrar', { duration: 3000 });
        },
        error: (err) => {
          this.exchangeRateSaving.set(false);
          const msg = err?.error?.message ?? 'Error al guardar';
          this.snackBar.open(`❌ ${msg}`, 'Cerrar', { duration: 5000 });
        }
      });
  }

  refreshExchangeRateBcv() {
    this.exchangeRateRefreshing.set(true);
    this.paymentService.refreshExchangeRateFromBcv().subscribe({
      next: (res) => {
        this.exchangeRateRefreshing.set(false);
        if (res?.data) {
          this.patchExchangeRow(res.data);
        }
        this.snackBar.open('✅ Tasa cargada desde el BCV', 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        this.exchangeRateRefreshing.set(false);
        const msg = err?.error?.message ?? 'No se pudo obtener el BCV';
        this.snackBar.open(`❌ ${msg}`, 'Cerrar', { duration: 5000 });
      }
    });
  }

  formatRateDateDisplay(value: string | null | undefined): string {
    if (!value) return '—';
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
    if (!m) return String(value);
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatUpdatedAtDisplay(value: string | null | undefined): string {
    if (!value) return '—';
    const normalized = String(value).replace(' ', 'T');
    const d = new Date(normalized);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' });
  }

  /** Muestra cuándo cambió el registro en BD: prioriza updated_at; si no existe, created_at. */
  formatLastDbChangeDisplay(
    updatedAt: string | null | undefined,
    createdAt: string | null | undefined
  ): string {
    const u = updatedAt != null ? String(updatedAt).trim() : '';
    const c = createdAt != null ? String(createdAt).trim() : '';
    return this.formatUpdatedAtDisplay(u || c || null);
  }
}
