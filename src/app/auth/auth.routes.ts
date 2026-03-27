import { Routes } from '@angular/router';
import { AdminLoginComponent } from './pages/admin-login/admin-login.component';
import { BuildingAdminLoginComponent } from './pages/building-admin-login/building-admin-login.component';
import { OwnerLoginComponent } from './pages/owner-login/owner-login.component';

export const AUTH_ROUTES: Routes = [
    { path: 'admin', component: AdminLoginComponent },
    { path: 'building-admin', component: BuildingAdminLoginComponent },
    { path: 'owner', component: OwnerLoginComponent },
    { path: '', redirectTo: 'admin', pathMatch: 'full' }
];