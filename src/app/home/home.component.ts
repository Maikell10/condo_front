import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthAccent, AuthShellComponent } from '../auth/components/auth-shell/auth-shell.component';

interface LoginProfile {
  path: string;
  icon: string;
  title: string;
  subtitle: string;
  accent: AuthAccent;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MatIconModule, AuthShellComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  readonly profiles: LoginProfile[] = [
    {
      path: '/auth/owner',
      icon: 'person',
      title: 'Propietario / Cliente',
      subtitle: 'Inmuebles y puestos de estacionamiento',
      accent: 'owner'
    },
    {
      path: '/auth/building-admin',
      icon: 'manage_accounts',
      title: 'Administrador',
      subtitle: 'Gestión de residencias y estacionamientos',
      accent: 'building-admin'
    },
    {
      path: '/auth/admin',
      icon: 'admin_panel_settings',
      title: 'Super Admin',
      subtitle: 'Control total del sistema',
      accent: 'admin'
    }
  ];

  constructor(private router: Router) {}

  goTo(path: string) {
    this.router.navigate([path]);
  }
}
