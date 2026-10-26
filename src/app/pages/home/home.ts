import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MovieCard } from '../../shared/components/movie-card/movie-card';
import { MOCK_FILMS, MOCK_GENRES } from '../../shared/mock-data';

@Component({
  selector: 'app-home',
  imports: [MovieCard, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  // TODO (P2, S1) : remplacer par TmdbService.getNowPlaying() et getGenres()
  protected films = signal(MOCK_FILMS);
  protected genres = signal(MOCK_GENRES);

  protected genreChoisi = signal<number | null>(null);

  protected vedette = computed(() => this.films()[0]);

  protected filmsFiltres = computed(() => {
    const genre = this.genreChoisi();
    return genre === null ? this.films() : this.films().filter((f) => f.genre_ids?.includes(genre));
  });
}
