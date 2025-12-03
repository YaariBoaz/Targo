import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { IonNav } from '@ionic/angular/standalone';
import { HomePage } from '../../features/home/pages/home/home.page';
import { StackNavigationService } from '../../core/services/stack-navigation.service';

/**
 * Home Tab Container
 *
 * This component wraps the IonNav for the Home tab.
 * It maintains its own navigation stack, so navigating away
 * and coming back preserves the state.
 */
@Component({
  selector: 'app-tabs-home',
  standalone: true,
  imports: [IonNav],
  template: `<ion-nav [root]="rootPage"></ion-nav>`,
})
export class TabsHomeComponent implements AfterViewInit {
  @ViewChild(IonNav) nav!: IonNav;
  rootPage = HomePage;

  constructor(private stackNav: StackNavigationService) {}

  ngAfterViewInit() {
    // Register this tab's nav controller
    this.stackNav.registerNav('home', this.nav);
  }
}
