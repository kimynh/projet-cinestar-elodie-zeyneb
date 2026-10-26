import { Component, computed, input } from '@angular/core';
import { MovieCard } from '../../shared/components/movie-card/movie-card';
import { MOCK_FILMS } from '../../shared/mock-data';

@Component({
  selector: 'app-search',
  imports: [MovieCard],
  templateUrl: './search.html',
  styleUrl: './search.scss',
})
export class Search {
  // Paramètre ?q= de l'URL
  q = input<string>('');

  // TODO (P4) : remplacer par TmdbService.search() avec debounceTime et switchMap
  protected resultats = computed(() => {
    const texte = this.q().toLowerCase();
    return texte ? MOCK_FILMS.filter((f) => f.title.toLowerCase().includes(texte)) : [];
  });
}
