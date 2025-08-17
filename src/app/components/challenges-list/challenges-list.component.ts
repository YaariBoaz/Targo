import { Component, OnInit } from '@angular/core';
import { ScreenComponentMap } from 'src/app/shared/models/screen-state';
import { NavigationService } from 'src/app/shared/services/navigation.service';
import {
  Challenge,
  ChallengeCardComponent,
  ChallengeType,
} from './challenge-card/challenge-card.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-challenge-list',
  templateUrl: './challenges-list.component.html',
  styleUrls: ['./challenges-list.component.scss'],
  standalone: true,
  imports: [ChallengeCardComponent, CommonModule],
})
export class ChallengeListComponent implements OnInit {
  searchTerm = '';
  filteredChallenges: Challenge[] = [];

  tabs = [
    { key: 'my', label: 'My Challenges' },
    { key: 'global', label: 'Global' },
    { key: 'heroes', label: 'Heroes' },
  ];

  private _activeTab: 'my' | 'global' | 'heroes' = 'my';
  get activeTab() {
    return this._activeTab;
  }
  set activeTab(value: 'my' | 'global' | 'heroes') {
    this._activeTab = value;
    this.filterChallenges();
  }

  challenges: Challenge[] = [];

  constructor(private nav: NavigationService) {}

  ngOnInit() {
    this.challenges = [
      {
        id: 1,
        title: 'In Memory of John D.',
        description: '...',
        xp: 150,
        leader: 'Mike',
        image: 'https://i.pravatar.cc/150?img=1',
        type: ChallengeType.My,
        userRank: 4,
        userScore: 92,
        details:
          'Shoot 10 targets in under 15 seconds while maintaining 90% accuracy.',
      },
      {
        id: 3,
        title: 'Nationwide Tactical',
        description: '...',
        xp: 200,
        leader: 'Steve',
        image: 'https://i.pravatar.cc/150?img=3',
        type: ChallengeType.Global,
        userRank: 4,
        userScore: 92,
        details:
          'Compete across state lines in a fast-paced accuracy challenge using your preferred weapon class.',
      },
      {
        id: 5,
        title: 'Fallen Hero Memorial',
        description: 'Honor Sgt. T. Marcus.',
        xp: 250,
        leader: 'Global',
        image: 'https://i.pravatar.cc/150?img=5',
        type: ChallengeType.Heroes,
        userRank: 4,
        userScore: 92,
        details: `Sgt. Terrance Marcus served 8 years in the Special Forces. Known for his resilience and mentorship, this challenge honors his final training routine – a rapid 3-position shooting drill. Complete it in his memory.`,
        detailImage: '/assets/challenges/s1.jpeg',
      },
      // Add more...
    ];

    this.filterChallenges();
  }

  filterChallenges() {
    this.filteredChallenges = this.challenges.filter((c) => {
      const a = c.type.toLowerCase();
      const b = this.activeTab.toString().toLowerCase();
      console.log(`Filtering: ${a} === ${b}`);
      return a === b;
    });
  }

  onTabClick(tabKey: 'my' | 'global' | 'heroes' | any) {
    this.activeTab = tabKey;
    this.filterChallenges();
  }

  onChallengeClick(_challenge: Challenge) {
    this.nav.push(ScreenComponentMap.TargetSelection);
  }
}
