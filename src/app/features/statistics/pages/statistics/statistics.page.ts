import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  inject,
  AfterViewInit,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonIcon, ModalController } from '@ionic/angular/standalone';
import { FirebaseService } from '@shared/services/firebase.service';
import { addIcons } from 'ionicons';
import { chevronDown, chevronUp, shareOutline } from 'ionicons/icons';
import {
  StatisticsService,
  UserStatistics,
} from '@core/services/statistics.service';
import { TabRefreshService } from '@core/services/tab-refresh.service';
import { HitRatioChartComponent } from '@shared/components/hit-ratio-chart/hit-ratio-chart.component';
import { ChartDetailModalComponent, ChartDetailData } from '../../components/chart-detail-modal/chart-detail-modal.component';
import { Subscription } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { FEATURE_FLAGS } from '@core/feature-flags';
import html2canvas from 'html2canvas';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { ChallengeService } from '@core/services/challenge.service';
import { ChallengeProgress } from '@models/challenge-progress.model';
import { Challenge } from '@models/challenge.model';

// Register Chart.js components
Chart.register(...registerables);

// Register Ionic icons
addIcons({ chevronDown, chevronUp, shareOutline });

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule, IonIcon, HitRatioChartComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './statistics.page.html',
  styleUrls: ['./statistics.page.scss'],
})
export class StatisticsPage implements OnInit, AfterViewInit, OnDestroy {
  readonly flags = FEATURE_FLAGS;

  private firebase = inject(FirebaseService);
  private statisticsService = inject(StatisticsService);
  private router = inject(Router);
  private tabRefreshService = inject(TabRefreshService);
  private modalController = inject(ModalController);
  private challengeService = inject(ChallengeService);
  private tabSubscription?: Subscription;

  // Challenge progress data
  userChallenges: Array<ChallengeProgress & { challengeTitle?: string }> = [];

  // Stats tab charts
  @ViewChild('accuracyChart') accuracyChartRef!: ElementRef<HTMLCanvasElement>;

  // Insights tab charts
  @ViewChild('adlScoreGauge') adlScoreGaugeRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('shotsLocationChart')
  shotsLocationChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('groupingMiniChart')
  groupingMiniChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('accuracyMiniChart')
  accuracyMiniChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('hitRatioAreaChart')
  hitRatioAreaChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('reactionTimeAreaChart')
  reactionTimeAreaChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('splitTimeAreaChart')
  splitTimeAreaChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('weakPointsRadar')
  weakPointsRadarRef!: ElementRef<HTMLCanvasElement>;

  activeTab: 'stats' | 'insights' | 'history' = 'history';
  stats: UserStatistics | null = null;
  loading = true;

  // History tab state
  historyFilter: 'training' | 'challenges' | 'league' = 'training';
  expandedSessionIndex: number | null = null;
  filteredSessions: any[] = [];

  // Stats tab chart instances
  private accuracyChart: Chart | null = null;

  // Insights tab chart instances
  private adlScoreGauge: Chart | null = null;
  private shotsLocationChart: Chart | null = null;
  private groupingMiniChart: Chart | null = null;
  private accuracyMiniChart: Chart | null = null;
  private hitRatioAreaChart: Chart | null = null;
  private reactionTimeAreaChart: Chart | null = null;
  private splitTimeAreaChart: Chart | null = null;
  private weakPointsRadar: Chart | null = null;

  private viewInitialized = false;

  async ngOnInit() {
    await this.loadStatistics();
    if (this.viewInitialized && this.stats) {
      setTimeout(() => this.initCharts(), 100);
    }

    // Subscribe to tab changes to reload statistics when statistics tab is activated
    this.tabSubscription = this.tabRefreshService.tabChange$.subscribe(
      async (tabName) => {
        if (tabName === 'statistics') {
          console.log(
            'Statistics page - Statistics tab activated, refreshing statistics...'
          );
          await this.loadStatistics();

          // Re-initialize charts based on active tab
          if (this.viewInitialized && this.stats) {
            setTimeout(() => {
              if (this.activeTab === 'stats') {
                this.initCharts();
              } else if (this.activeTab === 'insights') {
                this.initInsightsCharts();
              }
            }, 100);
          }
        }
      }
    );
  }

  ngAfterViewInit() {
    this.viewInitialized = true;
    if (this.stats && !this.loading) {
      setTimeout(() => this.initCharts(), 100);
    }
  }

  private initCharts() {
    this.createAccuracyChart();
  }

  ngOnDestroy() {
    // Unsubscribe from tab changes
    this.tabSubscription?.unsubscribe();

    // Destroy stats tab charts
    if (this.accuracyChart) {
      this.accuracyChart.destroy();
    }

    // Destroy insights tab charts
    if (this.adlScoreGauge) {
      this.adlScoreGauge.destroy();
    }
    if (this.shotsLocationChart) {
      this.shotsLocationChart.destroy();
    }
    if (this.groupingMiniChart) {
      this.groupingMiniChart.destroy();
    }
    if (this.accuracyMiniChart) {
      this.accuracyMiniChart.destroy();
    }
    if (this.hitRatioAreaChart) {
      this.hitRatioAreaChart.destroy();
    }
    if (this.reactionTimeAreaChart) {
      this.reactionTimeAreaChart.destroy();
    }
    if (this.splitTimeAreaChart) {
      this.splitTimeAreaChart.destroy();
    }
    if (this.weakPointsRadar) {
      this.weakPointsRadar.destroy();
    }
  }

