import { animate, keyframes, style, transition, trigger } from '@angular/animations';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { UserDialogComponent } from '../../../modals/user-dialog/user-dialog.component';
import {
  AdminUserRow,
  AdminUsersStats
} from './admin-user.model';

function usersPaginatorLabels(): MatPaginatorIntl {
  const intl = new MatPaginatorIntl();
  intl.itemsPerPageLabel = 'Usuarios por página';
  intl.nextPageLabel = 'Siguiente';
  intl.previousPageLabel = 'Anterior';
  intl.firstPageLabel = 'Primera página';
  intl.lastPageLabel = 'Última página';
  intl.getRangeLabel = (page, pageSize, length) => {
    if (length === 0 || pageSize === 0) return `0 de ${length}`;
    const start = page * pageSize + 1;
    const end = Math.min((page + 1) * pageSize, length);
    return `${start} – ${end} de ${length}`;
  };
  return intl;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatPaginatorModule
  ],
  providers: [{ provide: MatPaginatorIntl, useValue: usersPaginatorLabels() }],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
  animations: [
    trigger('statCardIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(22px) scale(0.94)' }),
        animate(
          '420ms {{ delay }}ms cubic-bezier(0.22, 1, 0.36, 1)',
          style({ opacity: 1, transform: 'translateY(0) scale(1)' })
        )
      ], { params: { delay: 0 } })
    ]),
    trigger('statValuePop', [
      transition('* => *', [
        animate(
          '320ms cubic-bezier(0.22, 1, 0.36, 1)',
          keyframes([
            style({ transform: 'scale(1)', opacity: 1, offset: 0 }),
            style({ transform: 'scale(1.12)', opacity: 0.92, offset: 0.45 }),
            style({ transform: 'scale(1)', opacity: 1, offset: 1 })
          ])
        )
      ])
    ])
  ]
})
export class UsersComponent implements OnInit {
  private adminService = inject(AdminService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private searchDebounce?: ReturnType<typeof setTimeout>;

  users = signal<AdminUserRow[]>([]);
  stats = signal<AdminUsersStats>({
    total: 0,
    active: 0,
    inactive: 0,
    superAdmins: 0,
    buildingAdmins: 0,
    owners: 0
  });
  listTotal = signal(0);
  /** API antigua sin meta: paginar en cliente sobre el dataset cargado */
  clientPaging = signal(false);
  private clientCache = signal<AdminUserRow[]>([]);

  loading = signal(true);
  loadError = signal<string | null>(null);

  searchQuery = signal('');
  roleFilter = signal<'ALL' | 'SUPER_ADMIN' | 'BUILDING_ADMIN' | 'OWNER'>('ALL');
  statusFilter = signal<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  pageIndex = signal(0);
  pageSize = signal(25);

  displayedColumns = ['name', 'email', 'role', 'building', 'status', 'actions'];

  statCards = computed(() => {
    const s = this.stats();
    return [
      {
        id: 'total',
        variant: 'indigo',
        icon: 'group',
        chip: 'Registro',
        chipClass: '',
        label: 'Usuarios (filtro)',
        value: s.total
      },
      {
        id: 'active',
        variant: 'emerald',
        icon: 'check_circle',
        chip: 'Activos',
        chipClass: 'stat-card__chip--ok',
        label: 'Cuentas activas',
        value: s.active
      },
      {
        id: 'inactive',
        variant: 'rose',
        icon: 'block',
        chip: 'Inactivos',
        chipClass: 'stat-card__chip--warn',
        label: 'Suspendidos',
        value: s.inactive
      },
      {
        id: 'admins',
        variant: 'violet',
        icon: 'admin_panel_settings',
        chip: 'Admins',
        chipClass: '',
        label: 'Administradores',
        value: s.buildingAdmins + s.superAdmins
      },
      {
        id: 'owners',
        variant: 'amber',
        icon: 'home',
        chip: 'Propietarios',
        chipClass: 'stat-card__chip--alert',
        label: 'Dueños de unidad',
        value: s.owners
      }
    ];
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.pageIndex.set(0);
      this.loadUsers();
    }, 350);
  }

