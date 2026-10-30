import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { MovieCard } from '../../shared/components/movie-card/movie-card';
import { Loader } from '../../shared/components/loader/loader';
import { TmdbService } from '../../core/services/tmdb.service';
import { Genre, Movie } from '../../core/models/movie.model';

@Component({
  selector: 'app-home',
  imports: [MovieCard, Loader, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private tmdb = inject(TmdbService);

  protected films = signal<Movie[]>([]);
  protected genres = signal<Genre[]>([]);

  // États de la page : chargement en cours, ou erreur si TMDB ne répond pas
  protected chargement = signal(true);
  protected erreur = signal(false);

  protected genreChoisi = signal<number | null>(null);

  // Un emoji par genre TMDB, pour des filtres plus vivants
  protected emojis: Record<number, string> = {
    28: '💥',
    12: '🧭',
    16: '🎨',
    35: '😂',
    18: '🎭',
    27: '👻',
    878: '🚀',
    53: '🔪',
    10749: '💖',
    14: '🧚',
    10751: '👨‍👩‍👧',
    80: '🕵️',
  };

  protected vedette = computed(() => this.films()[0]);

  protected filmsFiltres = computed(() => {
    const genre = this.genreChoisi();
    return genre === null ? this.films() : this.films().filter((f) => f.genre_ids?.includes(genre));
  });

  constructor() {
    this.charger();
  }

  // Appelée au démarrage et par le bouton « Réessayer »
  protected charger() {
    this.chargement.set(true);
    this.erreur.set(false);

    forkJoin({
      films: this.tmdb.getNowPlaying(),
      // Sans la liste des genres, les films s'affichent quand même (juste sans filtres)
      genres: this.tmdb.getGenres().pipe(catchError(() => of([] as Genre[]))),
    }).subscribe({
      next: ({ films, genres }) => {
        this.films.set(films);
        this.genres.set(genres);
        this.chargement.set(false);
      },
      error: () => {
        this.erreur.set(true);
        this.chargement.set(false);
      },
    });
  }
}