import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApartmentService } from '../../../core/services/apartment.service';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardService } from '../../../core/services/dashboard.service'; // 🔥 Añadido
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select'; // 🔥 Añadido
import { MatTooltipModule } from '@angular/material/tooltip'; // 🔥 Añadido
import { BankAccountDialogComponent } from '../../modal/bank-account-dialog/bank-account-dialog.component';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-bank-accounts',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatButtonModule,
    MatDialogModule, MatSnackBarModule, MatSelectModule, MatTooltipModule, MatDividerModule
  ],
  templateUrl: './bank-accounts.component.html'
})
export class BankAccountsComponent implements OnInit {
  private apartmentService = inject(ApartmentService);
  private auth = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  // --- SEÑALES DEL CONJUNTO RESIDENCIAL ---
  isComplex = computed(() => !!this.auth.userSignal()?.complexId);
  buildingsList = signal<any[]>([]);
  selectedBuildingId = signal<number | 'ALL'>('ALL');

  accounts = signal<any[]>([]);

  ngOnInit() {
    this.initView();
  }

  initView() {
    const user = this.auth.userSignal();

    if (user?.complexId) {
      this.dashboardService.getBuildingsByComplex().subscribe({
        next: (res: any) => {
          this.buildingsList.set(res.data);
          this.selectedBuildingId.set('ALL'); // Empieza viendo todo el conjunto
          this.loadAccounts();
        }
      });
    } else if (user?.buildingId) {
      this.selectedBuildingId.set(Number(user.buildingId));
      this.loadAccounts();
    }
  }

  onBuildingChange(buildingId: number | 'ALL') {
    this.selectedBuildingId.set(buildingId);
    this.accounts.set([]); // Limpiamos vista temporalmente
    this.loadAccounts();
  }

  loadAccounts() {
    const buildingId = this.selectedBuildingId();
    const complexId = this.auth.userSignal()?.complexId;

    const payload = buildingId === 'ALL'
      ? { isComplex: true, complexId: complexId }
      : { isComplex: false, buildingId: buildingId };

    this.apartmentService.getBankAccountsAdmin(payload).subscribe({
      next: (res: any) => this.accounts.set(res.data)
    });
  }

  openDialog(account?: any) {
    // Si estamos en la vista global, no se puede crear
    if (this.selectedBuildingId() === 'ALL') return;

    const dialogRef = this.dialog.open(BankAccountDialogComponent, {
      width: '450px',
      data: account || null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (account) {
          this.apartmentService.updateBankAccount(account.id, result).subscribe(() => {
            this.snackBar.open('Cuenta actualizada', 'Cerrar', { duration: 3000 });
            this.loadAccounts();
          });
        } else {
          // Usamos el selectedBuildingId en lugar del viejo ID del token
          this.apartmentService.createBankAccount({ ...result, building_id: this.selectedBuildingId() }).subscribe(() => {
            this.snackBar.open('Cuenta registrada', 'Cerrar', { duration: 3000 });
            this.loadAccounts();
          });
        }
      }
    });
  }

  deleteAccount(id: number) {
    if (confirm('¿Estás seguro de eliminar esta cuenta?')) {
      this.apartmentService.deleteBankAccount(id).subscribe(() => {
        this.snackBar.open('Cuenta eliminada', 'Cerrar', { duration: 3000 });
        this.loadAccounts();
      });
    }
  }
}