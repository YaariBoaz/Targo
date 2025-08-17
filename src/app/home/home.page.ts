import { Component, ViewChild, ViewContainerRef } from '@angular/core';
import { NavigationService } from '../shared/services/navigation.service';
import { ScreenComponentMap, ScreenState } from '../shared/models/screen-state';
import { NavigationOutletComponent } from '../shared/services/navigation-outlet/navigation-outlet.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Capacitor } from '@capacitor/core';
import { AuthService } from '../shared/services/authentication/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [NavigationOutletComponent, CommonModule, FormsModule],
})
export class HomePage {
  @ViewChild('container', { read: ViewContainerRef, static: true })
  container!: ViewContainerRef;
  isApple =
    Capacitor.getPlatform() === 'ios' || Capacitor.getPlatform() === 'mac';

  constructor(
    public nav: NavigationService,
    private authService: AuthService
  ) {}

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.authService.isLoggedIn()) {
        this.nav.reset(ScreenComponentMap[ScreenState.Dashboard]);
      } else {
        this.nav.reset(ScreenComponentMap[ScreenState.Welcome]);
      }
    });
  }

  goBack() {
    this.nav.pop();
  }
}
