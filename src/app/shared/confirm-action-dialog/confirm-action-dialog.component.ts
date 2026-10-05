import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export type ConfirmActionVariant = 'approve' | 'reject' | 'neutral';

export interface ConfirmActionDialogData {
  variant: ConfirmActionVariant;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Líneas opcionales (unidad, monto, referencia…) */
  highlights?: string[];
}

@Component({
  selector: 'app-confirm-action-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './confirm-action-dialog.component.html',
  styleUrl: './confirm-action-dialog.component.scss'
})
export class ConfirmActionDialogComponent {
  data = inject<ConfirmActionDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<ConfirmActionDialogComponent, boolean>);

  icon(): string {
    if (this.data.variant === 'approve') return 'verified';
    if (this.data.variant === 'reject') return 'block';
    return 'help_outline';
  }

  confirm(): void {
    this.dialogRef.close(true);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
