import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { IonNav, ViewWillEnter } from '@ionic/angular/standalone';
import { TrainingPage } from '../../features/training/pages/training/training.page';
import { StackNavigationService } from '../../core/services/stack-navigation.service';

/**
 * Training Tab Container
 */
@Component({
  selector: 'app-tabs-training',
  standalone: true,
  imports: [IonNav],
  template: `<ion-nav [root]="rootPage"></ion-nav>`,
})
export class TabsTrainingComponent implements AfterViewInit, ViewWillEnter {
  @ViewChild(IonNav) nav!: IonNav;
  rootPage = TrainingPage;

  constructor(private stackNav: StackNavigationService) {}

  ngAfterViewInit() {
    this.stackNav.registerNav('training', this.nav);
  }

  /**
   * Called when tab is about to enter
   * Triggers refresh on the active page in the nav stack
   */
  async ionViewWillEnter() {
    console.log('Training tab - View will enter, triggering refresh...');
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
