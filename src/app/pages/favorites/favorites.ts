import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MovieCard } from '../../shared/components/movie-card/movie-card';
import { MOCK_FILMS } from '../../shared/mock-data';

@Component({
  selector: 'app-favorites',
  imports: [MovieCard, RouterLink],
  templateUrl: './favorites.html',
  styleUrl: './favorites.scss',
})
export class Favorites {
  // TODO (S2) : remplacer par GET /favoris?userId= puis les films TMDB correspondants
  protected favoris = signal(MOCK_FILMS.slice(0, 3));
}
