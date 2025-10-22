import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RechercheAnnonceComponent } from './recherche-annonce';

describe('RechercheAnnonce', () => {
  let component: RechercheAnnonceComponent;
  let fixture: ComponentFixture<RechercheAnnonceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RechercheAnnonceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RechercheAnnonceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
