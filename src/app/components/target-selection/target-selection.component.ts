import { ShootingComponent } from './../shooting/shooting.component';
import {
  ScreenComponentMap,
  ScreenState,
} from './../../shared/models/screen-state';
import { Component, OnInit } from '@angular/core';
import { TargetCardComponent } from './target-card/target-card.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavigationService } from 'src/app/shared/services/navigation.service';

@Component({
  selector: 'app-target-selection',
  templateUrl: './target-selection.component.html',
  styleUrls: ['./target-selection.component.scss'],
  imports: [TargetCardComponent, CommonModule, FormsModule],
})
export class TargetSelectionComponent implements OnInit {
  targets = [
    { name: 'Target Alpha', distance: 12 },
    { name: 'Range Bravo', distance: 30 },
    { name: 'Field Delta', distance: 85 },
  ];
  scanning = false;

  constructor(private nav: NavigationService) {}

  ngOnInit() {}

  onConnect() {
    this.nav.push(ScreenComponentMap[ScreenState.Shooting]);
  }

  scanForTargets() {
    this.scanning = true;

    // Simulate scanning delay (replace with real scan logic)
    setTimeout(() => {
      this.scanning = false;

      // Optionally add mock new targets or refresh list
      this.targets.push({
        name: 'New Tactical Range',
        distance: 123,
      });
    }, 3000);
  }
}
