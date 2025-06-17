import { Component, ViewChild, ViewContainerRef } from '@angular/core';
import { NavigationService } from '../shared/services/navigation.service';
import { ScreenComponentMap, ScreenState } from '../shared/models/screen-state';
import { NavigationOutletComponent } from '../shared/services/navigation-outlet/navigation-outlet.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [NavigationOutletComponent, CommonModule, FormsModule],
})
export class HomePage {
  @ViewChild('container', { read: ViewContainerRef, static: true })
  container!: ViewContainerRef;

  constructor(public nav: NavigationService) {}

  ngAfterViewInit() {
    setTimeout(() => {
      this.nav.reset(ScreenComponentMap[ScreenState.Dashboard]);
    });
  }

  goBack() {
    this.nav.pop();
  }
}
