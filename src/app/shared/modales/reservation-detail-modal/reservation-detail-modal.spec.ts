import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservationDetailModal } from './reservation-detail-modal';

describe('ReservationDetailModal', () => {
  let component: ReservationDetailModal;
  let fixture: ComponentFixture<ReservationDetailModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservationDetailModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReservationDetailModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
