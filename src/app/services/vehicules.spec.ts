import { TestBed } from '@angular/core/testing';

import { Vehicules } from './vehicules.js';

describe('VehiculesTs', () => {
  let service: Vehicules;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Vehicules);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
