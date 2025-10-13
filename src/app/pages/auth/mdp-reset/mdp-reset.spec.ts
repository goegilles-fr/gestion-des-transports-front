import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MdpReset } from './mdp-reset';

describe('MdpReset', () => {
  let component: MdpReset;
  let fixture: ComponentFixture<MdpReset>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MdpReset]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MdpReset);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
