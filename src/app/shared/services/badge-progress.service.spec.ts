import { TestBed } from '@angular/core/testing';

import { BadgeProgressService } from './badge-progress.service';

describe('BadgeProgressService', () => {
  let service: BadgeProgressService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BadgeProgressService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
