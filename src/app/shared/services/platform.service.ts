import { Injectable } from '@angular/core';
import { Platform } from '@angular/cdk/platform';

@Injectable({
  providedIn: 'root'
})
export class PlatformService {

 readonly isAndroid: boolean;
  readonly isIOS: boolean;

  constructor(platform: Platform) {
    this.isAndroid = platform.ANDROID;
    this.isIOS = platform.IOS;
  }
}
