import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Seance } from '../../core/models/seance.model';
import { ReservationService, SiegesDejaPrisError } from '../../core/services/reservation.service';

import { Booking } from './booking';

describe('Booking', () => {
  let fixture: ComponentFixture<Booking>;
  let httpMock: HttpTestingController;
  const reserver = vi.fn();

  const seance: Seance = {
    id: 2,
    tmdbId: 1,
    cinemaId: 1,
    salleId: 1,
    date: '2026-12-02',
    heure: '20:30',
    version: 'VF',
    siegesPris: ['A1'],
    salle: { id: 1, cinemaId: 1, nom: 'Salle 3', rangees: 2, siegesParRangee: 3 },
  };

  beforeEach(async () => {
    reserver.mockReset();
    await TestBed.configureTestingModule({
      imports: [Booking],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ReservationService, useValue: { reserver } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Booking);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.componentRef.setInput('seanceId', '2');
    fixture.detectChanges();
    httpMock.expectOne((r) => r.url.endsWith('/seances/2')).flush(seance);
    httpMock.expectOne((r) => r.url.endsWith('/movie/1')).flush({ id: 1, title: 'Dune' });
    await fixture.whenStable();
  });

  function choisirSiege(label: string) {
    fixture.nativeElement.querySelector(`[aria-label="Siège ${label}"]`).click();
    fixture.detectChanges();
  }

  function cliquerReserver() {
    fixture.nativeElement.querySelector('.recap .bouton-or').click();
    fixture.detectChanges();
  }

  it('affiche la confirmation après la réservation', async () => {
    reserver.mockReturnValue(of({ id: 42, userId: 3, seanceId: 2, sieges: ['B2'], createdAt: '' }));

    choisirSiege('B2');
    cliquerReserver();
    await fixture.whenStable();

    expect(reserver).toHaveBeenCalledWith(2, ['B2']);
    const page: HTMLElement = fixture.nativeElement;
    expect(page.querySelector('.confirmation')?.textContent).toContain('N° CS-00042');
    // Le siège réservé apparaît maintenant comme pris
    expect(page.querySelector('[aria-label="Siège B2"]')?.classList).toContain('pris');
  });

  it('prévient et retire le siège s’il vient d’être pris par quelqu’un d’autre', async () => {
    reserver.mockReturnValue(
      throwError(() => new SiegesDejaPrisError(['B2'], { ...seance, siegesPris: ['A1', 'B2'] })),
    );

    choisirSiege('B2');
    cliquerReserver();
    await fixture.whenStable();

    const page: HTMLElement = fixture.nativeElement;
    expect(page.querySelector('.erreur')?.textContent).toContain('B2');
    expect(page.querySelector('.sieges__liste')?.textContent).not.toContain('B2');
    expect(page.querySelector('.confirmation')).toBeNull();
  });
});
