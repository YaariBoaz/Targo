import { TestBed } from '@angular/core/testing';

import { ShootingService } from './shooting.service';

describe('ShootingService', () => {
  let service: ShootingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShootingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
