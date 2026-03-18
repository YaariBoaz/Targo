import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronDown, chevronUp, shareOutline } from 'ionicons/icons';
import { StatisticsService, UserStatistics } from '@core/services/statistics.service';
import { FirebaseService } from '@shared/services/firebase.service';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import html2canvas from 'html2canvas';

addIcons({ chevronDown, chevronUp, shareOutline });

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, IonIcon],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './history.page.html',
  styleUrls: ['./history.page.scss'],
})
export class HistoryPage implements OnInit, OnDestroy {
  private firebase = inject(FirebaseService);
  private statisticsService = inject(StatisticsService);
  private router = inject(Router);

  stats: UserStatistics | null = null;
  loading = true;

  historyFilter: 'training' | 'challenges' = 'training';
  expandedSessionIndex: number | null = null;
  filteredSessions: any[] = [];

  async ngOnInit() {
    await this.loadHistory();
  }

  ngOnDestroy() {}

  async ionViewWillEnter() {
    await this.loadHistory();
  }

  async loadHistory() {
    await this.firebase.auth.authStateReady();
    const user = this.firebase.auth.currentUser;
    if (!user) {
      this.router.navigate(['/auth/welcome']);
      return;
    }

    try {
      this.loading = true;
      this.stats = await this.statisticsService.getUserStatistics(user.uid);
      this.filterSessions();
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      this.loading = false;
    }
  }

  setHistoryFilter(filter: 'training' | 'challenges') {
    this.historyFilter = filter;
    this.expandedSessionIndex = null;
    this.filterSessions();
  }

  filterSessions() {
    if (!this.stats) return;

    if (this.historyFilter === 'training') {
      this.filteredSessions = this.stats.sessionHistory.filter(
        (session) => session.source === 'training' || !session.source
      );
    } else if (this.historyFilter === 'challenges') {
      this.filteredSessions = this.stats.sessionHistory.filter(
        (session) => session.source === 'challenge'
      );
    } else {
      this.filteredSessions = this.stats.sessionHistory.filter(
        (session) => session.source === 'challenge'
      );
    }
  }

  toggleSession(index: number) {
    this.expandedSessionIndex = this.expandedSessionIndex === index ? null : index;
  }

  formatDate(date: any): string {
    const d = date?.toDate ? date.toDate() : new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  }

  getCompletionRate(session: any): string {
    const total = session.drillSetup?.numberOfBullets || 0;
    const hits = session.shots?.length || 0;
    return total > 0 ? ((hits / total) * 100).toFixed(1) : '0.0';
  }

  getShotPositionX(shot: any): number {
    return (shot.x / 400) * 100;
  }

  getShotPositionY(shot: any): number {
    return (shot.y / 400) * 100;
  }

  async shareSession(session: any, sessionIndex: number) {
    try {
      const sessionCards = document.querySelectorAll(
        '.session-card.expanded .session-details'
      );
      const sessionCard = sessionCards[0] as HTMLElement;
      if (!sessionCard) return;

      const canvas = await html2canvas(sessionCard, {
        backgroundColor: '#202020',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      const base64Data = canvas.toDataURL('image/png');
      const base64String = base64Data.split(',')[1];
      const fileName = `shooting-session-${Date.now()}.png`;

      try {
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: base64String,
          directory: Directory.Cache,
        });

        await Share.share({
          title: 'My Shooting Session',
          text: `Check out my shooting session! ${session.shots.length}/${session.drillSetup.numberOfBullets} hits at ${session.drillSetup.distance}m`,
          url: savedFile.uri,
          dialogTitle: 'Share your session',
        });

        setTimeout(async () => {
          try {
            await Filesystem.deleteFile({ path: fileName, directory: Directory.Cache });
          } catch {}
        }, 5000);
      } catch {
        const link = document.createElement('a');
        link.download = fileName;
        link.href = base64Data;
        link.click();
      }
    } catch (error) {
      console.error('Error sharing session:', error);
    }
  }
}
