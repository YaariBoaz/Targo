import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { IonNav } from '@ionic/angular/standalone';
import { StatisticsPage } from '../../features/statistics/pages/statistics/statistics.page';
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
export class TabsStatisticsComponent implements AfterViewInit {
  @ViewChild(IonNav) nav!: IonNav;
  rootPage = StatisticsPage;

  constructor(private stackNav: StackNavigationService) {}

  ngAfterViewInit() {
    this.stackNav.registerNav('statistics', this.nav);
  }
}
