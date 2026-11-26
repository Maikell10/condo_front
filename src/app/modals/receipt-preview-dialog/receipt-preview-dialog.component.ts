import { Component, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ReceiptPreviewDialogData {
  buildingName: string;
  unit: string;
  issueDate: string;
  monthYear: string;
  ownerName: string;
  quota: string;
  lineItems: { concept: string; commonExpense: number; individualShare: number }[];
  totalGastoComun: number;
  totalGastoIndividual: number;
  totalBill: number;
  accessCode: string;
  status: string;
}

@Component({
  selector: 'app-receipt-preview-dialog',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './receipt-preview-dialog.component.html',
  styleUrl: './receipt-preview-dialog.component.scss'
})
export class ReceiptPreviewDialogComponent {
  data = inject<ReceiptPreviewDialogData>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<ReceiptPreviewDialogComponent>);

  isPaid(): boolean {
    const s = this.data.status;
    return s === 'PAID' || s === 'APPROVED';
  }

  statusLabel(): string {
    return this.isPaid() ? 'Pagado' : 'Pendiente';
  }

  close(): void {
    this.dialogRef.close();
  }

  print(): void {
    window.print();
  }
}