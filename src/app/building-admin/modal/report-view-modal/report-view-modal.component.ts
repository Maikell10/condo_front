import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-report-view-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './report-view-modal.component.html',
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      max-height: 85vh;
    }

    .report-dialog {
      display: flex;
      flex-direction: column;
      min-height: 0;
      max-height: 85vh;
    }

    .report-dialog-body {
      flex: 1 1 auto;
      min-height: 0;
      max-height: none;
      overflow: auto;
    }

    @media print {
      :host,
      .report-dialog {
        max-height: none;
      }
      .no-print {
        display: none !important;
      }
      .report-dialog-body {
        overflow: visible !important;
        max-height: none !important;
      }
      mat-dialog-container {
        box-shadow: none !important;
        padding: 0 !important;
      }
    }
  `]
})
export class ReportViewModalComponent {
  public dialogRef = inject(MatDialogRef<ReportViewModalComponent>);
  public data = inject(MAT_DIALOG_DATA);

  private readonly monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  get periodLabel(): string {
    const month = Number(this.data?.month);
    const name = this.monthNames[month - 1] || String(this.data?.month ?? '');
    return `${name} ${this.data?.year ?? ''}`.trim();
  }

  printReport() {
    window.print();
  }
}