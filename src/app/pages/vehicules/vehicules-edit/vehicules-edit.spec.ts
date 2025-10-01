import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehiculesEdit } from './vehicules-edit';

describe('VehiculesEdit', () => {
  let component: VehiculesEdit;
  let fixture: ComponentFixture<VehiculesEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehiculesEdit]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehiculesEdit);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
