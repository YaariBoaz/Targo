import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { refreshOutline } from 'ionicons/icons';
import { LahavSessionService } from '@core/services/lahav-session.service';
import { LahavSession } from '@models/lahav.model';

@Component({
  selector: 'app-session-selector',
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
    IonIcon,
  ],
  templateUrl: './session-selector.page.html',
  styleUrls: ['./session-selector.page.scss'],
})
export class SessionSelectorPage implements OnInit, OnDestroy {
  readonly lahavService = inject(LahavSessionService);

  constructor() {
    addIcons({ refreshOutline });
  }

  ngOnInit(): void {
    console.log('[SessionSelectorPage] ngOnInit - calling watchSessions');
    this.lahavService.watchSessions();
  }

  ngOnDestroy(): void {
    this.lahavService.stopWatchingSessions();
  }

  refresh(): void {
    this.lahavService.watchSessions();
  }

  selectSession(session: LahavSession): void {
    this.lahavService.selectSession(session);
  }
}
