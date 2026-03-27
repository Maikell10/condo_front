import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';

import { BuildingService } from '../../../core/services/building.service';
import { ApartmentService } from '../../../core/services/apartment.service';
import { FilterByBuildingPipe } from "../../../shared/filter-by-building.pipe";
import { MatIconModule } from '@angular/material/icon';
import { MatChip } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatButtonModule, MatChip, MatTableModule],

  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  buildings$: any = [];
  apartments$: any = [];

  newBuildingName = '';
  selectedBuildingId: string | null = null;

  newApartmentNumber = '';
  newOwnerName = '';

  recentEvents = [
    { timestamp: '2026-01-30 09:15', user: 'admin@condo.com', action: 'LOGIN', module: 'AUTH' },
    { timestamp: '2026-01-30 10:05', user: 'building1@admin.com', action: 'UPDATE_PAYMENT', module: 'PAYMENTS' },
    { timestamp: '2026-01-29 18:44', user: 'owner12@condo.com', action: 'CREATE_INCIDENT', module: 'INCIDENTS' }
  ];

  constructor(
    private buildingService: BuildingService,
    private apartmentService: ApartmentService
  ) {
    this.buildings$ = this.buildingService.getBuildings();
    this.apartments$ = this.apartmentService.getApartments(1);
  }

  addBuilding() {
    if (!this.newBuildingName.trim()) return;
    this.buildingService.addBuilding(this.newBuildingName);
    this.newBuildingName = '';
  }

  selectBuilding(id: string) {
    this.selectedBuildingId = id;
  }

  addApartment() {
    if (!this.selectedBuildingId) return;
    this.apartmentService.addApartment(
      this.selectedBuildingId,
      this.newApartmentNumber,
      this.newOwnerName
    );
    this.newApartmentNumber = '';
    this.newOwnerName = '';
  }

}
