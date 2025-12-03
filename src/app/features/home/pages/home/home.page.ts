import { Component } from '@angular/core';
import { UserHeaderComponent } from '@shared/components/user-header/user-header.component';
import { ChallengesSectionComponent } from '../../components/challenges-section/challenges-section.component';
import { SpecialOffersBannerComponent } from '@shared/components/special-offers-banner/special-offers-banner.component';
import { StatisticsSectionComponent } from '../../components/statistics-section/statistics-section.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    UserHeaderComponent,
    ChallengesSectionComponent,
    SpecialOffersBannerComponent,
    StatisticsSectionComponent,
  ],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage {
  constructor() {}
}
