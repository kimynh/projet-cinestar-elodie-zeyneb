import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { MovieCard } from '../../shared/components/movie-card/movie-card';
import { Loader } from '../../shared/components/loader/loader';
import { TmdbService } from '../../core/services/tmdb.service';
import { Genre, Movie } from '../../core/models/movie.model';
import { tmdbImage } from '../../shared/tmdb-image';

@Component({
  selector: 'app-home',
  imports: [MovieCard, Loader, RouterLink, DatePipe, DecimalPipe],
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

  // Les 5 premiers films qui ont une image de fond et une affiche défilent en haut de page
  protected vedettes = computed(() =>
    this.films()
      .filter((f) => f.backdrop_path && f.poster_path)
      .slice(0, 5),
  );
  protected indexVedette = signal(0);
  protected vedette = computed(() => this.vedettes()[this.indexVedette()] ?? this.films()[0]);

  // Le défilement s'arrête quand la souris est sur le bandeau
  protected enPause = signal(false);

  protected image = tmdbImage;

  protected filmsFiltres = computed(() => {
    const genre = this.genreChoisi();
    return genre === null ? this.films() : this.films().filter((f) => f.genre_ids?.includes(genre));
  });

  constructor() {
    this.charger();
  }

  // Appelée à la fin de la barre de progression de la vignette active
  protected vedetteSuivante() {
    this.indexVedette.update((i) => (i + 1) % this.vedettes().length);
  }

  protected nomsGenres(film: Movie) {
    return this.genres()
      .filter((g) => film.genre_ids?.includes(g.id))
      .slice(0, 3)
      .map((g) => g.name);
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