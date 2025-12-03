import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton } from '@ionic/angular/standalone';

export interface Challenge {
  id: string;
  title: string;
  imageUrl: string;
  progress: {
    current: number;
    total: number;
    label: string; // e.g., "Drills", "Hits"
  };
}

@Component({
  selector: 'app-challenge-card',
  standalone: true,
  imports: [CommonModule, IonButton],
  templateUrl: './challenge-card.component.html',
  styleUrls: ['./challenge-card.component.scss'],
})
export class ChallengeCardComponent {
  @Input() challenge!: Challenge;
  @Output() startChallenge = new EventEmitter<Challenge>();

  onStartClick() {
    this.startChallenge.emit(this.challenge);
  }
}