  async loadStatistics() {
    await this.firebase.auth.authStateReady();
    const user = this.firebase.auth.currentUser;
    if (!user) {
      this.router.navigate(['/auth/welcome']);
      return;
    }

    try {
      this.loading = true;
      this.stats = await this.statisticsService.getUserStatistics(user.uid);
      // Initialize filtered sessions for history tab
      this.filterSessions();

      // Load user's challenge progress
      await this.loadChallengeProgress(user.uid);
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      this.loading = false;
    }
  }

  async loadChallengeProgress(userId: string) {
    try {
      const challenges = await this.challengeService.getUserActiveChallenges(userId);
      console.log('[Statistics] Found', challenges.length, 'active challenges');

      // Fetch challenge titles for each progress
      this.userChallenges = await Promise.all(
        challenges.map(async (progress) => {
          try {
            const challenge = await this.challengeService.getChallenge(progress.challengeId);
            const title = challenge?.title?.trim() || `Challenge ${progress.challengeId}`;
            console.log(`[Statistics] Challenge ${progress.challengeId}: "${title}" - ${progress.progress}%`);
            return {
              ...progress,
              challengeTitle: title,
            };
          } catch (error) {
            console.error(`[Statistics] Error fetching challenge ${progress.challengeId}:`, error);
            return {
              ...progress,
              challengeTitle: `Challenge ${progress.challengeId}`,
            };
          }
        })
      );

      console.log('[Statistics] User challenges loaded:', this.userChallenges);
    } catch (error) {
      console.error('[Statistics] Error loading challenge progress:', error);
      this.userChallenges = [];
    }
  }

  switchTab(tab: 'stats' | 'insights' | 'history') {
    this.activeTab = tab;

    // Initialize charts after tab switch (need timeout for DOM to update)
    if (tab === 'stats') {
      setTimeout(() => this.initCharts(), 100);
    } else if (tab === 'insights') {
      setTimeout(() => this.initInsightsCharts(), 100);
    }
  }

  private initInsightsCharts() {
    this.createAdlScoreGauge();
    this.createShotsLocationChart();
    this.createGroupingMiniChart();
    this.createAccuracyMiniChartInsights();
    this.createHitRatioAreaChart();
    this.createReactionTimeAreaChart();
    this.createSplitTimeAreaChart();
    this.createWeakPointsRadar();
  }

  private createAccuracyChart() {
    if (!this.accuracyChartRef || !this.stats) {
      return;
    }

    const canvas = this.accuracyChartRef.nativeElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    // Destroy existing chart
    if (this.accuracyChart) {
      this.accuracyChart.destroy();
    }

    // Get accuracy history data (last 7 points for smooth wave)
    let data = this.stats.accuracyHistory.slice(-7);

    // If no data or insufficient data, create a smooth wave pattern
    if (data.length < 7) {
      const currentAccuracy = this.stats.accuracy;
      // Create a wave pattern that looks like the design
      const wavePattern = [5, 4, 6, 3.5, 5.5, 3, currentAccuracy];
      data = wavePattern.map((value, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
        value: value,
      }));
    }

    const labels = data.map(() => ''); // Empty labels
    const values = data.map((d) => d.value);

    // Create point radius array - only show point on the last data point
    const pointRadiusArray = values.map((_, i) =>
      i === values.length - 1 ? 6 : 0
    );
    const pointBackgroundColorArray = values.map((_, i) =>
      i === values.length - 1 ? '#10b981' : 'transparent'
    );

