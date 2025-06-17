import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-stats-history',
  templateUrl: './stats-history.component.html',
  styleUrls: ['./stats-history.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class StatsHistoryComponent implements OnInit {
  expandedSessionId: string | null = null;
  selectedType = 'training';
  history = [
    {
      id: 's1',
      date: '2025-06-10',
      type: 'training',
      distance: '25m',
      weapon: 'M4',
      bullets: 25,
      hits: 21,
      targetImageUrl: 'assets/targets/target1.png',
      hitLocations: [
        { x: 50, y: 48 },
        { x: 52, y: 53 },
        { x: 47, y: 50 },
      ],
    },
    {
      id: 's2',
      date: '2025-06-09',
      type: 'challenge',
      distance: '50m',
      weapon: 'Glock 19',
      bullets: 20,
      hits: 14,
      targetImageUrl: 'assets/targets/target2.png',
      hitLocations: [
        { x: 44, y: 55 },
        { x: 51, y: 49 },
        { x: 60, y: 52 },
      ],
    },
    {
      id: 's3',
      date: '2025-06-08',
      type: 'league',
      distance: '100m',
      weapon: 'AR-15',
      bullets: 30,
      hits: 26,
      targetImageUrl: 'assets/targets/target3.png',
      hitLocations: [
        { x: 48, y: 48 },
        { x: 50, y: 50 },
        { x: 53, y: 51 },
      ],
    },
    {
      id: 's4',
      date: '2025-06-07',
      type: 'training',
      distance: '25m',
      weapon: 'M4',
      bullets: 15,
      hits: 12,
      targetImageUrl: 'assets/targets/target1.png',
      hitLocations: [
        { x: 51, y: 49 },
        { x: 52, y: 50 },
      ],
    },
    {
      id: 's5',
      date: '2025-06-06',
      type: 'challenge',
      distance: '75m',
      weapon: 'Glock 19',
      bullets: 20,
      hits: 10,
      targetImageUrl: 'assets/targets/target2.png',
      hitLocations: [
        { x: 60, y: 48 },
        { x: 58, y: 52 },
      ],
    },
  ];

  constructor() {}

  ngOnInit() {}

  toggleRow(sessionId: string) {
    this.expandedSessionId =
      this.expandedSessionId === sessionId ? null : sessionId;
  }

  get filteredHistory() {
    return this.history.filter((h) => h.type === this.selectedType);
  }
}
