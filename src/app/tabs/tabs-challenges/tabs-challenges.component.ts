import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { IonNav } from '@ionic/angular/standalone';
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
export class TabsChallengesComponent implements AfterViewInit {
  @ViewChild(IonNav) nav!: IonNav;
  rootPage = ChallengesPage;

  constructor(private stackNav: StackNavigationService) {}

  ngAfterViewInit() {
    this.stackNav.registerNav('challenges', this.nav);
  }
}
