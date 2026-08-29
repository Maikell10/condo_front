import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

export type AuthAccent = 'owner' | 'building-admin' | 'admin' | 'picker';

@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  templateUrl: './auth-shell.component.html',
  styleUrl: './auth-shell.component.scss'
})
export class AuthShellComponent {
  @Input({ required: true }) title!: string;
  @Input() subtitle = '';
  @Input() icon = 'login';
  @Input() accent: AuthAccent = 'owner';
  @Input() backLink = '/login';
  @Input() backLabel = 'Volver a selección de perfil';
  @Input() showBackLink = true;
  @Input() showIconBadge = true;
}
