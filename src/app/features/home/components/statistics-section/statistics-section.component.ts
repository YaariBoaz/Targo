import {
  Component,
  ViewChild,
  ElementRef,
  OnInit,
  OnDestroy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { Auth } from '@angular/fire/auth';
import { StatisticsService } from '@core/services/statistics.service';
import { AuthService } from '@core/services/auth';
import { HitRatioChartComponent } from '@shared/components/hit-ratio-chart/hit-ratio-chart.component';
import { TabRefreshService } from '@core/services/tab-refresh.service';
import { Subscription } from 'rxjs';

Chart.register(...registerables);

@Component({
  selector: 'app-statistics-section',
  standalone: true,
  imports: [CommonModule, HitRatioChartComponent],
  templateUrl: './statistics-section.component.html',
  styleUrls: ['./statistics-section.component.scss'],
})
export class StatisticsSectionComponent implements OnInit, OnDestroy {
  private auth = inject(Auth);
  private authService = inject(AuthService);
  private statisticsService = inject(StatisticsService);
  private router = inject(Router);
  private tabRefreshService = inject(TabRefreshService);
  private authSubscription?: Subscription;
  private tabSubscription?: Subscription;

  @ViewChild('splitTimeChart') splitTimeChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('accuracyChart') accuracyChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('groupingChart') groupingChartRef!: ElementRef<HTMLCanvasElement>;

  private splitTimeChartInstance: Chart | null = null;
  private accuracyChartInstance: Chart | null = null;

  // Hit Ratio
  hitRatio = 0;
  hitRatioChange = 0;

  // Split Time
  splitTime = 0;
  splitTimeChange = 0;

  // Accuracy
  avgAccuracy = 0;
  accuracyChange = 0;

  // Avg Grouping
  avgGrouping = 0;
  groupingChange = 0;

  loading = true;

  readonly abs = Math.abs;

  async ngOnInit() {
    // Pass the user directly from the observable — avoids the race where
    // this.auth.currentUser is null even though auth state just changed
    this.authSubscription = this.authService.currentUser$.subscribe(async (user) => {
      await this.loadStatistics(user?.uid);
    });

    this.tabSubscription = this.tabRefreshService.tabChange$.subscribe(async (tabName) => {
      if (tabName === 'home') {
        await this.loadStatistics(this.auth.currentUser?.uid);
      }
    });
  }

  ngOnDestroy() {
    this.authSubscription?.unsubscribe();
    this.tabSubscription?.unsubscribe();
    this.splitTimeChartInstance?.destroy();
    this.accuracyChartInstance?.destroy();
  }

  private async loadStatistics(uid?: string) {
    try {
      this.loading = true;
      console.log('[StatisticsSection] loadStatistics, uid:', uid ?? 'null');
      if (!uid) {
        this.loading = false;
        return;
      }

      const stats = await this.statisticsService.getHomeStatistics(uid);
      console.log('[StatisticsSection] stats:', { hitRatio: stats.hitRatio, splitTimes: stats.splitTimes, accuracy: stats.accuracy, sessions: stats.sessionHistory.length });

      this.hitRatio = stats.hitRatio;
      this.hitRatioChange = stats.hitRatioChange;
      this.splitTime = stats.splitTimes;
      this.splitTimeChange = stats.splitTimesChange;
      this.avgAccuracy = stats.accuracy;
      this.accuracyChange = stats.accuracyChange;
      this.avgGrouping = stats.avgGrouping;
      this.groupingChange = stats.groupingChange;

      // Build history from last 10 sessions (oldest → newest for left-to-right trend)
      const last10 = stats.sessionHistory.slice(0, 10).reverse();
      const splitTimeHistory = last10.map((s) => s.statistics.avgSplitTime);
      const accuracyHistory = last10.map((s) => s.statistics.avgDistance);

      // Collect all shots from last 10 sessions for the radial heatmap
      const allShots = last10.flatMap((s) => s.shots ?? []);

      this.loading = false;

      console.log('[GroupingChart] allShots count:', allShots.length, 'avgGrouping:', this.avgGrouping);

      // Wait one tick so Angular renders the canvases before we paint on them
      setTimeout(() => {
        console.log('[GroupingChart] groupingChartRef:', !!this.groupingChartRef, 'offsetWidth:', this.groupingChartRef?.nativeElement?.offsetWidth);
        this.renderSplitTimeChart(splitTimeHistory);
        this.renderAccuracyChart(accuracyHistory);
        this.renderGroupingChart(allShots);
      }, 0);
    } catch (error) {
      console.error('Error loading statistics:', error);
      this.loading = false;
    }
  }

  private renderSplitTimeChart(data: number[]) {
    const canvas = this.splitTimeChartRef?.nativeElement;
    if (!canvas) return;

    this.splitTimeChartInstance?.destroy();

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.offsetHeight || 80);
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');

    this.splitTimeChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(() => ''),
        datasets: [{
          data,
          borderColor: '#10b981',
          borderWidth: 2,
          backgroundColor: gradient,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } },
      },
    });
  }

  private renderAccuracyChart(data: number[]) {
    const canvas = this.accuracyChartRef?.nativeElement;
    if (!canvas) return;

    this.accuracyChartInstance?.destroy();

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.offsetHeight || 80);
    gradient.addColorStop(0, 'rgba(246, 186, 22, 0.4)');
    gradient.addColorStop(1, 'rgba(246, 186, 22, 0)');

    this.accuracyChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(() => ''),
        datasets: [{
          data,
          borderColor: '#f6ba16',
          borderWidth: 2,
          backgroundColor: gradient,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } },
      },
    });
  }

  private renderGroupingChart(shots: { distanceFromCenter: number }[]) {
    const canvas = this.groupingChartRef?.nativeElement;
    console.log('[GroupingChart] renderGroupingChart called, canvas:', !!canvas, 'shots:', shots.length);
    if (!canvas) return;

    const size = canvas.offsetWidth || 120;
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cx = size / 2;
    const cy = size / 2;
    const maxRadius = size / 2 - 2;

    // Radial bands in cm: [0-8, 8-18, 18-30, 30-45, 45+]
    const bands = [8, 18, 30, 45, Infinity];
    const counts = new Array(bands.length).fill(0);

    shots.forEach((shot) => {
      const d = shot.distanceFromCenter;
      for (let i = 0; i < bands.length; i++) {
        if (d < bands[i]) { counts[i]++; break; }
      }
    });

    const maxCount = Math.max(...counts, 1);

    // Radii proportions for each band (outer edge of each ring)
    const radiiPct = [0.2, 0.38, 0.58, 0.78, 1.0];

    // Colors: gold center → amber → orange → red → dark red
    const colors = ['#f6ba16', '#f59e0b', '#f97316', '#ef4444', '#991b1b'];

    ctx.clearRect(0, 0, size, size);

    const parseHex = (hex: string): [number, number, number] => {
      const n = parseInt(hex.slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    };

    for (let i = bands.length - 1; i >= 0; i--) {
      const outerR = radiiPct[i] * maxRadius;
      const innerR = i === 0 ? 0 : radiiPct[i - 1] * maxRadius;
      const density = counts[i] / maxCount;
      const alpha = shots.length === 0 ? 0.08 : 0.08 + density * 0.88;
      const [r, g, b] = parseHex(colors[i]);

      ctx.beginPath();
      ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
      if (innerR > 0) {
        ctx.arc(cx, cy, innerR, 0, Math.PI * 2, true);
      }
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.fill();
    }

    // Subtle ring borders
    for (let i = 0; i < bands.length - 1; i++) {
      const r = radiiPct[i] * maxRadius;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // Center crosshair
    ctx.strokeStyle = 'rgba(246, 186, 22, 0.4)';
    ctx.lineWidth = 0.5;
    const ch = maxRadius * 0.08;
    ctx.beginPath(); ctx.moveTo(cx - ch, cy); ctx.lineTo(cx + ch, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - ch); ctx.lineTo(cx, cy + ch); ctx.stroke();
  }

  onSeeMore() {
    this.router.navigate(['/tabs/statistics']);
  }
}
