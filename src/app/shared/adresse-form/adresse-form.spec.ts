import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdresseForm } from './adresse-form';

describe('AdresseForm', () => {
  let component: AdresseForm;
  let fixture: ComponentFixture<AdresseForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdresseForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdresseForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
