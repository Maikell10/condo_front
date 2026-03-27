import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'app-buildings',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatIconModule, MatChipsModule, MatButtonModule, MatTooltip],
  templateUrl: './buildings.component.html'
})
export class BuildingsComponent implements OnInit {
  private adminService = inject(AdminService);

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

  toggleStatus(building: any) {
    const newStatus = building.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.adminService.updateBuildingStatus(building.id, newStatus).subscribe(() => {
      this.loadBuildings();
    });
  }
}