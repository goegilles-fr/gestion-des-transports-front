import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehiculeEdit } from './vehicule-edit';

describe('VehiculeEdit', () => {
  let component: VehiculeEdit;
  let fixture: ComponentFixture<VehiculeEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehiculeEdit]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehiculeEdit);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
