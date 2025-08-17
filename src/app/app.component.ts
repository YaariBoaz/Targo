import { Component } from '@angular/core';
import { HomePage } from './home/home.page';
import { EdgeToEdge } from '@capawesome/capacitor-android-edge-to-edge-support';
import { App } from '@capacitor/app';
import { NavigationService } from './shared/services/navigation.service';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [HomePage],
  standalone: true,
})
export class AppComponent {
  constructor(private nav: NavigationService) {
    this.changeColor();

    App.addListener('backButton', ({ canGoBack }) => {
      if (this.nav.canGoBack()) {
        this.nav.pop();
      } else {
        App.exitApp();
      }
    });
  }

  async changeColor() {
    await EdgeToEdge.setBackgroundColor({ color: '#ffffff' }); // Replace with your desired color
  }
}