    try {
      this.accuracyChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              data: values,
              borderColor: '#10b981',
              backgroundColor: 'transparent',
              fill: false,
              tension: 0.4, // Smooth curves
              pointRadius: pointRadiusArray,
              pointBackgroundColor: pointBackgroundColorArray,
              pointBorderColor: '#10b981',
              pointBorderWidth: 2,
              borderWidth: 2.5,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
          },
          scales: {
            x: {
              display: true,
              grid: { display: false },
              border: { display: false },
              ticks: { display: false },
            },
            y: {
              display: true,
              grid: {
                display: true,
                color: 'rgba(255, 255, 255, 0.1)',
                lineWidth: 1,
              },
              border: { display: false },
              ticks: {
                display: true,
                color: 'rgba(255, 255, 255, 0.5)',
                font: { size: 10 },
                stepSize: 5,
                callback: function (value) {
                  return value;
                },
              },
              min: 0,
              max: 10,
            },
          },
          layout: {
            padding: {
              right: 10,
            },
          },
        },
      });
    } catch (error) {
      console.error('[AccuracyChart] Error creating chart:', error);
    }
  }

  // =====================
  // INSIGHTS TAB CHARTS
  // =====================

  private createAdlScoreGauge() {
    if (!this.adlScoreGaugeRef || !this.stats) return;

    const canvas = this.adlScoreGaugeRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.adlScoreGauge) {
      this.adlScoreGauge.destroy();
    }

    // Calculate score percentage (assuming max score of 1000)
    const maxScore = 1000;
    const scorePercentage = Math.min(
      (this.stats.ratingPoints / maxScore) * 100,
      100
    );

    // Speedometer-style gauge with colored zones
    this.adlScoreGauge = new Chart(ctx, {
      type: 'doughnut',
      data: {
        datasets: [
          {
            data: [20, 20, 20, 20, 20], // 5 equal zones
            backgroundColor: [
              '#ef4444',
              '#f97316',
              '#f6ba16',
              '#84cc16',
              '#10b981',
            ],
            borderWidth: 0,
            spacing: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '80%',
        rotation: -135, // Start from bottom-left
        circumference: 270, // 270 degrees arc (3/4 circle)
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
      },
      plugins: [
        {
          id: 'gaugeNeedle',
          afterDraw: (chart: any) => {
            const { ctx, chartArea, config } = chart;
            if (!chartArea) return;

            // Position the pivot point at the bottom center of the chart area
            const centerX = (chartArea.left + chartArea.right) / 2;
            const centerY = chartArea.bottom - 10; // 10 pixels up from bottom

            // Calculate the radius based on the chart dimensions
            const width = chartArea.right - chartArea.left;
            const height = chartArea.bottom - chartArea.top;
            const radius = Math.min(width, height * 1.5) / 2;

            // Calculate needle angle based on score
            // rotation: -135 means the arc starts at -135° (bottom-left)
            // and sweeps 270° clockwise to 135° (bottom-right)
            // In canvas: 0° = right (3 o'clock), 90° = down (6 o'clock),
            // -90° or 270° = up (12 o'clock), 180° or -180° = left (9 o'clock)
            // We want: 0% score = -135° (bottom-left), 100% score = 135° (bottom-right)
            const startAngle = -135; // Bottom-left in degrees
            const sweepAngle = 270; // Arc sweep
            const needleAngleDeg = startAngle + (scorePercentage / 100) * sweepAngle;
            const needleAngle = (needleAngleDeg * Math.PI) / 180;

            // Draw needle - extend upward from bottom pivot point
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(
              centerX + Math.cos(needleAngle) * radius * 0.75,
              centerY + Math.sin(needleAngle) * radius * 0.75
            );
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.stroke();

            // Draw center circle at bottom pivot point
            ctx.beginPath();
            ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.restore();
          },
        },
      ],
    });
  }

  private createShotsLocationChart() {
    if (!this.shotsLocationChartRef || !this.stats) return;

    const canvas = this.shotsLocationChartRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.shotsLocationChart) {
      this.shotsLocationChart.destroy();
    }

    // Target dimensions (assuming 400x400 pixel target with center at 200,200)
    const targetSize = 400;
    const targetCenter = targetSize / 2;

    // Get all shots from session history and normalize coordinates
    // Shot x,y are in pixels relative to target, we need to convert to centered coordinates
    const allShots: { x: number; y: number; distance: number }[] = [];

    this.stats.sessionHistory.forEach((session) => {
      if (session.shots && session.shots.length > 0) {
        session.shots.forEach((shot) => {
          if (shot.x !== undefined && shot.y !== undefined) {
            // Convert from pixel coordinates to normalized coordinates (-1 to 1)
            // Shot coordinates are in pixels, with (0,0) at top-left
            // We need to center them and normalize
            const normalizedX = (shot.x - targetCenter) / targetCenter;
            const normalizedY = -(shot.y - targetCenter) / targetCenter; // Flip Y for chart (positive = up)

            // Use distanceFromCenter if available, otherwise calculate from normalized coords
            const distance =
              shot.distanceFromCenter ||
              Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY) *
                10;

            allShots.push({ x: normalizedX, y: normalizedY, distance });
          }
        });
      }
    });

    // Categorize shots by distance from center (in cm)
    const excellentShots = allShots
      .filter((s) => s.distance <= 2)
      .map((s) => ({ x: s.x, y: s.y }));
    const goodShots = allShots
      .filter((s) => s.distance > 2 && s.distance <= 5)
      .map((s) => ({ x: s.x, y: s.y }));
    const fairShots = allShots
      .filter((s) => s.distance > 5 && s.distance <= 10)
      .map((s) => ({ x: s.x, y: s.y }));
    const poorShots = allShots
      .filter((s) => s.distance > 10)
      .map((s) => ({ x: s.x, y: s.y }));

    // If no real data, generate sample data clustered around center
    const generateShots = (count: number, maxRadius: number) => {
      return Array.from({ length: count }, () => {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * maxRadius;
        return {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
        };
      });
    };

    const hasData = allShots.length > 0;

    // Use sample data if no real data available - clustered by quality
    const excellentData =
      hasData && excellentShots.length > 0
        ? excellentShots
        : generateShots(8, 0.15);
    const goodData =
      hasData && goodShots.length > 0 ? goodShots : generateShots(6, 0.35);
    const fairData =
      hasData && fairShots.length > 0 ? fairShots : generateShots(4, 0.6);
    const poorData =
      hasData && poorShots.length > 0 ? poorShots : generateShots(2, 0.9);

    this.shotsLocationChart = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: 'Excellent',
            data: excellentData,
            backgroundColor: '#10b981',
            pointRadius: 4,
          },
          {
            label: 'Good',
            data: goodData,
            backgroundColor: '#3B82F6',
            pointRadius: 4,
          },
          {
            label: 'Fair',
            data: fairData,
            backgroundColor: '#f6ba16',
            pointRadius: 4,
          },
          {
            label: 'Poor',
            data: poorData,
            backgroundColor: '#ef4444',
            pointRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
        scales: {
          x: {
            display: false,
            min: -1,
            max: 1,
          },
          y: {
            display: false,
            min: -1,
            max: 1,
          },
        },
      },
    });
  }

  private createGroupingMiniChart() {
    if (!this.groupingMiniChartRef || !this.stats) return;

    const canvas = this.groupingMiniChartRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.groupingMiniChart) {
      this.groupingMiniChart.destroy();
    }

    const values = [4, 3, 5, 2.5, 4.5, 3, this.stats.groupingTightness];

    this.groupingMiniChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: values.map(() => ''),
        datasets: [
          {
            data: values,
            borderColor: '#f97316',
            backgroundColor: 'transparent',
            fill: false,
            tension: 0.4,
            pointRadius: values.map((_, i) =>
              i === values.length - 1 ? 4 : 0
            ),
            pointBackgroundColor: '#f97316',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
        scales: {
          x: { display: false },
          y: { display: false, min: 0, max: 10 },
        },
      },
    });
  }

  private createAccuracyMiniChartInsights() {
    if (!this.accuracyMiniChartRef || !this.stats) return;

    const canvas = this.accuracyMiniChartRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.accuracyMiniChart) {
      this.accuracyMiniChart.destroy();
    }

    const values = [5, 4, 6, 3.5, 5.5, 3, this.stats.accuracy];

    this.accuracyMiniChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: values.map(() => ''),
        datasets: [
          {
            data: values,
            borderColor: '#14b8a6',
            backgroundColor: 'transparent',
            fill: false,
            tension: 0.4,
            pointRadius: values.map((_, i) =>
              i === values.length - 1 ? 4 : 0
            ),
            pointBackgroundColor: '#14b8a6',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
        scales: {
          x: { display: false },
          y: { display: false, min: 0, max: 10 },
        },
      },
    });
  }

  private createHitRatioAreaChart() {
    if (!this.hitRatioAreaChartRef || !this.stats) return;

    const canvas = this.hitRatioAreaChartRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.hitRatioAreaChart) {
      this.hitRatioAreaChart.destroy();
    }

    // Get hit ratio data from session history (last 7 sessions)
    const sessions = this.stats.sessionHistory.slice(0, 7).reverse();
    let labels: string[];
    let values: number[];

    if (sessions.length > 0) {
      labels = sessions.map((_, i) => `S${i + 1}`);
      values = sessions.map((session) => {
        const expectedBullets = session.drillSetup?.numberOfBullets || 0;
        const shotsRecorded = session.shots?.length || 0;
        return expectedBullets > 0
          ? (shotsRecorded / expectedBullets) * 100
          : 0;
      });
    } else {
      labels = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7'];
      values = [70, 75, 72, 80, 78, 82, this.stats.hitRatio];
    }

    // Calculate dynamic y-axis range
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const padding = (maxVal - minVal) * 0.2 || 10;

    this.hitRatioAreaChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            data: values,
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.3)',
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointBackgroundColor: '#3B82F6',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
        scales: {
          x: {
            display: true,
            grid: { display: false },
            ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 10 } },
          },
          y: {
            display: true,
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 10 } },
            min: Math.max(0, minVal - padding),
            max: Math.min(100, maxVal + padding),
          },
        },
      },
    });
  }

  private createReactionTimeAreaChart() {
    if (!this.reactionTimeAreaChartRef || !this.stats) return;

    const canvas = this.reactionTimeAreaChartRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.reactionTimeAreaChart) {
      this.reactionTimeAreaChart.destroy();
    }

    // Get reaction time data from session history (last 7 sessions)
    // Note: Using avgSplitTime as a proxy for reaction time since it's the first shot time
    const sessions = this.stats.sessionHistory.slice(0, 7).reverse();
    let labels: string[];
    let values: number[];

    if (sessions.length > 0) {
      labels = sessions.map((_, i) => `S${i + 1}`);
      values = sessions.map((session) => session.statistics.avgSplitTime || 0);
    } else {
      labels = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7'];
      values = [2.5, 2.3, 2.6, 2.2, 2.4, 2.1, this.stats.reactionTime];
    }

    // Calculate dynamic y-axis range
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const padding = (maxVal - minVal) * 0.2 || 0.5;

    this.reactionTimeAreaChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            data: values,
            borderColor: '#84cc16',
            backgroundColor: 'rgba(132, 204, 22, 0.3)',
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointBackgroundColor: '#84cc16',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
        scales: {
          x: {
            display: true,
            grid: { display: false },
            ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 10 } },
          },
          y: {
            display: true,
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 10 } },
            min: Math.max(0, minVal - padding),
            max: maxVal + padding,
          },
        },
      },
    });
  }

  private createSplitTimeAreaChart() {
    if (!this.splitTimeAreaChartRef || !this.stats) return;

    const canvas = this.splitTimeAreaChartRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.splitTimeAreaChart) {
      this.splitTimeAreaChart.destroy();
    }

    // Get split time data from session history (last 7 sessions)
    const sessions = this.stats.sessionHistory.slice(0, 7).reverse();
    let labels: string[];
    let values: number[];

    if (sessions.length > 0) {
      labels = sessions.map((_, i) => `S${i + 1}`);
      values = sessions.map((session) => session.statistics.avgSplitTime || 0);
    } else {
      labels = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7'];
      values = [5.5, 5.8, 5.2, 6.0, 5.7, 6.2, this.stats.splitTimes];
    }

    // Calculate dynamic y-axis range
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const padding = (maxVal - minVal) * 0.2 || 1;

    this.splitTimeAreaChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            data: values,
            borderColor: '#14b8a6',
            backgroundColor: 'rgba(20, 184, 166, 0.3)',
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointBackgroundColor: '#14b8a6',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
        scales: {
          x: {
            display: true,
            grid: { display: false },
            ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 10 } },
          },
          y: {
            display: true,
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 10 } },
            min: Math.max(0, minVal - padding),
            max: maxVal + padding,
          },
        },
      },
    });
  }

  private createWeakPointsRadar() {
    if (!this.weakPointsRadarRef || !this.stats) return;

    const canvas = this.weakPointsRadarRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.weakPointsRadar) {
      this.weakPointsRadar.destroy();
    }

    // Weak points labels - positioned around the wheel
    const labels = [
      'Breaking\nWrist Up',
      'Heeling:\nAnticipating\nRecoil',
      'Thumbing',
      'Tightening Grip\nWhile Pulling \n the Trigger',
      'Breaking\nWrist Down\nDropping\nthe Head',
      'Jerking',
      'Finger Not On\nTrigger Correctly',
      'Pushing:\nAnticipating\nRecoil',
    ];

    // Values for each weak point (higher = worse)
    const values = [3, 4, 8, 6, 2, 1, 3, 4];
    const maxIndex = values.indexOf(Math.max(...values)); // Index of worst weak point (Thumbing = 2)

    // All slices equal size, highlight the detected weak point with green border
    const sliceData = labels.map(() => 1); // Equal slices

    // All slices same dark background
    const backgroundColors = labels.map(() => '#2a2a2a');

    // Green border for detected weak point, dark gray for others
    const borderColors = labels.map((_, i) =>
      i === maxIndex ? '#00FF6A' : '#3a3a3a'
    );

    // Thicker border for detected weak point
    const borderWidths = labels.map((_, i) => (i === maxIndex ? 4 : 2));

    this.weakPointsRadar = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels.map((l) => l.replace(/\n/g, ' ')), // Flatten for tooltips
        datasets: [
          {
            data: sliceData,
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: borderWidths,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        rotation: -112.5, // Rotate to position slices correctly (start from top)
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
      },
      plugins: [
        {
          id: 'weakPointsLabels',
          afterDraw: (chart: any) => {
            const { ctx, chartArea } = chart;
            if (!chartArea) return;

            const centerX = (chartArea.left + chartArea.right) / 2;
            const centerY = (chartArea.top + chartArea.bottom) / 2;
            const radius =
              Math.min(
                chartArea.right - chartArea.left,
                chartArea.bottom - chartArea.top
              ) / 2;

            ctx.save();

            labels.forEach((label, i) => {
              // Calculate angle for this slice (center of slice)
              const sliceAngle = (2 * Math.PI) / labels.length;
              const angle =
                -Math.PI / 2 - (112.5 * Math.PI) / 180 + (i + 0.5) * sliceAngle;

              // Draw label inside the slice at 60% of radius
              const labelRadius = radius * 0.7;
              const labelX = centerX + Math.cos(angle) * labelRadius;
              const labelY = centerY + Math.sin(angle) * labelRadius;

              ctx.font = '600 9px Lexend, system-ui, sans-serif';
              ctx.fillStyle =
                i === maxIndex ? '#00FF6A' : 'rgba(255, 255, 255, 0.8)';
              ctx.textAlign = 'center';
              // ctx.textBaseline = 'middle';

              // Split label by newlines and draw each line
              const lines = label.split('\n');
              const lineHeight = 12;
              const startY = labelY - ((lines.length - 1) * lineHeight) / 2;

              lines.forEach((line, lineIndex) => {
                ctx.fillText(line, labelX, startY + lineIndex * lineHeight);
              });
            });

            ctx.restore();
          },
        },
      ],
    });
  }

  startShooting() {
    this.router.navigate(['/tabs/training']);
  }

  formatChange(value: number, unit: string = ''): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}${unit}`;
  }

  getChangeClass(value: number, reverse: boolean = false): string {
    const isPositive = reverse ? value < 0 : value > 0;
    return isPositive ? 'positive' : 'negative';
  }

  abs(value: number): number {
    return Math.abs(value);
  }

  // Expose Math to template
  Math = Math;

  // Get top 3 challenges with highest progress
  get top3Challenges() {
    return this.userChallenges
      .slice()
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 3);
  }

  // History tab methods
  setHistoryFilter(filter: 'training' | 'challenges' | 'league') {
    this.historyFilter = filter;
    this.expandedSessionIndex = null; // Collapse all when filter changes
    this.filterSessions();
  }

  filterSessions() {
    if (!this.stats) return;

    // Show all sessions for now since most don't have a source field yet
    if (this.historyFilter === 'training') {
      // Show all sessions that are training or have no source (backwards compatibility)
      this.filteredSessions = this.stats.sessionHistory.filter(
        (session) => session.source === 'training' || !session.source
      );
    } else if (this.historyFilter === 'challenges') {
      // Only show sessions explicitly marked as challenges
      this.filteredSessions = this.stats.sessionHistory.filter(
        (session) => session.source === 'challenge'
      );
    } else if (this.historyFilter === 'league') {
      // League sessions would have a specific flag
      this.filteredSessions = [];
    } else {
      // Default: show all
      this.filteredSessions = this.stats.sessionHistory;
    }

    console.log(
      'Filtered sessions:',
      this.filteredSessions.length,
      'Filter:',
      this.historyFilter
    );
  }

  toggleSession(index: number) {
    if (this.expandedSessionIndex === index) {
      this.expandedSessionIndex = null;
    } else {
      this.expandedSessionIndex = index;
    }
  }

  formatDate(date: any): string {
    const d = date?.toDate ? date.toDate() : new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  }

  getCompletionRate(session: any): string {
    const total = session.drillSetup?.numberOfBullets || 0;
    const hits = session.shots?.length || 0;
    return total > 0 ? ((hits / total) * 100).toFixed(1) : '0.0';
  }

  /**
   * Calculate shot X position as percentage (0-100%)
   * Shot coordinates are in pixels relative to a 400x400 target
   */
  getShotPositionX(shot: any): number {
    const targetSize = 400;
    // shot.x is already in pixels (0-400), convert to percentage
    return (shot.x / targetSize) * 100;
  }

  /**
   * Calculate shot Y position as percentage (0-100%)
   * Shot coordinates are in pixels relative to a 400x400 target
   */
  getShotPositionY(shot: any): number {
    const targetSize = 400;
    // shot.y is already in pixels (0-400), convert to percentage
    return (shot.y / targetSize) * 100;
  }

  /**
   * Share session card as image
   */
  async shareSession(session: any, sessionIndex: number) {
    try {
      // Find the expanded session card (session-details div)
      const sessionCards = document.querySelectorAll(
        '.session-card.expanded .session-details'
      );
      const sessionCard = sessionCards[0] as HTMLElement;

      if (!sessionCard) {
        console.error(
          'Session card not found. Make sure the card is expanded.'
        );
        return;
      }

      // Capture the entire session card as a canvas
      const canvas = await html2canvas(sessionCard, {
        backgroundColor: '#202020',
        scale: 2, // Higher quality
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      // Convert canvas to base64
      const base64Data = canvas.toDataURL('image/png');

      // Remove the data URL prefix to get just the base64 string
      const base64String = base64Data.split(',')[1];

      // Generate a unique filename
      const fileName = `shooting-session-${Date.now()}.png`;

      try {
        // Save the file to the cache directory
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: base64String,
          directory: Directory.Cache,
        });

        console.log('File saved:', savedFile.uri);

        // Share the file
        await Share.share({
          title: 'My Shooting Session',
          text: `Check out my shooting session! ${session.shots.length}/${session.drillSetup.numberOfBullets} hits at ${session.drillSetup.distance}m`,
          url: savedFile.uri,
          dialogTitle: 'Share your session',
        });

        // Clean up: delete the file after sharing
        setTimeout(async () => {
          try {
            await Filesystem.deleteFile({
              path: fileName,
              directory: Directory.Cache,
            });
            console.log('Temporary file deleted');
          } catch (deleteError) {
            console.log('Could not delete temporary file:', deleteError);
          }
        }, 5000); // Wait 5 seconds before deleting
      } catch (fsError) {
        console.error('Filesystem error:', fsError);

        // Fallback: Download the image for web/desktop
        const link = document.createElement('a');
        link.download = fileName;
        link.href = base64Data;
        link.click();
        console.log('Image downloaded as fallback');
      }
    } catch (error) {
      console.error('Error sharing session:', error);
    }
  }

  /**
   * Open chart detail modal for grouping
   */
  async openGroupingDetail() {
    console.log('openGroupingDetail called');
    if (!this.stats) return;

    const values = [4, 3, 5, 2.5, 4.5, 3, this.stats.groupingTightness];

    const chartData = {
      type: 'line',
      data: {
        labels: values.map(() => ''),
        datasets: [
          {
            data: values,
            borderColor: '#f97316',
            backgroundColor: 'rgba(249, 115, 22, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 6,
            pointBackgroundColor: '#f97316',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            borderWidth: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true },
        },
        scales: {
          x: { display: false },
          y: {
            display: true,
            min: 0,
            max: 10,
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: { color: 'rgba(255, 255, 255, 0.6)' },
          },
        },
      },
    };

    try {
      console.log('Creating modal...');
      const modal = await this.modalController.create({
        component: ChartDetailModalComponent,
        componentProps: {
          data: {
            type: 'grouping',
            title: 'Grouping Tightness',
            currentValue: this.stats.groupingTightness,
            unit: 'cm',
            chartData: chartData,
          } as ChartDetailData,
        },
      });

      console.log('Modal created, presenting...');
      await modal.present();
      console.log('Modal presented');
    } catch (error) {
      console.error('Error opening modal:', error);
    }
  }

  /**
   * Open chart detail modal for accuracy
   */
  async openAccuracyDetail() {
    if (!this.stats) return;

    const values = [5, 4, 6, 3.5, 5.5, 3, this.stats.accuracy];

    const chartData = {
      type: 'line',
      data: {
        labels: values.map(() => ''),
        datasets: [
          {
            data: values,
            borderColor: '#14b8a6',
            backgroundColor: 'rgba(20, 184, 166, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 6,
            pointBackgroundColor: '#14b8a6',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            borderWidth: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true },
        },
        scales: {
          x: { display: false },
          y: {
            display: true,
            min: 0,
            max: 10,
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: { color: 'rgba(255, 255, 255, 0.6)' },
          },
        },
      },
    };

    const modal = await this.modalController.create({
      component: ChartDetailModalComponent,
      componentProps: {
        data: {
          type: 'accuracy',
          title: 'Accuracy',
          currentValue: this.stats.accuracy,
          unit: 'cm',
          chartData: chartData,
        } as ChartDetailData,
      },
    });

    await modal.present();
  }

  /**
   * Open chart detail modal for hit ratio
   */
  async openHitRatioDetail() {
    if (!this.stats) return;

    const sessions = this.stats.sessionHistory.slice(0, 7).reverse();
    let labels: string[];
    let values: number[];

    if (sessions.length > 0) {
      labels = sessions.map((_, i) => `Session ${i + 1}`);
      values = sessions.map((session) => {
        const expectedBullets = session.drillSetup?.numberOfBullets || 0;
        const shotsRecorded = session.shots?.length || 0;
        return expectedBullets > 0
          ? (shotsRecorded / expectedBullets) * 100
          : 0;
      });
    } else {
      labels = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7'];
      values = [70, 75, 72, 80, 78, 82, this.stats.hitRatio];
    }

    const chartData = {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            data: values,
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.3)',
            fill: true,
            tension: 0.4,
            pointRadius: 6,
            pointBackgroundColor: '#3B82F6',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            borderWidth: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true },
        },
        scales: {
          x: {
            display: true,
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: { color: 'rgba(255, 255, 255, 0.6)' },
          },
          y: {
            display: true,
            min: 0,
            max: 100,
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: { color: 'rgba(255, 255, 255, 0.6)' },
          },
        },
      },
    };

    const modal = await this.modalController.create({
      component: ChartDetailModalComponent,
      componentProps: {
        data: {
          type: 'hitRatio',
          title: 'Hit Ratio',
          currentValue: this.stats.hitRatio,
          unit: '%',
          chartData: chartData,
        } as ChartDetailData,
      },
    });

    await modal.present();
  }

  /**
   * Open chart detail modal for reaction time
   */
  async openReactionTimeDetail() {
    if (!this.stats) return;

    const sessions = this.stats.sessionHistory.slice(0, 7).reverse();
    let labels: string[];
    let values: number[];

    if (sessions.length > 0) {
      labels = sessions.map((_, i) => `Session ${i + 1}`);
      values = sessions.map((session) => session.statistics.avgSplitTime || 0);
    } else {
      labels = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7'];
      values = [2.5, 2.3, 2.6, 2.2, 2.4, 2.1, this.stats.reactionTime];
    }

    const chartData = {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            data: values,
            borderColor: '#84cc16',
            backgroundColor: 'rgba(132, 204, 22, 0.3)',
            fill: true,
            tension: 0.4,
            pointRadius: 6,
            pointBackgroundColor: '#84cc16',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            borderWidth: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true },
        },
        scales: {
          x: {
            display: true,
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: { color: 'rgba(255, 255, 255, 0.6)' },
          },
          y: {
            display: true,
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: { color: 'rgba(255, 255, 255, 0.6)' },
          },
        },
      },
    };

    const modal = await this.modalController.create({
      component: ChartDetailModalComponent,
      componentProps: {
        data: {
          type: 'reactionTime',
          title: 'Reaction Time',
          currentValue: this.stats.reactionTime,
          unit: 's',
          chartData: chartData,
        } as ChartDetailData,
      },
    });

    await modal.present();
  }

  /**
   * Open chart detail modal for split time
   */
  async openSplitTimeDetail() {
    if (!this.stats) return;

    const sessions = this.stats.sessionHistory.slice(0, 7).reverse();
    let labels: string[];
    let values: number[];

    if (sessions.length > 0) {
      labels = sessions.map((_, i) => `Session ${i + 1}`);
      values = sessions.map((session) => session.statistics.avgSplitTime || 0);
    } else {
      labels = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7'];
      values = [5.5, 5.8, 5.2, 6.0, 5.7, 6.2, this.stats.splitTimes];
    }

    const chartData = {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            data: values,
            borderColor: '#14b8a6',
            backgroundColor: 'rgba(20, 184, 166, 0.3)',
            fill: true,
            tension: 0.4,
            pointRadius: 6,
            pointBackgroundColor: '#14b8a6',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            borderWidth: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true },
        },
        scales: {
          x: {
            display: true,
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: { color: 'rgba(255, 255, 255, 0.6)' },
          },
          y: {
            display: true,
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: { color: 'rgba(255, 255, 255, 0.6)' },
          },
        },
      },
    };

    const modal = await this.modalController.create({
      component: ChartDetailModalComponent,
      componentProps: {
        data: {
          type: 'splitTime',
          title: 'Split Time',
          currentValue: this.stats.splitTimes,
          unit: 's',
          chartData: chartData,
        } as ChartDetailData,
      },
    });

    await modal.present();
  }

  /**
   * Open ADL Score detail modal
   */
  async openAdlScoreDetail() {
    if (!this.stats) return;

    console.log('ADL Score clicked - opening modal');

    // Calculate score percentage (assuming max score of 1000)
    const maxScore = 1000;
    const scorePercentage = Math.min((this.stats.ratingPoints / maxScore) * 100, 100);

    // Create the same speedometer-style gauge as shown in the card
    const chartData = {
      type: 'doughnut',
      data: {
        datasets: [
          {
            data: [20, 20, 20, 20, 20], // 5 equal zones
            backgroundColor: ['#ef4444', '#f97316', '#f6ba16', '#84cc16', '#10b981'],
            borderWidth: 0,
            spacing: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '80%',
        rotation: -135, // Start from bottom-left
        circumference: 270, // 270 degrees arc (3/4 circle)
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
      },
      plugins: [
        {
          id: 'gaugeNeedle',
          afterDraw: (chart: any) => {
            const { ctx, chartArea } = chart;
            if (!chartArea) return;

            // Position the pivot point at the bottom center of the chart area
            const centerX = (chartArea.left + chartArea.right) / 2;
            const centerY = chartArea.bottom - 10; // 10 pixels up from bottom

            // Calculate the radius based on the chart dimensions
            const width = chartArea.right - chartArea.left;
            const height = chartArea.bottom - chartArea.top;
            const radius = Math.min(width, height * 1.5) / 2;

            // Calculate needle angle based on score
            const startAngle = -135; // Bottom-left in degrees
            const sweepAngle = 270; // Arc sweep
            const needleAngleDeg = startAngle + (scorePercentage / 100) * sweepAngle;
            const needleAngle = (needleAngleDeg * Math.PI) / 180;

            // Draw needle - extend upward from bottom pivot point
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(
              centerX + Math.cos(needleAngle) * radius * 0.75,
              centerY + Math.sin(needleAngle) * radius * 0.75
            );
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.stroke();

            // Draw center circle at bottom pivot point
            ctx.beginPath();
            ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.restore();
          },
        },
      ],
    };

    const modal = await this.modalController.create({
      component: ChartDetailModalComponent,
      componentProps: {
        data: {
          type: 'adlScore',
          title: 'ADL Score',
          currentValue: this.stats.ratingPoints,
          unit: 'RP',
          chartData: chartData,
        } as ChartDetailData,
      },
    });

    await modal.present();
  }

  /**
   * Open Challenge Complete detail modal
   */
  async openChallengeCompleteDetail() {
    if (!this.stats) return;

    console.log('Challenge Complete clicked - opening modal');

    // Create horizontal bar chart showing ALL challenges with their completion percentage
    const labels = this.userChallenges.length > 0
      ? this.userChallenges.map(c => c.challengeTitle || 'Unknown')
      : ['No challenges started'];

    const data = this.userChallenges.length > 0
      ? this.userChallenges.map(c => c.progress)
      : [0];

    // Color bars based on progress: green (>=75%), yellow (50-75%), orange (25-50%), red (<25%)
    const backgroundColors = this.userChallenges.length > 0
      ? this.userChallenges.map(c => {
          if (c.progress >= 75) return '#10b981';  // green
          if (c.progress >= 50) return '#f6ba16';  // yellow
          if (c.progress >= 25) return '#f97316';  // orange
          return '#ef4444';  // red
        })
      : ['#6b7280'];

    const chartData = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Completion %',
            data,
            backgroundColor: backgroundColors,
            borderRadius: 4,
            barThickness: 30,
          },
        ],
      },
      options: {
        indexAxis: 'y', // Horizontal bars
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            callbacks: {
              label: function(context: any) {
                return context.parsed.x.toFixed(0) + '% complete';
              }
            }
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: {
              color: 'rgba(255, 255, 255, 0.6)',
              callback: function(value: any) {
                return value + '%';
              }
            },
            min: 0,
            max: 100,
          },
          y: {
            grid: { display: false },
            ticks: { color: 'rgba(255, 255, 255, 0.8)', font: { size: 12 } },
          },
        },
      },
    };

    const modal = await this.modalController.create({
      component: ChartDetailModalComponent,
      componentProps: {
        data: {
          type: 'challengeComplete',
          title: 'Challenge Progress',
          currentValue: this.stats.challengeCompleteRate,
          unit: '%',
          chartData: chartData,
        } as ChartDetailData,
      },
    });

    await modal.present();
  }

  /**
   * Open Global Ranking detail modal
   */
  async openGlobalRankingDetail() {
    if (!this.stats) return;

    console.log('Global Ranking clicked - opening modal');

    // Pass the stats object so the modal can recreate the same ranking stats view
    const modal = await this.modalController.create({
      component: ChartDetailModalComponent,
      componentProps: {
        data: {
          type: 'globalRanking',
          title: 'Global Ranking',
          currentValue: this.stats.globalRank,
          unit: '',
          chartData: null,
        } as ChartDetailData,
        stats: this.stats, // Pass the full stats object
      },
    });

    await modal.present();
  }

  /**
   * Open Shots Location detail modal
   */
  async openShotsLocationDetail() {
    if (!this.stats) return;

    console.log('Shots Location clicked - opening modal');

    // Get all shots from session history
    const targetSize = 400;
    const targetCenter = targetSize / 2;
    const allShots: { x: number; y: number; distance: number }[] = [];

    this.stats.sessionHistory.forEach((session) => {
      if (session.shots && session.shots.length > 0) {
        session.shots.forEach((shot) => {
          if (shot.x !== undefined && shot.y !== undefined) {
            const normalizedX = (shot.x - targetCenter) / targetCenter;
            const normalizedY = -(shot.y - targetCenter) / targetCenter;
            const distance =
              shot.distanceFromCenter ||
              Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY) * 10;
            allShots.push({ x: normalizedX, y: normalizedY, distance });
          }
        });
      }
    });

    // Categorize shots
    const excellentShots = allShots.filter((s) => s.distance <= 2).map((s) => ({ x: s.x, y: s.y }));
    const goodShots = allShots.filter((s) => s.distance > 2 && s.distance <= 5).map((s) => ({ x: s.x, y: s.y }));
    const fairShots = allShots.filter((s) => s.distance > 5 && s.distance <= 10).map((s) => ({ x: s.x, y: s.y }));
    const poorShots = allShots.filter((s) => s.distance > 10).map((s) => ({ x: s.x, y: s.y }));

    const chartData = {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: 'Excellent (≤2cm)',
            data: excellentShots.length > 0 ? excellentShots : [{ x: 0, y: 0 }],
            backgroundColor: '#10b981',
            pointRadius: 6,
          },
          {
            label: 'Good (2-5cm)',
            data: goodShots.length > 0 ? goodShots : [],
            backgroundColor: '#3B82F6',
            pointRadius: 6,
          },
          {
            label: 'Fair (5-10cm)',
            data: fairShots.length > 0 ? fairShots : [],
            backgroundColor: '#f6ba16',
            pointRadius: 6,
          },
          {
            label: 'Poor (>10cm)',
            data: poorShots.length > 0 ? poorShots : [],
            backgroundColor: '#ef4444',
            pointRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: { color: 'rgba(255, 255, 255, 0.8)' },
          },
          tooltip: { enabled: true },
        },
        scales: {
          x: {
            display: true,
            min: -1,
            max: 1,
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: { color: 'rgba(255, 255, 255, 0.6)' },
          },
          y: {
            display: true,
            min: -1,
            max: 1,
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: { color: 'rgba(255, 255, 255, 0.6)' },
          },
        },
      },
    };

    const modal = await this.modalController.create({
      component: ChartDetailModalComponent,
      componentProps: {
        data: {
          type: 'shotsLocation',
          title: 'All Shots Locations',
          currentValue: allShots.length,
          unit: 'shots',
          chartData: chartData,
        } as ChartDetailData,
      },
    });

    await modal.present();
  }
}
