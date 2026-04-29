import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';

export const OWNER_ROUTES: Routes = [
    { path: '', component: DashboardComponent },
    {
        path: 'pending-receipts',
        loadComponent: () =>
            import('./pages/pending-receipts/pending-receipts.component').then(m => m.PendingReceiptsComponent)
    },
    {
        path: 'pending-detailed',
        loadComponent: () =>
            import('./pages/pending-detailed/pending-detailed.component').then(m => m.PendingDetailedComponent)
    },
    {
        path: 'building-expenses',
        loadComponent: () =>
            import('./pages/building-expenses/building-expenses.component').then(m => m.BuildingExpensesComponent)
    },
    {
        path: 'condo-receipt',
        loadComponent: () =>
            import('./pages/condo-receipt/condo-receipt.component').then(m => m.CondoReceiptComponent)
    },
    {
        path: 'paid-receipts',
        loadComponent: () =>
            import('./pages/paid-receipts/paid-receipts.component').then(m => m.PaidReceiptsComponent)
    },
    {
        path: 'payments',
        loadComponent: () =>
            import('./pages/payments/payments.component').then(m => m.PaymentsComponent)
    },
    {
        path: 'incidents',
        loadComponent: () =>
            import('./pages/incidents/incidents.component').then(m => m.IncidentsComponent)
    },
    {
        path: 'aliquots',
        loadComponent: () =>
            import('./pages/aliquots/aliquots.component').then(m => m.AliquotsComponent)
    }

];