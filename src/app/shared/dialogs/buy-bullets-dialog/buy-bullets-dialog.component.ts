import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-buy-bullets-dialog',
  templateUrl: './buy-bullets-dialog.component.html',
  styleUrls: ['./buy-bullets-dialog.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class BuyBulletsDialogComponent {
  bulletPacks = [
    { count: 50, price: 4.99 },
    { count: 100, price: 8.99 },
    { count: 200, price: 16.99 },
  ];

  constructor(public dialogRef: MatDialogRef<BuyBulletsDialogComponent>) {}

  buyPack(pack: { count: number; price: number }) {
    // Mock: Add bullets to user
    console.log(`Bought ${pack.count} bullets for $${pack.price}`);
    this.dialogRef.close({ bulletsAdded: pack.count });
  }

  subscribeToPro() {
    // Mock: Upgrade to pro
    console.log('Subscribed to Pro: +100 bullets, 5% off, etc.');
    this.dialogRef.close({ proSubscribed: true, bulletsAdded: 100 });
  }
}
