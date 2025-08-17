import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Color, NgxChartsModule, ScaleType } from '@swimlane/ngx-charts';
import { KpiComponent } from './kpi/kpi.component';
import { StatisticsService, OverviewStats } from 'src/app/shared/services/statistics.service';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-stats-overview',
  standalone: true,
  imports: [CommonModule, NgxChartsModule, KpiComponent],
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss'],
})
export class OverviewComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Real data from Firebase
  overviewStats: OverviewStats = {
    accuracy: 0,
    avgSplit: '0:00',
    avgGrouping: 0,
    hitRatio: 0,
    challengesComplete: 0,
    globalRank: 0,
    weeklyActivity: []
  };

  // Loading states
  isLoading = true;
  hasError = false;

  // Chart data
  chartData: { name: string; value: number }[] = [];
  barColor: Color = {
    name: 'activityRed',
    selectable: false,
    group: ScaleType.Ordinal,
    domain: ['#e53935'],
  };

  // Dynamic suggestions
  suggestions: { id: string; name: string; description: string }[] = [];

  constructor(
    private statisticsService: StatisticsService,
    private firebase: FirebaseService
  ) {}

  ngOnInit(): void {
    this.loadOverviewData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Loads all overview data from Firebase
   */
  private loadOverviewData(): void {
    const currentUser = this.firebase.auth.currentUser;
    if (!currentUser) {
      console.warn('No authenticated user found');
      this.hasError = true;
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.hasError = false;

    // Load overview statistics
    this.statisticsService.getOverviewStats(currentUser.uid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.overviewStats = stats;
          this.updateChartData();
          this.isLoading = false;
          console.log('Overview stats loaded:', stats);
        },
        error: (error) => {
          console.error('Error loading overview stats:', error);
          this.hasError = true;
          this.isLoading = false;
        }
      });

    // Load performance insights and suggestions
    this.statisticsService.getPerformanceInsights(currentUser.uid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (insights) => {
          this.suggestions = insights.recommendations;
          console.log('Performance insights loaded:', insights);
        },
        error: (error) => {
          console.error('Error loading performance insights:', error);
        }
      });
  }

  /**
   * Updates chart data from weekly activity
   */
  private updateChartData(): void {
    this.chartData = this.overviewStats.weeklyActivity.map((activity) => ({
      name: activity.day,
      value: activity.value,
    }));
  }

  /**
   * Handles challenge start action
   */
  startChallenge(id: string): void {
    // TODO: navigate to challenge/training flow
    console.log('Starting challenge/training:', id);
    // You can navigate to shooting component or specific challenge here
  }

  /**
   * Refreshes all data
   */
  refreshData(): void {
    this.loadOverviewData();
  }

  /**
   * Getter for the primary suggestion
   */
  get primarySuggestion(): { id: string; name: string; description: string } | null {
    return this.suggestions.length > 0 ? this.suggestions[0] : null;
  }
}
