import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close } from 'ionicons/icons';
import { Chart } from 'chart.js';

addIcons({ close });

export type ChartType = 'grouping' | 'accuracy' | 'hitRatio' | 'reactionTime' | 'splitTime' | 'adlScore' | 'challengeComplete' | 'globalRanking' | 'shotsLocation';

export interface ChartDetailData {
  type: ChartType;
  title: string;
  currentValue: number;
  unit: string;
  chartData: any; // Chart data to render
}

@Component({
  selector: 'app-chart-detail-modal',
  standalone: true,
  imports: [CommonModule, IonIcon],
  template: `
    <div class="modal-container">
      <div class="modal-header">
        <h2>{{ data.title }}</h2>
        <ion-icon name="close" (click)="dismiss()"></ion-icon>
      </div>

      <div class="modal-content">
        <!-- Current Value Display -->
        <div class="current-value" *ngIf="data.type !== 'globalRanking'">
          <span class="value">{{ data.currentValue.toFixed(1) }}</span>
          <span class="unit">{{ data.unit }}</span>
        </div>

        <!-- Global Ranking Display -->
        <div class="current-value" *ngIf="data.type === 'globalRanking'">
          <span class="value">#{{ data.currentValue }}</span>
          <span class="unit">Global Rank</span>
        </div>

        <!-- Ranking Stats (for globalRanking type) -->
        <div class="ranking-stats-large" *ngIf="data.type === 'globalRanking' && stats">
          <div class="ranking-stat-large">
            <span class="stat-name-large">Rating Points</span>
            <div class="stat-bar-container-large">
              <div class="stat-bar-large"></div>
            </div>
            <span class="stat-rank-large" [class.green]="stats.rpChange >= 0" [class.red]="stats.rpChange < 0">
              {{ stats.rpChange >= 0 ? '+' : '' }}{{ stats.rpChange }} {{ stats.rpChange >= 0 ? '▲' : '▼' }}
            </span>
          </div>
          <div class="ranking-stat-large">
            <span class="stat-name-large">Reaction Time</span>
            <div class="stat-bar-container-large">
              <div class="stat-bar-large"></div>
            </div>
            <span class="stat-rank-large" [class.green]="stats.reactionTimeChange <= 0" [class.red]="stats.reactionTimeChange > 0">
              {{ abs(stats.reactionTimeChange).toFixed(2) }}s {{ stats.reactionTimeChange <= 0 ? '▲' : '▼' }}
            </span>
          </div>
          <div class="ranking-stat-large">
            <span class="stat-name-large">Accuracy</span>
            <div class="stat-bar-container-large">
              <div class="stat-bar-large"></div>
            </div>
            <span class="stat-rank-large" [class.green]="stats.accuracyChange <= 0" [class.red]="stats.accuracyChange > 0">
              {{ abs(stats.accuracyChange).toFixed(1) }}cm {{ stats.accuracyChange <= 0 ? '▲' : '▼' }}
            </span>
          </div>
          <div class="ranking-stat-large">
            <span class="stat-name-large">Grouping</span>
            <div class="stat-bar-container-large">
              <div class="stat-bar-large"></div>
            </div>
            <span class="stat-rank-large" [class.green]="stats.groupingChange <= 0" [class.red]="stats.groupingChange > 0">
              {{ abs(stats.groupingChange).toFixed(1) }}cm {{ stats.groupingChange <= 0 ? '▲' : '▼' }}
            </span>
          </div>
        </div>

        <!-- Full Size Chart -->
        <div class="chart-container" *ngIf="data.chartData">
          <canvas #chartCanvas></canvas>
        </div>

        <!-- Improvement Tip -->
        <div class="tip-section">
          <h3>💡 How to Improve</h3>
          <p>{{ getImprovementTip() }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-container {
      background: #1a1a1a;
      color: white;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .modal-header h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }

    .modal-header ion-icon {
      font-size: 28px;
      cursor: pointer;
      color: rgba(255, 255, 255, 0.7);
    }

    .modal-content {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
    }

    .current-value {
      text-align: center;
      margin-bottom: 30px;
    }

    .current-value .value {
      font-size: 48px;
      font-weight: 700;
      color: #FF8C00;
    }

    .current-value .unit {
      font-size: 24px;
      color: rgba(255, 255, 255, 0.6);
      margin-left: 8px;
    }

    .chart-container {
      height: 300px;
      margin-bottom: 30px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 20px;
    }

    .tip-section {
      background: rgba(255, 140, 0, 0.1);
      border-left: 4px solid #FF8C00;
      padding: 20px;
      border-radius: 8px;
    }

    .tip-section h3 {
      margin: 0 0 12px 0;
      font-size: 18px;
      font-weight: 600;
      color: #FF8C00;
    }

    .tip-section p {
      margin: 0;
      line-height: 1.6;
      color: rgba(255, 255, 255, 0.8);
      font-size: 14px;
    }

    .ranking-stats-large {
      display: flex;
      flex-direction: column;
      gap: 20px;
      margin-bottom: 30px;
    }

    .ranking-stat-large {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .stat-name-large {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.7);
      flex: 0 0 120px;
      font-weight: 500;
    }

    .stat-bar-container-large {
      flex: 1;
      height: 8px;
      background: #333;
      border-radius: 4px;
      position: relative;
    }

    .stat-bar-large {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 50%;
      background: #f6ba16;
      border-radius: 4px;
    }

    .stat-bar-large::after {
      content: "";
      position: absolute;
      right: 0;
      top: 50%;
      transform: translate(50%, -50%);
      width: 10px;
      height: 10px;
      background: #fff;
      border-radius: 50%;
    }

    .stat-rank-large {
      font-size: 14px;
      font-weight: 600;
      flex: 0 0 80px;
      text-align: right;
    }

    .stat-rank-large.green {
      color: #10b981;
    }

    .stat-rank-large.red {
      color: #ef4444;
    }
  `],
})
export class ChartDetailModalComponent implements OnInit, AfterViewInit {
  @ViewChild('chartCanvas') chartCanvasRef!: ElementRef<HTMLCanvasElement>;

