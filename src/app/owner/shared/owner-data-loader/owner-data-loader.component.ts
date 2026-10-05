import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-owner-data-loader',
  standalone: true,
  imports: [MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="owner-data-loader" role="status" aria-live="polite">
      <div class="owner-data-loader__card">
        <div class="owner-data-loader__logo">
          <img src="/LOGO_SN1.png" alt="" width="40" height="40" />
        </div>
        <mat-spinner diameter="52" class="owner-data-loader__spinner"></mat-spinner>
        <p class="owner-data-loader__title">{{ message() }}</p>
        <p class="owner-data-loader__sub">{{ submessage() }}</p>
      </div>
    </div>
  `,
  styles: [
    `
      .owner-data-loader {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: min(70vh, 560px);
        padding: 2rem 1rem;
        animation: ownerLoaderIn 0.35s ease both;
      }

      @keyframes ownerLoaderIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      .owner-data-loader__card {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        max-width: 22rem;
        padding: 2rem 1.75rem;
        border-radius: 1.5rem;
        background: linear-gradient(165deg, #eef3fb 0%, #ffffff 55%, #f8fafc 100%);
        border: 1px solid rgba(30, 58, 138, 0.12);
        box-shadow: 0 24px 48px -28px rgba(26, 43, 75, 0.35);
      }

      .owner-data-loader__logo {
        width: 3rem;
        height: 3rem;
        border-radius: 0.85rem;
        overflow: hidden;
        margin-bottom: 1rem;
        box-shadow: 0 8px 20px -10px rgba(30, 58, 138, 0.45);
      }

      .owner-data-loader__logo img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .owner-data-loader__spinner {
        margin-bottom: 1.25rem;
      }

      .owner-data-loader__title {
        margin: 0;
        font-size: 1.05rem;
        font-weight: 800;
        color: #1e3a8a;
      }

      .owner-data-loader__sub {
        margin: 0.45rem 0 0;
        font-size: 0.8rem;
        color: #64748b;
      }
    `
  ]
})
export class OwnerDataLoaderComponent {
  message = input('Preparando tu información…');
  submessage = input('Esto solo tomará un momento');
}
