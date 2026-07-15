import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SafetyPermit } from './safety-permit';

describe('SafetyPermit', () => {
  let component: SafetyPermit;
  let fixture: ComponentFixture<SafetyPermit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SafetyPermit],
    }).compileComponents();

    fixture = TestBed.createComponent(SafetyPermit);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
