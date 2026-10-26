import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { MovieCard } from './movie-card';
import { MOCK_FILMS } from '../../mock-data';

describe('MovieCard', () => {
  let component: MovieCard;
  let fixture: ComponentFixture<MovieCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MovieCard],
      providers: [provideRouter([])],
    })
    .compileComponents();

    fixture = TestBed.createComponent(MovieCard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('movie', MOCK_FILMS[0]);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
