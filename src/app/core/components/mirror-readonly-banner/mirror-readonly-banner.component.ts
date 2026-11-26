import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-mirror-readonly-banner',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    @if (auth.isReadOnlyMirror()) {
      <div
        class="mirror-banner"
        role="status"
        aria-live="polite">
        <div class="mirror-banner__text">
          <mat-icon>visibility</mat-icon>
          <span>
            <strong>Vista espejo — solo lectura</strong>
            <span class="mirror-banner__sep">·</span>
            {{ auth.mirrorBuildingLabel() }}
          </span>
        </div>
        <button mat-stroked-button type="button" class="mirror-banner__exit" (click)="auth.exitReadOnlyMirror()">
          <mat-icon>arrow_back</mat-icon>
          Volver a super admin
        </button>
      </div>
    }
  `,
  styles: `
    .mirror-banner {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.65rem 1rem;
      background: linear-gradient(90deg, #312e81, #4f46e5);
      color: #fff;
      font-size: 0.875rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow: 0 4px 16px rgba(49, 46, 129, 0.25);
    }

    .mirror-banner__text {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      min-width: 0;
    }

    .mirror-banner__sep {
      opacity: 0.65;
      margin: 0 0.25rem;
    }

    .mirror-banner__exit {
      --mdc-outlined-button-label-text-color: #fff;
      --mdc-outlined-button-outline-color: rgba(255, 255, 255, 0.45);
    }
  `
})
export class MirrorReadonlyBannerComponent {
  auth = inject(AuthService);
}