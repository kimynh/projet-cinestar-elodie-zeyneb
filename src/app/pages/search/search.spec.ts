import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { Search } from './search';

describe('Search', () => {
  let fixture: ComponentFixture<Search>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Search],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Search);
    httpMock = TestBed.inject(HttpTestingController);
  });

  function chercher(q: string) {
    fixture.componentRef.setInput('q', q);
    fixture.detectChanges();
  }

  it('n’appelle pas TMDB avec moins de 2 lettres', async () => {
    chercher('d');
    await fixture.whenStable();

    httpMock.expectNone((r) => r.url.endsWith('/search/movie'));
    expect(fixture.nativeElement.textContent).toContain('au moins 2 lettres');
  });

  it('affiche les films trouvés', async () => {
    chercher('dune');
    const req = httpMock.expectOne((r) => r.url.endsWith('/search/movie'));
    expect(req.request.params.get('query')).toBe('dune');

    req.flush({ results: [{ id: 1, title: 'Dune', poster_path: null }] });
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelectorAll('app-movie-card').length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('1 film trouvé');
  });

  it('propose de réessayer si TMDB ne répond pas', async () => {
    chercher('dune');
    httpMock.expectOne((r) => r.url.endsWith('/search/movie')).flush({}, { status: 500, statusText: 'Erreur' });
    await fixture.whenStable();

    const bouton: HTMLButtonElement = fixture.nativeElement.querySelector('.etat-vide button');
    bouton.click();
    fixture.detectChanges();

    httpMock.expectOne((r) => r.url.endsWith('/search/movie'));
  });
});
