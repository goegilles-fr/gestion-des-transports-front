import { TestBed } from '@angular/core/testing';

import { Annonce } from './annonce';

describe('Annonce', () => {
  let service: Annonce;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Annonce);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