  private modalController = inject(ModalController);
  private chart: Chart | null = null;

  data!: ChartDetailData;
  stats?: any; // Optional stats object for globalRanking type

  ngOnInit() {
    console.log('Chart detail modal initialized with data:', this.data);
    console.log('Stats passed to modal:', this.stats);
  }

  abs(value: number): number {
    return Math.abs(value);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.createChart();
    }, 100);
  }

  dismiss() {
    this.modalController.dismiss();
  }

  private createChart() {
    // Don't create chart if no chart data provided
    if (!this.data.chartData) return;

    if (!this.chartCanvasRef) return;

    const canvas = this.chartCanvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(ctx, this.data.chartData);
  }

  getImprovementTip(): string {
    const tips: Record<ChartType, string> = {
      grouping: 'Focus on consistency in your stance and grip. Practice dry-fire exercises to build muscle memory. Ensure proper trigger control without disturbing your sight picture. Tighten your grouping by focusing on the fundamentals: stance, grip, sight alignment, and smooth trigger press.',
      accuracy: 'Slow down your shots and focus on proper sight alignment. Practice the BRASS technique: Breathe, Relax, Aim, Sight picture, Squeeze. Remember that accuracy comes from consistent fundamentals, not speed. Work on eliminating anticipation and flinching.',
      hitRatio: 'Improve your hit ratio by taking deliberate, controlled shots. Focus on your breathing and trigger control. Ensure you have a proper sight picture before each shot. Consider practicing at closer distances to build confidence, then gradually increase distance.',
      reactionTime: 'Work on your draw speed and first shot accuracy. Practice getting a solid grip on presentation. Use dry-fire drills to improve your reaction time safely. Remember that smooth is fast - focus on efficient movements rather than rushed ones.',
      splitTime: 'Reduce split time between shots by managing recoil better and getting back on target faster. Practice calling your shots and maintaining sight picture through recoil. Work on grip strength and proper stance to control the firearm better between shots.',
      adlScore: 'Your ADL Score represents your overall shooting performance across all metrics. To improve it, focus on consistent training, completing challenges, and working on your weak areas. Regular practice with proper technique will steadily increase your rating points.',
      challengeComplete: 'Complete more challenges to improve this metric. Start with easier challenges to build confidence, then gradually tackle harder ones. Consistent participation and learning from each attempt will boost your completion rate over time.',
      globalRanking: 'Improve your global ranking by consistently training, completing challenges, and competing in leagues. Focus on improving all aspects of your shooting - accuracy, speed, and consistency. Track your progress and celebrate small improvements along the way.',
      shotsLocation: 'Analyze your shot patterns to identify tendencies. If shots cluster in one direction, adjust your stance, grip, or trigger control accordingly. Practice controlled breathing and smooth trigger press to keep shots centered. Consider recording sessions to review your form.',
    };

    return tips[this.data.type] || 'Keep practicing and focus on the fundamentals!';
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }
}
