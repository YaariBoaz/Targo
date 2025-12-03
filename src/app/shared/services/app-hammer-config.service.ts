import { Injectable } from '@angular/core';
import {
  HammerGestureConfig,
  HAMMER_GESTURE_CONFIG,
} from '@angular/platform-browser';
import * as Hammer from 'hammerjs';

@Injectable()
export class AppHammerConfig extends HammerGestureConfig {
  override overrides = {
    swipe: { direction: Hammer.DIRECTION_ALL, threshold: 10, velocity: 0.2 },
    pan: { direction: Hammer.DIRECTION_ALL },
  };
}
