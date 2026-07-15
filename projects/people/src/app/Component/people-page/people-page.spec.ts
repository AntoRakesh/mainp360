import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PeoplePage } from './people-page';

describe('PeoplePage', () => {
  let component: PeoplePage;
  let fixture: ComponentFixture<PeoplePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PeoplePage],
    }).compileComponents();

    fixture = TestBed.createComponent(PeoplePage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
