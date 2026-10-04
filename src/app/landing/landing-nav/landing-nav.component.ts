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
}
