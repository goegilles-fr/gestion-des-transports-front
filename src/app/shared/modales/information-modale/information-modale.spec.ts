import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InformationModale } from './information-modale';

describe('InformationModale', () => {
  let component: InformationModale;
  let fixture: ComponentFixture<InformationModale>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InformationModale]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InformationModale);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
