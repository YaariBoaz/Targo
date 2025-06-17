import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Challenge {
  id: number;
  title: string;
  description: string;
  xp: number;
  leader: string;
  image: string;
}


@Component({
  selector: 'app-challenge-card',
  templateUrl: './challenge-card.component.html',
  styleUrls: ['./challenge-card.component.scss'],
  host: {
    '[attr.cardType]': 'cardType' // bind to host attribute for styling
  },
  standalone: true,
  imports: [CommonModule]
})
export class ChallengeCardComponent {
  @Input() challenge!: Challenge;
  @Input() cardType: 'mine' | 'global' = 'global';
}

