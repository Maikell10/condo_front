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
  email = '';
  password = '';
  error = '';
  isLoading = false;

  // Usamos inject() al estilo Angular moderno
  private auth = inject(AuthService);
  private router = inject(Router);

  onSubmit() {
    // Validamos que no envíen el formulario vacío
    if (!this.email || !this.password) {
      this.error = 'Por favor ingresa tu correo y contraseña';
      return;
    }

    this.isLoading = true;
    this.error = '';

    // Nos suscribimos al Observable del nuevo servicio
    this.auth.login(this.email, this.password).subscribe({
      next: (res) => {
        this.isLoading = false;

        // Medida extra de seguridad: verificar que realmente sea un propietario
        if (res.user.role === 'OWNER') {
          this.router.navigate(['/owner']);
        } else {
          this.error = 'No tienes permisos de propietario para acceder aquí.';
          this.auth.logout(); // Destruimos la sesión si intentó entrar un Admin por acá
        }
      },
      error: (err) => {
        this.isLoading = false;
        // Capturamos el mensaje que manda el backend Node.js (ej. "Credenciales inválidas")
        this.error = err.error?.message || 'Error al conectar con el servidor';
      }
    });
  }
}