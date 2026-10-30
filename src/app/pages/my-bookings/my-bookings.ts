import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { Movie } from '../../core/models/movie.model';
import { Reservation } from '../../core/models/reservation.model';
import { ReservationService } from '../../core/services/reservation.service';
import { TmdbService } from '../../core/services/tmdb.service';
import { Billet } from '../../shared/components/billet/billet';
import { Loader } from '../../shared/components/loader/loader';
import { tmdbImage } from '../../shared/tmdb-image';

@Component({
  selector: 'app-my-bookings',
  imports: [Billet, Loader, DatePipe, RouterLink],
  templateUrl: './my-bookings.html',
  styleUrl: './my-bookings.scss',
})
export class MyBookings {
  private reservationService = inject(ReservationService);
  private tmdb = inject(TmdbService);

  protected reservations = signal<Reservation[]>([]);
  // Films TMDB rangés par id, pour afficher titre et affiche
  protected films = signal<Record<number, Movie>>({});
  protected chargement = signal(true);
  protected erreur = signal(false);

  // Réservation dont le billet électronique est affiché
  protected billetOuvert = signal<Reservation | null>(null);
  private fenetre = viewChild.required<ElementRef<HTMLDialogElement>>('fenetre');

  protected image = tmdbImage;

  constructor() {
    this.charger();
  }

  protected charger() {
    this.chargement.set(true);
    this.erreur.set(false);

    this.reservationService.getMesReservations().subscribe({
      next: (reservations) => {
        this.reservations.set(reservations);
        this.chargement.set(false);
        this.chargerFilms(reservations);
      },
      error: () => {
        this.erreur.set(true);
        this.chargement.set(false);
      },
    });
  }

  // Un seul appel TMDB par film, même s'il a plusieurs réservations
  private chargerFilms(reservations: Reservation[]) {
    const ids = [...new Set(reservations.map((r) => r.seance!.tmdbId))];
    if (!ids.length) {
      return;
    }
    forkJoin(ids.map((id) => this.tmdb.getMovie(id).pipe(catchError(() => of(null))))).subscribe((films) => {
      const parId: Record<number, Movie> = {};
      films.forEach((f) => f && (parId[f.id] = f));
      this.films.set(parId);
    });
  }

  protected filmDe(r: Reservation): Movie | null {
    return this.films()[r.seance!.tmdbId] ?? null;
  }

  protected voirBillet(r: Reservation) {
    this.billetOuvert.set(r);
    this.fenetre().nativeElement.showModal();
  }

  protected annuler(r: Reservation) {
    // TODO (P6) : confirmation, DELETE /reservations/:id, PATCH /seances/:id
  }
}
