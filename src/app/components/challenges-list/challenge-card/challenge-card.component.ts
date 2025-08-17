import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Challenge {
  id: number;
  title: string;
  description: string;
  xp: number;
  leader: string;
  image: string;
  type: ChallengeType;
  userRank?: number;
  userScore?: number;
  details?: string;
  detailImage?: string; // Only used for heroes
}
export enum ChallengeType {
  My = 'my',
  Global = 'global',
  Heroes = 'heroes',
}

@Component({
  selector: 'app-challenge-card',
  templateUrl: './challenge-card.component.html',
  styleUrls: ['./challenge-card.component.scss'],
  host: {
    '[attr.cardType]': 'cardType', // bind to host attribute for styling
  },
  standalone: true,
  imports: [CommonModule],
})
export class ChallengeCardComponent {
  expanded: boolean = false;
  @Input() challenge!: Challenge;
  @Input() cardType: ChallengeType = ChallengeType.My;

  toggleDetails(event: Event) {
    event.stopPropagation(); // Prevents bubbling to parent
    this.expanded = !this.expanded;
  }
}
