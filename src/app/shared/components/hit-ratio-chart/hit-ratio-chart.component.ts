import {
  Component,
  Input,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart } from 'chart.js';

@Component({
  selector: 'app-hit-ratio-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hit-ratio-chart.component.html',
  styleUrls: ['./hit-ratio-chart.component.scss'],
})
export class HitRatioChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('hitRatioChart') hitRatioChartRef!: ElementRef<HTMLCanvasElement>;

  @Input() hitRatio: number = 0;
  @Input() hitRatioChange: number = 0;

  private chart: Chart | null = null;

  ngAfterViewInit() {
    this.createChart();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['hitRatio'] || changes['hitRatioChange']) {
      if (this.chart) {
        this.updateChart();
      }
    }
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private createChart() {
    if (!this.hitRatioChartRef) return;

    const canvas = this.hitRatioChartRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.chart) {
      this.chart.destroy();
    }

    const change = this.hitRatioChange || 0;
    const arrow = change >= 0 ? '↗' : '↘';
    const changeColor = change >= 0 ? '#10b981' : '#ef4444';

    // For a gauge-style chart with gap at bottom
    // We use circumference of 270 degrees (75% of 360) to create the gap
    // The filled and empty portions are calculated based on hitRatio within that 270 degrees
    const filledValue = this.hitRatio;
    const emptyValue = 100 - this.hitRatio;

    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        datasets: [
          {
            data: [filledValue, emptyValue],
            backgroundColor: ['#3B82F6', '#2a2a2a'],
            borderWidth: 0,
            borderRadius: 10, // Rounded ends for the arc segments
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '85%',
        rotation: -135, // Start from bottom-left (225 degrees, or -135 from top)
        circumference: 270, // Only draw 270 degrees, leaving 90 degree gap at bottom
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
      },
      plugins: [
        {
          id: 'centerText',
          afterDraw: (chart: any) => {
            const { ctx, chartArea } = chart;
            if (!chartArea) return;

            const centerX = (chartArea.left + chartArea.right) / 2;
            const centerY = (chartArea.top + chartArea.bottom) / 2;

            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Label
            ctx.font = '12px Lexend';
            ctx.fillStyle = '#ffffff';
            ctx.fillText('Hit Ratio', centerX, centerY - 20);

            // Percentage
            ctx.font = 'bold 16px Lexend';
            ctx.fillStyle = '#3B82F6';
            ctx.fillText(`${this.hitRatio.toFixed(1)}%`, centerX, centerY + 2);

            // Change
            ctx.font = '600 12px Lexend';
            ctx.fillStyle = changeColor;
            ctx.fillText(
              `${arrow} ${this.formatChange(change, '%')}`,
              centerX,
              centerY + 22
            );

            ctx.restore();
          },
        },
      ],
    });
  }

  private updateChart() {
    if (!this.chart) return;

    const filledValue = this.hitRatio;
    const emptyValue = 100 - this.hitRatio;

    this.chart.data.datasets[0].data = [filledValue, emptyValue];
    this.chart.update();
  }

  private formatChange(value: number, unit: string = ''): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}${unit}`;
  }
}
