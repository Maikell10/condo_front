import { Component, HostListener, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-landing-nav',
  standalone: true,
  imports: [RouterModule, MatButtonModule],
  templateUrl: './landing-nav.component.html'
})
export class LandingNavComponent {
  navScrolled = signal(false);

  @HostListener('window:scroll')
  onScroll(): void {
    this.navScrolled.set(window.scrollY > 24);
  }

  scrollToSection(id: string, event: Event): void {
    event.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', `/#${id}`);
  }
}
