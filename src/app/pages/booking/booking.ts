import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { Movie } from '../../core/models/movie.model';
import { Reservation } from '../../core/models/reservation.model';
import { Seance } from '../../core/models/seance.model';
import { ReservationService, SiegesDejaPrisError } from '../../core/services/reservation.service';
import { SeanceService } from '../../core/services/seance.service';
import { TmdbService } from '../../core/services/tmdb.service';
import { Loader } from '../../shared/components/loader/loader';
import { SeatMap } from '../../shared/components/seat-map/seat-map';
import { BookingConfirmation } from './booking-confirmation/booking-confirmation';

@Component({
  selector: 'app-booking',
  imports: [SeatMap, Loader, BookingConfirmation, DatePipe, RouterLink],
  templateUrl: './booking.html',
  styleUrl: './booking.scss',
})
export class Booking {
  private seances = inject(SeanceService);
  private tmdb = inject(TmdbService);
  private reservations = inject(ReservationService);

  // Paramètre :seanceId de la route
  seanceId = input.required<string>();

  protected seance = signal<Seance | null>(null);
  protected film = signal<Movie | null>(null);
  protected chargement = signal(true);
  protected erreurChargement = signal(false);

  protected siegesChoisis = signal<string[]>([]);
  protected enCours = signal(false);
  protected erreur = signal<string | null>(null);

  // Réservation enregistrée : affiche la fenêtre de confirmation
  protected confirmation = signal<Reservation | null>(null);

  constructor() {
    // Recharge la séance si l'id change dans l'URL
    effect(() => {
      const id = +this.seanceId();
      untracked(() => this.charger(id));
    });

  }

  protected charger(id: number) {
    this.chargement.set(true);
    this.erreurChargement.set(false);

    this.seances.getById(id).subscribe({
      next: (seance) => {
        this.seance.set(seance);
        this.chargement.set(false);
        // Sans TMDB, on peut quand même réserver (le titre manquera juste)
        this.tmdb
          .getMovie(seance.tmdbId)
          .pipe(catchError(() => of(null)))
          .subscribe((film) => this.film.set(film));
      },
      error: () => {
        this.erreurChargement.set(true);
        this.chargement.set(false);
      },
    });
  }

  protected reserver() {
    const seance = this.seance();
    const sieges = this.siegesChoisis();
    if (!seance || !sieges.length || this.enCours()) {
      return;
    }

    this.enCours.set(true);
    this.erreur.set(null);

    this.reservations.reserver(seance.id, sieges).subscribe({
      next: (reservation) => {
        // Les sièges réservés apparaissent maintenant comme pris sur le plan
        this.seance.set({ ...seance, siegesPris: [...seance.siegesPris, ...sieges] });
        this.siegesChoisis.set([]);
        this.confirmation.set(reservation);
        this.enCours.set(false);
      },
      error: (err) => {
        if (err instanceof SiegesDejaPrisError) {
          // Quelqu'un a été plus rapide : on met le plan à jour et on retire ces sièges
          this.seance.set({ ...seance, siegesPris: err.seance.siegesPris });
          this.siegesChoisis.update((choisis) => choisis.filter((s) => !err.sieges.includes(s)));
          const pluriel = err.sieges.length > 1;
          this.erreur.set(
            `Oups, ${pluriel ? 'les sièges' : 'le siège'} ${err.sieges.join(', ')} ${pluriel ? 'viennent' : 'vient'} d’être ${pluriel ? 'réservés' : 'réservé'} par quelqu’un d’autre. Choisissez-en ${pluriel ? 'd’autres' : 'un autre'}.`,
          );
        } else {
          this.erreur.set('La réservation n’a pas pu être enregistrée. Réessayez dans un instant.');
        }
        this.enCours.set(false);
      },
    });
  }

}
