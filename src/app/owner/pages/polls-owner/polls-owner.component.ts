import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { PollService } from '../../../core/services/poll.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-polls-owner',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatSnackBarModule
  ],
  templateUrl: './polls-owner.component.html'
})
export class PollsOwnerComponent implements OnInit {
  private pollService = inject(PollService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  polls = signal<any[]>([]);
  buildingId = computed(() => Number(this.authService.userSignal()?.buildingId));
  // Si tu backend requiere explícitamente el apartmentId, lo tomamos del usuario
  apartmentId = computed(() => Number(this.authService.userSignal()?.apartmentId));

  ngOnInit() {
    this.loadPolls();
  }

  loadPolls() {
    if (!this.buildingId()) return;

    this.pollService.getPollsByBuilding(this.buildingId(), this.apartmentId()).subscribe({
      next: (res) => {
        const mappedPolls = res.data.map((p: any) => {
          const isClosed = new Date() > new Date(p.end_date) || p.status === 'CLOSED';
          return {
            ...p,
            isClosed,
            // 🔥 Persistencia real: leemos la respuesta enviada por MySQL
            hasVoted: p.userVoted || false,
            results: null
          };
        });

        this.polls.set(mappedPolls);

        // Cargar resultados automáticos para encuestas cerradas
        mappedPolls.filter((p: any) => p.isClosed).forEach((p: any) => this.fetchResults(p.id));
      }
    });
  }

  fetchResults(pollId: number) {
    this.pollService.getPollResults(pollId).subscribe({
      next: (res) => {
        this.polls.update(current =>
          current.map(p => p.id === pollId ? { ...p, results: res.data.results } : p)
        );
      }
    });
  }

  castVote(poll: any, voteValue: 'SI' | 'NO') {
    const payload = {
      pollId: poll.id,
      apartmentId: this.apartmentId(), // Asegúrate de que el token envíe esto, o modifícalo según tu auth
      vote: voteValue
    };

    this.pollService.castVote(payload).subscribe({
      next: () => {
        this.snackBar.open('✅ Tu voto ha sido registrado. Gracias por participar.', 'Cerrar', { duration: 4000 });
        // Actualizamos localmente para ocultar los botones de votación
        this.polls.update(current =>
          current.map(p => p.id === poll.id ? { ...p, hasVoted: true } : p)
        );
      },
      error: (err) => {
        // Si el backend lanza el error de ER_DUP_ENTRY (Ya votó)
        if (err.status === 400) {
          this.snackBar.open('⚠️ Ya habías registrado tu voto en esta consulta.', 'Entendido', { duration: 4000 });
          this.polls.update(current => current.map(p => p.id === poll.id ? { ...p, hasVoted: true } : p));
        } else {
          this.snackBar.open('❌ Error de conexión al registrar el voto.', 'Cerrar', { duration: 4000 });
        }
      }
    });
  }
}