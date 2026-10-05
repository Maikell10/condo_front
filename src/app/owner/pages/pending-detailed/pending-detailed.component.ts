import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CurrencyPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { BillingService } from '../../../core/services/billing.service';
import { OwnerDataLoaderComponent } from '../../shared/owner-data-loader/owner-data-loader.component';

interface PendingReceiptLine {
  description?: string;
  period?: string;
  debt: number;
}

interface PendingUnitGroup {
  unit: string;
  owner: string;
  receipts: PendingReceiptLine[];
  totalDebt: number;
  isMe?: boolean;
}

interface DetailedTableRow {
  unit: string;
  owner: string;
  receipt: string;
  debt: number;
  isHeader: boolean;
  isGrandTotal: boolean;
  isMe?: boolean;
}

@Component({
  selector: 'app-pending-detailed',
  standalone: true,
  imports: [
    CurrencyPipe,
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
    OwnerDataLoaderComponent
  ],
  templateUrl: './pending-detailed.component.html',
  styleUrl: './pending-detailed.component.scss'
})
export class PendingDetailedComponent implements OnInit {
  private authService = inject(AuthService);
  private billingService = inject(BillingService);
  private snackBar = inject(MatSnackBar);

  displayedColumns: string[] = ['unit', 'receipt', 'debt'];

  groups = signal<PendingUnitGroup[]>([]);
  loading = signal(false);
  searchQuery = signal('');

  buildingLabel = computed(() => {
    const u = this.authService.userSignal() as { buildingName?: string } | null;
    return u?.buildingName?.trim() || 'Tu edificio';
  });

  myUnitHint = computed(() => {
    const u = this.authService.userSignal();
    return (u?.username || u?.name || '').trim();
  });

  showPageLoader = computed(() => this.loading() && this.groups().length === 0);

  grandTotalDebt = computed(() => this.groups().reduce((acc, g) => acc + g.totalDebt, 0));
  grandTotalReceipts = computed(() =>
    this.groups().reduce((acc, g) => acc + g.receipts.length, 0)
  );
  unitsInDebt = computed(() => this.groups().length);

  filteredGroups = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const list = this.groups();
    if (!q) return list;
    return list.filter((g) => {
      if (String(g.unit).toLowerCase().includes(q)) return true;
      if (String(g.owner).toLowerCase().includes(q)) return true;
      return g.receipts.some((r) =>
        String(r.description || r.period || '')
          .toLowerCase()
          .includes(q)
      );
    });
  });

  viewDebt = computed(() =>
    this.filteredGroups().reduce((acc, g) => acc + g.totalDebt, 0)
  );
  viewReceipts = computed(() =>
    this.filteredGroups().reduce((acc, g) => acc + g.receipts.length, 0)
  );

  detailed = computed(() => {
    const groups = this.filteredGroups();
    const formatted: DetailedTableRow[] = [];

    groups.forEach((group) => {
      formatted.push({
        unit: group.unit,
        owner: group.owner,
        receipt: String(group.receipts.length),
        debt: group.totalDebt,
        isHeader: true,
        isGrandTotal: false,
        isMe: group.isMe
      });

      group.receipts.forEach((r) => {
        formatted.push({
          unit: '',
          owner: '',
          receipt: r.description || r.period || '—',
          debt: Number(r.debt),
          isHeader: false,
          isGrandTotal: false
        });
      });
    });

    if (formatted.length > 0) {
      formatted.push({
        unit: '',
        owner: 'TOTALES:',
        receipt: String(this.viewReceipts()),
        debt: this.viewDebt(),
        isHeader: false,
        isGrandTotal: true
      });
    }

    return formatted;
  });

  isSolvent = computed(() => !this.loading() && this.groups().length === 0);

  statCards = computed(() => [
    {
      id: 'debt',
      variant: 'orange',
      icon: 'account_balance_wallet',
      chip: 'Deuda total',
      value: this.formatMoney(this.grandTotalDebt()),
      sub: this.buildingLabel()
    },
    {
      id: 'receipts',
      variant: 'rose',
      icon: 'receipt_long',
      chip: 'Recibos',
      value: String(this.grandTotalReceipts()),
      sub: 'Periodos pendientes'
    },
    {
      id: 'units',
      variant: 'amber',
      icon: 'domain',
      chip: 'Unidades',
      value: String(this.unitsInDebt()),
      sub: 'Con desglose'
    },
    {
      id: 'view',
      variant: 'slate',
      icon: 'filter_alt',
      chip: 'En vista',
      value: String(this.filteredGroups().length),
      sub: this.searchQuery() ? 'Grupos filtrados' : 'Todos'
    }
  ]);

  ngOnInit() {
    this.loadPendingDetailed();
  }

  loadPendingDetailed() {
    const buildingId = Number(this.authService.userSignal()?.buildingId);
    if (!buildingId) return;

    this.loading.set(true);
    this.billingService.getPendingDetailed(buildingId).subscribe({
      next: (res: any) => {
        const rawData = res.data ?? [];
        const hint = this.myUnitHint().toLowerCase();
        const grouped: Record<string, PendingUnitGroup> = {};

        rawData.forEach((curr: any) => {
          const unit = String(curr.unit ?? '');
          if (!grouped[unit]) {
            grouped[unit] = {
              unit,
              owner: curr.owner || 'Sin propietario asignado',
              receipts: [],
              totalDebt: 0,
              isMe: hint.length > 0 && unit.toLowerCase() === hint.toLowerCase()
            };
          }
          grouped[unit].receipts.push({
            description: curr.description,
            period: curr.period,
            debt: Number(curr.debt)
          });
          grouped[unit].totalDebt += Number(curr.debt);
        });

        const groups = Object.values(grouped).sort((a, b) =>
          a.unit.localeCompare(b.unit, undefined, { numeric: true })
        );
        this.groups.set(groups);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('No se pudo cargar el detalle de morosidad', 'Cerrar', { duration: 3500 });
      }
    });
  }

  refresh() {
    this.loadPendingDetailed();
  }

  onSearchChange(value: string) {
    this.searchQuery.set(value);
  }

  printDetail() {
    if (this.groups().length === 0) {
      this.snackBar.open('No hay deudas que imprimir', 'Cerrar', { duration: 3000 });
      return;
    }
    window.print();
  }

  rowClass(row: DetailedTableRow) {
    if (row.isGrandTotal) return 'row-grand';
    if (row.isHeader && row.isMe) return 'row-mine';
    if (row.isHeader) return 'row-header';
    return 'row-detail';
  }

  private formatMoney(value: number): string {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
