import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { VCardApiService } from '../../core/services/vcard-api.service';
import { VCardProfile } from '../../core/contact/vcard.models';
import { VcardShowcaseComponent } from '../../shared/vcard-showcase/vcard-showcase.component';
import { LandingNavComponent } from '../../landing/landing-nav/landing-nav.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-vcard-public',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule, VcardShowcaseComponent, LandingNavComponent],
  templateUrl: './vcard-public.component.html',
  styleUrl: './vcard-public.component.scss'
})
export class VcardPublicComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(VCardApiService);

  loading = signal(true);
  error = signal<string | null>(null);
  cardId = signal<number | null>(null);
  contact = signal<VCardProfile | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Enlace inválido');
      this.loading.set(false);
      return;
    }
    this.api.getPublic(id).subscribe({
      next: (res) => {
        this.cardId.set(res.data.id);
        this.contact.set(res.data.contact);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Esta tarjeta no existe o no está publicada.');
        this.loading.set(false);
      }
    });
  }
}
