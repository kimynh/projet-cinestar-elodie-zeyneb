import { Component, computed, input, model } from '@angular/core';

// Plan de salle : ne fait aucun appel HTTP.
// Reçoit la forme de la salle et les sièges pris, renvoie les sièges choisis.
@Component({
  selector: 'app-seat-map',
  templateUrl: './seat-map.html',
  styleUrl: './seat-map.scss',
})
export class SeatMap {
  rangees = input.required<number>();
  siegesParRangee = input.required<number>();
  siegesPris = input<string[]>([]);
  maxSieges = input(10);

  // Sièges choisis. model() permet le [(selection)] dans la page parente,
  // et émet aussi l'événement (selectionChange) à chaque changement
  selection = model<string[]>([]);

  // ['A', 'B', 'C', …]
  protected lettres = computed(() =>
    Array.from({ length: this.rangees() }, (_, i) => String.fromCharCode(65 + i)),
  );
  protected numeros = computed(() => Array.from({ length: this.siegesParRangee() }, (_, i) => i + 1));

  protected estPris(siege: string) {
    return this.siegesPris().includes(siege);
  }

  protected estChoisi(siege: string) {
    return this.selection().includes(siege);
  }

  protected basculer(siege: string) {
    if (this.estPris(siege)) {
      return;
    }
    const actuelle = this.selection();
    if (actuelle.includes(siege)) {
      this.selection.set(actuelle.filter((s) => s !== siege));
    } else if (actuelle.length < this.maxSieges()) {
      this.selection.set([...actuelle, siege]);
    }
  }
}
