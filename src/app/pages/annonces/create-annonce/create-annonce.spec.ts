import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateAnnonce } from './create-annonce';

describe('CreateAnnonce', () => {
  let component: CreateAnnonce;
  let fixture: ComponentFixture<CreateAnnonce>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateAnnonce]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateAnnonce);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
