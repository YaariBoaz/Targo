import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { UserHeaderComponent } from '@shared/components/user-header/user-header.component';
import { ChallengesSectionComponent } from '../../components/challenges-section/challenges-section.component';
import { SpecialOffersBannerComponent } from '@shared/components/special-offers-banner/special-offers-banner.component';
import { StatisticsSectionComponent } from '../../components/statistics-section/statistics-section.component';
import { TabRefreshService } from '@core/services/tab-refresh.service';
import { Subscription } from 'rxjs';
import { MultiplayerPanelComponent } from '@shared/components/multiplayer-panel/multiplayer-panel.component';
import { FEATURE_FLAGS } from '@core/feature-flags';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    UserHeaderComponent,
    ChallengesSectionComponent,
    SpecialOffersBannerComponent,
    StatisticsSectionComponent,
    MultiplayerPanelComponent,
  ],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {
  readonly flags = FEATURE_FLAGS;

  private tabRefreshService = inject(TabRefreshService);
  private tabSubscription?: Subscription;

  ngOnInit() {
    // Subscribe to tab changes
    this.tabSubscription = this.tabRefreshService.tabChange$.subscribe(
      (tabName) => {
        if (tabName === 'home') {
          console.log('Home page - Tab activated, refreshing data...');
          // Child components will refresh via their own subscriptions
        }
      }
    );
  }

  ngOnDestroy() {
    this.tabSubscription?.unsubscribe();
  }
}
