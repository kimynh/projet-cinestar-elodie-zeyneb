import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { MovieDetail } from './movie-detail';

describe('MovieDetail', () => {
  let component: MovieDetail;
  let fixture: ComponentFixture<MovieDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MovieDetail],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    })
    .compileComponents();

    fixture = TestBed.createComponent(MovieDetail);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('id', '1184918');
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
