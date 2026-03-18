import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { IonNav, ViewWillEnter } from '@ionic/angular/standalone';
import { ChallengesPage } from '../../features/challenges/pages/challenges/challenges.page';
import { StackNavigationService } from '../../core/services/stack-navigation.service';

/**
 * Challenges Tab Container
 */
@Component({
  selector: 'app-tabs-challenges',
  standalone: true,
  imports: [IonNav],
  template: `<ion-nav [root]="rootPage"></ion-nav>`,
})
export class TabsChallengesComponent implements AfterViewInit, ViewWillEnter {
  @ViewChild(IonNav) nav!: IonNav;
  rootPage = ChallengesPage;

  constructor(private stackNav: StackNavigationService) {}

  ngAfterViewInit() {
    this.stackNav.registerNav('challenges', this.nav);
  }

  /**
   * Called when tab is about to enter
   * Triggers refresh on the active page in the nav stack
   */
  async ionViewWillEnter() {
    console.log('Challenges tab - View will enter, triggering refresh...');
    // Get the active page and call its ionViewWillEnter if it exists
    setTimeout(async () => {
      const activeView = await this.nav?.getActive();
      if (activeView?.component) {
        const componentInstance = (activeView as any).instance;
        if (componentInstance && typeof componentInstance.ionViewWillEnter === 'function') {
          await componentInstance.ionViewWillEnter();
        }
      }
    }, 0);
  }
}
