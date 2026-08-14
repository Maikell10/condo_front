import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { SaasService, SaaSAdmin } from '../../../core/services/saas.service';
import { ConfigSaasModalComponent } from '../../../modals/config-saas-modal/config-saas-modal.component';

@Component({
  selector: 'app-administration',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatTableModule,
    MatIconModule, MatButtonModule, MatTooltipModule, MatChipsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, FormsModule, MatSnackBarModule, MatDialogModule
  ],
  templateUrl: './administration.component.html'
})
export class AdministrationComponent implements OnInit {

  private saasService = inject(SaasService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  // 🔥 Señal ahora vacía, se llenará con la DB
  adminsList = signal<SaaSAdmin[]>([]);

  searchQuery = signal<string>('');
  selectedStatus = signal<string>('ALL');

  displayedColumns = ['client', 'scope', 'plan', 'status', 'amounts', 'actions'];

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.saasService.getDashboard().subscribe({
      next: (res) => {
        if (res.success) {
          this.adminsList.set(res.data);
        }
      },
      error: (err) => {
        console.error("Error al cargar SaaS", err);
        this.snackBar.open('Error al conectar con la base de datos', 'Cerrar', { duration: 3000 });
      }
    });
  }

  filteredAdmins = computed(() => {
    let data = this.adminsList();

    if (this.selectedStatus() !== 'ALL') {
      data = data.filter(a => a.currentPeriod.status === this.selectedStatus());
    }

    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      data = data.filter(a =>
        a.name.toLowerCase().includes(query) ||
        a.email.toLowerCase().includes(query)
      );
    }

    return data;
  });

  // KPIs
  totalMRR = computed(() => {
    return this.adminsList().reduce((acc, admin) => acc + admin.billingConfig.feeAmount, 0);
  });

  collectedThisMonth = computed(() => {
    return this.adminsList()
      .filter(a => a.currentPeriod.status === 'PAID')
      .reduce((acc, admin) => acc + admin.billingConfig.feeAmount, 0);
  });

  pendingCollection = computed(() => {
    return this.adminsList()
      .filter(a => a.currentPeriod.status !== 'PAID')
      .reduce((acc, admin) => acc + admin.billingConfig.feeAmount, 0);
  });

  applySearch(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val);
  }

  // --- ACCIONES A LA BASE DE DATOS ---

  openConfigModal(admin: SaaSAdmin) {
    const dialogRef = this.dialog.open(ConfigSaasModalComponent, {
      width: '450px',
      disableClose: true,
      data: admin // Le pasamos toda la info del admin al modal
    });

    dialogRef.afterClosed().subscribe(result => {
      // Si el usuario guardó (result trae los datos del formulario)
      if (result) {
        const payload = {
          admin_id: admin.id,
          fee_amount: result.feeAmount,
          currency: result.currency,
          local_currency: admin.billingConfig.localCurrency || 'BS', // Mantenemos la moneda local intacta
          due_days: result.dueDays
        };

        this.saasService.updateSubscription(payload).subscribe({
          next: () => {
            this.snackBar.open('Configuración actualizada correctamente', 'Cerrar', { duration: 3000 });
            this.loadDashboard(); // Refresca la tabla automáticamente
          },
          error: () => this.snackBar.open('Error al actualizar la configuración', 'Cerrar', { duration: 3000 })
        });
      }
    });
  }

  registerSaaSPayment(admin: SaaSAdmin) {
    const confirmPayment = confirm(`¿Confirmas que recibiste el pago de ${admin.billingConfig.feeAmount} ${admin.billingConfig.currency} de ${admin.name}?`);

    if (confirmPayment) {
      const payload = {
        admin_id: admin.id,
        amount_paid: admin.billingConfig.feeAmount,
        payment_method: 'Zelle / Transferencia',
        reference_number: `REF-${new Date().getTime()}`,
        payment_date: new Date().toISOString().split('T')[0], // Fecha actual
        notes: 'Pago registrado desde el Dashboard SaaS'
      };

      this.saasService.registerPayment(payload).subscribe({
        next: () => {
          this.snackBar.open('Pago registrado con éxito', 'Cerrar', { duration: 3000 });
          this.loadDashboard(); // Recargamos para que pase a color verde (PAID)
        },
        error: (err) => alert(err.error?.message || 'Error al procesar el pago')
      });
    }
  }

  openHistoryModal(admin: SaaSAdmin) {
    this.saasService.getPaymentHistory(admin.id).subscribe({
      next: (res) => {
        // Por ahora lo mostramos en consola. Luego puedes hacer una tabla/modal
        console.log(`Historial de ${admin.name}:`, res.data);
        alert(`Se encontraron ${res.data.length} pagos en el historial. Revisa la consola para detalles.`);
      }
    });
  }
}