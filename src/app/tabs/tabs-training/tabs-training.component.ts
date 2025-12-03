import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { IonNav } from '@ionic/angular/standalone';
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
export class TabsTrainingComponent implements AfterViewInit {
  @ViewChild(IonNav) nav!: IonNav;
  rootPage = TrainingPage;

  constructor(private stackNav: StackNavigationService) {}

  ngAfterViewInit() {
    this.stackNav.registerNav('training', this.nav);
  }
}
