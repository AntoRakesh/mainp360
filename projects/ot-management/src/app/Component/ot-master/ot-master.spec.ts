import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OtMaster } from './ot-master';

describe('OtMaster', () => {
  let component: OtMaster;
  let fixture: ComponentFixture<OtMaster>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OtMaster],
    }).compileComponents();

    fixture = TestBed.createComponent(OtMaster);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
