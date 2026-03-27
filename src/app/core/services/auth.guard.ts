import { Injectable } from '@angular/core';
import {
    ActivatedRouteSnapshot,
    CanActivateFn,
    Router,
    RouterStateSnapshot,
} from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { UserRole } from '../models/user';

@Injectable({
    providedIn: 'root',
})
export class AuthGuardService {
    constructor(private auth: AuthService, private router: Router) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        if (!this.auth.isLoggedIn()) {
            this.router.navigate(['/auth']);
            return false;
        }

        const expectedRoles = route.data['roles'] as UserRole[] | undefined;
        const role = this.auth.getRole();

        if (expectedRoles && role && !expectedRoles.includes(role)) {
            this.router.navigate(['/auth']);
            return false;
        }

        return true;
    }

}

// Versión funcional para Angular 15+ standalone
export const AuthGuard: CanActivateFn = (route, state) => {
    const guard = inject(AuthGuardService);
    return guard.canActivate(route, state);
};