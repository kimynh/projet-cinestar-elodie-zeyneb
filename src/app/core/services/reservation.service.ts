import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, forkJoin, map, of, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cinema } from '../models/cinema.model';
import { Reservation } from '../models/reservation.model';
import { Salle } from '../models/salle.model';
import { Seance } from '../models/seance.model';
import { AuthService } from './auth.service';
import { SeanceService } from './seance.service';

// Erreur levée quand quelqu'un a pris un des sièges entre-temps
export class SiegesDejaPrisError extends Error {
  constructor(
    readonly sieges: string[],
    readonly seance: Seance,
  ) {
    super(`Sièges déjà pris : ${sieges.join(', ')}`);
  }
}

@Injectable({
  providedIn: 'root',
})
export class ReservationService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private seances = inject(SeanceService);

  // Réserve des sièges en 3 étapes :
  // 1. on relit la séance pour être sûr que les sièges sont encore libres
  // 2. on marque les sièges comme pris dans la séance
  // 3. on enregistre la réservation de l'utilisateur
  reserver(seanceId: number, sieges: string[]) {
    return this.seances.getById(seanceId).pipe(
      switchMap((seance) => {
        const dejaPris = sieges.filter((s) => seance.siegesPris.includes(s));
        if (dejaPris.length) {
          return throwError(() => new SiegesDejaPrisError(dejaPris, seance));
        }

        return this.seances.majSiegesPris(seanceId, [...seance.siegesPris, ...sieges]).pipe(
          switchMap(() => this.creer(seanceId, sieges)),
          // Si la réservation échoue, on libère les sièges qu'on venait de prendre
          catchError((err) =>
            this.seances.majSiegesPris(seanceId, seance.siegesPris).pipe(
              catchError(() => of(null)),
              switchMap(() => throwError(() => err)),
            ),
          ),
        );
      }),
    );
  }

  // Annule une réservation en 2 étapes :
  // 1. on supprime la réservation
  // 2. on relit la séance et on libère ses sièges (relue juste avant, pour ne pas
  //    effacer les sièges que d'autres personnes auraient réservés entre-temps)
  annuler(reservation: Reservation) {
    return this.http.delete<void>(`${environment.apiUrl}/reservations/${reservation.id}`).pipe(
      switchMap(() => this.seances.getById(reservation.seanceId)),
      switchMap((seance) =>
        this.seances.majSiegesPris(
          seance.id,
          seance.siegesPris.filter((s) => !reservation.sieges.includes(s)),
        ),
      ),
      map(() => undefined),
    );
  }

  // Réservations de l'utilisateur connecté, avec leur séance, salle et cinéma,
  // de la plus proche à la plus lointaine
  getMesReservations() {
    const url = environment.apiUrl;
    return forkJoin({
      reservations: this.http
        .get<Reservation[]>(`${url}/reservations`, {
          params: { userId: this.auth.currentUser()!.id, _expand: 'seance' },
        })
        .pipe(
          // json-server-auth répond 403 (au lieu de []) quand l'utilisateur n'a encore rien réservé
          catchError((err: HttpErrorResponse) => (err.status === 403 ? of([]) : throwError(() => err))),
        ),
      salles: this.http.get<Salle[]>(`${url}/salles`),
      cinemas: this.http.get<Cinema[]>(`${url}/cinemas`),
    }).pipe(
      map(({ reservations, salles, cinemas }) =>
        reservations
          .filter((r) => r.seance)
          .map((r) => ({
            ...r,
            seance: {
              ...r.seance!,
              salle: salles.find((s) => s.id === r.seance!.salleId),
              cinema: cinemas.find((c) => c.id === r.seance!.cinemaId),
            },
          }))
          .sort((a, b) => (a.seance.date + a.seance.heure).localeCompare(b.seance.date + b.seance.heure)),
      ),
    );
  }

  private creer(seanceId: number, sieges: string[]) {
    const reservation: Omit<Reservation, 'id'> = {
      userId: this.auth.currentUser()!.id,
      seanceId,
      sieges,
      createdAt: new Date().toISOString(),
    };
    return this.http.post<Reservation>(`${environment.apiUrl}/reservations`, reservation);
  }
}
