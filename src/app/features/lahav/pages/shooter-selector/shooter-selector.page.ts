import { Component, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonSpinner,
  IonButton,
  IonButtons,
} from '@ionic/angular/standalone';
import { LahavSessionService } from '@core/services/lahav-session.service';
import { LahavShooter } from '@models/lahav.model';

@Component({
  selector: 'app-shooter-selector',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonSpinner,
    IonButton,
    IonButtons,
  ],
  templateUrl: './shooter-selector.page.html',
  styleUrls: ['./shooter-selector.page.scss'],
})
export class ShooterSelectorPage implements OnDestroy {
  readonly lahavService = inject(LahavSessionService);
  private router = inject(Router);

  readonly shooters = signal<LahavShooter[]>([]);
  readonly shooterProgress = signal<Record<string, number>>({});
  readonly isLoading = signal<boolean>(true);

  async ionViewWillEnter(): Promise<void> {
    const session = this.lahavService.activeSession();
    if (!session) {
      this.router.navigate(['/lahav/sessions']);
      return;
    }

    this.isLoading.set(true);
    this.lahavService.watchActiveSession(session.sessionId);

    try {
      const shooters = await this.lahavService.getShootersByIds(session.shooters ?? []);
      this.shooters.set(shooters);

      const progressMap: Record<string, number> = {};
      for (const shooter of shooters) {
        progressMap[shooter.shooterId] = await this.lahavService.loadShooterProgress(session.sessionId, shooter.shooterId);
      }
      this.shooterProgress.set(progressMap);
    } catch (e) {
      console.error('[ShooterSelectorPage] error loading shooters:', e);
    } finally {
      this.isLoading.set(false);
    }
  }

  ngOnDestroy(): void {
    this.lahavService.stopWatchingActiveSession();
  }

  isCompleted(shooterId: string): boolean {
    return (
      this.lahavService.activeSession()?.completedTurns?.includes(shooterId) ??
      false
    );
  }

  get completedCount(): number {
    return this.lahavService.activeSession()?.completedTurns?.length ?? 0;
  }

  selectShooter(shooter: LahavShooter): void {
    void this.lahavService.selectShooter(shooter);
  }

  goBack(): void {
    this.lahavService.stopWatchingActiveSession();
    this.router.navigate(['/lahav/sessions']);
  }
}
