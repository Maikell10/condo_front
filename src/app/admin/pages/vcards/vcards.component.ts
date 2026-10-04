import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthService } from '../../../core/services/auth.service';
import { VCardApiService } from '../../../core/services/vcard-api.service';
import { DEFAULT_BRAND_VCARD } from '../../../core/contact/brand-contact.defaults';
import {
  StoredVCard,
  VCARD_USAGE_HINTS,
  VCARD_USAGE_LABELS,
  VCardProfile,
  VCardUsage
} from '../../../core/contact/vcard.models';
import { downloadVCard } from '../../../core/contact/vcard';
import { compressProfilePhoto } from '../../../core/contact/photo-compress.util';
import { vcardPublicUrl } from '../../../core/constants';
import { VcardShowcaseComponent } from '../../../shared/vcard-showcase/vcard-showcase.component';

@Component({
  selector: 'app-vcards',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatSlideToggleModule,
    VcardShowcaseComponent
  ],
  templateUrl: './vcards.component.html',
  styleUrl: './vcards.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VcardsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(VCardApiService);
  private auth = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  usageLabels = VCARD_USAGE_LABELS;
  usageHints = VCARD_USAGE_HINTS;
  usageOptions = Object.keys(VCARD_USAGE_LABELS) as VCardUsage[];

  cards = signal<StoredVCard[]>([]);
  selectedId = signal<number | null>(null);
  isCreating = signal(false);
  loading = signal(true);
  saving = signal(false);
  loadError = signal<string | null>(null);

  photoPreview = signal<string>('');

  selectedCard = computed(() => {
    const id = this.selectedId();
    if (id == null) return null;
    return this.cards().find((c) => c.id === id) ?? null;
  });

  editorForm: FormGroup = this.fb.group({
    label: ['', Validators.required],
    usage: ['VENTAS_CAMPO' as VCardUsage, Validators.required],
    isPublished: [true],
    fullName: ['', Validators.required],
    organization: [DEFAULT_BRAND_VCARD.organization, Validators.required],
    title: ['', Validators.required],
    tagline: [''],
    email: [DEFAULT_BRAND_VCARD.email, [Validators.required, Validators.email]],
    cellPhone: [DEFAULT_BRAND_VCARD.cellPhone, Validators.required],
    workPhone: [DEFAULT_BRAND_VCARD.workPhone ?? ''],
    addressLocality: [DEFAULT_BRAND_VCARD.addressLocality, Validators.required],
    addressCountry: [DEFAULT_BRAND_VCARD.addressCountry, Validators.required],
    website: [DEFAULT_BRAND_VCARD.website, Validators.required],
    note: [''],
    linkedin: [''],
    instagram: [''],
    tiktok: [''],
    github: [''],
    behance: ['']
  });

  previewContact = signal<VCardProfile>(this.buildPreviewFromForm());

  ngOnInit(): void {
    this.syncPreview();
    this.loadCards();
    this.editorForm.valueChanges
      .pipe(debounceTime(200), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.syncPreview());
  }

  loadCards(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.api.list().subscribe({
      next: (res) => {
        this.cards.set(res.data ?? []);
        this.loading.set(false);
        const first = this.cards()[0];
        if (first && this.selectedId() == null && !this.isCreating()) {
          this.openCard(first);
        }
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set(
          'No se pudieron cargar las tarjetas. En el backend ejecuta scripts/create_sales_vcards.sql y despliega la API.'
        );
      }
    });
  }

  startNewCard(): void {
    this.isCreating.set(true);
    this.selectedId.set(null);
    const userName = this.auth.userSignal()?.name ?? '';
    this.photoPreview.set('');
    this.editorForm.reset({
      label: userName ? `${userName} — comercial` : 'Mi tarjeta comercial',
      usage: 'VENTAS_CAMPO',
      isPublished: true,
      fullName: userName,
      organization: DEFAULT_BRAND_VCARD.organization,
      title: 'Ejecutivo comercial — Condominio A Un Clic',
      tagline: 'Administración de condominios a un clic',
      email: DEFAULT_BRAND_VCARD.email,
      cellPhone: DEFAULT_BRAND_VCARD.cellPhone,
      workPhone: DEFAULT_BRAND_VCARD.workPhone ?? '',
      addressLocality: DEFAULT_BRAND_VCARD.addressLocality,
      addressCountry: DEFAULT_BRAND_VCARD.addressCountry,
      website: DEFAULT_BRAND_VCARD.website,
      note: DEFAULT_BRAND_VCARD.note ?? '',
      linkedin: '',
      instagram: '',
      tiktok: '',
      github: '',
      behance: ''
    });
    this.syncPreview();
  }

  openCard(card: StoredVCard): void {
    this.isCreating.set(false);
    this.selectedId.set(card.id);
    this.patchFormFromCard(card);
    this.syncPreview();
  }

  async onPhotoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressProfilePhoto(file);
      this.photoPreview.set(dataUrl);
      this.syncPreview();
      this.snackBar.open('Foto lista — guarda la tarjeta para persistirla', 'Cerrar', { duration: 3000 });
    } catch {
      this.snackBar.open('No se pudo procesar la imagen', 'Cerrar', { duration: 3000 });
    }
    input.value = '';
  }

  clearPhoto(): void {
    this.photoPreview.set('');
    this.syncPreview();
  }

  saveCard(): void {
    const payload = this.buildSavePayload();
    if (!payload) return;

    this.saving.set(true);
    const id = this.selectedId();
    const req = id != null ? this.api.update(id, payload) : this.api.create(payload);

    req.subscribe({
      next: (res) => {
        this.saving.set(false);
        this.isCreating.set(false);
        this.selectedId.set(res.data.id);
        this.cards.update((list) => {
          const idx = list.findIndex((c) => c.id === res.data.id);
          if (idx >= 0) {
            const next = [...list];
            next[idx] = res.data;
            return next;
          }
          return [res.data, ...list];
        });
        this.openCard(res.data);
        this.snackBar.open('Tarjeta guardada — QR y enlace público listos', 'Cerrar', { duration: 3500 });
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Error al guardar. Revisa la tabla sales_vcards en MySQL.', 'Cerrar', {
          duration: 4500
        });
      }
    });
  }

  downloadCurrent(): void {
    const contact = this.contactFromForm(true);
    if (!contact) return;
    downloadVCard(contact);
  }

  duplicateSelected(): void {
    const card = this.selectedCard();
    if (!card) return;
    this.isCreating.set(true);
    this.selectedId.set(null);
    this.patchFormFromCard(card);
    this.editorForm.patchValue({
      label: `${card.label} (copia)`
    });
  }

  deleteSelected(): void {
    const id = this.selectedId();
    if (id == null) return;
    this.api.remove(id).subscribe({
      next: () => {
        this.snackBar.open('Tarjeta eliminada', 'Cerrar', { duration: 2500 });
        this.selectedId.set(null);
        this.loadCards();
      },
      error: () => this.snackBar.open('No se pudo eliminar', 'Cerrar', { duration: 3000 })
    });
  }

  openPublicPage(): void {
    const id = this.selectedId();
    if (id == null) return;
    window.open(vcardPublicUrl(id), '_blank', 'noopener,noreferrer');
  }

  copyPublicLink(): void {
    const id = this.selectedId();
    if (id == null) return;
    void navigator.clipboard?.writeText(vcardPublicUrl(id));
    this.snackBar.open('Enlace copiado', 'Cerrar', { duration: 2000 });
  }

  usageHint(): string {
    const usage = this.editorForm.get('usage')?.value as VCardUsage;
    return this.usageHints[usage] ?? '';
  }

  private patchFormFromCard(card: StoredVCard): void {
    const c = card.contact;
    this.photoPreview.set(c.photoDataUrl ?? '');
    this.editorForm.patchValue({
      label: card.label,
      usage: card.usage,
      isPublished: card.isPublished !== false,
      fullName: c.fullName,
      organization: c.organization,
      title: c.title,
      tagline: c.tagline ?? '',
      email: c.email,
      cellPhone: c.cellPhone,
      workPhone: c.workPhone ?? '',
      addressLocality: c.addressLocality,
      addressCountry: c.addressCountry,
      website: c.website,
      note: c.note ?? '',
      linkedin: c.social?.linkedin ?? '',
      instagram: c.social?.instagram ?? '',
      tiktok: c.social?.tiktok ?? '',
      github: c.social?.github ?? '',
      behance: c.social?.behance ?? ''
    });
  }

  private buildSavePayload() {
    const contact = this.contactFromForm(true);
    if (!contact) return null;
    const raw = this.editorForm.getRawValue();
    return {
      label: raw.label,
      usage: raw.usage as VCardUsage,
      isPublished: !!raw.isPublished,
      contact
    };
  }

  private contactFromForm(markTouched: boolean): VCardProfile | null {
    if (this.editorForm.invalid) {
      if (markTouched) this.editorForm.markAllAsTouched();
      return null;
    }
    const raw = this.editorForm.getRawValue();
    const social = {
      linkedin: raw.linkedin?.trim() || undefined,
      instagram: raw.instagram?.trim() || undefined,
      tiktok: raw.tiktok?.trim() || undefined,
      github: raw.github?.trim() || undefined,
      behance: raw.behance?.trim() || undefined
    };
    return {
      fullName: raw.fullName,
      organization: raw.organization,
      title: raw.title,
      tagline: raw.tagline?.trim() || undefined,
      email: raw.email,
      cellPhone: raw.cellPhone,
      workPhone: raw.workPhone,
      addressLocality: raw.addressLocality,
      addressCountry: raw.addressCountry,
      website: raw.website,
      note: raw.note,
      photoDataUrl: this.photoPreview() || undefined,
      social: Object.values(social).some(Boolean) ? social : undefined
    };
  }

  private syncPreview(): void {
    this.previewContact.set(this.buildPreviewFromForm());
  }

  /** Vista previa aunque falten campos obligatorios */
  private buildPreviewFromForm(): VCardProfile {
    const raw = this.editorForm.getRawValue();
    return {
      fullName: raw.fullName || 'Tu nombre',
      organization: raw.organization || DEFAULT_BRAND_VCARD.organization,
      title: raw.title || 'Cargo',
      tagline: raw.tagline,
      email: raw.email || DEFAULT_BRAND_VCARD.email,
      cellPhone: raw.cellPhone || DEFAULT_BRAND_VCARD.cellPhone,
      workPhone: raw.workPhone,
      addressLocality: raw.addressLocality || 'Caracas',
      addressCountry: raw.addressCountry || 'Venezuela',
      website: raw.website || DEFAULT_BRAND_VCARD.website,
      note: raw.note,
      photoDataUrl: this.photoPreview() || undefined,
      social: {
        linkedin: raw.linkedin,
        instagram: raw.instagram,
        tiktok: raw.tiktok,
        github: raw.github,
        behance: raw.behance
      }
    };
  }
}
