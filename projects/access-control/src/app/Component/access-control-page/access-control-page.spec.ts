import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccessControlPage } from './access-control-page';

describe('AccessControlPage', () => {
  let component: AccessControlPage;
  let fixture: ComponentFixture<AccessControlPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccessControlPage],
    }).compileComponents();

    fixture = TestBed.createComponent(AccessControlPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
