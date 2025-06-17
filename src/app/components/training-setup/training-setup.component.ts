import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { BuyBulletsDialogComponent } from 'src/app/shared/dialogs/buy-bullets-dialog/buy-bullets-dialog.component';
import { ProPlanBulletsComponent } from 'src/app/shared/dialogs/pro-plan-bullets/pro-plan-bullets.component';
import { ScreenComponentMap } from 'src/app/shared/models/screen-state';
import { NavigationService } from 'src/app/shared/services/navigation.service';

@Component({
  selector: 'app-training-setup',
  templateUrl: './training-setup.component.html',
  styleUrls: ['./training-setup.component.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule],
})
export class TrainingSetupComponent implements OnInit {
  presetDistances = [10, 25, 50, 100, 150, 200];
  selectedDistance = 50;
  selectedCategory = 'Pistol';
  filteredWeapons = new Array<any>();
  weapons = [
    {
      name: 'Glock 19',
      icon: 'assets/weapons/glock.png',
      category: 'Pistol',
    },
    { name: 'SIG P320', icon: 'assets/weapons/sig.png', category: 'Pistol' },
    { name: 'AK-47', icon: 'assets/weapons/ak.png', category: 'AR' },
    { name: 'M4 Carbine', icon: 'assets/weapons/m4.png', category: 'AR' },
  ];
  selectedWeapon = this.weapons[0].name;
  selectedWeaponIcon = this.weapons[0].icon;

  bullets = 30;
  userBullets = 20;

  constructor(
    private navigationService: NavigationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.selectCategory(this.selectedCategory);
  }

  selectDistance(value: number) {
    this.selectedDistance = value;
  }

  changeBullets(delta: number) {
    this.bullets = Math.max(1, this.bullets + delta);
  }

  updateSelectedWeaponIcon() {
    const selected = this.weapons.find((w) => w.name === this.selectedWeapon);
    this.selectedWeaponIcon = selected?.icon || '';
  }

  startDrill() {
    if (this.bullets > this.userBullets) {
      this.dialog
        .open(ProPlanBulletsComponent, {
          data: {
            required: this.bullets - this.userBullets,
          },
          panelClass: 'fullscreen-dialog-panel',
        })
        .afterClosed()
        .subscribe((result) => {
          if (result?.purchased) {
            this.userBullets += result.bullets;
            this.startDrill(); // retry now that bullets are available
          }
        });
      return;
    } else {
      this.navigationService.push(ScreenComponentMap.TargetSelection);
      console.log('✅ Starting drill with:', {
        distance: this.selectedDistance,
        weapon: this.selectedWeapon,
        bullets: this.bullets,
      });
    }
  }
  selectCategory(category: string) {
    this.selectedCategory = category;
    this.filteredWeapons = this.weapons.filter((w) => w.category === category);
    this.selectedWeapon = this.filteredWeapons[0]?.name || '';
    this.updateSelectedWeaponIcon();
  }
}
