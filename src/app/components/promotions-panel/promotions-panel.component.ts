import { C } from '@angular/cdk/focus-monitor.d-CvvJeQRc';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  ScreenComponentMap,
  ScreenState,
} from 'src/app/shared/models/screen-state';
import { NavigationService } from 'src/app/shared/services/navigation.service';

interface Promotion {
  bg: string; // background image path
  title: string;
  subtitle: string;
  cta: string;
  action: () => void;
}

@Component({
  selector: 'app-promotions-panel',
  templateUrl: './promotions-panel.component.html',
  styleUrls: ['./promotions-panel.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class PromotionsPanelComponent implements OnInit {
  active = 0;

  constructor(private nav: NavigationService) {}

  promotions: Promotion[] = [
    {
      bg: 'assets/promotions/p1.png',
      title: 'Challenge of the Day',
      subtitle: 'Hit 10 shots in under 10 s',
      cta: 'Start Challenge',
      action: () => console.log('Go to daily challenge'),
    },
    {
      bg: 'assets/promotions/p2.png',
      title: 'Daily Bullets Deal',
      subtitle: 'Buy 100 bullets and get 30 extra – today only!',
      cta: 'Buy Now',
      action: () => console.log('Open bullet store'),
    },
    {
      bg: 'assets/promotions/p3.png',
      title: 'New Tactical Pack',
      subtitle: 'Try our latest 5-drill series to level up faster',
      cta: 'Preview Pack',
      action: () => console.log('Preview drill pack'),
    },
  ];

  ngOnInit() {
    // auto-rotate every 5 s
    setInterval(() => {
      this.active = (this.active + 1) % this.promotions.length;
    }, 5000);
  }

  go(i: number) {
    this.active = i;
  }
}
