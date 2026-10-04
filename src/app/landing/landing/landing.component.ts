import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { API_URL_BASE } from '../../core/constants';
import { LandingNavComponent } from '../landing-nav/landing-nav.component';

interface LandingSector {
  icon: string;
  label: string;
  soon?: boolean;
}

interface LandingMetric {
  value: string;
  label: string;
}

interface LandingFeature {
  icon: string;
  title: string;
  description: string;
  bg: string;
  color: string;
}

interface DashboardWidget {
  label: string;
  value: string;
  trend: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, ReactiveFormsModule, LandingNavComponent],
  templateUrl: './landing.component.html'
})
export class LandingComponent implements AfterViewInit, OnDestroy {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private host = inject(ElementRef<HTMLElement>);
  private revealObserver?: IntersectionObserver;

  isSubmitting = signal(false);
  successMessage = signal('');

  readonly sectors: LandingSector[] = [
    { icon: 'apartment', label: 'Residencias' },
    { icon: 'local_parking', label: 'Estacionamientos' },
    { icon: 'storefront', label: 'Más sectores', soon: true }
  ];

  readonly metrics: LandingMetric[] = [
    { value: '24/7', label: 'Acceso en línea' },
    { value: '1 clic', label: 'Validar pagos' },
    { value: '100%', label: 'Trazabilidad' },
    { value: 'Multi', label: 'Recintos' }
  ];

  readonly dashboardWidgets: DashboardWidget[] = [
    { label: 'Cobranza del mes', value: 'USD 12.4K', trend: '+18% vs mes anterior' },
    { label: 'Unidades activas', value: '148', trend: 'Residencias y puestos' },
    { label: 'Pagos por validar', value: '7', trend: 'Conciliación pendiente' }
  ];

  readonly features: LandingFeature[] = [
    {
      icon: 'price_check',
      title: 'Conciliación automática',
      description:
        'Los usuarios reportan transferencias con comprobante y el administrador valida con un clic. Saldos actualizados al instante.',
      bg: '#ecfdf5',
      color: '#059669'
    },
    {
      icon: 'receipt_long',
      title: 'Recibos y estados claros',
      description:
        'Generación automática de recibos detallados por unidad, alícuota o puesto. Sin confusiones ni cálculos manuales.',
      bg: '#eef2ff',
      color: '#4f46e5'
    },
    {
      icon: 'analytics',
      title: 'Panel administrativo',
      description:
        'Indicadores, reportes y seguimiento operativo en un solo lugar. Diseñado para equipos que administran múltiples recintos.',
      bg: '#fff1f2',
      color: '#e11d48'
    }
  ];

  contactForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    condo: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    message: ['', Validators.required]
  });

  ngAfterViewInit() {
    this.revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          this.revealObserver?.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    this.host.nativeElement.querySelectorAll('.landing-reveal').forEach((element: Element) => {
      this.revealObserver?.observe(element);
    });
  }

  ngOnDestroy() {
    this.revealObserver?.disconnect();
  }

  onSubmit() {
    if (this.contactForm.invalid) return;

    this.isSubmitting.set(true);
    const payload = this.contactForm.value;

    this.http.post(API_URL_BASE + '/api/contact/contact', payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.successMessage.set('¡Gracias! Hemos recibido tu mensaje y te contactaremos pronto.');
        this.contactForm.reset();
        setTimeout(() => this.successMessage.set(''), 5000);
      },
      error: (err: unknown) => {
        this.isSubmitting.set(false);
        console.error('Error enviando correo', err);
        alert('Hubo un error de conexión. Por favor, intenta de nuevo más tarde.');
      }
    });
  }
}
