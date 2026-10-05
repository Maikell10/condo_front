import { Component, inject, signal } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { OwnerDataLoaderComponent } from '../shared/owner-data-loader/owner-data-loader.component';
import { ownerRouteAnimation } from '../owner-page.animations';

@Component({
  selector: 'app-owner-layout',
  standalone: true,
  imports: [RouterOutlet, OwnerDataLoaderComponent],
  templateUrl: './owner-layout.component.html',
  styleUrl: './owner-layout.component.scss',
  animations: [ownerRouteAnimation]
})
export class OwnerLayoutComponent {
  private router = inject(Router);

  routeLoading = signal(false);
  routeAnimKey = signal(0);

  constructor() {
    this.router.events
      .pipe(takeUntilDestroyed())
      .subscribe((event) => {
        if (event instanceof NavigationStart) {
          if (this.isOwnerAppRoute(event.url)) {
            this.routeLoading.set(true);
          }
          return;
        }
        if (
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError
        ) {
          this.routeLoading.set(false);
          if (event instanceof NavigationEnd && this.isOwnerAppRoute(event.urlAfterRedirects)) {
            this.routeAnimKey.update((v) => v + 1);
          }
        }
      });
  }

  private isOwnerAppRoute(url: string): boolean {
    return url === '/owner' || url.startsWith('/owner/');
  }
}
