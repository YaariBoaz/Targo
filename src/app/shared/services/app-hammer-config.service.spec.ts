import { TestBed } from '@angular/core/testing';

import { AppHammerConfigService } from './app-hammer-config.service';

describe('AppHammerConfigService', () => {
  let service: AppHammerConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AppHammerConfigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
