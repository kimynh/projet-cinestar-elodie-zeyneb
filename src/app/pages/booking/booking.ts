import { Component, computed, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeatMap } from '../../shared/components/seat-map/seat-map';
import { MOCK_CINEMAS, MOCK_FILMS, MOCK_SALLE, MOCK_SEANCES } from '../../shared/mock-data';

@Component({
  selector: 'app-booking',
  imports: [SeatMap, DatePipe, RouterLink],
  templateUrl: './booking.html',
  styleUrl: './booking.scss',
})
export class Booking {
  // Paramètre :seanceId de la route
  seanceId = input.required<string>();

  // TODO (P5) : charger la séance avec GET /seances/:id?_expand=salle
  protected seance = computed(() => MOCK_SEANCES.find((s) => s.id === +this.seanceId()) ?? MOCK_SEANCES[0]);
  protected salle = signal(MOCK_SALLE);
  protected film = computed(() => MOCK_FILMS.find((f) => f.id === this.seance().tmdbId) ?? MOCK_FILMS[0]);
  protected cinema = computed(() => MOCK_CINEMAS.find((c) => c.id === this.seance().cinemaId));

  protected siegesChoisis = signal<string[]>([]);

  protected reserver() {
    // TODO (P5) : revérifier la séance, POST /reservations, PATCH /seances/:id, notification, redirection
  }
}
