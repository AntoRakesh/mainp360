import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeviceCreate } from './device-create';

describe('DeviceCreate', () => {
  let component: DeviceCreate;
  let fixture: ComponentFixture<DeviceCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeviceCreate],
    }).compileComponents();

    fixture = TestBed.createComponent(DeviceCreate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
