import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ProToolsService {
  private key = 'onTargetUserIsPro';

  constructor() {}

  isPro(): boolean {
    return localStorage.getItem(this.key) === 'true';
  }

  setPro(): void {
    localStorage.setItem(this.key, 'true');
  }
}
