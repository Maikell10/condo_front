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
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

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
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    DecimalPipe
  ],
  templateUrl: './apartments.component.html',
  styleUrl: './apartments.component.scss'
})
export class ApartmentsComponent implements OnInit {
  private apartmentService = inject(ApartmentService);
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  // --- SEÑALES DEL CONJUNTO RESIDENCIAL ---
  isComplex = computed(() => !!this.authService.userSignal()?.complexId);
  buildingsList = signal<any[]>([]);
  selectedBuildingId = signal<number | null>(null);

  apartments = signal<any[]>([]);
  loading = signal(false);

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
  withOwner = computed(() => this.apartments().filter(a => !!a.ownerName).length);
  occupancyRate = computed(() => {
    const t = this.total();
    return t ? Math.round((this.withOwner() / t) * 100) : 0;
  });

  selectedBuildingLabel = computed(() => {
    const id = this.selectedBuildingId();
    if (!id) return '';
    const b = this.buildingsList().find(x => x.id === id);
    return b?.name || '';
  });

  statCards = computed(() => [
    {
      id: 'total',
      variant: 'indigo',
      icon: 'domain',
      chip: 'Unidades',
      value: this.total(),
      sub: this.selectedBuildingLabel() || 'Edificio actual'
    },
    {
      id: 'ok',
      variant: 'emerald',
      icon: 'verified',
      chip: 'Solventes',
      value: this.upToDate(),
      sub: 'Sin saldo pendiente'
    },
    {
      id: 'debt',
      variant: 'rose',
      icon: 'priority_high',
      chip: 'En mora',
      value: this.delinquent(),
      sub: 'Con deuda activa'
    },
    {
      id: 'occ',
      variant: 'violet',
      icon: 'person',
      chip: 'Ocupación',
      value: `${this.occupancyRate()}%`,
      sub: `${this.withOwner()} con propietario`
    }
  ]);

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
    this.loading.set(true);
    this.apartmentService.getApartments(buildingId).subscribe({
      next: (res) => {
        this.apartments.set(res.data ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
        this.snackBar.open('No se pudieron cargar los apartamentos', 'Cerrar', {
          duration: 4000
        });
      }
    });
  }

  refreshList(): void {
    const id = this.selectedBuildingId();
    if (id) this.loadApartments(id);
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(String(value || '').trim().toLowerCase());
  }

  onBuildingChange(buildingId: number) {
    this.selectedBuildingId.set(buildingId);
    this.apartments.set([]);
    this.searchQuery.set(''); // Reseteamos la búsqueda al cambiar de edificio
    this.loadApartments(buildingId);
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
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      this.snackBar.open('Código copiado', 'Cerrar', { duration: 2000 });
    });
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