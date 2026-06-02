import { Component, OnInit, signal, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // 🔥 IMPORTANTE
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTableModule,
    MatProgressBarModule,
    MatSnackBarModule // 🔥 AGREGADO AQUÍ
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

  private adminService = inject(AdminService);
  private snackBar = inject(MatSnackBar); // Para notificaciones

  // 🔥 Referencia al input de archivo oculto
  @ViewChild('fileInput') fileInput!: ElementRef;

  isUploading = signal(false); // Para deshabilitar el botón y mostrar carga

  globalMetrics = signal({
    totalBuildings: 0,
    activeUsers: 0,
    monthlyRevenue: 0,
    activeIncidents: 0
  });

  attentionRequired = signal<any[]>([]);
  recentActivity = signal<any[]>([]);

  displayedColumns = ['time', 'user', 'action', 'target', 'type'];

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.adminService.getDashboardStats().subscribe({
      next: (res: any) => {
        this.globalMetrics.set(res.metrics);
        this.attentionRequired.set(res.attentionRequired);
        this.recentActivity.set(res.recentActivity);
      },
      error: (err) => console.error("Error al cargar el dashboard", err)
    });
  }

  exportReport() {
    console.log("Generando PDF global...");
  }

  // ==========================================
  // 🔥 LÓGICA DE CARGA MASIVA DE CSV
  // ==========================================

  triggerFileUpload() {
    this.fileInput.nativeElement.click(); // Simula el clic en el input invisible
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      // Validar que sea CSV
      if (file.type !== 'text/csv' && !file.name.toLowerCase().endsWith('.csv')) {
        this.snackBar.open('Por favor, selecciona un archivo CSV válido.', 'Cerrar', { duration: 4000 });
        this.fileInput.nativeElement.value = ''; // Resetear input
        return;
      }

      this.isUploading.set(true);

      // Multer espera recibir los datos como FormData
      const formData = new FormData();
      formData.append('file', file); // 'file' debe coincidir con upload.single('file') del backend

      this.adminService.importComplexData(formData).subscribe({
        next: (res: any) => {
          this.isUploading.set(false);
          this.snackBar.open(`¡Éxito! ${res.message} Edificios procesados: ${res.edificiosCreados}`, 'Excelente', { duration: 6000 });
          this.loadDashboardData(); // Recargamos las métricas para ver los nuevos edificios/usuarios
          this.fileInput.nativeElement.value = ''; // Limpiamos el input
        },
        error: (err) => {
          this.isUploading.set(false);
          console.error(err);
          const errorMsg = err.error?.message || 'Ocurrió un error inesperado al importar.';
          this.snackBar.open(`Error: ${errorMsg}`, 'Cerrar', { duration: 6000 });
          this.fileInput.nativeElement.value = '';
        }
      });
    }
  }
}