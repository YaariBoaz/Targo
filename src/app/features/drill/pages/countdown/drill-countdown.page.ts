import { Component, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-drill-countdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './drill-countdown.page.html',
  styleUrls: ['./drill-countdown.page.scss'],
})
export class DrillCountdownPage implements OnDestroy {
  private router = inject(Router);

  countdown: number = 3;
  private countdownInterval: any;
  private navTimeout: any;

  // Use ionViewWillEnter so Ionic calls this even when reusing a cached page instance
  ionViewWillEnter() {
    this.clearTimers();
    this.countdown = 3;
    this.startCountdown();
  }

  ngOnDestroy() {
    this.clearTimers();
  }

  private clearTimers() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
    if (this.navTimeout) {
      clearTimeout(this.navTimeout);
      this.navTimeout = null;
    }
  }

  private startCountdown() {
    this.countdownInterval = setInterval(() => {
      this.countdown--;

      if (this.countdown === 0) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
        this.navTimeout = setTimeout(() => {
          this.router.navigate(['/drill/shooting']);
        }, 1000);
      }
    }, 1000);
  }
}
