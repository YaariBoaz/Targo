import { Component, OnInit } from '@angular/core';
import {Challenge, ChallengeCardComponent } from './challenge-card/challenge-card.component';
import { CommonModule } from '@angular/common';
import { FormsModule, NgModel } from '@angular/forms';
import { NavigationService } from 'src/app/shared/services/navigation.service';
import { ScreenComponentMap, ScreenState } from 'src/app/shared/models/screen-state';

@Component({
  selector: 'app-challenge-list',
  templateUrl: './challenges-list.component.html',
  styleUrls: ['./challenges-list.component.scss'],
  imports: [ChallengeCardComponent,CommonModule,FormsModule],
})
export class ChallengeListComponent implements OnInit {

  myChallenges: Challenge[] = [];
  globalChallenges: Challenge[] = [];

  filteredMyChallenges: Challenge[] = [];
  filteredGlobalChallenges: Challenge[] = [];

  searchTerm: string = '';
  constructor(private nav:NavigationService){}

  ngOnInit() {
    // Load mock data
    this.myChallenges = [
      { id: 1, title: 'In Memory of John D.', description: '...', xp: 150, leader: 'Mike', image: 'https://i.pravatar.cc/' },
      { id: 2, title: 'California Sniper Week', description: '...', xp: 100, leader: 'Lena', image: 'https://i.pravatar.cc/' }
    ];

    this.globalChallenges = [
      { id: 3, title: 'Nationwide Tactical', description: '...', xp: 200, leader: 'Steve', image: 'https://i.pravatar.cc/' },
      { id: 4, title: 'Texas League Shot', description: '...', xp: 120, leader: 'Jill', image: 'https://i.pravatar.cc/' }
    ];

    this.filterChallenges();
  }

  filterChallenges() {
    const term = this.searchTerm.toLowerCase();

    this.filteredMyChallenges = this.myChallenges.filter(c =>
      c.title.toLowerCase().includes(term)
    );

    this.filteredGlobalChallenges = this.globalChallenges.filter(c =>
      c.title.toLowerCase().includes(term)
    );
  }

  onChallengeClick(_t14: Challenge) {
    this.nav.push(ScreenComponentMap[ScreenState.TargetSelection]);
  }
}
