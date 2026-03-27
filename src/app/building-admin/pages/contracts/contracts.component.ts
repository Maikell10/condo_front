import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ContractService } from '../../../core/services/contract.service';
import { AuthService } from '../../../core/services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { DatePipe, DecimalPipe, NgClass, NgIf } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { NewContractDialogComponent } from '../../../modals/new-contract-dialog/new-contract-dialog.component';

@Component({
  selector: 'app-contracts',
  standalone: true,
  imports: [MatCardModule, MatTableModule, MatButtonModule, MatIconModule, MatChipsModule, NgClass, NgIf, DecimalPipe, DatePipe],
  templateUrl: './contracts.component.html'
})
export class ContractsComponent implements OnInit {
  private contractService = inject(ContractService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);

  contracts = signal<any[]>([]);
  displayedColumns = ['provider', 'service', 'monthlyCost', 'startDate', 'endDate', 'status', 'actions'];

  // KPIs Calculados automáticamente
  totalMonthlyCost = computed(() => this.contracts().reduce((acc, c) => acc + Number(c.monthlyCost), 0));
  activeContracts = computed(() => this.contracts().filter(c => c.status === 'ACTIVE').length);
  expiredContracts = computed(() => this.contracts().filter(c => c.status === 'EXPIRED').length);

  ngOnInit() {
    this.loadContracts();
  }

  loadContracts() {
    const buildingId = this.authService.userSignal()?.buildingId;
    if (buildingId) {
      this.contractService.getBuildingContracts(Number(buildingId)).subscribe({
        next: (res) => this.contracts.set(res.data),
        error: (err) => console.error(err)
      });
    }
  }

  openNewContractDialog() {
    const dialogRef = this.dialog.open(NewContractDialogComponent, { width: '450px' });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const buildingId = this.authService.userSignal()?.buildingId;
        const payload = {
          ...result,
          buildingId: Number(buildingId),
          startDate: result.startDate.toISOString().split('T')[0],
          endDate: result.endDate.toISOString().split('T')[0]
        };

        this.contractService.createContract(payload).subscribe({
          next: () => {
            alert('Contrato creado exitosamente');
            this.loadContracts();
          },
          error: (err) => alert('Error al crear: ' + err.error.message)
        });
      }
    });
  }
}