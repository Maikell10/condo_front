import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-owner-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './owner-login.component.html',
  styleUrl: './owner-login.component.scss'
})
export class OwnerLoginComponent {
  // Reemplazamos ownerCode por email y password
  accessCode: string = '';
  isLoading: boolean = false;
  error: string = '';

  // Usamos inject() al estilo Angular moderno
  private auth = inject(AuthService);
  private router = inject(Router);

  onSubmit() {
    // Validamos que no envíen el formulario vacío
    if (!this.accessCode || this.accessCode.length !== 8) return;

    this.isLoading = true;
    this.error = '';

    // Asegurarnos de enviarlo en mayúsculas tal cual se generó
    const payload = { accessCode: this.accessCode.toUpperCase() };

    // Nos suscribimos al Observable del nuevo servicio
    this.auth.ownerLogin(payload).subscribe({
      next: (res) => {
        // Guardar token y redirigir
        this.isLoading = false;
        this.router.navigate(['/owner']);
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error?.message || 'Código inválido o error de conexión.';
      }
    });
  }
}