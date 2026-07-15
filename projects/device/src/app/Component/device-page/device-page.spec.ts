import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DevicePage } from './device-page';

describe('DevicePage', () => {
  let component: DevicePage;
  let fixture: ComponentFixture<DevicePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DevicePage],
    }).compileComponents();

    fixture = TestBed.createComponent(DevicePage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
