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
    }


];