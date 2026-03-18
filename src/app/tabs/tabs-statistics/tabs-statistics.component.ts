import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { IonNav, ViewWillEnter } from '@ionic/angular/standalone';
import { HistoryPage } from '../../features/history/pages/history/history.page';
import { StackNavigationService } from '../../core/services/stack-navigation.service';

/**
 * Statistics Tab Container
 */
@Component({
  selector: 'app-tabs-statistics',
  standalone: true,
  imports: [IonNav],
  template: `<ion-nav [root]="rootPage"></ion-nav>`,
})
export class TabsStatisticsComponent implements AfterViewInit, ViewWillEnter {
  @ViewChild(IonNav) nav!: IonNav;
  rootPage = HistoryPage;

  constructor(private stackNav: StackNavigationService) {}

  ngAfterViewInit() {
    this.stackNav.registerNav('statistics', this.nav);
  }

  /**
   * Called when tab is about to enter
   * Triggers refresh on the active page in the nav stack
   */
  async ionViewWillEnter() {
    console.log('Statistics tab - View will enter, triggering refresh...');
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
