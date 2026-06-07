import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common'; // Añadido DecimalPipe
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select'; // <-- Importante para el selector
import { MatTooltipModule } from '@angular/material/tooltip'; // <-- Para el tooltip de copiar
import { ApartmentService } from '../../../core/services/apartment.service';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardService } from '../../../core/services/dashboard.service'; // <-- Servicio de edificios
import { MatDialog } from '@angular/material/dialog';
import { LinkOwnerModalComponent } from '../../modal/link-owner-modal.component';
import { AddApartmentModalComponent } from '../../modal/add-apartment-modal.component';

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

  // 🔥 Añadimos 'accessCode' para ver el código de acceso en la tabla
  displayedColumns = ['number', 'accessCode', 'owner', 'alicuota', 'status', 'balance', 'actions'];

  // KPIs dinámicos
  total = computed(() => this.apartments().length);
  delinquent = computed(() => this.apartments().filter(a => a.balance > 0).length);
  upToDate = computed(() => this.apartments().filter(a => a.balance <= 0).length);

  ngOnInit() {
    this.initView();
  }

  initView() {
    const user = this.authService.userSignal();

    if (user?.complexId) {
      // Si es un conjunto, cargamos la lista de edificios
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
      // Si es individual, cargamos directo
      this.selectedBuildingId.set(Number(user.buildingId));
      this.loadApartments(Number(user.buildingId));
    }
  }

  // Carga apartamentos dependiendo del edificio seleccionado
  loadApartments(buildingId: number) {
    this.apartmentService.getApartments(buildingId).subscribe({
      next: (res) => this.apartments.set(res.data),
      error: (err) => console.error(err)
    });
  }

  // Se ejecuta al cambiar el selector
  onBuildingChange(buildingId: number) {
    this.selectedBuildingId.set(buildingId);
    this.apartments.set([]); // Limpiamos visualmente mientras carga
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
        // 🔥 Usamos el Edificio SELECCIONADO actualmente, no el del token
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

  // Método para copiar el código rápido
  copyAccessCode(code: string) {
    if (code) {
      navigator.clipboard.writeText(code);
      // Aquí podrías usar un SnackBar de Angular Material si lo prefieres
      console.log('Código copiado:', code);
    }
  }

  // Función para obtener el nombre del edificio del apartamento
  getBuildingName(apt: any): string {
    // Si tu backend ya envía el nombre directamente (como hicimos en la consulta anterior), lo usamos:
    if (apt.buildingName) return apt.buildingName;

    // Si la vista está en 'ALL', usamos el building_id del apartamento. 
    // Si no, usamos el edificio seleccionado en el dropdown.
    const targetId = this.selectedBuildingId();

    // Buscamos el edificio en la lista que ya cargaste
    const building = this.buildingsList().find(b => b.id === targetId);

    // Retornamos el nombre, o un string vacío si no lo encuentra
    return building ? building.name : '';
  }
}