import { Component, computed, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Movie } from '../../../core/models/movie.model';
import { Reservation } from '../../../core/models/reservation.model';
import { Seance } from '../../../core/models/seance.model';
import { tmdbImage } from '../../tmdb-image';

// Billet de cinéma doré, avec un code-barres propre à chaque réservation.
// « horizontal » : talon à droite (confirmation). « vertical » : billet électronique plein écran.
@Component({
  selector: 'app-billet',
  imports: [DatePipe],
  templateUrl: './billet.html',
  styleUrl: './billet.scss',
  host: { '[class.vertical]': "format() === 'vertical'" },
})
export class Billet {
  reservation = input.required<Reservation>();
  seance = input.required<Seance>();
  film = input<Movie | null>(null);
  format = input<'horizontal' | 'vertical'>('horizontal');

  protected affiche = computed(() => tmdbImage(this.film()?.poster_path, 'w342'));
  protected numero = computed(() => `CS-${String(this.reservation().id).padStart(5, '0')}`);

  // Barres générées à partir du numéro : toujours le même dessin pour une même réservation
  protected barres = computed(() => {
    let graine = this.reservation().id * 9301 + 49297;
    const aleatoire = () => {
      graine = (graine * 9301 + 49297) % 233280;
      return graine / 233280;
    };
    const barres: { x: number; largeur: number }[] = [];
    let x = 0;
    while (x < 96) {
      const largeur = 1 + Math.floor(aleatoire() * 3);
      barres.push({ x, largeur });
      x += largeur + 1 + Math.floor(aleatoire() * 2);
    }
    return barres;
  });
}
