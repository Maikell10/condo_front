import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
// 🔥 Importamos los módulos para el buscador
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { ApartmentService } from '../../../core/services/apartment.service';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { MatDialog } from '@angular/material/dialog';
import { LinkOwnerModalComponent } from '../../modal/link-owner-modal.component';
import { AddApartmentModalComponent } from '../../modal/add-apartment-modal.component';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-apartments',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatChipsModule,
    MatButtonModule,
    MatSelectModule,
    MatTooltipModule,
    MatFormFieldModule, // <-- Añadido
    MatInputModule,     // <-- Añadido
    DecimalPipe
  ],
  templateUrl: './apartments.component.html'
})
export class ApartmentsComponent implements OnInit {
  private apartmentService = inject(ApartmentService);
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private dialog = inject(MatDialog);

  // --- SEÑALES DEL CONJUNTO RESIDENCIAL ---
  isComplex = computed(() => !!this.authService.userSignal()?.complexId);
  buildingsList = signal<any[]>([]);
  selectedBuildingId = signal<number | null>(null);

  apartments = signal<any[]>([]);

  // 🔥 1. Señal para almacenar el texto de búsqueda
  searchQuery = signal('');

  // 🔥 2. Computed que filtra los apartamentos en tiempo real
  filteredApartments = computed(() => {
    const data = this.apartments();
    const query = this.searchQuery();

    if (!query) return data;

    return data.filter(a =>
      a.number?.toString().toLowerCase().includes(query) ||
      a.ownerName?.toLowerCase().includes(query) ||
      a.access_code?.toLowerCase().includes(query)
    );
  });

  displayedColumns = ['number', 'accessCode', 'owner', 'alicuota', 'status', 'balance', 'actions'];

  // KPIs dinámicos (calculados sobre el total real, no sobre el filtro)
  total = computed(() => this.apartments().length);
  delinquent = computed(() => this.apartments().filter(a => a.balance > 0).length);
  upToDate = computed(() => this.apartments().filter(a => a.balance <= 0).length);

  ngOnInit() {
    this.initView();
  }

  initView() {
    const user = this.authService.userSignal();

    if (user?.complexId) {
      this.dashboardService.getBuildingsByComplex().subscribe({
        next: (res: any) => {
          this.buildingsList.set(res.data);
          if (res.data.length > 0) {
            this.selectedBuildingId.set(res.data[0].id);
            this.loadApartments(res.data[0].id);
          }
        }
      });
    } else if (user?.buildingId) {
      this.selectedBuildingId.set(Number(user.buildingId));
      this.loadApartments(Number(user.buildingId));
    }
  }

  loadApartments(buildingId: number) {
    this.apartmentService.getApartments(buildingId).subscribe({
      next: (res) => this.apartments.set(res.data),
      error: (err) => console.error(err)
    });
  }

  onBuildingChange(buildingId: number) {
    this.selectedBuildingId.set(buildingId);
    this.apartments.set([]);
    this.searchQuery.set(''); // Reseteamos la búsqueda al cambiar de edificio
    this.loadApartments(buildingId);
  }

  // 🔥 3. Método disparado por el keyup del input
  applySearch(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchQuery.set(filterValue.trim().toLowerCase());
  }

  editAlicuota(apt: any) {
    const newValue = prompt(`Nueva alícuota para ${apt.number} (como decimal, ej: 0.0512):`, apt.alicuota);
    if (newValue !== null && this.selectedBuildingId()) {
      this.apartmentService.updateAlicuota(apt.id, parseFloat(newValue)).subscribe(() => {
        this.loadApartments(this.selectedBuildingId()!);
      });
    }
  }

  openLinkOwnerModal(apt: any) {
    const dialogRef = this.dialog.open(LinkOwnerModalComponent, {
      width: '450px',
      data: apt
    });

    dialogRef.afterClosed().subscribe(userId => {
      if (userId && this.selectedBuildingId()) {
        this.apartmentService.linkOwner(apt.id, userId).subscribe({
          next: () => {
            alert('Propietario vinculado con éxito');
            this.loadApartments(this.selectedBuildingId()!);
          },
          error: (err) => alert('Error: ' + err.error.message)
        });
      }
    });
  }

  openAddApartmentModal() {
    const dialogRef = this.dialog.open(AddApartmentModalComponent, {
      width: '400px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.selectedBuildingId()) {
        const payload = { ...result, buildingId: this.selectedBuildingId() };
        this.apartmentService.createApartment(payload).subscribe({
          next: () => {
            alert('Apartamento creado exitosamente');
            this.loadApartments(this.selectedBuildingId()!);
          },
          error: (err) => alert(err.error?.message || 'Error al crear')
        });
      }
    });
  }

  copyAccessCode(code: string) {
    if (code) {
      navigator.clipboard.writeText(code);
      console.log('Código copiado:', code);
    }
  }

  getBuildingName(apt: any): string {
    if (apt.buildingName) return apt.buildingName;
    const targetId = this.selectedBuildingId();
    const building = this.buildingsList().find(b => b.id === targetId);
    return building ? building.name : '';
  }

  exportToExcel() {
    // 🔥 Ahora exportamos la lista filtrada si hay un filtro activo, si no, todos
    const data = this.filteredApartments();

    if (!data || data.length === 0) {
      alert('No hay datos de apartamentos para exportar.');
      return;
    }

    const excelData = data.map(a => ({
      'Edificio': this.getBuildingName(a) || 'N/A',
      'Apartamento': a.number || '',
      'Cod. Acceso': a.access_code || 'PENDIENTE',
      'Propietario': a.ownerName || 'Sin asignar',
      'Alicuota (%)': Number((a.alicuota * 100).toFixed(4)),
      'Estado': a.balance > 0 ? 'Moroso' : 'Al día',
      'Deuda ($)': Number(a.balance) > 0 ? Number(a.balance) : 0
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(excelData);
    ws['!cols'] = [
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 35 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }
    ];

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Apartamentos');
    XLSX.writeFile(wb, `Listado_Apartamentos_${new Date().getTime()}.xlsx`);
  }
}