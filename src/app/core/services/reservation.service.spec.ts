import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { Seance } from '../models/seance.model';
import { AuthService } from './auth.service';

import { ReservationService, SiegesDejaPrisError } from './reservation.service';

describe('ReservationService', () => {
  let service: ReservationService;
  let httpMock: HttpTestingController;
  const url = environment.apiUrl;

  const seance: Seance = {
    id: 7,
    tmdbId: 1,
    cinemaId: 1,
    salleId: 1,
    date: '2026-12-02',
    heure: '20:30',
    version: 'VF',
    siegesPris: ['A1'],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { currentUser: () => ({ id: 3, email: 'a@b.fr' }) } },
      ],
    });
    service = TestBed.inject(ReservationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('marque les sièges comme pris puis enregistre la réservation', () => {
    let id: number | undefined;
    service.reserver(7, ['C4', 'C5']).subscribe((resa) => (id = resa.id));

    httpMock.expectOne((r) => r.url === `${url}/seances/7`).flush(seance);

    const patch = httpMock.expectOne({ method: 'PATCH', url: `${url}/seances/7` });
    expect(patch.request.body).toEqual({ siegesPris: ['A1', 'C4', 'C5'] });
    patch.flush({});

    const post = httpMock.expectOne({ method: 'POST', url: `${url}/reservations` });
    expect(post.request.body).toMatchObject({ userId: 3, seanceId: 7, sieges: ['C4', 'C5'] });
    post.flush({ ...post.request.body, id: 12 });

    expect(id).toBe(12);
  });

  it('refuse si un siège a été pris entre-temps, sans rien modifier', () => {
    let erreur: unknown;
    service.reserver(7, ['A1', 'C4']).subscribe({ error: (e) => (erreur = e) });

    httpMock.expectOne((r) => r.url === `${url}/seances/7`).flush(seance);

    expect(erreur).toBeInstanceOf(SiegesDejaPrisError);
    expect((erreur as SiegesDejaPrisError).sieges).toEqual(['A1']);
  });

  it('libère les sièges si la réservation ne peut pas être enregistrée', () => {
    let echec = false;
    service.reserver(7, ['C4']).subscribe({ error: () => (echec = true) });

    httpMock.expectOne((r) => r.url === `${url}/seances/7`).flush(seance);
    httpMock.expectOne({ method: 'PATCH', url: `${url}/seances/7` }).flush({});
    httpMock
      .expectOne({ method: 'POST', url: `${url}/reservations` })
      .flush({}, { status: 500, statusText: 'Erreur' });

    const annulation = httpMock.expectOne({ method: 'PATCH', url: `${url}/seances/7` });
    expect(annulation.request.body).toEqual({ siegesPris: ['A1'] });
    annulation.flush({});

    expect(echec).toBe(true);
  });

  it('getMesReservations complète la séance avec sa salle et son cinéma', () => {
    let resultat: unknown[] = [];
    service.getMesReservations().subscribe((r) => (resultat = r));

    httpMock
      .expectOne((r) => r.url === `${url}/reservations`)
      .flush([{ id: 1, userId: 3, seanceId: 7, sieges: ['C4'], createdAt: '', seance }]);
    httpMock.expectOne(`${url}/salles`).flush([{ id: 1, nom: 'Salle 3' }]);
    httpMock.expectOne(`${url}/cinemas`).flush([{ id: 1, nom: 'Ciné Star' }]);

    expect(resultat).toMatchObject([{ id: 1, seance: { salle: { nom: 'Salle 3' }, cinema: { nom: 'Ciné Star' } } }]);
  });

  it('getMesReservations renvoie une liste vide quand json-server répond 403', () => {
    let resultat: unknown[] | undefined;
    service.getMesReservations().subscribe((r) => (resultat = r));

    httpMock
      .expectOne((r) => r.url === `${url}/reservations`)
      .flush('Private resource access', { status: 403, statusText: 'Forbidden' });
    httpMock.expectOne(`${url}/salles`).flush([]);
    httpMock.expectOne(`${url}/cinemas`).flush([]);

    expect(resultat).toEqual([]);
  });
});
