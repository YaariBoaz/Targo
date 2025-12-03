import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

export interface SpecialOffer {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  ctaText: string;
  bulletsAmount?: number;
  bonusBullets?: number;
}

@Component({
  selector: 'app-special-offers-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './special-offers-banner.component.html',
  styleUrls: ['./special-offers-banner.component.scss'],
})
export class SpecialOffersBannerComponent {
  private router = inject(Router);

  offers: SpecialOffer[] = [
    {
      id: '1',
      title: 'UNLOCK MORE!',
      description: 'Buy 100 bullets and\nget 30 extra today only!',
      imageUrl: '/assets/bg/advertisment/ad1.png',
      ctaText: 'GET OFFER',
      bulletsAmount: 100,
      bonusBullets: 30,
    },
    {
      id: '2',
      title: 'PREMIUM PACK!',
      description: 'Unlock unlimited bullets\nand premium features!',
      imageUrl: '/assets/bg/advertisment/ad1.png',
      ctaText: 'UPGRADE NOW',
    },
  ];

  currentOfferIndex = 0;

  get currentOffer(): SpecialOffer {
    return this.offers[this.currentOfferIndex];
  }

  selectOffer(index: number) {
    this.currentOfferIndex = index;
  }

  onOfferClick() {
    const offer = this.currentOffer;
    console.log('Offer clicked:', offer);

    // Navigate to the store page with query parameters for bullet offers
    if (offer.bulletsAmount) {
      this.router.navigate(['/store'], {
        queryParams: {
          bullets: offer.bulletsAmount,
          bonus: offer.bonusBullets || 0
        }
      });
    } else {
      // For subscription offers, just navigate to store
      this.router.navigate(['/store']);
    }
  }
}
