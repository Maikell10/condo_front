import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BillingService } from '../../../core/services/billing.service';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { MatDividerModule } from '@angular/material/divider';
import { AdminPaymentModalComponent } from '../../modal/admin-payment-modal/admin-payment-modal.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-statements',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatCardModule, MatButtonModule,
    MatIconModule, MatSelectModule, MatTooltipModule, MatDividerModule
  ],
  templateUrl: './statements.component.html'
})
export class StatementsComponent implements OnInit {
  private billingService = inject(BillingService);
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);

  private dialog = inject(MatDialog);

  isComplex = computed(() => !!this.authService.userSignal()?.complexId);
  buildingsList = signal<any[]>([]);
  selectedBuildingId = signal<number | 'ALL'>('ALL');

  receipts = signal<any[]>([]);

  // Columnas dinámicas
  displayedColumns = computed(() => {
    const baseCols = ['issueDate', 'apartment', 'ownerName', 'description', 'amount', 'paid', 'balance', 'status', 'actions'];
    if (this.isComplex() && this.selectedBuildingId() === 'ALL') {
      return ['buildingName', ...baseCols];
    }
    return baseCols;
  });

  // KPIs calculados
  totalExpected = computed(() => this.receipts().reduce((acc, r) => acc + Number(r.amount), 0));
  totalCollected = computed(() => this.receipts().reduce((acc, r) => acc + Number(r.paid), 0));
  totalPending = computed(() => this.receipts().reduce((acc, r) => acc + Number(r.balance), 0));

  // Porcentaje de recaudación
  collectionRate = computed(() => {
    const expected = this.totalExpected();
    if (expected === 0) return 0;
    return Math.round((this.totalCollected() / expected) * 100);
  });

  ngOnInit() {
    this.initView();
  }

  initView() {
    const user = this.authService.userSignal();

    if (user?.complexId) {
      this.dashboardService.getBuildingsByComplex().subscribe({
        next: (res: any) => {
          this.buildingsList.set(res.data);
          this.selectedBuildingId.set('ALL');
          this.loadStatements();
        }
      });
    } else if (user?.buildingId) {
      this.selectedBuildingId.set(Number(user.buildingId));
      this.loadStatements();
    }
  }

  onBuildingChange(buildingId: number | 'ALL') {
    this.selectedBuildingId.set(buildingId);
    this.receipts.set([]);
    this.loadStatements();
  }

  loadStatements() {
    const buildingId = this.selectedBuildingId();
    const complexId = this.authService.userSignal()?.complexId;

    const payload = buildingId === 'ALL'
      ? { isComplex: true, complexId: complexId }
      : { isComplex: false, buildingId: buildingId };

    this.billingService.getStatements(payload).subscribe({
      next: (res: any) => this.receipts.set(res.data),
      error: (err) => console.error(err)
    });
  }

  sendReminder(receipt: any) {
    // Aquí puedes conectar a tu servicio de Email o WhatsApp en un futuro
    alert(`Aviso de cobro enviado a: ${receipt.ownerName || 'Propietario'} (Apt: ${receipt.apartment})`);
  }

  openPaymentModal(receipt: any) {
    // 1. Identificamos el ID del edificio (ya sea del recibo o del filtro seleccionado)
    const currentBuildingId = this.selectedBuildingId() !== 'ALL'
      ? this.selectedBuildingId()
      : (receipt.building_id || receipt.buildingId);

    // 2. Enriquecemos la data antes de enviarla al modal
    const dialogData = {
      ...receipt,
      building_id: currentBuildingId,
      buildingId: currentBuildingId, // Pasamos ambos formatos (camelCase y snake_case) por precaución
      complex_id: this.authService.userSignal()?.complexId
    };

    const dialogRef = this.dialog.open(AdminPaymentModalComponent, {
      width: '500px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(success => {
      if (success) {
        this.loadStatements(); // Recargamos para ver el recibo en PAID y el balance en 0
      }
    });
  }
}