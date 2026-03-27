import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-building-admin-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './building-admin-login.component.html',
  styleUrl: './building-admin-login.component.scss'
})
export class BuildingAdminLoginComponent {
  // Cambiamos username por email para que coincida con la base de datos
  email = '';
  password = '';
  error = '';
  isLoading = false;

  constructor(private auth: AuthService, private router: Router) { }

  onSubmit() {
    if (!this.email || !this.password) {
      this.error = 'Ingresa correo y contraseña';
      return;
    }

    this.isLoading = true;
    this.error = '';

    // Llamamos al nuevo endpoint real
    this.auth.login(this.email, this.password).subscribe({
      next: (res) => {
        this.isLoading = false;

        // Verificamos que el usuario tenga el rol correcto para este portal
        if (res.user.role === 'BUILDING_ADMIN') {
          this.router.navigate(['/building-admin']);
        } else {
          this.error = 'No tienes permisos de Administrador de Edificio.';
          this.auth.logout(); // Destruimos la sesión inválida
        }
      },
      error: (err) => {
        this.isLoading = false;
        // Mostramos el error devuelto por Node.js
        this.error = err.error?.message || 'Error al conectar con el servidor';
      }
    });
  }
}