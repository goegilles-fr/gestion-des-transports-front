import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MdpChange } from './mdp-change';

describe('MdpChange', () => {
  let component: MdpChange;
  let fixture: ComponentFixture<MdpChange>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MdpChange]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MdpChange);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
