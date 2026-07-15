import { TestBed } from '@angular/core/testing';

import { SafetyPermitService } from './safety-permit-service';

describe('SafetyPermitService', () => {
  let service: SafetyPermitService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SafetyPermitService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
