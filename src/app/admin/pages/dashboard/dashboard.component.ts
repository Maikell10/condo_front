import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AdminService } from '../../../core/services/admin.service'; // <-- IMPORTA EL SERVICIO

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
    MatProgressBarModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

  private adminService = inject(AdminService); // <-- INYECTA EL SERVICIO

  // Inicializamos los signals con valores en 0 o vacíos
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
      next: (res) => {
        // Actualizamos todos los signals con la data real que viene de MySQL
        this.globalMetrics.set(res.metrics);
        this.attentionRequired.set(res.attentionRequired);
        this.recentActivity.set(res.recentActivity);
      },
      error: (err) => {
        console.error("Error al cargar el dashboard", err);
        // Aquí podrías agregar un this.showMessage() si inyectas MatSnackBar
      }
    });
  }

  exportReport() {
    console.log("Generando PDF global...");
    // Próximo paso: Generar reporte con jsPDF o un endpoint de Node
  }
}