import { TestBed } from '@angular/core/testing';
import { project } from './project';


describe('Project', () => {
  let service: project;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(project);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});