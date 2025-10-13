import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Mdp } from './mdp';

describe('Mdp', () => {
  let component: Mdp;
  let fixture: ComponentFixture<Mdp>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Mdp]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Mdp);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
