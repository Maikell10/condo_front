import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../core/components/header/header.component';
import { SidebarComponent } from '../../core/components/sidebar/sidebar.component';
import { MirrorReadonlyBannerComponent } from '../../core/components/mirror-readonly-banner/mirror-readonly-banner.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent, MirrorReadonlyBannerComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
  host: {
    '[class.mirror-read-only]': 'mirrorMode()'
  }
})
export class MainLayoutComponent {
  private auth = inject(AuthService);
  mirrorMode = computed(() => this.auth.isReadOnlyMirror());
}
