import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { DashboardService } from '../../../core/services/dashboard.service';
import { AuthService } from '../../../core/services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { RouterModule } from '@angular/router';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-building-admin-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatSelectModule, DecimalPipe, RouterModule, MatDividerModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private auth = inject(AuthService);

  isComplex = computed(() => !!this.auth.userSignal()?.complexId);
  buildingsList = signal<any[]>([]);
  selectedBuildingId = signal<number | 'ALL'>('ALL');

  // --- SEÑALES DEL DASHBOARD ---
  buildingInfo = signal({ name: 'Cargando...', code: '...' });
  kpis = signal({ totalApartments: 0, occupied: 0, delinquent: 0, monthIncome: 0 });
  apartments = signal<any[]>([]);

  // 🔥 NUEVA SEÑAL PARA EFICIENCIA DE RECAUDACIÓN
  collectionInfo = signal({ period: 'Cargando...', expected: 0, collected: 0, rate: 0, missing: 0 });

  delinquentRate = computed(() => {
    const { delinquent, occupied } = this.kpis();
    return occupied > 0 ? Math.round((delinquent / occupied) * 100) : 0;
  });

  ngOnInit() {
    this.initDashboard();
  }

  initDashboard() {
    const user = this.auth.userSignal();

    if (user?.complexId) {
      // Usamos getManagedBuildings para estandarizar
      this.dashboardService.getBuildingsByComplex().subscribe({
        next: (res: any) => {
          this.buildingsList.set(res.data);
          this.selectedBuildingId.set('ALL'); // Arranca viendo la salud global
          this.loadStats('ALL');
        }
      });
    } else if (user?.buildingId) {
      this.selectedBuildingId.set(Number(user.buildingId));
      this.loadStats(Number(user.buildingId));
    }
  }

  loadStats(buildingId: number | 'ALL') {
    const complexId = this.auth.userSignal()?.complexId;
    // Si tienes un método específico para el dashboard con payload como en facturas, úsalo aquí.
    // Asumiré que pasas la variable por URL query params si es ALL.
    const urlParam = buildingId === 'ALL' ? `ALL?complexId=${complexId}` : `${buildingId}`;

    // NOTA: Ajusta el método getStats en tu DashboardService para que reciba un string
    this.dashboardService.getStats(urlParam).subscribe({
      next: (res: any) => {
        this.buildingInfo.set(res.building);
        this.kpis.set(res.kpis);
        this.apartments.set(res.featured);

        // 🔥 Cargamos la data real de la base de datos
        if (res.collection) {
          this.collectionInfo.set(res.collection);
        }
      },
      error: (err) => console.error('Error al cargar dashboard', err)
    });
  }

  onBuildingChange(newBuildingId: number | 'ALL') {
    this.selectedBuildingId.set(newBuildingId);
    this.buildingInfo.set({ name: 'Cargando...', code: '...' });
    this.collectionInfo.set({ period: 'Cargando...', expected: 0, collected: 0, rate: 0, missing: 0 });
    this.loadStats(newBuildingId);
  }
}