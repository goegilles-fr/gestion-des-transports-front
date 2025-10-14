import { TestBed } from '@angular/core/testing';

import { MesReservations } from './mes-reservations';

describe('MesReservations', () => {
  let service: MesReservations;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MesReservations);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
