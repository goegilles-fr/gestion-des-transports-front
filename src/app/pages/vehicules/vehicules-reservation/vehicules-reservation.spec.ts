import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehiculesReservation } from './vehicules-reservation';

describe('VehiculesReservation', () => {
  let component: VehiculesReservation;
  let fixture: ComponentFixture<VehiculesReservation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehiculesReservation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehiculesReservation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
