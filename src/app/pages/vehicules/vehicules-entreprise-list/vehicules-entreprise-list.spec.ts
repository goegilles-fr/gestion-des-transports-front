import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehiculeEntrepriseList } from './vehicules-entreprise-list';

describe('VehiculesEntrepriseList', () => {
  let component: VehiculeEntrepriseList;
  let fixture: ComponentFixture<VehiculeEntrepriseList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehiculeEntrepriseList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehiculeEntrepriseList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
