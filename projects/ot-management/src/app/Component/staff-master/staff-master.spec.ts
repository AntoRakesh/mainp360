import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StaffMaster } from './staff-master';

describe('StaffMaster', () => {
  let component: StaffMaster;
  let fixture: ComponentFixture<StaffMaster>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaffMaster],
    }).compileComponents();

    fixture = TestBed.createComponent(StaffMaster);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
