import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';

export enum DrillMode {
  training = 'training',
  challenge = 'challenge',
}
@Component({
  selector: 'app-post-drill-dialog',
  templateUrl: './post-drill-dialog.component.html',
  styleUrls: ['./post-drill-dialog.component.scss'],
  standalone: true,
  imports: [MatDialogModule, CommonModule, FormsModule],
})
export class PostDrillDialogComponent implements OnInit {
  /** INPUTS */
  @Input({ required: true }) mode!: DrillMode; // 'training' | 'challenge'
  @Input() hitRate = 0; // 0-100 %
  @Input() hasNextStep = false; // challenge only
  @Input() bgImage = '/assets/challenges/c3.png';
  /** OUTPUT – emit one of 'start' | 'retry' | 'exit' */
  @Output() close = new EventEmitter<'start' | 'retry' | 'exit'>();

  /* ---------- countdown ---------- */
  initial = 30;
  counter = this.initial;
  interval?: any;

  /* ---------- life-cycle ---------- */
  ngOnInit() {
    if (this.shouldAutoplay) this.startCountdown();
  }
  ngOnDestroy() {
    clearInterval(this.interval);
  }

  private startCountdown() {
    this.interval = setInterval(() => {
      this.counter--;
      if (this.counter === 0) this.startNow(); // auto-continue
    }, 1000);
  }

  /* ---------- dynamic text ---------- */
  get headline() {
    if (this.mode === 'challenge') return 'Step Complete!';
    return this.hitRate >= 60 ? 'Great Shooting!' : 'Keep Pushing!';
  }
  get subtext() {
    if (this.mode === 'challenge')
      return this.hasNextStep
        ? 'Next stage will start automatically.'
        : 'Challenge finished – nice work!';
    return this.hitRate >= 60
      ? '🔥 You’re on a roll. Ready for another round?'
      : 'You can do better. Let’s tighten that group!';
  }
  get shouldAutoplay() {
    return true;
    // return (
    //   (this.mode === 'challenge' && this.hasNextStep) ||
    //   (this.mode === 'training' && this.hitRate < 60)
    // );
  }

  /* ---------- button handlers ---------- */
  startNow() {
    this.finish('start');
  }
  retry() {
    this.finish('retry');
  }
  exit() {
    this.finish('exit');
  }

  private finish(res: 'start' | 'retry' | 'exit') {
    clearInterval(this.interval);
    this.close.emit(res);
  }

  /* progress-bar percentage */
  get progress() {
    return (this.counter / this.initial) * 100;
  }
}
