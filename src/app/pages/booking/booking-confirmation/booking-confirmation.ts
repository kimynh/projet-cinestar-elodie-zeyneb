import { Component, ElementRef, afterNextRender, input, output, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Movie } from '../../../core/models/movie.model';
import { Reservation } from '../../../core/models/reservation.model';
import { Seance } from '../../../core/models/seance.model';
import { Billet } from '../../../shared/components/billet/billet';

// Fenêtre affichée après une réservation réussie : un billet doré sous une pluie de confettis
@Component({
  selector: 'app-booking-confirmation',
  imports: [Billet, RouterLink],
  templateUrl: './booking-confirmation.html',
  styleUrl: './booking-confirmation.scss',
})
export class BookingConfirmation {
  reservation = input.required<Reservation>();
  seance = input.required<Seance>();
  film = input<Movie | null>(null);

  // Émis quand la fenêtre se ferme (bouton, lien ou touche Échap)
  fermer = output();

  protected fenetre = viewChild.required<ElementRef<HTMLDialogElement>>('fenetre');

  // Confettis dorés, chacun avec sa position, son délai et sa vitesse
  protected confettis = Array.from({ length: 36 }, (_, i) => ({
    symbole: ['✦', '★', '🎟️', '🍿', '✨'][i % 5],
    gauche: Math.random() * 100,
    delai: Math.random() * 0.8,
    duree: 2.2 + Math.random() * 1.6,
    rotation: Math.random() * 720 - 360,
    taille: 0.8 + Math.random() * 0.9,
  }));

  constructor() {
    // showModal() : fond assombri, focus gardé dans la fenêtre, Échap pour fermer
    afterNextRender(() => this.fenetre().nativeElement.showModal());
  }
}
