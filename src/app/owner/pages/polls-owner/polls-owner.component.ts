import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DateOnlyPipe } from '../../../shared/date-only.pipe';
import { PollService } from '../../../core/services/poll.service';
import { AuthService } from '../../../core/services/auth.service';
import { OwnerDataLoaderComponent } from '../../shared/owner-data-loader/owner-data-loader.component';

@Component({
  selector: 'app-polls-owner',
  standalone: true,
  imports: [
    DecimalPipe,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    DateOnlyPipe,
    OwnerDataLoaderComponent
  ],
  templateUrl: './polls-owner.component.html',
  styleUrl: './polls-owner.component.scss'
})
export class PollsOwnerComponent implements OnInit {
  private pollService = inject(PollService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  polls = signal<any[]>([]);
  loading = signal(false);
  searchQuery = signal('');
  statusFilter = signal<'ALL' | 'ACTIVE' | 'CLOSED'>('ALL');

  buildingId = computed(() => Number(this.authService.userSignal()?.buildingId));
  apartmentId = computed(() => Number(this.authService.userSignal()?.apartmentId));

  showPageLoader = computed(() => this.loading() && this.polls().length === 0);

  activePolls = computed(() => this.polls().filter((p) => !p.isClosed).length);
  closedPolls = computed(() => this.polls().filter((p) => p.isClosed).length);
  pendingVote = computed(
    () => this.polls().filter((p) => !p.isClosed && !p.hasVoted).length
  );

  filteredPolls = computed(() => {
    let rows = this.polls();
    const status = this.statusFilter();
    const q = this.searchQuery().trim().toLowerCase();

    if (status === 'ACTIVE') rows = rows.filter((p) => !p.isClosed);
    if (status === 'CLOSED') rows = rows.filter((p) => p.isClosed);
    if (q) rows = rows.filter((p) => String(p.question ?? '').toLowerCase().includes(q));
    return rows;
  });

  statCards = computed(() => [
    {
      id: 'active',
      variant: 'indigo',
      icon: 'how_to_vote',
      chip: 'Activas',
      value: String(this.activePolls()),
      sub: 'Puedes participar'
    },
    {
      id: 'pending',
      variant: 'amber',
      icon: 'pending_actions',
      chip: 'Tu voto',
      value: String(this.pendingVote()),
      sub: 'Consultas sin votar'
    },
    {
      id: 'closed',
      variant: 'slate',
      icon: 'lock',
      chip: 'Cerradas',
      value: String(this.closedPolls()),
      sub: 'Resultados publicados'
    },
    {
      id: 'total',
      variant: 'violet',
      icon: 'ballot',
      chip: 'Total',
      value: String(this.polls().length),
      sub: 'En tu edificio'
    }
  ]);

  ngOnInit() {
    this.loadPolls();
  }

  loadPolls() {
    if (!this.buildingId()) return;

    this.loading.set(true);
    this.pollService.getPollsByBuilding(this.buildingId(), this.apartmentId()).subscribe({
      next: (res) => {
        const mappedPolls = (res.data ?? []).map((p: any) => {
          const isClosed = new Date() > new Date(p.end_date) || p.status === 'CLOSED';
          return {
            ...p,
            isClosed,
            hasVoted: p.userVoted || false,
            results: null
          };
        });

        this.polls.set(mappedPolls);
        this.loading.set(false);
        mappedPolls.filter((p: any) => p.isClosed).forEach((p: any) => this.fetchResults(p.id));
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('No se pudieron cargar las consultas', 'Cerrar', { duration: 3500 });
      }
    });
  }

  refreshList() {
    this.loadPolls();
  }

  onSearchChange(value: string) {
    this.searchQuery.set(value);
  }

  onStatusFilterChange(value: 'ALL' | 'ACTIVE' | 'CLOSED') {
    this.statusFilter.set(value);
  }

  fetchResults(pollId: number) {
    this.pollService.getPollResults(pollId).subscribe({
      next: (res) => {
        this.polls.update((current) =>
          current.map((p) => (p.id === pollId ? { ...p, results: res.data.results } : p))
        );
      }
    });
  }

  yesPercent(poll: { results: { si: number; total: number } }): number {
    const total = poll.results?.total ?? 0;
    if (!total) return 0;
    return (poll.results.si / total) * 100;
  }

  castVote(poll: any, voteValue: 'SI' | 'NO') {
    const payload = {
      pollId: poll.id,
      apartmentId: this.apartmentId(),
      vote: voteValue
    };

    this.pollService.castVote(payload).subscribe({
      next: () => {
        this.snackBar.open('Tu voto fue registrado. Gracias por participar.', 'Cerrar', { duration: 4000 });
        this.polls.update((current) =>
          current.map((p) => (p.id === poll.id ? { ...p, hasVoted: true } : p))
        );
      },
      error: (err) => {
        if (err.status === 400) {
          this.snackBar.open('Ya habías votado en esta consulta.', 'Entendido', { duration: 4000 });
          this.polls.update((current) =>
            current.map((p) => (p.id === poll.id ? { ...p, hasVoted: true } : p))
          );
        } else {
          this.snackBar.open('Error al registrar el voto', 'Cerrar', { duration: 4000 });
        }
      }
    });
  }
}
