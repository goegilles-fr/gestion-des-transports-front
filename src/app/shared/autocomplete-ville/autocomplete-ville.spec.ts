import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AutocompleteVille } from './autocomplete-ville';

describe('AutocompleteVille', () => {
  let component: AutocompleteVille;
  let fixture: ComponentFixture<AutocompleteVille>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AutocompleteVille]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AutocompleteVille);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
