import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

const PRIVATE_ROUTE = /^\/(admin|building-admin|owner|auth|login|config|vcard)(\/|$)/;

const HOME_TITLE = 'Sistema de condominios en Venezuela | A Un Clic';
const HOME_DESCRIPTION =
  'Sistema en línea para administrar condominios en Venezuela: alícuotas, recibos, cobranza y conciliación de pagos. Para juntas y administradores. Pide una demo.';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private title = inject(Title);
  private meta = inject(Meta);
  private router = inject(Router);

  init(): void {
    this.apply(this.router.url);
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.apply(event.urlAfterRedirects));
  }

  private apply(url: string): void {
    const path = url.split('?')[0].split('#')[0] || '/';
    if (PRIVATE_ROUTE.test(path)) {
      this.title.setTitle('Condominio A Un Clic');
      this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });
      return;
    }

    this.title.setTitle(HOME_TITLE);
    this.meta.updateTag({ name: 'description', content: HOME_DESCRIPTION });
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });
  }
}
