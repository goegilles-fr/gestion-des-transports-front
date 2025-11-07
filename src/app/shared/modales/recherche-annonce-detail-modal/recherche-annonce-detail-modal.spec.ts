import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RechercheAnnonceDetailModal } from './recherche-annonce-detail-modal';

describe('RechercheAnnonceDetailModal', () => {
  let component: RechercheAnnonceDetailModal;
  let fixture: ComponentFixture<RechercheAnnonceDetailModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RechercheAnnonceDetailModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RechercheAnnonceDetailModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
