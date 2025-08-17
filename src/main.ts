import { bootstrapApplication, HammerModule } from '@angular/platform-browser';
import 'hammerjs';
import {
  HammerGestureConfig,
  HAMMER_GESTURE_CONFIG,
} from '@angular/platform-browser';
import {
  RouteReuseStrategy,
  provideRouter,
  withPreloading,
  PreloadAllModules,
} from '@angular/router';
import {
  IonicRouteStrategy,
  provideIonicAngular,
} from '@ionic/angular/standalone';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
  ScatterController,
  DoughnutController,
} from 'chart.js';
import { AppHammerConfig } from './app/shared/services/app-hammer-config.service';
import { importProvidersFrom } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { Clock3, Crosshair, Focus, Percent, Trophy, Globe } from 'lucide'; // ✅ RIGHT import
import { FirebaseService } from './app/shared/services/firebase.service';
Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale, // ✅ the one that fixes your error
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
  ScatterController,
  DoughnutController
);

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    FirebaseService,
    importProvidersFrom(HammerModule),
    { provide: HAMMER_GESTURE_CONFIG, useClass: AppHammerConfig },
    provideIonicAngular(),
    provideAnimations(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    importProvidersFrom(
      LucideAngularModule.pick({
        Clock3,
        Crosshair,
        Focus,
        Percent,
        Trophy,
        Globe,
      })
    ),
  ],
});
