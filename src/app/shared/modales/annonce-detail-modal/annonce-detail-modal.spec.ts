import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnnonceDetailModal } from './annonce-detail-modal';

describe('AnnonceDetailModal', () => {
  let component: AnnonceDetailModal;
  let fixture: ComponentFixture<AnnonceDetailModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnnonceDetailModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnnonceDetailModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
