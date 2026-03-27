import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../../core/services/auth.service';
import { ApartmentService } from '../../../core/services/apartment.service';
import { MatIconModule } from '@angular/material/icon';
import { NgClass, NgFor, NgIf } from '@angular/common';

interface Incident {
  id: string;
  title: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  createdAt: string;
}

interface Payment {
  id: string;
  amount: number;
  date: string;
  status: 'PAID' | 'PENDING';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatCardModule, MatIconModule, NgFor, NgIf, NgClass],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  ownerName = 'Juan Pérez';
  ownerCode = 'APT-0001-UNICO';
  apartment = 'Apto 12A';
  building = 'Residencias El Mirador';

  balance = {
    month: 'Enero 2026',
    amount: 45,
    status: 'PENDING'
  };

  lastPayment: Payment = {
    id: 'P-001',
    amount: 60,
    date: '2025-12-28',
    status: 'PAID'
  };

  incidents: Incident[] = [
    { id: 'I-001', title: 'Fuga de agua en baño', status: 'IN_PROGRESS', createdAt: '2026-01-10' },
    { id: 'I-002', title: 'Luces del pasillo dañadas', status: 'OPEN', createdAt: '2026-01-15' }
  ];

  constructor(
    private auth: AuthService,
    private apartmentService: ApartmentService
  ) {

  }

}
