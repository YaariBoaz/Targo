import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-rank-progress',
  templateUrl: './rank-progress.component.html',
  styleUrls: ['./rank-progress.component.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule],
})
export class RankProgressComponent implements OnInit {
  challenges = [
    { level: 17, title: 'Headshots Elite', rank: 94, progress: 92, total: 110 },
    {
      level: 8,
      title: 'Reflex Drills Pro',
      rank: 150,
      progress: 145,
      total: 180,
    },
    {
      level: 26,
      title: 'Tactical Accuracy',
      rank: 200,
      progress: 286,
      total: 320,
    },
  ];

  league = {
    level: 8,
    name: 'Silver League – Weekly',
    rank: 8,
    totalPlayers: 150,
    rankProgress: 8,
    maxProgress: 15,
    rewardRank: 5,
  };

  friends = [
    { name: 'Friend1', rank: 5, score: 1405, trend: 'up' },
    { name: 'Friend2', rank: 11, score: 1250, trend: 'down' },
    { name: 'You', rank: 8, score: 1350, trend: 'flat' },
  ];

  constructor() {}

  ngOnInit() {}

  getPercent(current: number, total: number): number {
    return (current / total) * 100;
  }
}
