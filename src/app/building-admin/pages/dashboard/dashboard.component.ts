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

  // 🔥 Añadimos prevMonthIncome al KPI
  kpis = signal({ totalApartments: 0, occupied: 0, delinquent: 0, monthIncome: 0, prevMonthIncome: 0 });
  apartments = signal<any[]>([]);

  // 🔥 NUEVA ESTRUCTURA DUAL PARA EFICIENCIA DE RECAUDACIÓN
  collectionInfo = signal({
    current: { period: 'Cargando...', expected: 0, collected: 0, rate: 0, missing: 0 },
    previous: { period: 'Cargando...', expected: 0, collected: 0, rate: 0, missing: 0 }
  });

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
      this.dashboardService.getBuildingsByComplex().subscribe({
        next: (res: any) => {
          this.buildingsList.set(res.data);
          this.selectedBuildingId.set('ALL');
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
    const urlParam = buildingId === 'ALL' ? `ALL?complexId=${complexId}` : `${buildingId}`;

    this.dashboardService.getStats(urlParam).subscribe({
      next: (res: any) => {
        this.buildingInfo.set(res.building);

        // El backend ahora deberá enviar kpis.prevMonthIncome
        this.kpis.set({
          totalApartments: res.kpis?.totalApartments || 0,
          occupied: res.kpis?.occupied || 0,
          delinquent: res.kpis?.delinquent || 0,
          monthIncome: res.kpis?.monthIncome || 0,
          prevMonthIncome: res.kpis?.prevMonthIncome || 0
        });

        this.apartments.set(res.featured);

        // 🔥 El backend ahora deberá enviar res.collection.current y res.collection.previous
        if (res.collection) {
          this.collectionInfo.set({
            current: res.collection.current || this.collectionInfo().current,
            previous: res.collection.previous || this.collectionInfo().previous
          });
        }
      },
      error: (err) => console.error('Error al cargar dashboard', err)
    });
  }

  onBuildingChange(newBuildingId: number | 'ALL') {
    this.selectedBuildingId.set(newBuildingId);
    this.buildingInfo.set({ name: 'Cargando...', code: '...' });

    // Reseteamos ambas vistas
    this.collectionInfo.set({
      current: { period: 'Cargando...', expected: 0, collected: 0, rate: 0, missing: 0 },
      previous: { period: 'Cargando...', expected: 0, collected: 0, rate: 0, missing: 0 }
    });

    this.loadStats(newBuildingId);
  }
}