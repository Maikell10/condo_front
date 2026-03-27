import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';

export const OWNER_ROUTES: Routes = [
    { path: '', component: DashboardComponent },
    {
        path: 'payments',
        loadComponent: () =>
            import('./pages/payments/payments.component').then(m => m.PaymentsComponent)
    },
    {
        path: 'incidents',
        loadComponent: () =>
            import('./pages/incidents/incidents.component').then(m => m.IncidentsComponent)
    }

];