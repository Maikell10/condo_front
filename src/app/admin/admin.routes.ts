import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';

export const ADMIN_ROUTES: Routes = [
    { path: '', component: DashboardComponent },
    {
        path: 'buildings',
        loadComponent: () =>
            import('./pages/buildings/buildings.component').then(m => m.BuildingsComponent)
    },
    {
        path: 'users',
        loadComponent: () =>
            import('./pages/users/users.component').then(m => m.UsersComponent)
    },
    {
        path: 'audit',
        loadComponent: () =>
            import('./pages/audit/audit.component').then(m => m.AuditComponent)
    },
    {
        path: 'administration',
        loadComponent: () =>
            import('./pages/administration/administration.component').then(m => m.AdministrationComponent)
    },
    {
        path: 'administration/history',
        loadComponent: () =>
            import('./pages/saas-history/saas-history.component').then(m => m.SaasHistoryComponent)
    },
    {
        path: 'vcards',
        loadComponent: () =>
            import('./pages/vcards/vcards.component').then(m => m.VcardsComponent)
    }


];