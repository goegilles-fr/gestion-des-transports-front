import { TestBed } from '@angular/core/testing';

import { CreateAnnonce } from './create-annonce';

describe('CreateAnnonce', () => {
  let service: CreateAnnonce;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CreateAnnonce);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
