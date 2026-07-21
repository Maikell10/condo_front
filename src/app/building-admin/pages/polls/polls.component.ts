import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { PollService } from '../../../core/services/poll.service';
import { AuthService } from '../../../core/services/auth.service';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-polls',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatIconModule,
    MatSnackBarModule, MatProgressBarModule, MatDividerModule
  ],
  templateUrl: './polls.component.html'
})
export class PollsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private pollService = inject(PollService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  polls = signal<any[]>([]);
  isSubmitting = signal(false);

  pollForm: FormGroup = this.fb.group({
    question: ['', [Validators.required, Validators.minLength(10)]],
    durationDays: [3, Validators.required]
  });

  buildingId = computed(() => Number(this.authService.userSignal()?.buildingId));

  ngOnInit() {
    this.loadPolls();
  }

  loadPolls() {
    if (!this.buildingId()) return;

    this.pollService.getPollsByBuilding(this.buildingId()).subscribe({
      next: (res) => {
        const enrichedPolls = res.data.map((p: any) => {
          const isClosed = new Date() > new Date(p.end_date) || p.status === 'CLOSED';
          return { ...p, isClosed, resultsLoaded: false, results: null };
        });

        this.polls.set(enrichedPolls);

        // 🔥 Novedad: Auto-cargamos los resultados de TODAS las encuestas para el Admin
        enrichedPolls.forEach((poll: any) => this.loadResults(poll));
      }
    });
  }

  createPoll() {
    if (this.pollForm.valid && !this.isSubmitting()) {
      this.isSubmitting.set(true);
      const payload = {
        buildingId: this.buildingId(),
        question: this.pollForm.value.question,
        durationDays: this.pollForm.value.durationDays
      };

      this.pollService.createPoll(payload).subscribe({
        next: () => {
          this.snackBar.open('✅ Encuesta publicada con éxito', 'Cerrar', { duration: 3000 });
          this.pollForm.reset({ durationDays: 3 });
          this.loadPolls();
          this.isSubmitting.set(false);
        },
        error: () => {
          this.snackBar.open('❌ Error al publicar la encuesta', 'Cerrar', { duration: 3000 });
          this.isSubmitting.set(false);
        }
      });
    }
  }

  // Carga los resultados solo cuando el admin hace clic en una encuesta cerrada
  loadResults(poll: any) {
    // 🔥 Novedad: Eliminamos la restricción de "solo si está cerrada"
    this.pollService.getPollResults(poll.id).subscribe({
      next: (res) => {
        this.polls.update(currentPolls =>
          currentPolls.map(p => p.id === poll.id ? { ...p, resultsLoaded: true, results: res.data.results } : p)
        );
      }
    });
  }

  // Genera el texto formal para el Libro de Actas y lo copia al portapapeles
  exportActa(poll: any) {
    if (!poll.results) return;

    const res = poll.results;
    const total = res.total;
    const percSi = total > 0 ? ((res.si / total) * 100).toFixed(1) : '0.0';
    const percNo = total > 0 ? ((res.no / total) * 100).toFixed(1) : '0.0';
    const decision = res.si > res.no ? 'APROBADA' : (res.si < res.no ? 'RECHAZADA' : 'EMPATE TÉCNICO');

    const fechaCierre = new Date(poll.end_date).toLocaleDateString('es-ES', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const actaText = `
===================================================
ACTA DE ASAMBLEA DIGITAL (ENCUESTA DE COPROPIETARIOS)
===================================================

FECHA DE CIERRE: ${fechaCierre}

ASUNTO SOMETIDO A VOTACIÓN:
"${poll.question}"

--- RESULTADOS OFICIALES ---
Total de Votos Emitidos: ${total}

Votos a favor (SÍ): ${res.si} (${percSi}%)
Votos en contra (NO): ${res.no} (${percNo}%)

CONCLUSIÓN:
De acuerdo con los resultados emitidos de forma digital e inalterable por los copropietarios, la propuesta ha sido ${decision}.

___________________________________
Firma del Administrador / Junta de Condominio
Generado automáticamente por el Sistema.
    `.trim();

    // Copiar al portapapeles
    navigator.clipboard.writeText(actaText).then(() => {
      this.snackBar.open('📋 Acta copiada al portapapeles lista para pegar', 'Cerrar', { duration: 4000 });
    });
  }
}