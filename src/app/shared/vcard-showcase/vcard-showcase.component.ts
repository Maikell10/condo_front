import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import QRCode from 'qrcode';
import { VCardProfile } from '../../core/contact/vcard.models';
import { vcardPublicUrl } from '../../core/constants';
import { downloadVCard } from '../../core/contact/vcard';
import { telHref, whatsAppHref } from '../../core/contact/vcard-phone.util';

@Component({
  selector: 'app-vcard-showcase',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './vcard-showcase.component.html',
  styleUrl: './vcard-showcase.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VcardShowcaseComponent {
  contact = input.required<VCardProfile>();
  cardId = input<number | null>(null);
  embedded = input(false);
  isPublicPage = input(false);

  qrDataUrl = signal<string | null>(null);
  qrTargetUrl = signal<string>('');
  private qrGeneration = 0;

  constructor() {
    effect(() => {
      this.cardId();
      void this.refreshQr();
    });
  }

  get initials(): string {
    return (this.contact()?.fullName ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  }

  telLink(): string {
    return telHref(this.contact()?.cellPhone ?? '');
  }

  waLink(): string {
    return whatsAppHref(this.contact()?.cellPhone ?? '');
  }

  mailLink(): string {
    const email = this.contact()?.email;
    return email ? `mailto:${email}` : '';
  }

  saveContact(): void {
    const c = this.contact();
    if (c) {
      downloadVCard(c);
    }
  }

  openSocial(url?: string): void {
    if (url?.trim()) {
      window.open(url.trim(), '_blank', 'noopener,noreferrer');
    }
  }

  copyPublicLink(): void {
    const url = this.qrTargetUrl();
    if (!url) return;
    void navigator.clipboard?.writeText(url);
  }

  hasSocialLinks(): boolean {
    const s = this.contact()?.social;
    if (!s) return false;
    return !!(s.linkedin || s.instagram || s.tiktok || s.github || s.behance);
  }

  private async refreshQr(): Promise<void> {
    const generation = ++this.qrGeneration;
    const id = this.cardId();

    if (id == null) {
      this.qrDataUrl.set(null);
      this.qrTargetUrl.set('');
      return;
    }

    const url = vcardPublicUrl(id);
    this.qrTargetUrl.set(url);

    try {
      const dataUrl = await QRCode.toDataURL(url, {
        width: 220,
        margin: 1,
        color: { dark: '#1e1b4b', light: '#ffffff' }
      });
      if (generation === this.qrGeneration) {
        this.qrDataUrl.set(dataUrl);
      }
    } catch {
      if (generation === this.qrGeneration) {
        this.qrDataUrl.set(null);
      }
    }
  }
}
