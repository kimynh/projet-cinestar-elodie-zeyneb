import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CastMember, Genre, Movie } from '../models/movie.model';
import { Review } from '../models/review.model';

@Injectable({
  providedIn: 'root',
})
export class TmdbService {
  private http = inject(HttpClient);

  // Films actuellement à l'affiche en France
  getNowPlaying() {
    return this.http
      .get<{ results: Movie[] }>(`${environment.tmdbUrl}/movie/now_playing`, {
        params: { region: 'FR' },
      })
      .pipe(map((rep) => rep.results));
  }

  // Liste des genres (Action, Comédie, ...)
  getGenres() {
    return this.http
      .get<{ genres: Genre[] }>(`${environment.tmdbUrl}/genre/movie/list`)
      .pipe(map((rep) => rep.genres));
  }

  // Détail d'un film : résumé, durée, genres...
  getMovie(id: number) {
    return this.http.get<Movie>(`${environment.tmdbUrl}/movie/${id}`);
  }

  // Les 12 premiers acteurs
  getCredits(id: number) {
    return this.http
      .get<{ cast: CastMember[] }>(`${environment.tmdbUrl}/movie/${id}/credits`)
      .pipe(map((rep) => rep.cast.slice(0, 12)));
  }

  // Avis : la plupart sont en anglais, donc on demande l'anglais
  // (avec fr-FR la liste serait presque toujours vide)
  getReviews(id: number) {
    return this.http
      .get<{ results: Review[] }>(`${environment.tmdbUrl}/movie/${id}/reviews`, {
        params: { language: 'en-US' },
      })
      .pipe(map((rep) => rep.results));
  }
}