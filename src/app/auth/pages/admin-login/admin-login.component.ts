import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.scss'
})
export class AdminLoginComponent {
  // Cambiamos username por email
  email = '';
  password = '';
  error = '';
  isLoading = false;

  private auth = inject(AuthService);
  private router = inject(Router);

  onSubmit() {
    if (!this.email || !this.password) {
      this.error = 'Ingresa correo y contraseña';
      return;
    }

    this.isLoading = true;
    this.error = '';

    // Conectamos con el backend real
    this.auth.login(this.email, this.password).subscribe({
      next: (res) => {
        this.isLoading = false;

        // Validamos que sea estrictamente el Super Admin
        if (res.user.role === 'SUPER_ADMIN') {
          this.router.navigate(['/admin']);
        } else {
          this.error = 'No tienes permisos de Super Administrador.';
          this.auth.logout(); // Cerramos la sesión incorrecta
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error?.message || 'Error al conectar con el servidor';
      }
    });
  }
}