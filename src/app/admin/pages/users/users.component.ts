import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
// ... (imports de material)

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatIconModule, MatChipsModule, MatButtonModule, MatTooltip],
  templateUrl: './users.component.html'
})
export class UsersComponent implements OnInit {
  private adminService = inject(AdminService);

  users = signal<any[]>([]);
  displayedColumns = ['name', 'email', 'role', 'building', 'status', 'actions'];

  // KPIs Reactivos
  total = computed(() => this.users().length);
  active = computed(() => this.users().filter(u => u.status === 'ACTIVE').length);
  inactive = computed(() => this.users().filter(u => u.status === 'INACTIVE').length);

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.adminService.getUsers().subscribe(res => this.users.set(res.data));
  }

  toggleStatus(user: any) {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.adminService.updateStatus(user.id, newStatus).subscribe(() => {
      this.loadUsers(); // Recarga la lista y actualiza KPIs
    });
  }
}