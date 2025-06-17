import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-buy-bullets',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './buy-bullets.component.html',
  styleUrls: ['./buy-bullets.component.scss']
})
export class BuyBulletsComponent {
  @Input() offerText = 'Buy 50 bullets and get 5% OFF';
  @Input() boldText = '5% OFF';

}
