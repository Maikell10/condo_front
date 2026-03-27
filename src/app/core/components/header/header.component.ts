import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu'; // 🔥 Para el menú desplegable
import { MatBadgeModule } from '@angular/material/badge'; // 🔥 Para la campanita
import { AuthService } from '../../services/auth.service';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,

  ],
  templateUrl: './header.component.html'
})
export class HeaderComponent {
  private auth = inject(AuthService);

  // Emitimos un evento por si quieres usar el botón hamburguesa para el sidebar en móvil
  @Output() toggleSidebar = new EventEmitter<void>();

  // Leemos el usuario usando la Señal moderna
  user = this.auth.userSignal;

  logout() {
    this.auth.logout();
  }

  // Extrae las iniciales para el Avatar (Ej. "Propietario PH" -> "PP")
  getInitials(name: string | undefined): string {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }
}