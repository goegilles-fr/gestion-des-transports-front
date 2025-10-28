import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservationsModale } from './reservations-modale';

describe('ReservationsModale', () => {
  let component: ReservationsModale;
  let fixture: ComponentFixture<ReservationsModale>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservationsModale]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReservationsModale);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
