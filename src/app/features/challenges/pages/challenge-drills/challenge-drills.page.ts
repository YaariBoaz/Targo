import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IonIcon, ToastController, NavParams, ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBack, lockClosed, star, starOutline } from 'ionicons/icons';
import { Auth } from '@angular/fire/auth';
import { ChallengeService } from '@core/services/challenge.service';
import { DrillService } from '@core/services/drill.service';
import { BulletsService } from '@core/services/bullets.service';
import { BLEService } from '@core/services/ble.service';
import { StackNavigationService } from '@core/services/stack-navigation.service';
import { Challenge } from '@models/challenge.model';
import { ChallengeDrill } from '@models/challenge-drill.model';
import { DrillAttempt } from '@models/challenge-progress.model';
import { DrillSetup } from '@models/drill-session.model';
import { checkAndDeductBullets } from '@utils/bullets.utils';

interface DrillWithStatus extends ChallengeDrill {
  status: 'locked' | 'available' | 'completed';
  score?: number;
  stars?: number;
}

@Component({
  selector: 'app-challenge-drills',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './challenge-drills.page.html',
  styleUrl: './challenge-drills.page.scss',
})
export class ChallengeDrillsPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private navParams = inject(NavParams);
  private challengeService = inject(ChallengeService);
  private drillService = inject(DrillService);
  private bulletsService = inject(BulletsService);
  private bleService = inject(BLEService);
  private auth = inject(Auth);
  private toastController = inject(ToastController);
  private modalController = inject(ModalController);
  private stackNav = inject(StackNavigationService);

  challengeId: string = '';
  challenge: Challenge | null = null;
  challengeTitle: string = '';
  challengeSubtitle: string = '';
  isLoading = false;
  sourceTab: string = ''; // Track which tab the user came from

  drills: DrillWithStatus[] = [];

  constructor() {
    addIcons({ arrowBack, lockClosed, star, starOutline });
  }

  async ngOnInit() {
    // Try to get challengeId from NavParams first (stack navigation), then from route params
    this.challengeId =
      this.navParams.get('challengeId') ||
      this.route.snapshot.paramMap.get('id') ||
      '';

    // Get the source tab to know where to navigate back to
    this.sourceTab = this.navParams.get('sourceTab') || '';

    if (!this.challengeId) {
      console.error('No challenge ID provided');
      this.goBack();
      return;
    }

    await this.loadChallengeData();
  }

  private async loadChallengeData() {
    this.isLoading = true;

    try {
      // Load challenge details
      this.challenge = await this.challengeService.getChallenge(
        this.challengeId
      );

      if (!this.challenge) {
        console.error('Challenge not found:', this.challengeId);
        await this.goBack();
        return;
      }

      this.challengeTitle = this.challenge.title.toUpperCase();
      this.challengeSubtitle = `Complete ${this.challenge.drillsCount} drills to earn the ${this.challenge.completionBadge.title} badge`;

      // Load challenge drills
      const challengeDrills = await this.challengeService.getChallengeDrills(
        this.challengeId
      );

      // Load user's attempt data if authenticated
      let drillAttempts: DrillAttempt[] = [];
      if (this.auth.currentUser) {
        drillAttempts = await this.challengeService.getChallengeDrillAttempts(
          this.auth.currentUser.uid,
          this.challengeId
        );
      }

      // Combine drills with attempt status
      this.drills = challengeDrills.map((drill) => {
        const attempt = drillAttempts.find((a) => a.drillId === drill.id);

        // Determine status
        let status: 'locked' | 'available' | 'completed' = 'locked';

        if (drill.order === 1) {
          // First drill is always available
          status = attempt?.status === 'completed' ? 'completed' : 'available';
        } else if (attempt) {
          status = attempt.status;
        } else {
          // Check if previous drill is completed
          const previousDrill = drillAttempts.find((a) => {
            const prevDrillData = challengeDrills.find(
              (d) => d.order === drill.order - 1
            );
            return prevDrillData && a.drillId === prevDrillData.id;
          });

          if (previousDrill && previousDrill.status === 'completed') {
            status = 'available';
          }
        }

        return {
          ...drill,
          status,
          score: attempt?.bestScore,
          stars: attempt?.bestStars,
        } as DrillWithStatus;
      });
    } catch (error) {
      console.error('Error loading challenge data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async goBack() {
    // Try to pop from stack first, if not available use router
    const canGoBack = await this.stackNav.canGoBack('challenges');
    if (canGoBack) {
      await this.stackNav.pop('challenges');

      // If user came from home tab, navigate back to home
      if (this.sourceTab === 'home') {
        this.router.navigate(['/tabs/home']);
      }
    } else {
      // No stack to pop, navigate based on source
      if (this.sourceTab === 'home') {
        this.router.navigate(['/tabs/home']);
      } else {
        this.router.navigate(['/tabs/challenges']);
      }
    }
  }

  async onDrillClick(drill: DrillWithStatus) {
    if (drill.status === 'locked') {
      await this.showToast(
        'Complete the previous drill to unlock this one',
        'warning'
      );
      return;
    }

    // Check authentication
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      await this.showToast('Please log in to start a drill', 'danger');
      return;
    }

    // Check if user has enough bullets and deduct them
    const requiredBullets = drill.requirements.numberOfBullets;
    const hasEnoughBullets = await checkAndDeductBullets(
      requiredBullets,
      this.modalController,
      this.bulletsService
    );

    if (!hasEnoughBullets) {
      console.log('User does not have enough bullets or cancelled');
      return; // User doesn't have enough bullets or cancelled the modal
    }

    // Start challenge if not already started
    if (this.challenge) {
      const progress = await this.challengeService.getUserChallengeProgress(
        currentUser.uid,
        this.challengeId
      );
      if (!progress) {
        await this.challengeService.startChallenge(
          currentUser.uid,
          this.challenge
        );
      }
    }

    // Create drill setup with challenge context
    // Use default weapon if not specified in requirements
    const defaultWeapons: Record<string, { id: string; name: string }> = {
      pistol: { id: 'glock-19', name: 'Glock 19' },
      rifle: { id: 'ar-15', name: 'AR-15' },
      sniper: { id: 'remington-700', name: 'Remington 700' },
    };

    const weaponCategory = drill.requirements.weaponCategory || 'pistol';
    const defaultWeapon =
      defaultWeapons[weaponCategory] || defaultWeapons['pistol'];

    const drillSetup: DrillSetup = {
      distance: drill.requirements.distance,
      weaponCategory: weaponCategory as 'pistol' | 'rifle' | 'sniper',
      weaponType: drill.requirements.weaponType || defaultWeapon.id,
      weaponName: drill.requirements.weaponName || defaultWeapon.name,
      numberOfBullets: drill.requirements.numberOfBullets,

      // Challenge context
      source: 'challenge',
      challengeId: this.challengeId,
      challengeDrillId: drill.id,
      challengeTitle: this.challenge?.title,
      challengeDrillTitle: drill.title,
      drillObjective: drill.challengeInfo.objective,
    };

    // Store drill setup in memory
    this.drillService.setCurrentDrillSetup(currentUser.uid, drillSetup);

    console.log('Challenge drill setup complete, bullets deducted');

    // Check if BLE is connected, if not navigate to BLE connection page
    if (!this.bleService.isConnected()) {
      this.router.navigate(['/ble-connection'], {
        queryParams: { returnUrl: '/tabs/challenges' }
      });
    } else {
      // Already connected, go straight to drill preparation
      this.router.navigate(['/drill/prepare']);
    }
  }

  private async showToast(
    message: string,
    color: 'success' | 'warning' | 'danger'
  ) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color,
    });
    await toast.present();
  }
}
