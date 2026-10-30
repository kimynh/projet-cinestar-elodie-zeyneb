import { Component, computed, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, distinctUntilChanged, map, of, startWith, switchMap } from 'rxjs';
import { Movie } from '../../core/models/movie.model';
import { TmdbService } from '../../core/services/tmdb.service';
import { Loader } from '../../shared/components/loader/loader';
import { MovieCard } from '../../shared/components/movie-card/movie-card';

// Ce que la page affiche : les résultats, ou un état d'attente / d'erreur
type EtatRecherche =
  | { statut: 'vide' }
  | { statut: 'chargement' }
  | { statut: 'erreur' }
  | { statut: 'ok'; films: Movie[] };

@Component({
  selector: 'app-search',
  imports: [Loader, MovieCard],
  templateUrl: './search.html',
  styleUrl: './search.scss',
})
export class Search {
  private tmdb = inject(TmdbService);

  // Paramètre ?q= de l'URL, mis à jour par la barre de recherche de la navbar
  q = input<string>('');

  // Pour relancer la même recherche avec le bouton « Réessayer »
  private essai = signal(0);

  // switchMap annule la requête précédente quand le texte change :
  // on n'affiche jamais les résultats d'une ancienne recherche
  protected etat = toSignal(
    toObservable(computed(() => ({ texte: this.q().trim(), essai: this.essai() }))).pipe(
      distinctUntilChanged((a, b) => a.texte === b.texte && a.essai === b.essai),
      switchMap(({ texte }) => {
        if (texte.length < 2) {
          return of<EtatRecherche>({ statut: 'vide' });
        }
        return this.tmdb.searchMovies(texte).pipe(
          map((films): EtatRecherche => ({ statut: 'ok', films })),
          catchError(() => of<EtatRecherche>({ statut: 'erreur' })),
          startWith<EtatRecherche>({ statut: 'chargement' }),
        );
      }),
    ),
    { initialValue: { statut: 'vide' } as EtatRecherche },
  );

  protected reessayer() {
    this.essai.update((n) => n + 1);
  }
}
