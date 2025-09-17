import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehiculesEntrepriseEdit } from './vehicules-entreprise-edit';

describe('VehiculesEntrepriseEdit', () => {
  let component: VehiculesEntrepriseEdit;
  let fixture: ComponentFixture<VehiculesEntrepriseEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehiculesEntrepriseEdit]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehiculesEntrepriseEdit);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
