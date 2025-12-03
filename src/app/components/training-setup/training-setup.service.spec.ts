import { TestBed } from '@angular/core/testing';

import { TrainingSetupService } from './training-setup.service';

describe('TrainingSetupService', () => {
  let service: TrainingSetupService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TrainingSetupService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
