import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { DashboardService } from '../../../core/services/dashboard.service';
import { AuthService } from '../../../core/services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select'; // <--- IMPORTANTE
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-building-admin-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatSelectModule, DecimalPipe, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss' // Asegúrate de tener este archivo
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private auth = inject(AuthService);

  // --- NUEVAS SEÑALES PARA EL CONJUNTO RESIDENCIAL ---
  // Detecta si el admin maneja un conjunto (tiene complexId en su token)
  isComplex = computed(() => !!this.auth.userSignal()?.complexId);
  buildingsList = signal<any[]>([]); // Lista de edificios en el conjunto
  selectedBuildingId = signal<number | null>(null); // Edificio actualmente seleccionado

  // --- SEÑALES DEL DASHBOARD ---
  buildingInfo = signal({ name: 'Cargando...', code: '...' });
  kpis = signal({ totalApartments: 0, occupied: 0, delinquent: 0, monthIncome: 0 });
  apartments = signal<any[]>([]);

  delinquentRate = computed(() => {
    const { delinquent, occupied } = this.kpis();
    return occupied > 0 ? Math.round((delinquent / occupied) * 100) : 0;
  });

  ngOnInit() {
    this.initDashboard();
  }

  initDashboard() {
    const user = this.auth.userSignal();
    console.log('first', user)

    if (user?.complexId) {
      // 1. ES UN CONJUNTO: Obtenemos todos sus edificios
      // NOTA: Debes crear este método en tu dashboardService o buildingService en Angular
      this.dashboardService.getBuildingsByComplex(user.complexId).subscribe({
        next: (res: any) => {
          this.buildingsList.set(res.data);
          if (res.data.length > 0) {
            // Seleccionamos el primer edificio por defecto
            this.selectedBuildingId.set(res.data[0].id);
            this.loadStats(res.data[0].id);
          }
        }
      });
    } else if (user?.buildingId) {
      // 2. EDIFICIO ÚNICO: Carga normal
      this.loadStats(Number(user.buildingId));
    }
  }

  // Carga los KPIs según el ID que le pasemos
  loadStats(buildingId: number) {
    this.dashboardService.getStats(buildingId).subscribe({
      next: (res) => {
        this.buildingInfo.set(res.building);
        this.kpis.set(res.kpis);
        this.apartments.set(res.featured);
      },
      error: (err) => console.error('Error al cargar dashboard del edificio', err)
    });
  }

  // Método que se ejecuta al cambiar el selector
  onBuildingChange(newBuildingId: number) {
    this.selectedBuildingId.set(newBuildingId);
    this.buildingInfo.set({ name: 'Cargando...', code: '...' }); // Efecto visual de recarga
    this.loadStats(newBuildingId);
  }
}