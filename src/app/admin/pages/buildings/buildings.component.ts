import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BuildingDialogComponent } from '../../../modals/building-dialog/building-dialog.component';
import { AssignAdminDialogComponent } from '../../../modals/assign-admin-dialog/assign-admin-dialog.component';

@Component({
  selector: 'app-buildings',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatIconModule, MatChipsModule, MatButtonModule, MatTooltip, MatSnackBarModule],
  templateUrl: './buildings.component.html'
})
export class BuildingsComponent implements OnInit {
  private adminService = inject(AdminService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  buildings = signal<any[]>([]);
  displayedColumns = ['code', 'name', 'admin', 'apartments', 'status', 'actions'];

  // KPIs dinámicos usando Computed Signals
  total = computed(() => this.buildings().length);
  active = computed(() => this.buildings().filter(b => b.status === 'ACTIVE').length);
  inactive = computed(() => this.buildings().filter(b => b.status === 'INACTIVE').length);

  ngOnInit() {
    this.loadBuildings();
  }

  loadBuildings() {
    this.adminService.getBuildings().subscribe(res => this.buildings.set(res.data));
  }

  // Método auxiliar para mostrar los mensajes sin repetir código
  private showMessage(message: string, isError: boolean = false) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 4000, // Desaparece en 4 segundos
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      // Clases CSS opcionales por si quieres darles color en tu styles.scss global
      panelClass: isError ? ['error-snackbar'] : ['success-snackbar']
    });
  }

  toggleStatus(building: any) {
    const newStatus = building.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.adminService.updateBuildingStatus(building.id, newStatus).subscribe({
      next: () => {
        this.showMessage(`Estado del edificio actualizado a ${newStatus === 'ACTIVE' ? 'Activo' : 'Suspendido'}`);
        this.loadBuildings();
      },
      error: () => this.showMessage('Error al cambiar el estado del edificio', true)
    });
  }

  openDialog(building?: any) {
    const dialogRef = this.dialog.open(BuildingDialogComponent, {
      width: '450px',
      data: building || null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (building) {
          // Modo Edición
          this.adminService.updateBuilding(building.id, result).subscribe({
            next: (response) => {
              this.showMessage(response.message || 'Edificio actualizado correctamente');
              this.loadBuildings();
            },
            error: (err) => {
              // Atrapamos el mensaje que viene de Node (ej: "Ya existe un edificio con ese código")
              const errorMsg = err.error?.message || 'Ocurrió un error al actualizar';
              this.showMessage(errorMsg, true);
            }
          });
        } else {
          // Modo Creación
          this.adminService.createBuilding(result).subscribe({
            next: (response) => {
              this.showMessage(response.message || 'Edificio creado exitosamente');
              this.loadBuildings();
            },
            error: (err) => {
              const errorMsg = err.error?.message || 'Ocurrió un error al crear';
              this.showMessage(errorMsg, true);
            }
          });
        }
      }
    });
  }

  openAssignAdmin(building: any) {
    const dialogRef = this.dialog.open(AssignAdminDialogComponent, {
      width: '400px',
      data: {
        buildingId: building.id,
        buildingName: building.name,
        currentEmail: building.adminEmail
      }
    });

    dialogRef.afterClosed().subscribe(email => {
      if (email) {
        this.adminService.assignBuildingAdmin(building.id, email).subscribe({
          next: (res) => {
            this.showMessage(res.message);
            this.loadBuildings(); // Refresca la tabla
          },
          error: (err) => this.showMessage(err.error?.message || 'Error al asignar administrador', true)
        });
      }
    });
  }
}