import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehiculesEntrepriseList } from './vehicules-entreprise-list';

describe('VehiculesEntrepriseList', () => {
  let component: VehiculesEntrepriseList;
  let fixture: ComponentFixture<VehiculesEntrepriseList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehiculesEntrepriseList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehiculesEntrepriseList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
