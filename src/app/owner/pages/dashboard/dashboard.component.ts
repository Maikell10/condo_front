import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatDividerModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {

  // Datos del Propietario
  owner = signal({
    name: 'Benito Sciamanna',
    unit: 'PH',
    building: 'Residencias Indiana',
    aliquot: 17.950000
  });

  // Estado Financiero
  financialStatus = signal({
    currentDebt: 83062.15,
    status: 'DEBT', // Puede ser 'UP_TO_DATE' o 'DEBT'
    pendingReceipts: 1,
    currentMonth: 'Marzo 2026'
  });

  // Último Pago
  lastPayment = signal({
    amount: 80194.39,
    date: '28 Feb 2026',
    method: 'Transferencia',
    status: 'VERIFIED'
  });

  // Incidencias Recientes
  incidents = signal([
    { id: 'INC-042', title: 'Fuga de agua en pasillo', status: 'IN_PROGRESS', date: 'Hace 2 días' },
    { id: 'INC-039', title: 'Falla en ascensor par', status: 'CLOSED', date: 'Hace 1 semana' }
  ]);

  // Avisos de la Administración
  announcements = signal([
    { title: 'Mantenimiento de Tanque', date: '15 Abr', type: 'warning' },
    { title: 'Asamblea Ordinaria', date: '20 Abr', type: 'info' }
  ]);
}