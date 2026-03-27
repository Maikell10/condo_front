import { Routes } from '@angular/router';
import { AuthGuard } from './core/services/auth.guard';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';

export const routes: Routes = [

    // 👉 Home con los 3 tipos de login (SIN HEADER)
    {
        path: '',
        loadComponent: () =>
            import('./home/home.component').then(m => m.HomeComponent)
    },


    // 👉 Rutas autenticadas (CON HEADER)
    {
        path: '',
        component: MainLayoutComponent,
        canActivate: [AuthGuard],
        children: [
            {
                path: 'admin',
                data: { roles: ['SUPER_ADMIN'] },
                loadChildren: () =>
                    import('./admin/admin.routes').then(m => m.ADMIN_ROUTES)
            },
            {
                path: 'building-admin',
                data: { roles: ['BUILDING_ADMIN'] },
                loadChildren: () =>
                    import('./building-admin/building-admin.routes').then(m => m.BUILDING_ADMIN_ROUTES)
            },
            {
                path: 'owner',
                data: { roles: ['OWNER'] },
                loadChildren: () =>
                    import('./owner/owner.routes').then(m => m.OWNER_ROUTES)
            }
        ]
    },


    // 👉 Login tradicional (si lo usas)
    {
        path: 'auth',
        loadChildren: () =>
            import('./auth/auth.routes').then(m => m.AUTH_ROUTES)
    },

    { path: '**', redirectTo: '' }

];