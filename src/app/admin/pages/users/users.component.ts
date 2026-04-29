import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserDialogComponent } from '../../../modals/user-dialog/user-dialog.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatIconModule, MatChipsModule, MatButtonModule, MatTooltip, MatDialogModule, MatSnackBarModule],
  templateUrl: './users.component.html'
})
export class UsersComponent implements OnInit {
  private adminService = inject(AdminService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

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

  private showMessage(message: string, isError: boolean = false) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: isError ? ['error-snackbar'] : ['success-snackbar']
    });
  }

  toggleStatus(user: any) {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.adminService.updateStatus(user.id, newStatus).subscribe({
      next: () => {
        this.showMessage(`Estado del usuario actualizado a ${newStatus === 'ACTIVE' ? 'Activo' : 'Suspendido'}`);
        this.loadUsers();
      },
      error: () => this.showMessage('Error al cambiar el estado del usuario', true)
    });
  }

  openDialog(user?: any) {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '450px',
      data: user || null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (user) {
          this.adminService.updateUser(user.id, result).subscribe({
            next: (res) => {
              this.showMessage(res.message || 'Usuario actualizado');
              this.loadUsers();
            },
            error: (err) => this.showMessage(err.error?.message || 'Error al actualizar', true)
          });
        } else {
          this.adminService.createUser(result).subscribe({
            next: (res) => {
              this.showMessage(res.message || 'Usuario creado exitosamente');
              this.loadUsers();
            },
            error: (err) => this.showMessage(err.error?.message || 'Error al crear', true)
          });
        }
      }
    });
  }
}