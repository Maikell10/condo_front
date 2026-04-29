import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';

export const BUILDING_ADMIN_ROUTES: Routes = [
    { path: '', component: DashboardComponent },
    {
        path: 'apartments',
        loadComponent: () =>
            import('./pages/apartments/apartments.component').then(m => m.ApartmentsComponent)
    },
    {
        path: 'bank-accounts',
        loadComponent: () =>
            import('./pages/bank-accounts/bank-accounts.component').then(m => m.BankAccountsComponent)
    },
    {
        path: 'payments',
        loadComponent: () =>
            import('./pages/payments/payments.component').then(m => m.PaymentsComponent)
    },
    {
        path: 'invoices',
        loadComponent: () =>
            import('./pages/invoices/invoices.component').then(m => m.InvoicesComponent)
    }
    , {
        path: 'contracts',
        loadComponent: () =>
            import('./pages/contracts/contracts.component').then(m => m.ContractsComponent)
    }
];