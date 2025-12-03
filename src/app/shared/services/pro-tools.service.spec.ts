import { TestBed } from '@angular/core/testing';

import { ProToolsService } from './pro-tools.service';

describe('ProToolsService', () => {
  let service: ProToolsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProToolsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
