import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientMaster } from './patient-master';

describe('PatientMaster', () => {
  let component: PatientMaster;
  let fixture: ComponentFixture<PatientMaster>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientMaster],
    }).compileComponents();

    fixture = TestBed.createComponent(PatientMaster);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
