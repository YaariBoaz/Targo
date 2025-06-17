import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-rankings',
  templateUrl: './rankings.component.html',
  styleUrls: ['./rankings.component.scss'],
  standalone:true,
  imports: [CommonModule]
})
export class RankingsComponent  implements OnInit {

  constructor() { }

  ngOnInit() {}

   ranking = [
    { name: 'DANIEL', points: 2100, avatar: 'https://i.pravatar.cc/40?u=daniel' },
    { name: 'LISA', points: 1950, avatar: 'https://i.pravatar.cc/40?u=lisa' },
    { name: 'ALON', points: 1820, avatar: 'https://i.pravatar.cc/40?u=alon', isYou: true },
    { name: 'CHRIS', points: 1650, avatar: 'https://i.pravatar.cc/40?u=chris' }
  ];
}
