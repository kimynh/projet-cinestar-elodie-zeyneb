import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Reservation } from '../../core/models/reservation.model';
import { ReservationService } from '../../core/services/reservation.service';

import { MyBookings } from './my-bookings';

describe('MyBookings', () => {
  let fixture: ComponentFixture<MyBookings>;
  let httpMock: HttpTestingController;

  const reservation: Reservation = {
    id: 7,
    userId: 3,
    seanceId: 2,
    sieges: ['E5', 'E6'],
    createdAt: '',
    seance: {
      id: 2,
      tmdbId: 99,
      cinemaId: 1,
      salleId: 1,
      date: '2026-12-02',
      heure: '20:30',
      version: 'VF',
      siegesPris: [],
      salle: { id: 1, cinemaId: 1, nom: 'Salle 3', rangees: 8, siegesParRangee: 12 },
      cinema: { id: 1, nom: 'Ciné Star', ville: 'Paris', adresse: '' },
    },
  };

  async function creer(reservations: Reservation[]) {
    await TestBed.configureTestingModule({
      imports: [MyBookings],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ReservationService, useValue: { getMesReservations: () => of(reservations) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MyBookings);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  }

  it('affiche l’affiche du film de chaque réservation', async () => {
    await creer([reservation]);
    httpMock.expectOne((r) => r.url.endsWith('/movie/99')).flush({ id: 99, title: 'Dune', poster_path: '/dune.jpg' });
    await fixture.whenStable();

    const img: HTMLImageElement = fixture.nativeElement.querySelector('.billet__film img');
    expect(img.src).toContain('/dune.jpg');
    expect(fixture.nativeElement.querySelector('h2').textContent).toContain('Dune');
  });

  it('affiche le billet électronique avec son numéro', async () => {
    await creer([reservation]);
    httpMock.expectOne((r) => r.url.endsWith('/movie/99')).flush({ id: 99, title: 'Dune', poster_path: null });
    await fixture.whenStable();

    const dialog: HTMLDialogElement = fixture.nativeElement.querySelector('dialog');
    dialog.showModal ??= () => dialog.setAttribute('open', '');
    fixture.nativeElement.querySelector('.voir-billet').click();
    fixture.detectChanges();

    expect(dialog.textContent).toContain('N° CS-00007');
    expect(dialog.querySelectorAll('.code-barres rect').length).toBeGreaterThan(10);
  });

  it('invite à réserver quand il n’y a aucune réservation', async () => {
    await creer([]);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.etat-vide').textContent).toContain('Aucune réservation');
  });
});
