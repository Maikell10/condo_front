import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BillingService } from '../../../core/services/billing.service';
import { ReportViewModalComponent } from '../report-view-modal/report-view-modal.component';
import {
  ConfirmActionDialogComponent,
  ConfirmActionDialogData
} from '../../../shared/confirm-action-dialog/confirm-action-dialog.component';

export interface CloseMonthPreviewDialogData {
  isComplex: boolean;
  complexId?: number;
  buildingId?: number;
  month: number;
  year: number;
  periodLabel: string;
  scopeLabel: string;
}

export interface BuildingClosePreview {
  buildingId: number;
  buildingName: string;
  buildingCode: string;
  canClose: boolean;
  alreadyClosed: boolean;
  blockReason?: string | null;
  month: number;
  year: number;
  variableExpenses: unknown[];
  fixedExpenses: unknown[];
  summary: {
    totalVariable: number;
    totalFixed: number;
    subtotalExpenses: number;
    hasReserveFund: boolean;
    reserveFundPercentage: number;
    reserveFundAmount: number;
    totalToDistribute: number;
    totalAmount: number;
    apartmentCount: number;
  };
}

@Component({
  selector: 'app-close-month-preview-dialog',
  standalone: true,
  imports: [
    CommonModule,
    DecimalPipe,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './close-month-preview-dialog.component.html',
  styleUrl: './close-month-preview-dialog.component.scss'
})
export class CloseMonthPreviewDialogComponent implements OnInit {
  private billing = inject(BillingService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  dialogRef = inject(MatDialogRef<CloseMonthPreviewDialogComponent>);
  data = inject<CloseMonthPreviewDialogData>(MAT_DIALOG_DATA);

  loading = signal(true);
  submitting = signal(false);
  loadError = signal<string | null>(null);
  buildings = signal<BuildingClosePreview[]>([]);
  summary = signal<{
    buildingCount?: number;
    closeableCount?: number;
    totalToDistribute?: number;
  } | null>(null);

  closeableBuildings = () => this.buildings().filter((b) => b.canClose);

  ngOnInit(): void {
    this.loadPreview();
  }

  loadPreview(): void {
    this.loading.set(true);
    this.loadError.set(null);

    const { month, year, isComplex, complexId, buildingId } = this.data;
    const req = isComplex && complexId
      ? this.billing.getComplexClosePreview(complexId, month, year)
      : this.billing.getBuildingClosePreview(buildingId!, month, year);

    req.subscribe({
      next: (res: any) => {
        if (this.data.isComplex && complexId && res.data?.buildings) {
          this.buildings.set(res.data.buildings);
          this.summary.set(res.data.summary);
        } else {
          const one = res.data as BuildingClosePreview;
          this.buildings.set([one]);
          this.summary.set({
            buildingCount: 1,
            closeableCount: one.canClose ? 1 : 0,
            totalToDistribute: one.summary.totalToDistribute
          });
        }
        this.loading.set(false);
      },
      error: (err: { error?: { message?: string } }) => {
        this.loading.set(false);
        this.loadError.set(err.error?.message || 'No se pudo cargar la vista previa.');
      }
    });
  }

  openBuildingDetail(preview: BuildingClosePreview): void {
    this.dialog.open(ReportViewModalComponent, {
      width: 'min(720px, 96vw)',
      maxWidth: '96vw',
      maxHeight: '90vh',
      data: {
        ...preview,
        buildingLabel: `${preview.buildingCode} · ${preview.buildingName}`,
        isPreview: true
      }
    });
  }

  confirmClose(): void {
    const closeable = this.closeableBuildings();
    if (!closeable.length) {
      this.snackBar.open('No hay edificios listos para cerrar.', 'Cerrar', { duration: 3500 });
      return;
    }

    const total = closeable.reduce((s, b) => s + Number(b.summary.totalToDistribute || 0), 0);
    const highlights = [
      `Periodo: ${this.data.periodLabel}`,
      `Alcance: ${this.data.scopeLabel}`,
      `Edificios a cerrar: ${closeable.length}`,
      `Monto total a distribuir: $${total.toFixed(2)}`
    ];

    if (this.data.isComplex) {
      highlights.push(
        ...closeable.slice(0, 5).map(
          (b) =>
            `${b.buildingCode}: $${Number(b.summary.totalToDistribute).toFixed(2)}` +
            (b.summary.hasReserveFund
              ? ` (RES_FUND ${b.summary.reserveFundPercentage}%)`
              : '')
        )
      );
      if (closeable.length > 5) {
        highlights.push(`… y ${closeable.length - 5} edificio(s) más`);
      }
    } else if (closeable[0].summary.hasReserveFund) {
      highlights.push(
        `Fondo de reserva: ${closeable[0].summary.reserveFundPercentage}% ($${closeable[0].summary.reserveFundAmount.toFixed(2)})`
      );
    }

    const confirmData: ConfirmActionDialogData = {
      variant: 'approve',
      title: this.data.isComplex
        ? `¿Cerrar ${this.data.periodLabel} en ${closeable.length} edificio(s)?`
        : `¿Confirmar cierre de ${this.data.periodLabel}?`,
      message:
        'Revisaste el detalle de gastos. Al confirmar se generarán los recibos en la base de datos. Esta acción no se puede deshacer desde aquí.',
      confirmLabel: 'Sí, cerrar mes',
      cancelLabel: 'Volver a revisar',
      highlights
    };

    this.dialog
      .open(ConfirmActionDialogComponent, {
        width: 'min(480px, 94vw)',
        data: confirmData
      })
      .afterClosed()
      .subscribe((ok) => {
        if (!ok) return;
        this.executeClose(closeable);
      });
  }

  private executeClose(closeable: BuildingClosePreview[]): void {
    const { month, year, isComplex, complexId, buildingId } = this.data;
    this.submitting.set(true);

    const done = (message: string, success: boolean) => {
      this.submitting.set(false);
      if (success) {
        this.dialogRef.close(true);
        this.snackBar.open(message, 'Cerrar', { duration: 5000 });
      } else {
        this.snackBar.open(message, 'Cerrar', { duration: 5000 });
      }
    };

    if (isComplex && complexId) {
      this.billing.generateBillingBatch({ complexId, month, year }).subscribe({
        next: (res: any) => {
          done(res.message, true);
        },
        error: (err: { error?: { message?: string } }) => {
          done(err.error?.message || 'Error en el cierre en lote', false);
        }
      });
    } else {
      this.billing
        .generateBilling({ buildingId: buildingId!, month, year })
        .subscribe({
          next: (res) => done(res.message, true),
          error: (err: { error?: { message?: string } }) =>
            done(err.error?.message || 'Error al cerrar el mes', false)
        });
    }
  }
}