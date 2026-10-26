import { TestBed } from '@angular/core/testing';

import { FavoriService } from './favori.service';

describe('FavoriService', () => {
  let service: FavoriService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FavoriService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
