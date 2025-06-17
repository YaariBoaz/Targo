import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ShootingService {

  currentShootingType: ShootingType = ShootingType.Training;
  constructor() { }


  set ShootingType(type: ShootingType) {
    this.currentShootingType = type;
  }
  get ShootingType() {
    return this.currentShootingType;
  }

}

export enum ShootingType {
  'Training',
  'Challenge'
}
