import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-building-expenses',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatIconModule, MatButtonModule, MatSelectModule, MatFormFieldModule],
  templateUrl: './building-expenses.component.html',
  styles: './building-expenses.component.scss'
})
export class BuildingExpensesComponent {
  displayedColumns: string[] = ['code', 'description', 'amount'];

  // Data simulada basada en tu captura
  expenses = signal([
    { code: '006', description: 'HIDROCAPITAL 04 / 2026', amount: 5119.46, isTotal: false },
    { code: '040', description: 'GASTOS ADMINISTRATIVOS', amount: 40500.00, isTotal: false },
    { code: '041', description: 'I. V. A.', amount: 6480.00, isTotal: false },
    { code: '042', description: 'COMISIONES BANCARIAS', amount: 8174.13, isTotal: false },
    { code: '', description: 'TOTAL GASTOS COMUNES:', amount: 60273.59, isTotal: true },

    { code: '001', description: 'FDO DE RESERVA', amount: 9041.04, isTotal: false },
    { code: '', description: 'TOTAL FONDOS:', amount: 9041.04, isTotal: true },

    { code: '', description: 'TOTAL FONDOS Y GASTOS COMUNES:', amount: 69314.63, isTotal: true },
  ]);
}