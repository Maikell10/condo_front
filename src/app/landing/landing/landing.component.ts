import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { API_URL_BASE } from '../../core/constants';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      
      <nav class="fixed w-full z-50 top-0 transition-all duration-300 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          <div class="flex items-center gap-2">
            <div class="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-white shadow-md shadow-indigo-100 border border-slate-100">
              <img src="/LOGO_SN1.png" alt="Logo Condominio A Un Clic" class="w-full h-full object-cover">
            </div>
            <span class="text-xl font-black tracking-tight text-slate-800">Condominio<span class="text-indigo-600"> A Un Clic</span></span>
          </div>

          <div class="hidden md:flex items-center gap-8 font-medium text-sm text-slate-600">
            <a href="#features" class="hover:text-indigo-600 transition-colors">Características</a>
            <a href="#benefits" class="hover:text-indigo-600 transition-colors">Beneficios</a>
            <a href="#contact" class="hover:text-indigo-600 transition-colors">Contacto</a>
          </div>

          <div class="flex items-center gap-4">
            <a routerLink="/login" class=" sm:block text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">
              <button mat-flat-button color="primary" class="rounded-xl px-6 h-12 font-bold shadow-lg shadow-indigo-200">
                Iniciar Sesión
              </button>
            </a>
          </div>
        </div>
      </nav>

      <section class="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50 via-white to-white"></div>
        <div class="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div class="absolute top-40 right-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

        <div class="max-w-7xl mx-auto px-6 text-center">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-8">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            La evolución del condominio
          </div>

          <div class="w-48 h-48 mx-auto mb-10 rounded-2xl overflow-hidden flex items-center justify-center bg-white shadow-xl shadow-indigo-100/50 border border-slate-100">
              <img src="/LOGO.jpg" alt="Logo Condominio A Un Clic" class="w-full h-full object-contain p-2">
          </div>
          
          <h1 class="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-tight max-w-4xl mx-auto">
            Gestión transparente para <br class="hidden md:block" />
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              edificios de primer nivel
            </span>
          </h1>
          
          <p class="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Automatiza la cobranza, valida pagos al instante y ofrece a tus propietarios una experiencia digital premium. Dile adiós al Excel y los recibos en papel.
          </p>
          
          <!-- <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button mat-flat-button color="primary" class="w-full sm:w-auto rounded-xl px-8 h-14 text-base font-bold shadow-xl shadow-indigo-200">
              Comenzar prueba gratis
            </button>
            <button mat-stroked-button class="w-full sm:w-auto rounded-xl px-8 h-14 text-base font-bold border-2 border-slate-200 text-slate-700 hover:bg-slate-50">
              <mat-icon class="mr-2 text-slate-400">play_circle</mat-icon> Ver cómo funciona
            </button>
          </div> -->

          <div class="mt-20 relative max-w-5xl mx-auto">
              <div class="rounded-2xl border border-slate-200/50 bg-white/50 backdrop-blur-sm p-2 shadow-2xl">
                  <div class="rounded-xl overflow-hidden aspect-[16/9] flex items-center justify-center relative bg-cover bg-center bg-no-repeat shadow-inner"
                      style="background-image: url('/democondo.jpg');">
                      <div class="absolute inset-0 "></div>
                      <mat-icon class="text-8xl text-white/90 z-10 drop-shadow-lg">dashboard</mat-icon>
                      <p class="absolute bottom-10 font-bold text-gray uppercase tracking-widest text-sm z-10 drop-shadow-md">
                          Interfaz del Panel de Control
                      </p>
                  </div>
              </div>
          </div>



        </div>
      </section>

      <section id="features" class="py-24 bg-slate-50">
        <div class="max-w-7xl mx-auto px-6">
          <div class="text-center max-w-2xl mx-auto mb-16">
            <h2 class="text-3xl md:text-4xl font-black tracking-tight mb-4">Todo lo que necesitas, en un solo lugar</h2>
            <p class="text-slate-500 text-lg">Diseñado tanto para la tranquilidad del administrador como para la comodidad del propietario.</p>
          </div>

          <div class="grid md:grid-cols-3 gap-8">
            <div class="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div class="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
                <mat-icon>price_check</mat-icon>
              </div>
              <h3 class="text-xl font-bold mb-3">Conciliación Automática</h3>
              <p class="text-slate-500 leading-relaxed">
                Los propietarios reportan sus transferencias con comprobante y el administrador las valida con un clic. Deudas actualizadas al instante.
              </p>
            </div>

            <div class="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div class="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
                <mat-icon>receipt_long</mat-icon>
              </div>
              <h3 class="text-xl font-bold mb-3">Recibos Claros</h3>
              <p class="text-slate-500 leading-relaxed">
                Generación automática de recibos detallados. Cada propietario entiende exactamente su alícuota y sus cargos sin confusiones.
              </p>
            </div>

            <div class="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div class="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-6">
                <mat-icon>report_problem</mat-icon>
              </div>
              <h3 class="text-xl font-bold mb-3">Gestión de Incidencias</h3>
              <p class="text-slate-500 leading-relaxed">
                Reportes de daños en áreas comunes, seguimiento de reparaciones y tablero de avisos integrado para toda la comunidad.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="benefits" class="py-24 bg-white overflow-hidden">
        <div class="max-w-7xl mx-auto px-6">
          <div class="text-center max-w-2xl mx-auto mb-20">
            <h2 class="text-3xl md:text-4xl font-black tracking-tight mb-4">Por qué elegir Condominio A Un Clic</h2>
            <p class="text-slate-500 text-lg">El impacto real que generamos en la convivencia y administración de tu comunidad.</p>
          </div>

          <div class="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-24">
            <div class="order-2 lg:order-1 space-y-6">
              <div class="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <mat-icon>timer</mat-icon>
              </div>
              <h3 class="text-3xl font-black text-slate-800">Recupera tu tiempo libre</h3>
              <p class="text-slate-500 leading-relaxed text-lg">
                Olvídate de pasar los fines de semana cruzando estados de cuenta bancarios con correos de propietarios. Nuestro flujo de validación reduce el trabajo administrativo en un 80%.
              </p>
              <ul class="space-y-4 pt-4 text-slate-700 font-medium">
                <li class="flex items-center gap-3">
                  <mat-icon class="text-emerald-500">check_circle</mat-icon> Cierres contables en minutos, no en días.
                </li>
                <li class="flex items-center gap-3">
                  <mat-icon class="text-emerald-500">check_circle</mat-icon> Cálculo preciso de alícuotas y deudas.
                </li>
              </ul>
            </div>
            
            <div class="order-1 lg:order-2 rounded-3xl aspect-[4/3] flex items-center justify-center shadow-xl relative overflow-hidden bg-white border border-slate-100">
               <img src="/grafico-tiempo.png" alt="Dashboard de automatización de tiempo" class="w-full h-full object-cover">
            </div>
          </div>

          <div class="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div class="bg-white rounded-3xl aspect-[4/3] flex items-center justify-center shadow-xl border border-slate-100 relative overflow-hidden">
               <img src="/grafico-transparencia.png" alt="Gráfico de transparencia financiera" class="w-full h-full object-cover">
            </div>
            <div class="space-y-6">
              <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <mat-icon>visibility</mat-icon>
              </div>
              <h3 class="text-3xl font-black text-slate-800">Confianza y Transparencia</h3>
              <p class="text-slate-500 leading-relaxed text-lg">
                Cero dudas, cero conflictos. Cada propietario tiene acceso directo 24/7 a su historial de pagos, recibos detallados y los gastos generales del edificio.
              </p>
              <ul class="space-y-4 pt-4 text-slate-700 font-medium">
                <li class="flex items-center gap-3">
                  <mat-icon class="text-emerald-500">check_circle</mat-icon> Cuentas claras accesibles desde el móvil.
                </li>
                <li class="flex items-center gap-3">
                  <mat-icon class="text-emerald-500">check_circle</mat-icon> Historial inmutable de solvencia.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" class="py-24 bg-slate-50 relative z-0">
        <div class="absolute top-0 w-full h-1/2 bg-white -z-10"></div>
        <div class="max-w-6xl mx-auto px-6">
          <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div class="grid lg:grid-cols-5">
              
              <!-- PANEL IZQUIERDO INFO DE CONTACTO -->
              <div class="lg:col-span-2 bg-indigo-600 p-10 lg:p-12 text-white flex flex-col justify-between relative overflow-hidden">
                <div class="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-2xl translate-x-1/3 -translate-y-1/3"></div>
                <div class="absolute bottom-0 left-0 w-40 h-40 bg-purple-500 opacity-20 rounded-full blur-2xl -translate-x-1/2 translate-y-1/2"></div>
                
                <div class="relative z-10">
                  <h3 class="text-3xl font-black mb-4">Hablemos</h3>
                  <p class="text-indigo-100 mb-10 text-lg">¿Tienes dudas o quieres una demostración personalizada? Escríbenos y nuestro equipo te contactará.</p>
                  
                  <div class="space-y-6">
                    <div class="flex items-center gap-4">
                      <div class="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center"><mat-icon>email</mat-icon></div>
                      <span class="font-medium">condominioaunclic&#64;gmail.com</span>
                    </div>
                    <div class="flex items-center gap-4">
                      <div class="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center"><mat-icon>phone</mat-icon></div>
                      <span class="font-medium">+58 (424) 247-5572</span>
                    </div>
                     <div class="flex items-center gap-4">
                      <div class="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center"><mat-icon>phone</mat-icon></div>
                      <span class="font-medium">(0212) 710-5278</span>
                    </div>
                    <div class="flex items-center gap-4">
                      <div class="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center"><mat-icon>location_on</mat-icon></div>
                      <span class="font-medium">Caracas, Venezuela</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 🔥 PANEL DERECHO: FORMULARIO REACTIVO -->
              <div class="lg:col-span-3 p-10 lg:p-12">
                
                <!-- Mensaje de Éxito -->
                <div *ngIf="successMessage()" class="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-3">
                  <mat-icon>check_circle</mat-icon>
                  <span class="font-bold">{{ successMessage() }}</span>
                </div>

                <form [formGroup]="contactForm" (ngSubmit)="onSubmit()" class="space-y-6">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-2">
                      <label class="text-sm font-bold text-slate-700">Nombre completo</label>
                      <input formControlName="name" type="text" class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none" placeholder="Tu nombre">
                    </div>
                    <div class="space-y-2">
                      <label class="text-sm font-bold text-slate-700">Edificio / Condominio</label>
                      <input formControlName="condo" type="text" class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none" placeholder="Nombre de tu residencia">
                    </div>
                  </div>
                  <div class="space-y-2">
                    <label class="text-sm font-bold text-slate-700">Correo Electrónico</label>
                    <input formControlName="email" type="email" class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none" placeholder="tucorreo@ejemplo.com">
                  </div>
                  <div class="space-y-2">
                    <label class="text-sm font-bold text-slate-700">Mensaje</label>
                    <textarea formControlName="message" rows="4" class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none resize-none" placeholder="¿En qué podemos ayudarte?"></textarea>
                  </div>
                  
                  <button mat-flat-button color="primary" type="submit" 
                          [disabled]="contactForm.invalid || isSubmitting()"
                          class="w-full rounded-xl h-14 text-base font-bold shadow-lg shadow-indigo-200">
                    <mat-icon *ngIf="isSubmitting()" class="animate-spin mr-2">hourglass_empty</mat-icon>
                    {{ isSubmitting() ? 'Enviando...' : 'Enviar Mensaje' }}
                  </button>
                </form>
              </div>

            </div>
          </div>
        </div>
      </section>

      <section class="py-24 relative overflow-hidden">
        <div class="absolute inset-0 bg-indigo-900"></div>
        <div class="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\\'60\\' height=\\'60\\' viewBox=\\'0 0 60 60\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cg fill=\\'none\\' fill-rule=\\'evenodd\\'%3E%3Cg fill=\\'%234f46e5\\' fill-opacity=\\'0.2\\'%3E%3Cpath d=\\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2V6h4V4H6z\\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        
        <div class="relative max-w-4xl mx-auto px-6 text-center text-white">
          <h2 class="text-4xl md:text-5xl font-black mb-6">Lleva tu edificio al siguiente nivel</h2>
          <p class="text-indigo-200 text-lg md:text-xl mb-10">
            Únete a la nueva generación de residencias que confían en Condominio A Un Clic para mantener sus finanzas sanas y vecinos felices.
          </p>
          <!-- <button mat-flat-button color="accent" class="rounded-xl px-10 h-14 text-lg font-black text-indigo-900 shadow-xl shadow-indigo-950/50">
            Crear cuenta para mi edificio
          </button> -->
        </div>
      </section>

      <footer class="border-t border-slate-100 py-8 bg-white text-center text-slate-500 text-sm">
        <p>© 2026 Condominio A Un Clic. Todos los derechos reservados.</p>
      </footer>

    </div>
  `,
  styles: [`
    @keyframes blob {
      0% { transform: translate(0px, 0px) scale(1); }
      33% { transform: translate(30px, -50px) scale(1.1); }
      66% { transform: translate(-20px, 20px) scale(0.9); }
      100% { transform: translate(0px, 0px) scale(1); }
    }
    .animate-blob {
      animation: blob 7s infinite;
    }
    .animation-delay-2000 {
      animation-delay: 2s;
    }
    /* Comportamiento de scroll suave para los enlaces del nav */
    html {
      scroll-behavior: smooth;
    }
  `]
})
export class LandingComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient); // Necesitarás asegurarte de que proveHttpClient() esté en tu app.config.ts

  isSubmitting = signal(false);
  successMessage = signal('');

  // 2. Creamos la estructura y validaciones del formulario
  contactForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    condo: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    message: ['', Validators.required]
  });

  onSubmit() {
    if (this.contactForm.invalid) return;

    this.isSubmitting.set(true);

    const payload = this.contactForm.value;

    // 🔥 3. Enviar al Backend (Asegúrate de ajustar esta URL a la de tu servidor real)
    this.http.post(API_URL_BASE + '/api/contact/contact', payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.successMessage.set('¡Gracias! Hemos recibido tu mensaje y te contactaremos pronto.');
        this.contactForm.reset();

        // Ocultar mensaje después de 5 segundos
        setTimeout(() => this.successMessage.set(''), 5000);
      },
      error: (err: any) => {
        this.isSubmitting.set(false);
        console.error('Error enviando correo', err);
        alert('Hubo un error de conexión. Por favor, intenta de nuevo más tarde.');
      }
    });
  }
}