import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditAnnonceModal } from './edit-annonce-modal';

describe('EditAnnonceModal', () => {
  let component: EditAnnonceModal;
  let fixture: ComponentFixture<EditAnnonceModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditAnnonceModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditAnnonceModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
