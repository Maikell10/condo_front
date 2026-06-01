import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ContractService } from '../../../core/services/contract.service';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardService } from '../../../core/services/dashboard.service'; // <-- Necesario para cargar edificios
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select'; // <-- Selector
import { DatePipe, DecimalPipe, NgClass, NgIf, NgFor } from '@angular/common'; // <-- Añadido NgFor
import { MatDialog } from '@angular/material/dialog';
import { NewContractDialogComponent } from '../../../modals/new-contract-dialog/new-contract-dialog.component';

@Component({
  selector: 'app-contracts',
  standalone: true,
  imports: [
    MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatSelectModule, NgClass, NgIf, NgFor, DecimalPipe, DatePipe
  ],
  templateUrl: './contracts.component.html'
})
export class ContractsComponent implements OnInit {
  private contractService = inject(ContractService);
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private dialog = inject(MatDialog);

  // --- SEÑALES DEL CONJUNTO RESIDENCIAL ---
  isComplex = computed(() => !!this.authService.userSignal()?.complexId);
  buildingsList = signal<any[]>([]);
  selectedBuildingId = signal<number | 'ALL'>('ALL'); // 'ALL' por defecto para Conjuntos

  contracts = signal<any[]>([]);

  // 🔥 Columnas Dinámicas: Si estamos viendo "TODOS", mostramos la columna del Edificio
  displayedColumns = computed(() => {
    const baseCols = ['provider', 'service', 'monthlyCost', 'startDate', 'endDate', 'status', 'actions'];
    if (this.isComplex() && this.selectedBuildingId() === 'ALL') {
      return ['buildingName', ...baseCols]; // Agrega la columna al inicio
    }
    return baseCols;
  });

  // KPIs Calculados automáticamente
  totalMonthlyCost = computed(() => this.contracts().reduce((acc, c) => acc + Number(c.monthlyCost), 0));
  activeContracts = computed(() => this.contracts().filter(c => c.status === 'ACTIVE').length);
  expiredContracts = computed(() => this.contracts().filter(c => c.status === 'EXPIRED').length);

  ngOnInit() {
    this.initView();
  }

  initView() {
    const user = this.authService.userSignal();

    if (user?.complexId) {
      // 1. Cargamos edificios del conjunto
      this.dashboardService.getBuildingsByComplex().subscribe({
        next: (res: any) => {
          this.buildingsList.set(res.data);
          this.selectedBuildingId.set('ALL'); // Empezamos viendo TODOS
          this.loadContracts('ALL');
        }
      });
    } else if (user?.buildingId) {
      // 2. Edificio Único
      this.selectedBuildingId.set(Number(user.buildingId));
      this.loadContracts(Number(user.buildingId));
    }
  }

  loadContracts(buildingId: number | 'ALL') {
    if (buildingId === 'ALL') {
      const complexId = this.authService.userSignal()?.complexId;
      // NOTA: Debes crear getComplexContracts en tu service para buscar todos los del conjunto
      this.contractService.getComplexContracts(Number(complexId)).subscribe({
        next: (res: any) => this.contracts.set(res.data),
        error: (err: any) => console.error(err)
      });
    } else {
      this.contractService.getBuildingContracts(buildingId).subscribe({
        next: (res: any) => this.contracts.set(res.data),
        error: (err: any) => console.error(err)
      });
    }
  }

  onBuildingChange(val: number | 'ALL') {
    this.selectedBuildingId.set(val);
    this.contracts.set([]); // Limpiamos tabla visualmente
    this.loadContracts(val);
  }

  openNewContractDialog() {
    const dialogRef = this.dialog.open(NewContractDialogComponent, {
      width: '450px',
      // Pasamos data extra al modal para que sepa si mostrar un dropdown de "Edificio"
      data: {
        isComplex: this.isComplex(),
        buildingsList: this.buildingsList(),
        currentSelection: this.selectedBuildingId()
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const payload = {
          ...result,
          // Si el modal no devuelve un buildingId específico, asume el seleccionado actualmente
          buildingId: result.buildingId || this.selectedBuildingId(),
          complexId: this.authService.userSignal()?.complexId,
          startDate: result.startDate.toISOString().split('T')[0],
          endDate: result.endDate.toISOString().split('T')[0]
        };

        this.contractService.createContract(payload).subscribe({
          next: () => {
            alert('Contrato creado exitosamente');
            this.loadContracts(this.selectedBuildingId());
          },
          error: (err: any) => alert('Error al crear: ' + err.error.message)
        });
      }
    });
  }
}