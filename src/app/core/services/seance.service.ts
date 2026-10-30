import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Seance } from '../models/seance.model';

@Injectable({
  providedIn: 'root',
})
export class SeanceService {
  private http = inject(HttpClient);

  // Séances d'un film (identifié par son id TMDB), avec leur cinéma et leur salle
  getByFilm(tmdbId: number) {
    return this.http.get<Seance[]>(`${environment.apiUrl}/seances`, {
      params: { tmdbId, _expand: ['cinema', 'salle'], _sort: 'date,heure' },
    });
  }

  // Une séance avec sa salle (pour dessiner le plan) et son cinéma
  getById(id: number) {
    return this.http.get<Seance>(`${environment.apiUrl}/seances/${id}`, {
      params: { _expand: ['cinema', 'salle'] },
    });
  }

  // Remplace la liste des sièges pris de la séance
  majSiegesPris(id: number, siegesPris: string[]) {
    return this.http.patch<Seance>(`${environment.apiUrl}/seances/${id}`, { siegesPris });
  }
}
