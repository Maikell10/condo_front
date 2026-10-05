import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DecimalPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApartmentService } from '../../../core/services/apartment.service';
import { AuthService } from '../../../core/services/auth.service';
import { OwnerDataLoaderComponent } from '../../shared/owner-data-loader/owner-data-loader.component';

export interface AliquotRow {
  unit: string;
  owner: string;
  percentage: number;
  isMe: boolean;
}

@Component({
  selector: 'app-aliquots',
  standalone: true,
  imports: [
    DecimalPipe,
    NgClass,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    OwnerDataLoaderComponent
  ],
  templateUrl: './aliquots.component.html',
  styleUrl: './aliquots.component.scss'
})
export class AliquotsComponent implements OnInit {
  private apartmentService = inject(ApartmentService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  displayedColumns: string[] = ['unit', 'owner', 'percentage', 'share'];
  aliquots = signal<AliquotRow[]>([]);
  loading = signal(false);
  searchQuery = signal('');

  buildingLabel = computed(() => {
    const u = this.authService.userSignal() as { buildingName?: string } | null;
    return u?.buildingName?.trim() || 'Tu edificio';
  });
  myRow = computed(() => this.aliquots().find((a) => a.isMe) ?? null);
  unitLabel = computed(() => this.myRow()?.unit || '—');
  myAliquot = computed(() => this.myRow()?.percentage ?? 0);
  unitCount = computed(() => this.aliquots().length);

  totalPercentage = computed(() =>
    this.aliquots().reduce((acc, row) => acc + row.percentage, 0)
  );

  totalIsBalanced = computed(() => Math.abs(this.totalPercentage() - 100) < 0.02);

  showPageLoader = computed(() => this.loading() && this.aliquots().length === 0);

  filteredAliquots = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const list = this.aliquots();
    if (!q) return list;
    return list.filter(
      (row) =>
        String(row.unit).toLowerCase().includes(q) ||
        row.owner.toLowerCase().includes(q)
    );
  });

  maxPercentage = computed(() => {
    const values = this.aliquots().map((r) => r.percentage);
    return values.length ? Math.max(...values) : 1;
  });

  statCards = computed(() => [
    {
      id: 'mine',
      variant: 'violet',
      icon: 'home',
      chip: 'Tu unidad',
      value: `${this.myAliquot().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}%`,
      sub: this.unitLabel() ? `Apto ${this.unitLabel()}` : 'Participación legal'
    },
    {
      id: 'units',
      variant: 'indigo',
      icon: 'apartment',
      chip: 'Unidades',
      value: String(this.unitCount()),
      sub: this.buildingLabel()
    },
    {
      id: 'total',
      variant: this.totalIsBalanced() ? 'emerald' : 'blue',
      icon: 'pie_chart',
      chip: 'Total edificio',
      value: `${this.totalPercentage().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}%`,
      sub: this.totalIsBalanced() ? 'Cuadra con 100%' : 'Revisar suma'
    },
    {
      id: 'view',
      variant: 'blue',
      icon: 'search',
      chip: 'En tabla',
      value: String(this.filteredAliquots().length),
      sub: this.searchQuery() ? 'Con búsqueda' : 'Todas las filas'
    }
  ]);

  ngOnInit() {
    this.loadAliquots();
  }

  loadAliquots() {
    const user = this.authService.userSignal();
    const buildingId = user?.buildingId;
    const myUserId = Number(user?.id);

    if (!buildingId) {
      return;
    }

    this.loading.set(true);
    this.apartmentService.getAliquots(Number(buildingId)).subscribe({
      next: (res: any) => {
        const formattedData: AliquotRow[] = (res.data ?? []).map((apt: any) => ({
          unit: String(apt.unit ?? apt.number ?? ''),
          owner: apt.ownerName || 'Sin asignar',
          percentage: parseFloat(apt.alicuota) * 100,
          isMe: apt.ownerId === myUserId
        }));
        formattedData.sort((a, b) =>
          a.unit.localeCompare(b.unit, undefined, { numeric: true })
        );
        this.aliquots.set(formattedData);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar alícuotas', err);
        this.loading.set(false);
        this.snackBar.open('No se pudo cargar la tabla de alícuotas', 'Cerrar', {
          duration: 3500,
          horizontalPosition: 'end',
          verticalPosition: 'bottom'
        });
      }
    });
  }

  refreshList() {
    this.loadAliquots();
  }

  onSearchChange(value: string) {
    this.searchQuery.set(value);
  }

  shareWidth(row: AliquotRow): number {
    const max = this.maxPercentage();
    if (!max) return 0;
    return Math.max(4, (row.percentage / max) * 100);
  }

  exportCsv() {
    const rows = this.filteredAliquots();
    if (!rows.length) {
      this.snackBar.open('No hay datos para exportar', 'Cerrar', { duration: 3000 });
      return;
    }

    const header = ['Unidad', 'Propietario', 'Alicuota (%)'];
    const lines = rows.map((r) => [
      r.unit,
      r.owner.replace(/"/g, '""'),
      r.percentage.toFixed(4)
    ]);
    const csv = [header, ...lines].map((cols) => cols.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alicuotas_${this.buildingLabel().replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.snackBar.open('Archivo descargado', 'Cerrar', { duration: 2500 });
  }
}
