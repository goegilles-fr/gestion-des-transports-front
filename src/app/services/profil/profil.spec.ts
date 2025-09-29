import { TestBed } from '@angular/core/testing';

import { Profil } from './profil';

describe('Profil', () => {
  let service: Profil;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Profil);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
