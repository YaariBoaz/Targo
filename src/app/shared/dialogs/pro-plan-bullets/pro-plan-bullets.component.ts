import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-pro-plan-bullets',
  templateUrl: './pro-plan-bullets.component.html',
  styleUrls: ['./pro-plan-bullets.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class ProPlanBulletsComponent {
  bulletPacks = [
    { count: 50, price: 4.99 },
    { count: 100, price: 8.99 },
    { count: 200, price: 16.99 },
  ];

  @Output() purchased = new EventEmitter<{ count: number; price: number }>();

  constructor(public dialogRef: MatDialogRef<ProPlanBulletsComponent>) {}
  get discountRate() {
    return 0.05; // 5%
  }

  discountedPrice(price: number): string {
    return (price * (1 - this.discountRate)).toFixed(2);
  }

  savedAmount(price: number): string {
    return (price * this.discountRate).toFixed(2);
  }

  buyPack(pack: { count: number; price: number }) {
    // const discounted = parseFloat(this.discountedPrice(pack.price));
    // this.purchased.emit({ count: pack.count, price: discounted });
    this.dialogRef.close({ purchased: true, bulletsAdded: 100 });
  }
}
