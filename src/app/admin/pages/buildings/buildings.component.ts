import { animate, keyframes, style, transition, trigger } from '@angular/animations';
import { Component, computed, effect, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { BuildingDialogComponent } from '../../../modals/building-dialog/building-dialog.component';
import { AssignAdminDialogComponent } from '../../../modals/assign-admin-dialog/assign-admin-dialog.component';
import {
  AdminBuilding,
  AdminComplexSummary,
  BuildingComplexGroup
} from './admin-building.model';

function buildingsPaginatorLabels(): MatPaginatorIntl {
  const intl = new MatPaginatorIntl();
  intl.itemsPerPageLabel = 'Edificios por página';
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
  selector: 'app-buildings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatChipsModule,
    MatButtonModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatPaginatorModule
  ],
  providers: [{ provide: MatPaginatorIntl, useValue: buildingsPaginatorLabels() }],
  templateUrl: './buildings.component.html',
  styleUrl: './buildings.component.scss',
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
    ]),
    trigger('panelSwap', [
      transition('* => *', [
        style({ opacity: 0, transform: 'translateY(14px) scale(0.99)' }),
        animate(
          '240ms cubic-bezier(0.22, 1, 0.36, 1)',
          style({ opacity: 1, transform: 'translateY(0) scale(1)' })
        )
      ])
    ])
  ]
})
export class BuildingsComponent implements OnInit {
  private adminService = inject(AdminService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  buildings = signal<AdminBuilding[]>([]);
  complexes = signal<AdminComplexSummary[]>([]);
  loading = signal(true);
  loadError = signal<string | null>(null);

  searchQuery = signal('');
  statusFilter = signal<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  complexFilter = signal<string>('ALL');
  viewMode = signal<'grouped' | 'table'>('grouped');
  pageIndex = signal(0);
  pageSize = signal(10);
  selectedGroupKey = signal<string | null>(null);
  complexActionId = signal<number | null>(null);

  displayedColumns = ['code', 'name', 'complex', 'admin', 'apartments', 'status', 'actions'];
  groupedDetailColumns = ['code', 'name', 'admin', 'apartments', 'status', 'actions'];

  constructor() {
    effect(() => {
      this.searchQuery();
      this.statusFilter();
      this.complexFilter();
      this.pageIndex.set(0);
    });

    effect(() => {
      const groups = this.groupedComplexes();
      const current = this.selectedGroupKey();
      if (!groups.length) {
        this.selectedGroupKey.set(null);
        return;
      }
      if (!current || !groups.some((g) => g.key === current)) {
        this.selectedGroupKey.set(groups[0].key);
      }
    });
  }

  filteredBuildings = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();
    const complex = this.complexFilter();

    return this.buildings().filter((b) => {
      if (status !== 'ALL' && b.status !== status) return false;
      if (complex === 'none' && b.complexId != null) return false;
      if (complex !== 'ALL' && complex !== 'none' && String(b.complexId) !== complex) return false;
      if (!q) return true;
      const haystack = [
        b.name,
        b.code,
        b.address,
        b.adminEmail,
        b.adminName,
        b.complexName,
        b.complexAddress
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  });

  groupedComplexes = computed((): BuildingComplexGroup[] => {
    const map = new Map<string, BuildingComplexGroup>();

    for (const b of this.filteredBuildings()) {
      const complexId = b.complexId ?? null;
      const key = complexId == null ? 'standalone' : String(complexId);
      if (!map.has(key)) {
        map.set(key, {
          key,
          complexId,
          complexName: b.complexName?.trim() || 'Edificios sin conjunto',
          complexAddress: b.complexAddress,
          buildings: []
        });
      }
      map.get(key)!.buildings.push(b);
    }

    const groups = Array.from(map.values());
    groups.sort((a, b) => {
      if (a.complexId == null) return 1;
      if (b.complexId == null) return -1;
      return a.complexName.localeCompare(b.complexName, 'es');
    });
    return groups;
  });

  selectedGroup = computed(() => {
    const key = this.selectedGroupKey();
    if (!key) return null;
    return this.groupedComplexes().find((g) => g.key === key) ?? null;
  });

  total = computed(() => this.buildings().length);
  totalFiltered = computed(() => this.filteredBuildings().length);
  active = computed(() => this.buildings().filter((b) => b.status === 'ACTIVE').length);
  inactive = computed(() => this.buildings().filter((b) => b.status === 'INACTIVE').length);
  totalComplexes = computed(() => this.complexes().length);
  withoutAdmin = computed(() => this.buildings().filter((b) => !b.adminEmail).length);

  statCards = computed(() => [
    {
      id: 'total',
      variant: 'indigo',
      icon: 'location_city',
      chip: 'Total',
      chipClass: '',
      label: 'Edificios registrados',
      value: this.total()
    },
    {
      id: 'complexes',
      variant: 'violet',
      icon: 'holiday_village',
      chip: 'Conjuntos',
      chipClass: '',
      label: 'Recintos multi-torre',
      value: this.totalComplexes()
    },
    {
      id: 'active',
      variant: 'emerald',
      icon: 'verified',
      chip: 'Operativos',
      chipClass: 'stat-card__chip--ok',
      label: 'Edificios activos',
      value: this.active()
    },
    {
      id: 'inactive',
      variant: 'rose',
      icon: 'domain_disabled',
      chip: 'Pausa',
      chipClass: 'stat-card__chip--warn',
      label: 'Suspendidos',
      value: this.inactive()
    },
    {
      id: 'noAdmin',
      variant: 'amber',
      icon: 'person_off',
      chip: 'Atención',
      chipClass: 'stat-card__chip--alert',
      label: 'Sin administrador',
      value: this.withoutAdmin()
    }
  ]);

  paginatedTableRows = computed(() => {
    const rows = this.filteredBuildings();
    const start = this.pageIndex() * this.pageSize();
    return rows.slice(start, start + this.pageSize());
  });

  ngOnInit(): void {
    this.loadBuildings();
  }

  loadBuildings(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.adminService.getBuildings().subscribe({
      next: (res) => {
        const rows = (res.data ?? []) as AdminBuilding[];
        this.buildings.set(rows);
        this.complexes.set(this.resolveComplexes(rows, res.complexes));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set('No se pudieron cargar los edificios. Revisa la API o vuelve a intentar.');
      }
    });
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set('ALL');
    this.complexFilter.set('ALL');
  }

  onTablePage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  selectComplexGroup(key: string): void {
    this.selectedGroupKey.set(key);
  }

  groupActiveCount(group: BuildingComplexGroup): number {
    return group.buildings.filter((b) => b.status === 'ACTIVE').length;
  }

  groupTotalUnits(group: BuildingComplexGroup): number {
    return group.buildings.reduce((sum, b) => sum + (Number(b.totalApartments) || 0), 0);
  }

  /** Etiqueta corta para users.status del administrador asignado */
  adminStatusLabel(status: string | null | undefined): string | null {
    if (!status) return null;
    return status === 'ACTIVE' ? 'Admin activo' : 'Admin inactivo';
  }

  groupAdminStatus(group: BuildingComplexGroup): string | null {
    for (const b of group.buildings) {
      if (b.adminStatus) return b.adminStatus;
    }
    return null;
  }

  groupHasAssignedAdmin(group: BuildingComplexGroup): boolean {
    return group.buildings.some((b) => !!b.adminEmail);
  }

  isComplexFullyActive(group: BuildingComplexGroup): boolean {
    if (group.complexId == null || !group.buildings.length) return false;
    const buildingsOk = group.buildings.every((b) => b.status === 'ACTIVE');
    if (!buildingsOk) return false;
    if (!this.groupHasAssignedAdmin(group)) return true;
    return this.groupAdminStatus(group) === 'ACTIVE';
  }

  isComplexFullySuspended(group: BuildingComplexGroup): boolean {
    if (group.complexId == null || !group.buildings.length) return false;
    const buildingsOk = group.buildings.every((b) => b.status === 'INACTIVE');
    if (!buildingsOk) return false;
    if (!this.groupHasAssignedAdmin(group)) return true;
    return this.groupAdminStatus(group) === 'INACTIVE';
  }

  suspendComplexGroup(group: BuildingComplexGroup): void {
    this.applyComplexGroupStatus(group, 'INACTIVE');
  }

  activateComplexGroup(group: BuildingComplexGroup): void {
    this.applyComplexGroupStatus(group, 'ACTIVE');
  }

  private applyComplexGroupStatus(
    group: BuildingComplexGroup,
    status: 'ACTIVE' | 'INACTIVE'
  ): void {
    const complexId = group.complexId;
    if (complexId == null) return;

    const isSuspend = status === 'INACTIVE';
    const ok = confirm(
      isSuspend
        ? `¿Suspender el conjunto "${group.complexName}"?\n\nSe suspenderán los ${group.buildings.length} edificio(s) y la cuenta del administrador.`
        : `¿Activar el conjunto "${group.complexName}"?\n\nSe activarán todos los edificios y la cuenta del administrador.`
    );
    if (!ok) return;

    this.complexActionId.set(complexId);
    this.adminService.updateComplexStatus(complexId, status).subscribe({
      next: (res) => {
        this.complexActionId.set(null);
        this.buildings.update((list) =>
          list.map((b) =>
            b.complexId === complexId
              ? { ...b, status, adminStatus: b.adminEmail ? status : b.adminStatus }
              : b
          )
        );
        this.showMessage(res.message || (isSuspend ? 'Conjunto suspendido' : 'Conjunto activado'));
      },
      error: (err) => {
        this.complexActionId.set(null);
        this.showMessage(err.error?.message || 'No se pudo actualizar el conjunto', true);
      }
    });
  }

  private showMessage(message: string, isError = false): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: isError ? ['error-snackbar'] : ['success-snackbar']
    });
  }

  toggleStatus(building: AdminBuilding): void {
    const newStatus = building.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.adminService.updateBuildingStatus(building.id, newStatus).subscribe({
      next: () => {
        this.buildings.update((list) =>
          list.map((b) => (b.id === building.id ? { ...b, status: newStatus } : b))
        );
        this.showMessage(`Estado actualizado a ${newStatus === 'ACTIVE' ? 'Activo' : 'Suspendido'}`);
      },
      error: () => this.showMessage('Error al cambiar el estado del edificio', true)
    });
  }

  openDialog(building?: AdminBuilding): void {
    const dialogRef = this.dialog.open(BuildingDialogComponent, {
      width: '450px',
      data: building || null
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;
      if (building) {
        this.adminService.updateBuilding(building.id, result).subscribe({
          next: (response) => {
            this.showMessage(response.message || 'Edificio actualizado correctamente');
            this.loadBuildings();
          },
          error: (err) => {
            this.showMessage(err.error?.message || 'Ocurrió un error al actualizar', true);
          }
        });
      } else {
        this.adminService.createBuilding(result).subscribe({
          next: (response) => {
            this.showMessage(response.message || 'Edificio creado exitosamente');
            this.loadBuildings();
          },
          error: (err) => {
            this.showMessage(err.error?.message || 'Ocurrió un error al crear', true);
          }
        });
      }
    });
  }

  private resolveComplexes(
    rows: AdminBuilding[],
    fromApi?: AdminComplexSummary[]
  ): AdminComplexSummary[] {
    if (fromApi?.length) return fromApi;
    const map = new Map<number, AdminComplexSummary>();
    for (const b of rows) {
      if (b.complexId == null || !b.complexName) continue;
      const existing = map.get(b.complexId);
      if (existing) {
        existing.buildingCount += 1;
      } else {
        map.set(b.complexId, {
          id: b.complexId,
          name: b.complexName,
          address: b.complexAddress,
          buildingCount: 1
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }

  openAssignAdmin(building: AdminBuilding): void {
    const dialogRef = this.dialog.open(AssignAdminDialogComponent, {
      width: '400px',
      data: {
        buildingId: building.id,
        buildingName: building.name,
        currentEmail: building.adminEmail
      }
    });

    dialogRef.afterClosed().subscribe((email) => {
      if (!email) return;
      this.adminService.assignBuildingAdmin(building.id, email).subscribe({
        next: (res) => {
          this.showMessage(res.message);
          this.loadBuildings();
        },
        error: (err) => this.showMessage(err.error?.message || 'Error al asignar administrador', true)
      });
    });
  }
}
