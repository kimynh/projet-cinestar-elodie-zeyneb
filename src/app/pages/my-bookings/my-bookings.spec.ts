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
  const annuler = vi.fn(() => of(undefined));

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

  // jsdom ne sait pas ouvrir/fermer une <dialog> : on imite le comportement du navigateur
  beforeAll(() => {
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    };
  });

  afterEach(() => vi.useRealTimers());

  async function creer(reservations: Reservation[]) {
    await TestBed.configureTestingModule({
      imports: [MyBookings],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ReservationService, useValue: { getMesReservations: () => of(reservations), annuler } },
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

  it('annule un billet après confirmation et le retire de la liste', async () => {
    vi.useFakeTimers();
    await creer([reservation]);
    httpMock.expectOne((r) => r.url.endsWith('/movie/99')).flush({ id: 99, title: 'Dune', poster_path: null });
    fixture.detectChanges();

    const page: HTMLElement = fixture.nativeElement;
    (page.querySelector('.annuler') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(page.querySelector('app-annulation')?.textContent).toContain('Annuler ce billet ?');

    (page.querySelector('.bouton-annuler') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(annuler).toHaveBeenCalledWith(reservation);
    expect(page.querySelector('.toast')?.textContent).toContain('E5, E6 sont à nouveau libres');

    vi.advanceTimersByTime(600);
    fixture.detectChanges();
    expect(page.querySelector('article.billet')).toBeNull();
  });

  it('ne propose pas d’annuler une séance passée', async () => {
    await creer([{ ...reservation, seance: { ...reservation.seance!, date: '2020-01-01' } }]);
    httpMock.expectOne((r) => r.url.endsWith('/movie/99')).flush({ id: 99, title: 'Dune', poster_path: null });
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.annuler')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Séance passée');
  });
});
