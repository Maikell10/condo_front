import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContractService } from '../../../core/services/contract.service';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { NewContractDialogComponent } from '../../../modals/new-contract-dialog/new-contract-dialog.component';
import { DateOnlyPipe } from '../../../shared/date-only.pipe';

@Component({
  selector: 'app-contracts',
  standalone: true,
  imports: [
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
    DecimalPipe,
    DateOnlyPipe
  ],
  templateUrl: './contracts.component.html',
  styleUrl: './contracts.component.scss'
})
export class ContractsComponent implements OnInit {
  private contractService = inject(ContractService);
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  isComplex = computed(() => !!this.authService.userSignal()?.complexId);
  buildingsList = signal<any[]>([]);
  selectedBuildingId = signal<number | 'ALL'>('ALL');

  contracts = signal<any[]>([]);
  loading = signal(false);
  searchQuery = signal('');

  filteredContracts = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const list = this.contracts();
    if (!q) return list;
    return list.filter(
      (c) =>
        c.provider?.toLowerCase().includes(q) ||
        c.service?.toLowerCase().includes(q) ||
        c.buildingName?.toLowerCase().includes(q)
    );
  });

  showBuildingColumn = computed(
    () => this.isComplex() && this.selectedBuildingId() === 'ALL'
  );

  displayedColumns = computed(() => {
    const baseCols = [
      'provider',
      'service',
      'monthlyCost',
      'startDate',
      'endDate',
      'status',
      'actions'
    ];
    if (this.showBuildingColumn()) {
      return ['buildingName', ...baseCols];
    }
    return baseCols;
  });

  totalMonthlyCost = computed(() =>
    this.contracts().reduce((acc, c) => acc + Number(c.monthlyCost || 0), 0)
  );
  activeContracts = computed(() =>
    this.contracts().filter((c) => c.status === 'ACTIVE').length
  );
  expiredContracts = computed(() =>
    this.contracts().filter((c) => c.status === 'EXPIRED').length
  );
  totalContracts = computed(() => this.contracts().length);

  scopeLabel = computed(() => {
    const sel = this.selectedBuildingId();
    if (sel === 'ALL') return 'Todo el conjunto';
    const b = this.buildingsList().find((x) => x.id === sel);
    return b?.name || 'Edificio';
  });

  statCards = computed(() => [
    {
      id: 'active',
      variant: 'emerald',
      icon: 'verified_user',
      chip: 'Activos',
      value: this.activeContracts(),
      sub: 'Vigentes hoy'
    },
    {
      id: 'expired',
      variant: 'rose',
      icon: 'event_busy',
      chip: 'Vencidos',
      value: this.expiredContracts(),
      sub: 'Requieren renovación'
    },
    {
      id: 'cost',
      variant: 'amber',
      icon: 'account_balance',
      chip: 'Carga mensual',
      value: `$${this.totalMonthlyCost().toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: 'Suma de contratos en vista'
    },
    {
      id: 'total',
      variant: 'blue',
      icon: 'description',
      chip: 'Registrados',
      value: this.totalContracts(),
      sub: this.scopeLabel()
    }
  ]);

  ngOnInit() {
    this.initView();
  }

  initView() {
    const user = this.authService.userSignal();

    if (user?.complexId) {
      this.dashboardService.getBuildingsByComplex().subscribe({
        next: (res: any) => {
          this.buildingsList.set(res.data ?? []);
          this.selectedBuildingId.set('ALL');
          this.loadContracts('ALL');
        }
      });
    } else if (user?.buildingId) {
      this.selectedBuildingId.set(Number(user.buildingId));
      this.loadContracts(Number(user.buildingId));
    }
  }

  loadContracts(buildingId: number | 'ALL') {
    this.loading.set(true);
    const done = (data: any[]) => {
      this.contracts.set(data ?? []);
      this.loading.set(false);
    };
    const fail = () => {
      this.loading.set(false);
      this.snackBar.open('No se pudieron cargar los contratos', 'Cerrar', {
        duration: 4000
      });
    };

    if (buildingId === 'ALL') {
      const complexId = this.authService.userSignal()?.complexId;
      this.contractService.getComplexContracts(Number(complexId)).subscribe({
        next: (res: any) => done(res.data),
        error: fail
      });
    } else {
      this.contractService.getBuildingContracts(buildingId).subscribe({
        next: (res: any) => done(res.data),
        error: fail
      });
    }
  }

  onBuildingChange(val: number | 'ALL') {
    this.selectedBuildingId.set(val);
    this.searchQuery.set('');
    this.contracts.set([]);
    this.loadContracts(val);
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(String(value || '').trim().toLowerCase());
  }

  refreshList(): void {
    this.loadContracts(this.selectedBuildingId());
  }

  statusLabel(status: string): string {
    return status === 'ACTIVE' ? 'Activo' : 'Vencido';
  }

  openNewContractDialog() {
    const dialogRef = this.dialog.open(NewContractDialogComponent, {
      width: '450px',
      data: {
        isComplex: this.isComplex(),
        buildingsList: this.buildingsList(),
        currentSelection: this.selectedBuildingId()
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;

      const payload = {
        ...result,
        buildingId: result.buildingId || this.selectedBuildingId(),
        complexId: this.authService.userSignal()?.complexId,
        startDate: result.startDate.toISOString().split('T')[0],
        endDate: result.endDate.toISOString().split('T')[0]
      };

      this.contractService.createContract(payload).subscribe({
        next: () => {
          this.snackBar.open('Contrato creado correctamente', 'Cerrar', {
            duration: 3000
          });
          this.loadContracts(this.selectedBuildingId());
        },
        error: (err: any) =>
          this.snackBar.open(
            err.error?.message || 'Error al crear el contrato',
            'Cerrar',
            { duration: 4000 }
          )
      });
    });
  }
}
