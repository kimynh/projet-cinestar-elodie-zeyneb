import { Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of, switchMap, tap } from 'rxjs';
import { DureePipe } from '../../shared/pipes/duree-pipe';
import { tmdbImage } from '../../shared/tmdb-image';
import { Loader } from '../../shared/components/loader/loader';
import { CastMember, Movie } from '../../core/models/movie.model';
import { Review } from '../../core/models/review.model';
import { Seance } from '../../core/models/seance.model';
import { TmdbService } from '../../core/services/tmdb.service';
import { SeanceService } from '../../core/services/seance.service';
import { FavoriButton } from '../../shared/components/favori-button/favori-button';

interface GroupeSeances {
  cinema: string;
  jours: { date: string; seances: Seance[] }[];
}

@Component({
  selector: 'app-movie-detail',
  imports: [RouterLink, DatePipe, DecimalPipe, DureePipe, Loader, FavoriButton],
  templateUrl: './movie-detail.html',
  styleUrl: './movie-detail.scss',
})
export class MovieDetail {
  private tmdb = inject(TmdbService);
  private seanceService = inject(SeanceService);

  // Paramètre :id de la route
  id = input.required<string>();

  protected film = signal<Movie | null>(null);
  protected casting = signal<CastMember[]>([]);
  protected avis = signal<Review[]>([]);
  protected seances = signal<Seance[]>([]);
  protected chargement = signal(true);
  protected erreur = signal(false);

  protected affiche = computed(() => tmdbImage(this.film()?.poster_path, 'w500'));
  protected fond = computed(() => tmdbImage(this.film()?.backdrop_path, 'w1280'));
  protected tmdbImage = tmdbImage;

  // Avis dont le texte est déplié (« Lire la suite »)
  protected avisOuverts = signal<string[]>([]);

  // Séances regroupées par cinéma, puis par date
  protected groupes = computed<GroupeSeances[]>(() => {
    const parCinema = new Map<number, { nom: string; jours: Map<string, Seance[]> }>();
    for (const s of this.seances()) {
      const groupe = parCinema.get(s.cinemaId) ?? {
        nom: s.cinema?.nom ?? 'Cinéma',
        jours: new Map<string, Seance[]>(),
      };
      groupe.jours.set(s.date, [...(groupe.jours.get(s.date) ?? []), s]);
      parCinema.set(s.cinemaId, groupe);
    }
    return [...parCinema.values()].map(({ nom, jours }) => ({
      cinema: nom,
      jours: [...jours].map(([date, seances]) => ({ date, seances })),
    }));
  });

  constructor() {
    // À chaque changement de :id (ex. clic sur un autre film), on recharge tout
    toObservable(this.id)
      .pipe(
        tap(() => {
          this.chargement.set(true);
          this.erreur.set(false);
          this.avisOuverts.set([]);
        }),
        switchMap((id) => {
          const filmId = +id;
          // forkJoin lance les 4 appels en même temps et attend qu'ils soient tous finis.
          // Si le casting, les avis ou les séances échouent, on affiche simplement une liste vide.
          return forkJoin({
            film: this.tmdb.getMovie(filmId),
            casting: this.tmdb.getCredits(filmId).pipe(catchError(() => of([] as CastMember[]))),
            avis: this.tmdb.getReviews(filmId).pipe(catchError(() => of([] as Review[]))),
            seances: this.seanceService.getByFilm(filmId).pipe(catchError(() => of([] as Seance[]))),
          }).pipe(catchError(() => of(null)));
        }),
        takeUntilDestroyed(),
      )
      .subscribe((donnees) => {
        if (donnees) {
          this.film.set(donnees.film);
          this.casting.set(donnees.casting);
          this.avis.set(donnees.avis);
          this.seances.set(donnees.seances);
        } else {
          this.film.set(null);
          this.erreur.set(true);
        }
        this.chargement.set(false);
      });
  }

  protected basculerAvis(id: string) {
    this.avisOuverts.update((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]));
  }
}