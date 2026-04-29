import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApartmentService } from '../../../core/services/apartment.service';
import { AuthService } from '../../../core/services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BankAccountDialogComponent } from '../../modal/bank-account-dialog/bank-account-dialog.component';

@Component({
  selector: 'app-bank-accounts',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatDialogModule, MatSnackBarModule],
  templateUrl: './bank-accounts.component.html'
})
export class BankAccountsComponent implements OnInit {
  private apartmentService = inject(ApartmentService);
  private auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  accounts = signal<any[]>([]);
  buildingId = Number(this.auth.userSignal()?.buildingId);

  ngOnInit() {
    this.loadAccounts();
  }

  loadAccounts() {
    if (this.buildingId) {
      this.apartmentService.getBankAccounts(this.buildingId).subscribe(res => this.accounts.set(res.data));
    }
  }

  openDialog(account?: any) {
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
          this.apartmentService.createBankAccount({ ...result, building_id: this.buildingId }).subscribe(() => {
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