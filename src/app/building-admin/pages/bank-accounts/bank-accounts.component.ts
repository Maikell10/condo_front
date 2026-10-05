import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApartmentService } from '../../../core/services/apartment.service';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BankAccountDialogComponent } from '../../modal/bank-account-dialog/bank-account-dialog.component';

@Component({
  selector: 'app-bank-accounts',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatSnackBarModule,
    MatSelectModule,
    MatTooltipModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './bank-accounts.component.html',
  styleUrl: './bank-accounts.component.scss'
})
export class BankAccountsComponent implements OnInit {
  private apartmentService = inject(ApartmentService);
  private auth = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  isComplex = computed(() => !!this.auth.userSignal()?.complexId);
  buildingsList = signal<any[]>([]);
  selectedBuildingId = signal<number | 'ALL'>('ALL');

  accounts = signal<any[]>([]);
  loading = signal(false);
  searchQuery = signal('');

  filteredAccounts = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const data = this.accounts();
    if (!query) return data;

    const compactQuery = query.replace(/\s+/g, '');
    return data.filter((acc) => {
      const bankName = String(acc.bank_name || '').toLowerCase();
      const accountNumber = String(acc.account_number || '').toLowerCase();
      const compactAccount = accountNumber.replace(/\s+/g, '');
      const holder = String(acc.holder_name || '').toLowerCase();
      return (
        bankName.includes(query) ||
        accountNumber.includes(query) ||
        compactAccount.includes(compactQuery) ||
        holder.includes(query)
      );
    });
  });

  totalAccounts = computed(() => this.accounts().length);
  activeAccounts = computed(() =>
    this.accounts().filter((a) => a.status === 'ACTIVE').length
  );
  uniqueBanks = computed(() => {
    const names = new Set(
      this.accounts().map((a) => String(a.bank_name || '').trim()).filter(Boolean)
    );
    return names.size;
  });

  scopeLabel = computed(() => {
    const sel = this.selectedBuildingId();
    if (sel === 'ALL') return 'Todos los edificios';
    const b = this.buildingsList().find((x) => x.id === sel);
    return b?.name || 'Edificio';
  });

  canEditAccounts = computed(() => this.selectedBuildingId() !== 'ALL');

  statCards = computed(() => [
    {
      id: 'total',
      variant: 'teal',
      icon: 'credit_card',
      chip: 'Cuentas',
      value: this.totalAccounts(),
      sub: this.scopeLabel()
    },
    {
      id: 'active',
      variant: 'emerald',
      icon: 'check_circle',
      chip: 'Activas',
      value: this.activeAccounts(),
      sub: 'Visibles para pagos'
    },
    {
      id: 'banks',
      variant: 'cyan',
      icon: 'account_balance',
      chip: 'Bancos',
      value: this.uniqueBanks(),
      sub: 'Instituciones distintas'
    },
    {
      id: 'view',
      variant: 'slate',
      icon: 'visibility',
      chip: 'En pantalla',
      value: this.filteredAccounts().length,
      sub: this.searchQuery() ? 'Con filtro' : 'Sin filtro'
    }
  ]);

  ngOnInit() {
    this.initView();
  }

  initView() {
    const user = this.auth.userSignal();

    if (user?.complexId) {
      this.dashboardService.getBuildingsByComplex().subscribe({
        next: (res: any) => {
          this.buildingsList.set(res.data ?? []);
          this.selectedBuildingId.set('ALL');
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
    this.searchQuery.set('');
    this.accounts.set([]);
    this.loadAccounts();
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(String(value ?? ''));
  }

  refreshList(): void {
    this.loadAccounts();
  }

  loadAccounts() {
    this.loading.set(true);
    const buildingId = this.selectedBuildingId();
    const complexId = this.auth.userSignal()?.complexId;

    const payload =
      buildingId === 'ALL'
        ? { isComplex: true, complexId: complexId }
        : { isComplex: false, buildingId: buildingId };

    this.apartmentService.getBankAccountsAdmin(payload).subscribe({
      next: (res: any) => {
        this.accounts.set(res.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('No se pudieron cargar las cuentas', 'Cerrar', {
          duration: 4000
        });
      }
    });
  }

  copyAccountNumber(number: string): void {
    if (!number) return;
    navigator.clipboard.writeText(String(number)).then(() => {
      this.snackBar.open('Número de cuenta copiado', 'Cerrar', { duration: 2000 });
    });
  }

  openDialog(account?: any) {
    if (this.selectedBuildingId() === 'ALL' && account) {
      this.snackBar.open(
        'Para editar o eliminar, elige el edificio en el selector superior.',
        'Entendido',
        { duration: 4000 }
      );
      return;
    }

    const dialogRef = this.dialog.open(BankAccountDialogComponent, {
      width: '450px',
      data: account || null
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;

      if (account) {
        this.apartmentService.updateBankAccount(account.id, result).subscribe({
          next: () => {
            this.snackBar.open('Cuenta actualizada', 'Cerrar', { duration: 3000 });
            this.loadAccounts();
          },
          error: () =>
            this.snackBar.open('Error al actualizar', 'Cerrar', { duration: 3000 })
        });
      } else {
        const payload = { ...result };

        if (this.selectedBuildingId() === 'ALL') {
          payload.building_id = 'ALL';
          payload.complex_id = this.auth.userSignal()?.complexId;
        } else {
          payload.building_id = this.selectedBuildingId();
        }

        this.apartmentService.createBankAccount(payload).subscribe({
          next: (res: any) => {
            this.snackBar.open(res.message || 'Cuentas registradas', 'Cerrar', {
              duration: 4000
            });
            this.loadAccounts();
          },
          error: () =>
            this.snackBar.open('Error al registrar cuenta', 'Cerrar', { duration: 3000 })
        });
      }
    });
  }

  deleteAccount(id: number) {
    if (!confirm('¿Estás seguro de eliminar esta cuenta?')) return;

    this.apartmentService.deleteBankAccount(id).subscribe({
      next: () => {
        this.snackBar.open('Cuenta eliminada', 'Cerrar', { duration: 3000 });
        this.loadAccounts();
      },
      error: () =>
        this.snackBar.open('No se pudo eliminar la cuenta', 'Cerrar', { duration: 3000 })
    });
  }
}
