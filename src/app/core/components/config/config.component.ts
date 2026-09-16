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
  private snackBar = inject(MatSnackBar);

  role = computed(() => this.authService.userSignal()?.role);
  isSubmitting = signal(false);

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
}