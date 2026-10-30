import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { Movie } from '../../core/models/movie.model';
import { FavoriService } from '../../core/services/favori.service';
import { TmdbService } from '../../core/services/tmdb.service';
import { Loader } from '../../shared/components/loader/loader';
import { MovieCard } from '../../shared/components/movie-card/movie-card';

@Component({
  selector: 'app-favorites',
  imports: [MovieCard, Loader, RouterLink],
  templateUrl: './favorites.html',
  styleUrl: './favorites.scss',
})
export class Favorites {
  private favoriService = inject(FavoriService);
  private tmdb = inject(TmdbService);

  // Films TMDB rangés par id : on les charge une seule fois, à l'ouverture de la page
  private films = signal<Record<number, Movie>>({});

  protected chargement = signal(true);
  protected erreur = signal(false);

  // Les plus récents d'abord. Si on retire un favori (cœur d'une carte), le film disparaît tout de suite.
  protected favoris = computed(() =>
    [...this.favoriService.favoris()]
      .sort((a, b) => b.id - a.id)
      .map((f) => this.films()[f.tmdbId])
      .filter((film): film is Movie => !!film),
  );

  constructor() {
    this.charger();
  }

  protected charger() {
    this.chargement.set(true);
    this.erreur.set(false);

    this.favoriService.charger().subscribe({
      next: (favoris) => this.chargerFilms(favoris.map((f) => f.tmdbId)),
      error: () => {
        this.erreur.set(true);
        this.chargement.set(false);
      },
    });
  }

  // Les favoris ne contiennent que l'id TMDB : on va chercher chaque film (affiche, titre, note...)
  private chargerFilms(ids: number[]) {
    if (!ids.length) {
      this.chargement.set(false);
      return;
    }
    // Un film qui ne répond pas est simplement ignoré, les autres s'affichent
    forkJoin(ids.map((id) => this.tmdb.getMovie(id).pipe(catchError(() => of(null))))).subscribe((films) => {
      const parId: Record<number, Movie> = {};
      films.forEach((f) => f && (parId[f.id] = f));
      this.films.set(parId);
      // TMDB n'a répondu pour aucun film : mieux vaut une erreur qu'un faux « aucun favori »
      this.erreur.set(Object.keys(parId).length === 0);
      this.chargement.set(false);
    });
  }
}