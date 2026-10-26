import { Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Movie } from '../../../core/models/movie.model';
import { tmdbImage } from '../../tmdb-image';

@Component({
  selector: 'app-movie-card',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './movie-card.html',
  styleUrl: './movie-card.scss',
})
export class MovieCard {
  movie = input.required<Movie>();

  protected affiche = computed(() => tmdbImage(this.movie().poster_path, 'w342'));
  protected annee = computed(() => this.movie().release_date?.slice(0, 4));
}
