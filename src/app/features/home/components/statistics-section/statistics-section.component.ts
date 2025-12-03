import { Component, ViewChild, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { Auth } from '@angular/fire/auth';
import { StatisticsService } from '@core/services/statistics.service';

@Component({
  selector: 'app-statistics-section',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './statistics-section.component.html',
  styleUrls: ['./statistics-section.component.scss'],
})
export class StatisticsSectionComponent implements OnInit {
  private auth = inject(Auth);
  private statisticsService = inject(StatisticsService);
  private router = inject(Router);

  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  // Targo Score Data
  targoScore = 0;
  maxScore = 1000;
  accuracy = '0cm';
  speed = 0;
  consistency = 0;
  loading = true;

  // Weekly Shots Chart Data
  weeklyChartData: ChartConfiguration<'bar'>['data'] = {
    labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
    datasets: [
      {
        data: [0, 0, 0, 0, 0, 0, 0],
        backgroundColor: '#FF8C00',
        borderRadius: 4,
        barThickness: 20,
      },
    ],
  };

  weeklyChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#FF8C00',
        bodyColor: '#ffffff',
        padding: 8,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
          font: {
            size: 10,
          },
        },
        border: {
          display: false,
        },
      },
      y: {
        display: false,
        grid: {
          display: false,
        },
      },
    },
  };

  async ngOnInit() {
    await this.loadStatistics();
  }

  private async loadStatistics() {
    try {
      this.loading = true;
      const user = this.auth.currentUser;
      if (!user) {
        console.log('No user logged in');
        this.loading = false;
        return;
      }

      const stats = await this.statisticsService.getUserStatistics(user.uid);

      // Update statistics
      this.targoScore = stats.ratingPoints;
      this.accuracy = `${stats.accuracy.toFixed(1)}cm`;
      this.speed = stats.reactionTime;
      this.consistency = stats.sessionVariance;

      // Calculate weekly shots from session history
      this.calculateWeeklyShots(stats.sessionHistory);

      this.chart?.update();
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      this.loading = false;
    }
  }

  private calculateWeeklyShots(sessionHistory: any[]) {
    // Get last 7 days
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i));
      date.setHours(0, 0, 0, 0);
      return date;
    });

    // Count shots per day
    const shotsPerDay = last7Days.map((date) => {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      return sessionHistory
        .filter((session) => {
          const sessionDate = session.completedAt?.toDate
            ? session.completedAt.toDate()
            : new Date(session.completedAt);
          return sessionDate >= date && sessionDate < nextDay;
        })
        .reduce((total, session) => total + (session.shots?.length || 0), 0);
    });

    // Update chart data
    this.weeklyChartData.datasets[0].data = shotsPerDay;
  }

  onSeeMore() {
    this.router.navigate(['/tabs/statistics']);
  }
}
