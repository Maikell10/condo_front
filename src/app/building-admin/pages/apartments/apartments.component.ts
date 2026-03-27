import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { ApartmentService } from '../../../core/services/apartment.service';
import { AuthService } from '../../../core/services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { LinkOwnerModalComponent } from '../../modal/link-owner-modal.component';
import { AddApartmentModalComponent } from '../../modal/add-apartment-modal.component';

@Component({
  selector: 'app-apartments',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatIconModule, MatChipsModule, MatButtonModule],
  templateUrl: './apartments.component.html'
})
export class ApartmentsComponent implements OnInit {
  private apartmentService = inject(ApartmentService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);

  apartments = signal<any[]>([]);
  displayedColumns = ['number', 'owner', 'alicuota', 'status', 'balance', 'actions'];

  // KPIs dinámicos basados en la data real
  total = computed(() => this.apartments().length);
  delinquent = computed(() => this.apartments().filter(a => a.balance > 0).length);
  upToDate = computed(() => this.apartments().filter(a => a.balance <= 0).length);

  ngOnInit() {
    this.loadApartments();
  }

  loadApartments() {
    const buildingId = this.authService.userSignal()?.buildingId;
    if (buildingId) {
      this.apartmentService.getApartments(Number(buildingId)).subscribe({
        next: (res) => this.apartments.set(res.data),
        error: (err) => console.error(err)
      });
    }
  }

  editAlicuota(apt: any) {
    const newValue = prompt(`Nueva alícuota para ${apt.number} (como decimal, ej: 0.0512):`, apt.alicuota);
    if (newValue !== null) {
      this.apartmentService.updateAlicuota(apt.id, parseFloat(newValue)).subscribe(() => {
        this.loadApartments();
      });
    }
  }

  openLinkOwnerModal(apt: any) {
    const dialogRef = this.dialog.open(LinkOwnerModalComponent, {
      width: '450px',
      data: apt
    });

    dialogRef.afterClosed().subscribe(userId => {
      if (userId) {
        this.apartmentService.linkOwner(apt.id, userId).subscribe({
          next: () => {
            alert('Propietario vinculado con éxito');
            this.loadApartments();
          },
          error: (err) => alert('Error: ' + err.error.message)
        });
      }
    });
  }

  // Dentro de la clase ApartmentsComponent
  openAddApartmentModal() {
    const dialogRef = this.dialog.open(AddApartmentModalComponent, {
      width: '400px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const buildingId = this.authService.userSignal()?.buildingId; // Obtenemos el ID del edificio
        const payload = { ...result, buildingId: Number(buildingId) };

        this.apartmentService.createApartment(payload).subscribe({
          next: () => {
            alert('Apartamento creado exitosamente');
            this.loadApartments(); // Recargamos la tabla
          },
          error: (err) => alert(err.error?.message || 'Error al crear')
        });
      }
    });
  }
}