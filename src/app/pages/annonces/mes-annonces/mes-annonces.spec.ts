import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MesAnnonces } from './mes-annonces';

describe('MesAnnonces', () => {
  let component: MesAnnonces;
  let fixture: ComponentFixture<MesAnnonces>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MesAnnonces]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MesAnnonces);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
