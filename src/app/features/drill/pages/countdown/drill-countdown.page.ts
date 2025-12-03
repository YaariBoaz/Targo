import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-drill-countdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './drill-countdown.page.html',
  styleUrls: ['./drill-countdown.page.scss'],
})
export class DrillCountdownPage implements OnInit {
  private router = inject(Router);

  countdown: number = 3;

  ngOnInit() {
    this.startCountdown();
  }

  private startCountdown() {
    const interval = setInterval(() => {
      this.countdown--;

      if (this.countdown === 0) {
        clearInterval(interval);
        // Navigate to shooting screen after countdown
        setTimeout(() => {
          this.router.navigate(['/drill/shooting']);
        }, 1000);
      }
    }, 1000);
  }
}
