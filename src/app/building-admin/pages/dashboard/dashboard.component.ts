import { Component, inject, signal, OnInit } from '@angular/core';
import { DashboardService } from '../../../core/services/dashboard.service';
import { AuthService } from '../../../core/services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule, DecimalPipe, NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatCardModule, MatIconModule, NgFor, DecimalPipe, CommonModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private auth = inject(AuthService);

  // Signals para reactividad
  buildingInfo = signal({ name: 'Cargando...', code: '...' });
  kpis = signal({ totalApartments: 0, occupied: 0, delinquent: 0, monthIncome: 0 });
  apartments = signal<any[]>([]);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    const buildingId = this.auth.userSignal()?.buildingId; // Obtenemos el ID del edificio del usuario logueado
    if (buildingId) {
      this.dashboardService.getStats(Number(buildingId)).subscribe(res => {
        this.buildingInfo.set(res.building);
        this.kpis.set(res.kpis);
        this.apartments.set(res.featured);
      });
    }
  }

  get delinquentRate(): number {
    const { delinquent, occupied } = this.kpis();
    return occupied > 0 ? Math.round((delinquent / occupied) * 100) : 0;
  }
}