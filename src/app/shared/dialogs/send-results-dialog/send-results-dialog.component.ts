import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonSpinner,
} from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';
import { LahavSessionService } from '@core/services/lahav-session.service';

export interface SendResultsData {
  shooterId: string;
  shooterName: string;
  shooterEmail: string;
  sessionId: string;
  stats: {
    shots: number;
    totalTime: number;
    avgDistance: number;
    score: number;
  };
}

@Component({
  selector: 'app-send-results-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonSpinner,
  ],
  templateUrl: './send-results-dialog.component.html',
  styleUrls: ['./send-results-dialog.component.scss'],
})
export class SendResultsDialogComponent implements OnInit {
  @Input() data!: SendResultsData;

  private modalController = inject(ModalController);
  private lahavService = inject(LahavSessionService);

  email = '';
  isSending = false;
  errorMessage = '';

  ngOnInit(): void {
    this.email = this.data.shooterEmail;
  }

  async sendEmail(): Promise<void> {
    this.isSending = true;
    this.errorMessage = '';

    try {
      const functions = getFunctions(getApp());
      const sendDrillResults = httpsCallable(functions, 'sendDrillResults');
      await sendDrillResults({
        email: this.email,
        shooterName: this.data.shooterName,
        stats: this.data.stats,
      });
    } catch (err) {
      console.error('[SendResultsDialog] Cloud Function error:', err);
      this.errorMessage = 'Failed to send email. Results still saved.';
    }

    await this.completeAndDismiss();
  }

  async skip(): Promise<void> {
    await this.completeAndDismiss();
  }

  private async completeAndDismiss(): Promise<void> {
    this.isSending = true;
    try {
      await this.lahavService.markShooterComplete(
        this.data.sessionId,
        this.data.shooterId
      );

      const session = this.lahavService.activeSession();
      const allDone = session
        ? await this.lahavService.completeSessionIfDone(session)
        : false;

      this.modalController.dismiss({ allDone });
    } catch (err) {
      console.error('[SendResultsDialog] Error marking complete:', err);
      this.modalController.dismiss({ allDone: false });
    }
  }
}
