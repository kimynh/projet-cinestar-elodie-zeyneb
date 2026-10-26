import { Component, computed, input, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DureePipe } from '../../shared/pipes/duree-pipe';
import { tmdbImage } from '../../shared/tmdb-image';
import { Seance } from '../../core/models/seance.model';
import { MOCK_AVIS, MOCK_CASTING, MOCK_CINEMAS, MOCK_FILMS, MOCK_SEANCES } from '../../shared/mock-data';

interface GroupeSeances {
  cinema: string;
  jours: { date: string; seances: Seance[] }[];
}

@Component({
  selector: 'app-movie-detail',
  imports: [RouterLink, DatePipe, DecimalPipe, DureePipe],
  templateUrl: './movie-detail.html',
  styleUrl: './movie-detail.scss',
})
export class MovieDetail {
  // Paramètre :id de la route
  id = input.required<string>();

  // TODO (P3) : remplacer par un forkJoin sur TmdbService et SeanceService
  protected film = computed(() => MOCK_FILMS.find((f) => f.id === +this.id()) ?? MOCK_FILMS[0]);
  protected casting = signal(MOCK_CASTING);
  protected avis = signal(MOCK_AVIS);
  protected seances = computed(() => MOCK_SEANCES.filter((s) => s.tmdbId === this.film().id));

  protected affiche = computed(() => tmdbImage(this.film().poster_path, 'w500'));
  protected fond = computed(() => tmdbImage(this.film().backdrop_path, 'w1280'));
  protected tmdbImage = tmdbImage;

  // Avis dont le texte est déplié (« Lire la suite »)
  protected avisOuverts = signal<string[]>([]);

  // Séances regroupées par cinéma, puis par date
  protected groupes = computed<GroupeSeances[]>(() => {
    const parCinema = new Map<number, Map<string, Seance[]>>();
    for (const s of this.seances()) {
      const jours = parCinema.get(s.cinemaId) ?? new Map<string, Seance[]>();
      jours.set(s.date, [...(jours.get(s.date) ?? []), s]);
      parCinema.set(s.cinemaId, jours);
    }
    return [...parCinema].map(([cinemaId, jours]) => ({
      cinema: MOCK_CINEMAS.find((c) => c.id === cinemaId)?.nom ?? 'Cinéma',
      jours: [...jours].map(([date, seances]) => ({ date, seances })),
    }));
  });

  protected basculerAvis(id: string) {
    this.avisOuverts.update((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]));
  }
}
