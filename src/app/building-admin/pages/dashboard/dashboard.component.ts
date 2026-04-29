import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { DashboardService } from '../../../core/services/dashboard.service';
import { AuthService } from '../../../core/services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-building-admin-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, DecimalPipe, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private auth = inject(AuthService);

  // Signals para reactividad
  buildingInfo = signal({ name: 'Cargando...', code: '...' });
  kpis = signal({ totalApartments: 0, occupied: 0, delinquent: 0, monthIncome: 0 });
  apartments = signal<any[]>([]);

  // Usamos computed para que sea ultra reactivo y eficiente
  delinquentRate = computed(() => {
    const { delinquent, occupied } = this.kpis();
    return occupied > 0 ? Math.round((delinquent / occupied) * 100) : 0;
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    const buildingId = this.auth.userSignal()?.buildingId;
    if (buildingId) {
      this.dashboardService.getStats(Number(buildingId)).subscribe({
        next: (res) => {
          this.buildingInfo.set(res.building);
          this.kpis.set(res.kpis);
          this.apartments.set(res.featured);
        },
        error: (err) => console.error('Error al cargar dashboard del edificio', err)
      });
    }
  }
}