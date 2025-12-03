import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-badge-card',
  templateUrl: './badge-card.component.html',
  styleUrls: ['./badge-card.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, CommonModule],
})
export class BadgeCardComponent implements OnInit {
  constructor() {}
  ngOnInit() {}
}
