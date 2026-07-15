import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeviceEdit } from './device-edit';

describe('DeviceEdit', () => {
  let component: DeviceEdit;
  let fixture: ComponentFixture<DeviceEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeviceEdit],
    }).compileComponents();

    fixture = TestBed.createComponent(DeviceEdit);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
