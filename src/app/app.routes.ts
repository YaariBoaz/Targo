import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'splash',
    pathMatch: 'full',
  },
  {
    path: 'splash',
    loadComponent: () =>
      import('./shared/components/splash/splash.component').then(
        (m) => m.SplashComponent
      ),
  },
  {
    path: 'tabs',
    loadComponent: () =>
      import('./tabs/tabs.component').then((m) => m.TabsPage),
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./tabs/tabs-home/tabs-home.component').then(
            (m) => m.TabsHomeComponent
          ),
      },
      {
        path: 'training',
        loadComponent: () =>
          import('./tabs/tabs-training/tabs-training.component').then(
            (m) => m.TabsTrainingComponent
          ),
      },
      {
        path: 'challenges',
        loadComponent: () =>
          import('./tabs/tabs-challenges/tabs-challenges.component').then(
            (m) => m.TabsChallengesComponent
          ),
      },
      {
        path: 'statistics',
        loadComponent: () =>
          import('./tabs/tabs-statistics/tabs-statistics.component').then(
            (m) => m.TabsStatisticsComponent
          ),
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./features/profile/pages/profile/profile.page').then(
        (m) => m.ProfilePage
      ),
    canActivate: [authGuard],
  },
  {
    path: 'store',
    loadComponent: () =>
      import('./features/store/pages/store/store.page').then(
        (m) => m.StorePage
      ),
    canActivate: [authGuard],
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./features/settings/pages/settings/settings.page').then(
        (m) => m.SettingsPage
      ),
    canActivate: [authGuard],
  },
  {
    path: 'settings-detail',
    loadComponent: () =>
      import('./features/settings/pages/settings-detail/settings-detail.page').then(
        (m) => m.SettingsDetailPage
      ),
    canActivate: [authGuard],
  },
  {
    path: 'challenges-list',
    loadComponent: () =>
      import('./features/challenges/pages/challenges/challenges.page').then(
        (m) => m.ChallengesPage
      ),
    canActivate: [authGuard],
  },
  {
    path: 'challenge-drills/:id',
    loadComponent: () =>
      import('./features/challenges/pages/challenge-drills/challenge-drills.page').then(
        (m) => m.ChallengeDrillsPage
      ),
    canActivate: [authGuard],
  },
  {
    path: 'ble-connection',
    loadComponent: () =>
      import('./features/ble/pages/ble-connection/ble-connection.page').then(
        (m) => m.BLEConnectionPage
      ),
    canActivate: [authGuard],
  },
  {
    path: 'drill',
    canActivate: [authGuard],
    children: [
      {
        path: 'prepare',
        loadComponent: () =>
          import('./features/drill/pages/prepare/drill-prepare.page').then(
            (m) => m.DrillPreparePage
          ),
      },
      {
        path: 'countdown',
        loadComponent: () =>
          import('./features/drill/pages/countdown/drill-countdown.page').then(
            (m) => m.DrillCountdownPage
          ),
      },
      {
        path: 'shooting',
        loadComponent: () =>
          import('./features/drill/pages/shooting/drill-shooting.page').then(
            (m) => m.DrillShootingPage
          ),
      },
    ],
  },
  {
    path: 'auth',
    children: [
      {
        path: 'welcome',
        loadComponent: () =>
          import('./features/auth/pages/welcome/welcome.page').then(
            (m) => m.WelcomePage
          ),
      },
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/pages/login/login.page').then(
            (m) => m.LoginPage
          ),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/pages/register/register.page').then(
            (m) => m.RegisterPage
          ),
      },
      {
        path: '',
        redirectTo: 'welcome',
        pathMatch: 'full',
      },
    ],
  },
];
