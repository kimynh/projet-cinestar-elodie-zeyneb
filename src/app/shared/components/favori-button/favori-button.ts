import { Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { FavoriService } from '../../../core/services/favori.service';

// Bouton cœur pour ajouter / retirer un film des favoris.
// Utilisé sur les cartes (variante « coeur », icône seule) et sur la fiche film (variante « texte »).
@Component({
  selector: 'app-favori-button',
  templateUrl: './favori-button.html',
  styleUrl: './favori-button.scss',
})
export class FavoriButton {
  private favoris = inject(FavoriService);
  private auth = inject(AuthService);
  private router = inject(Router);

  tmdbId = input.required<number>();
  variante = input<'coeur' | 'texte'>('coeur');

  protected erreur = signal(false);

  protected actif = computed(() => this.favoris.estFavori(this.tmdbId()));
  protected libelle = computed(() => (this.actif() ? 'Retirer des favoris' : 'Ajouter aux favoris'));

  protected basculer(event: Event) {
    // Le bouton peut se trouver à côté d'un lien : on ne veut pas le suivre
    event.preventDefault();
    event.stopPropagation();

    // Réservé aux utilisateurs connectés : on envoie vers la connexion, puis on revient ici
    if (!this.auth.estConnecte()) {
      this.router.navigate(['/connexion'], { queryParams: { retour: this.router.url } });
      return;
    }

    this.erreur.set(false);
    this.favoris.basculer(this.tmdbId()).subscribe({
      error: () => this.erreur.set(true),
    });
  }
}