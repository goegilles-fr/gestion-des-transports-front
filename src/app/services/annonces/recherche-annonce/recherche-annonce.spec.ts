import { TestBed } from '@angular/core/testing';

import { RechercheAnnonce } from './recherche-annonce';

describe('RechercheAnnonce', () => {
  let service: RechercheAnnonce;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RechercheAnnonce);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
