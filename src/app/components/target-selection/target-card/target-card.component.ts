import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface Target {
  name: string;
  distance: number;
}

@Component({
  selector: 'app-target-card',
  templateUrl: './target-card.component.html',
  styleUrls: ['./target-card.component.scss'],
  standalone: true,
  imports: [CommonModule,FormsModule],
})
export class TargetCardComponent {
  @Input() target!: Target;
  @Output() connect = new EventEmitter<void>();
}
