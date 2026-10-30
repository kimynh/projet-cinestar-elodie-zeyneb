import { Component, ElementRef, afterNextRender, inject, input, output, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Movie } from '../../../core/models/movie.model';
import { Reservation } from '../../../core/models/reservation.model';
import { ReservationService } from '../../../core/services/reservation.service';

// Fenêtre « Annuler ce billet ? » : demande confirmation puis annule la réservation
@Component({
  selector: 'app-annulation',
  imports: [DatePipe],
  templateUrl: './annulation.html',
  styleUrl: './annulation.scss',
})
export class Annulation {
  private reservations = inject(ReservationService);

  reservation = input.required<Reservation>();
  film = input<Movie | null>(null);

  // Émis après une annulation réussie
  annulee = output<Reservation>();
  // Émis quand la fenêtre se ferme (bouton « Garder », Échap ou après l'annulation)
  fermer = output();

  protected enCours = signal(false);
  protected erreur = signal(false);

  private fenetre = viewChild.required<ElementRef<HTMLDialogElement>>('fenetre');

  constructor() {
    afterNextRender(() => this.fenetre().nativeElement.showModal());
  }

  protected confirmer() {
    this.enCours.set(true);
    this.erreur.set(false);

    this.reservations.annuler(this.reservation()).subscribe({
      next: () => {
        this.annulee.emit(this.reservation());
        this.fenetre().nativeElement.close();
      },
      error: () => {
        this.erreur.set(true);
        this.enCours.set(false);
      },
    });
  }

  // Pendant l'annulation, on empêche de fermer avec Échap
  protected bloquerEchap(event: Event) {
    if (this.enCours()) {
      event.preventDefault();
    }
  }
}
