import { Component, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MOCK_CINEMAS, MOCK_FILMS, MOCK_RESERVATIONS, MOCK_SEANCES } from '../../shared/mock-data';
import { Reservation } from '../../core/models/reservation.model';

@Component({
  selector: 'app-my-bookings',
  imports: [DatePipe, RouterLink],
  templateUrl: './my-bookings.html',
  styleUrl: './my-bookings.scss',
})
export class MyBookings {
  // TODO (P6) : remplacer par GET /reservations?userId=
  protected reservations = signal(MOCK_RESERVATIONS);

  protected seanceDe(r: Reservation) {
    return MOCK_SEANCES.find((s) => s.id === r.seanceId)!;
  }

  protected filmDe(r: Reservation) {
    return MOCK_FILMS.find((f) => f.id === this.seanceDe(r).tmdbId) ?? MOCK_FILMS[0];
  }

  protected cinemaDe(r: Reservation) {
    return MOCK_CINEMAS.find((c) => c.id === this.seanceDe(r).cinemaId);
  }

  protected annuler(r: Reservation) {
    // TODO (P6) : confirmation, DELETE /reservations/:id, PATCH /seances/:id
  }
}
