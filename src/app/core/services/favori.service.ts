import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { EMPTY, Observable, catchError, filter, finalize, of, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Favori } from '../models/favori.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class FavoriService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  // Favoris de l'utilisateur connecté. Le service les garde en mémoire pour que
  // tous les cœurs de l'app (cartes, fiche film) restent synchronisés.
  private liste = signal<Favori[]>([]);
  readonly favoris = this.liste.asReadonly();

  private ids = computed(() => new Set(this.liste().map((f) => f.tmdbId)));

  // Films dont l'ajout ou le retrait est en cours : évite les doubles clics
  private enCours = new Set<number>();

  constructor() {
    // À la connexion on charge les favoris, à la déconnexion on les vide
    toObservable(this.auth.currentUser)
      .pipe(
        tap((user) => {
          if (!user) {
            this.liste.set([]);
          }
        }),
        filter((user) => user !== null),
        switchMap(() => this.charger().pipe(catchError(() => EMPTY))),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  estFavori(tmdbId: number): boolean {
    return this.ids().has(tmdbId);
  }

  // Relit les favoris de l'utilisateur connecté depuis l'API
  charger(): Observable<Favori[]> {
    return this.http
      .get<Favori[]>(`${environment.apiUrl}/favoris`, {
        params: { userId: this.auth.currentUser()!.id },
      })
      .pipe(
        // json-server-auth répond 403 (au lieu de []) quand l'utilisateur n'a encore aucun favori
        catchError((err: HttpErrorResponse) => (err.status === 403 ? of([] as Favori[]) : throwError(() => err))),
        tap((favoris) => this.liste.set(favoris)),
      );
  }

  // Ajoute le film aux favoris s'il n'y est pas, le retire sinon
  basculer(tmdbId: number): Observable<unknown> {
    if (this.enCours.has(tmdbId)) {
      return EMPTY;
    }
    this.enCours.add(tmdbId);

    const existant = this.liste().find((f) => f.tmdbId === tmdbId);
    const requete = existant ? this.retirer(existant) : this.ajouter(tmdbId);
    return requete.pipe(finalize(() => this.enCours.delete(tmdbId)));
  }

  private ajouter(tmdbId: number) {
    const favori: Omit<Favori, 'id'> = { userId: this.auth.currentUser()!.id, tmdbId };
    return this.http
      .post<Favori>(`${environment.apiUrl}/favoris`, favori)
      .pipe(tap((cree) => this.liste.update((l) => [...l, cree])));
  }

  private retirer(favori: Favori) {
    return this.http
      .delete(`${environment.apiUrl}/favoris/${favori.id}`)
      .pipe(tap(() => this.liste.update((l) => l.filter((f) => f.id !== favori.id))));
  }
}