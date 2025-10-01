import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehiculesDetail } from './vehicules-detail';

describe('VehiculesDetail', () => {
  let component: VehiculesDetail;
  let fixture: ComponentFixture<VehiculesDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehiculesDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehiculesDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
