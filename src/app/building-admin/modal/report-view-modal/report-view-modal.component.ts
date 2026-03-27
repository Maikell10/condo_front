import { Component, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
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
    /* Estilos para que al imprimir solo salga el reporte y no los botones del modal */
    @media print {
      .no-print {
        display: none !important;
      }
      mat-dialog-container {
        box-shadow: none !important;
        padding: 0 !important;
      }
      .max-w-4xl {
        max-width: 100% !important;
      }
    }
  `]
})
export class ReportViewModalComponent {
  // Inyectamos la referencia del modal y los datos recibidos del componente padre
  public dialogRef = inject(MatDialogRef<ReportViewModalComponent>);
  public data = inject(MAT_DIALOG_DATA);

  /**
   * Dispara el diálogo de impresión del sistema.
   * Gracias a los estilos CSS de arriba, se ocultarán los botones al generar el PDF.
   */
  printReport() {
    window.print();
  }
}