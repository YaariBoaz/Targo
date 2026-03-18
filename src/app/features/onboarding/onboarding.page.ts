import {
  Component,
  OnInit,
  ViewChild,
  inject,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonButton } from '@ionic/angular/standalone';
import { OnboardingService } from '@core/services/onboarding.service';

interface OnboardingSlide {
  title: string;
  description: string;
  image: string;
  icon?: string;
}

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, IonContent, IonButton],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './onboarding.page.html',
  styleUrls: ['./onboarding.page.scss'],
})
export class OnboardingPage implements OnInit {
  private onboardingService = inject(OnboardingService);
  private router = inject(Router);

  @ViewChild('swiper') swiperRef: any;

  currentSlideIndex = 0;
  isLastSlide = false;

  slides: OnboardingSlide[] = [
    {
      title: 'Welcome to Targo',
      description:
        'Your ultimate shooting training companion. Track your progress, compete in challenges, and become a better shooter.',
      image: '🎯',
      icon: 'target',
    },
    {
      title: 'Training Mode',
      description:
        'Practice with customizable drills. Choose your weapon, distance, and number of bullets. Track every shot and improve your accuracy.',
      image: '🏋️',
      icon: 'barbell',
    },
    {
      title: 'Connect Your Device',
      description:
        'Connect to your shooting target via Bluetooth for real-time shot tracking. Or use simulator mode for practice.',
      image: '📡',
      icon: 'bluetooth',
    },
    {
      title: 'Join Challenges',
      description:
        'Compete in tactical challenges, climb the global leaderboard, and earn stars by completing drill sequences.',
      image: '🏆',
      icon: 'trophy',
    },
    {
      title: 'Track Statistics',
      description:
        'Monitor your grouping, accuracy, reaction time, and more. Analyze your performance with detailed charts and insights.',
      image: '📊',
      icon: 'stats-chart',
    },
    {
      title: 'Earn & Spend Bullets',
      description:
        'Complete challenges to earn bullets. Use them to train and improve your skills. Visit the store to get more!',
      image: '💰',
      icon: 'cash',
    },
  ];

  ngOnInit() {
    console.log('Onboarding page initialized');
  }

  onSlideChange(event: any) {
    if (this.swiperRef?.nativeElement?.swiper) {
      this.currentSlideIndex = this.swiperRef.nativeElement.swiper.activeIndex;
      this.isLastSlide = this.currentSlideIndex === this.slides.length - 1;
    }
  }

  nextSlide() {
    if (this.swiperRef?.nativeElement?.swiper) {
      this.swiperRef.nativeElement.swiper.slideNext();
    }
  }

  previousSlide() {
    if (this.swiperRef?.nativeElement?.swiper) {
      this.swiperRef.nativeElement.swiper.slidePrev();
    }
  }

  async skip() {
    await this.completeOnboarding();
  }

  async getStarted() {
    await this.completeOnboarding();
  }

  private async completeOnboarding() {
    await this.onboardingService.markOnboardingComplete();
    this.router.navigate(['/tabs/home'], { replaceUrl: true });
  }
}