  onRoleFilterChange(value: 'ALL' | 'SUPER_ADMIN' | 'BUILDING_ADMIN' | 'OWNER'): void {
    this.roleFilter.set(value);
    this.pageIndex.set(0);
    this.loadUsers();
  }

  onStatusFilterChange(value: 'ALL' | 'ACTIVE' | 'INACTIVE'): void {
    this.statusFilter.set(value);
    this.pageIndex.set(0);
    this.loadUsers();
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    if (this.clientPaging()) {
      this.applyClientSlice();
    } else {
      this.loadUsers();
    }
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.roleFilter.set('ALL');
    this.statusFilter.set('ALL');
    this.pageIndex.set(0);
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.adminService
      .getUsers({
        page: this.pageIndex() + 1,
        limit: this.pageSize(),
        search: this.searchQuery(),
        role: this.roleFilter(),
        status: this.statusFilter()
      })
      .subscribe({
        next: (res) => {
          const rows = res.data ?? [];
          const serverMeta =
            res.meta != null && typeof res.meta.total === 'number' && !Number.isNaN(res.meta.total);

          this.clientPaging.set(!serverMeta);

          if (serverMeta) {
            this.users.set(rows);
            this.listTotal.set(res.meta!.total);
            if (res.stats) {
              this.stats.set(res.stats);
            }
          } else {
            const filtered = this.filterUsersClient(rows);
            this.clientCache.set(filtered);
            this.listTotal.set(filtered.length);
            this.applyClientSlice();
            this.stats.set(this.computeStats(filtered));
          }

          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.loadError.set('No se pudo cargar el listado de usuarios. Revisa la conexión con la API.');
        }
      });
  }

  private filterUsersClient(rows: AdminUserRow[]): AdminUserRow[] {
    const q = this.searchQuery().trim().toLowerCase();
    const role = this.roleFilter();
    const status = this.statusFilter();

    return rows.filter((u) => {
      if (role !== 'ALL' && u.role !== role) return false;
      if (status !== 'ALL' && u.status !== status) return false;
      if (!q) return true;
      return `${u.name} ${u.email}`.toLowerCase().includes(q);
    });
  }

  private applyClientSlice(): void {
    const filtered = this.clientCache();
    this.listTotal.set(filtered.length);
    const maxPage = Math.max(0, Math.ceil(filtered.length / this.pageSize()) - 1);
    if (this.pageIndex() > maxPage) {
      this.pageIndex.set(maxPage);
    }
    const start = this.pageIndex() * this.pageSize();
    this.users.set(filtered.slice(start, start + this.pageSize()));
  }

  private computeStats(rows: AdminUserRow[]): AdminUsersStats {
    return {
      total: rows.length,
      active: rows.filter((u) => u.status === 'ACTIVE').length,
      inactive: rows.filter((u) => u.status === 'INACTIVE').length,
      superAdmins: rows.filter((u) => u.role === 'SUPER_ADMIN').length,
      buildingAdmins: rows.filter((u) => u.role === 'BUILDING_ADMIN').length,
      owners: rows.filter((u) => u.role === 'OWNER').length
    };
  }

  roleLabel(role: string): string {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Super admin';
      case 'BUILDING_ADMIN':
        return 'Admin edificio';
      case 'OWNER':
        return 'Propietario';
      default:
        return role;
    }
  }

  private showMessage(message: string, isError = false): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: isError ? ['error-snackbar'] : ['success-snackbar']
    });
  }

  toggleStatus(user: AdminUserRow): void {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.adminService.updateStatus(user.id, newStatus).subscribe({
      next: () => {
        this.showMessage(
          `Estado actualizado a ${newStatus === 'ACTIVE' ? 'Activo' : 'Inactivo'}`
        );
        this.loadUsers();
      },
      error: () => this.showMessage('Error al cambiar el estado del usuario', true)
    });
  }

  openDialog(user?: AdminUserRow): void {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '450px',
      data: user || null
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;
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
            this.pageIndex.set(0);
            this.loadUsers();
          },
          error: (err) => this.showMessage(err.error?.message || 'Error al crear', true)
        });
      }
    });
  }
}
