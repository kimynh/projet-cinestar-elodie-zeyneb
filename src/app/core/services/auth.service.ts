import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';

interface AuthReponse {
  accessToken: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  private utilisateur = signal<User | null>(this.lireUtilisateur());
  readonly currentUser = this.utilisateur.asReadonly();
  readonly estConnecte = computed(() => this.utilisateur() !== null);

  register(email: string, password: string) {
    return this.http
      .post<AuthReponse>(`${environment.apiUrl}/register`, { email, password })
      .pipe(tap((rep) => this.enregistrerSession(rep)));
  }

  login(email: string, password: string) {
    return this.http
      .post<AuthReponse>(`${environment.apiUrl}/login`, { email, password })
      .pipe(tap((rep) => this.enregistrerSession(rep)));
  }

  get token(): string | null {
    return localStorage.getItem('token');
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.utilisateur.set(null);
  }

  private enregistrerSession(rep: AuthReponse) {
    localStorage.setItem('token', rep.accessToken);
    localStorage.setItem('user', JSON.stringify(rep.user));
    this.utilisateur.set(rep.user);
  }

  private lireUtilisateur(): User | null {
    try {
      const brut = localStorage.getItem('user');
      return brut ? (JSON.parse(brut) as User) : null;
    } catch {
      return null;
    }
  }
}