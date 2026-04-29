import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User, UserRole } from '../models/user';
import { API_URL_BASE } from '../constants';

// Interfaz para tipar la respuesta de nuestro backend Node.js
export interface AuthResponse {
    message: string;
    token: string;
    user: User;
}

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private http = inject(HttpClient);
    private router = inject(Router);

    private readonly STORAGE_KEY = 'condominio_current_user';
    private readonly TOKEN_KEY = 'condominio_token';
    private readonly API_URL = API_URL_BASE + '/api/auth'; // Tu backend

    // Mantenemos el Observable para compatibilidad con código viejo
    private userSubject = new BehaviorSubject<User | null>(null);
    user$ = this.userSubject.asObservable();

    // Signals para Angular 19
    private currentUserSignal = signal<User | null>(null);
    public readonly userSignal = this.currentUserSignal.asReadonly();
    public readonly isLoggedInSignal = computed(() => this.currentUserSignal() !== null);
    public readonly userRoleSignal = computed(() => this.currentUserSignal()?.role ?? null);

    constructor() {
        // Recuperar sesión al recargar la página
        const storedUser = localStorage.getItem(this.STORAGE_KEY);
        if (storedUser) {
            const user = JSON.parse(storedUser);
            this.currentUserSignal.set(user);
            this.userSubject.next(user);
        }
    }

    // 🔥 EL NUEVO MÉTODO UNIVERSAL DE LOGIN
    login(email: string, password: string): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.API_URL}/login`, { email, password }).pipe(
            tap(response => {
                // Si la petición es exitosa, guardamos la sesión
                this.setSession(response.user, response.token);
            })
        );
    }

    private setSession(user: User | null, token?: string) {
        this.currentUserSignal.set(user);
        this.userSubject.next(user);

        if (user && token) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
            localStorage.setItem(this.TOKEN_KEY, token); // Guardamos el JWT
        } else {
            localStorage.removeItem(this.STORAGE_KEY);
            localStorage.removeItem(this.TOKEN_KEY);
        }
    }

    // -------------------------
    // MÉTODOS PÚBLICOS ORIGINALES
    // -------------------------

    getUser(): User | null { return this.currentUserSignal(); }
    getCurrentUser(): User | null { return this.currentUserSignal(); }
    getRole(): UserRole | null { return this.currentUserSignal()?.role ?? null; }
    isLoggedIn(): boolean { return this.currentUserSignal() !== null; }

    // Método extra para obtener el token cuando armemos los Interceptors
    getToken(): string | null { return localStorage.getItem(this.TOKEN_KEY); }

    logout(): void {
        this.setSession(null);
        this.router.navigate(['/']); // Redirigir a la vista de inicio
    }
}