import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { NgFor, NgIf, NgClass } from '@angular/common';

interface Incident {
  id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  createdAt: string;
}

@Component({
  selector: 'app-incidents',
  standalone: true,
  imports: [
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    NgFor,
    NgClass
  ],

  templateUrl: './incidents.component.html',
  styleUrl: './incidents.component.scss'
})
export class IncidentsComponent {
  incidents: Incident[] = [
    {
      id: 'I-001',
      title: 'Fuga de agua en baño',
      description: 'Se detectó una fuga en la tubería del baño principal.',
      status: 'IN_PROGRESS',
      createdAt: '2026-01-10'
    },
    {
      id: 'I-002',
      title: 'Luces del pasillo dañadas',
      description: 'Las luces del pasillo del piso 3 no encienden.',
      status: 'OPEN',
      createdAt: '2026-01-15'
    },
    {
      id: 'I-003',
      title: 'Ventana rota en sala',
      description: 'La ventana de la sala tiene una grieta.',
      status: 'CLOSED',
      createdAt: '2025-12-20'
    }
  ];

  get openCount(): number {
    return this.incidents.filter(i => i.status === 'OPEN').length;
  }

  get inProgressCount(): number {
    return this.incidents.filter(i => i.status === 'IN_PROGRESS').length;
  }

  get closedCount(): number {
    return this.incidents.filter(i => i.status === 'CLOSED').length;
  }

}
