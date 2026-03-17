# Targo 2.0 — Developer Skill Document

## Project Overview

Targo is an Angular 17+ standalone shooting-training app (Ionic + Capacitor Android) that connects to a Bluetooth LE smart target. Users run timed drills, receive shot data from the BLE target, track performance over time, and compete on leaderboards and challenges.

- **Stack:** Angular 20 (standalone), Ionic 8.7, Capacitor 7.4, Firebase 12, AngularFire v20
- **Platform:** Android (primary), iOS (planned)
- **App ID:** `com.adl.targo`
- **Firebase Project:** `adl-backend`

---

## Critical Architecture Rules

### Firebase — Single Init Pattern

`FirebaseService` (`src/app/shared/services/firebase.service.ts`) is the **single source of truth** for Firebase. It uses vanilla Firebase SDKs (not AngularFire wrappers).

```typescript
// CORRECT — always use this pattern for Firestore queries
private firebase = inject(FirebaseService);
const snapshot = await getDocs(collection(this.firebase.db, 'path'));

// WRONG — AngularFire wrappers SILENTLY HANG outside Angular injection context
private firestore = inject(Firestore); // DO NOT USE
```

AngularFire `getDocs`, `getDoc`, `setDoc`, `updateDoc`, `addDoc`, `collection`, `doc`, `query`, `orderBy` — all hang when called from async RxJS callbacks. Always use `FirebaseService.db` + vanilla `firebase/firestore` imports.

Auth via `inject(Auth)` from `@angular/fire/auth` is safe in component constructors only.

### Ionic Mode

App runs in **iOS mode** (`provideIonicAngular({ mode: 'ios' })`). All Ionic components render with iOS styling regardless of platform.

### Standalone Components

All components, pages, and pipes are **standalone** (no NgModules). Import dependencies directly in `@Component({ imports: [...] })`.

---

## Directory Structure

```
src/app/
├── app.routes.ts           # All routes (lazy-loaded)
├── app.config.ts           # App providers (Firebase, Ionic, Router)
├── app.component.ts        # Root component
├── core/
│   ├── feature-flags.ts    # Boolean feature toggles (as const)
│   ├── guards/auth.guard.ts
│   └── services/           # Business logic services (21 services)
├── features/               # Lazy-loaded feature pages (14+ modules)
├── models/                 # TypeScript interfaces (index.ts barrel)
├── shared/
│   ├── components/         # Reusable UI components
│   ├── dialogs/            # Modals (buy-bullets, post-drill, pro-plan)
│   ├── services/           # firebase.service.ts, user.service.ts
│   └── pipes/
├── tabs/                   # Bottom tab navigation
└── utils/                  # Pure utility functions
```

---

## Routing

All routes are lazy-loaded with `loadComponent()`. Protected routes use `authGuard`.

| Route | Page | Guard |
|-------|------|-------|
| `/` | → redirect `/splash` | — |
| `/splash` | SplashComponent | — |
| `/onboarding` | OnboardingPage | — |
| `/auth/welcome` | WelcomePage | — |
| `/auth/login` | LoginPage | — |
| `/auth/register` | RegisterPage | — |
| `/auth/forgot-password` | ForgotPasswordPage | — |
| `/tabs/home` | HomePage | authGuard |
| `/tabs/training` | TrainingPage | authGuard |
| `/tabs/challenges` | ChallengesPage | authGuard |
| `/tabs/statistics` | StatisticsPage | authGuard |
| `/drill/prepare` | DrillPreparePage | authGuard |
| `/drill/countdown` | DrillCountdownPage | authGuard |
| `/drill/shooting` | DrillShootingPage | authGuard |
| `/challenge-drills/:id` | ChallengeDrillsPage | authGuard |
| `/ble-connection` | BleConnectionPage | authGuard |
| `/profile` | ProfilePage | authGuard |
| `/store` | StorePage | authGuard |
| `/settings` | SettingsPage | authGuard |
| `/friends/list` | FriendsListPage | authGuard |
| `/friends/add` | AddFriendsPage | authGuard |
| `/friends/requests` | FriendRequestsPage | authGuard |
| `/invite-players` | InvitePlayersPage | authGuard |
| `/multiplayer-lobby` | MultiplayerLobbyPage | authGuard |
| `/history` | HistoryPage | authGuard |

**Auth Guard logic:** passes if `authService.isAuthenticated` OR `guestService.isGuestMode`. Redirects to `/auth/welcome`.

---

## Bottom Tabs

`src/app/tabs/tabs.component.ts` — 4 tabs controlled by feature flags:

| Tab | Flag | Route |
|-----|------|-------|
| Home | always on | `tabs/home` |
| Training | `tabTraining` | `tabs/training` |
| Challenges | `tabChallenges` | `tabs/challenges` |
| Statistics | `tabStatistics` | `tabs/statistics` |

Optional bullet-count button (`tabBulletCount`) shown between Challenges and Statistics. Tab switches broadcast via `TabRefreshService.tabChange$`.

---

## Feature Flags

`src/app/core/feature-flags.ts` — single `as const` object:

```typescript
FEATURE_FLAGS = {
  homeMultiplayerPanel: false,
  homeChallengesSection: true,
  homeSpecialOffersBanner: false,
  homeStatisticsSection: true,
  tabTraining: true,
  tabBulletCount: false,
  tabChallenges: true,
  tabStatistics: true,
  challengesGlobalTab: false,
  challengesMyTab: true,
  challengesHeroesTab: false,
  statsLeaderboard: true,
  statsInsightsTab: true,
  statsHistoryTab: true,
  settingsUpgradeBanner: true,
}
```

Toggle features here without touching component logic.

---

## Services Reference

### Core Services (`src/app/core/services/`)

| Service | File | Purpose |
|---------|------|---------|
| AuthService | `auth.ts` | Email/password, Google, Facebook sign-in; `isAuthenticated` boolean |
| DrillService | `drill.service.ts` | Store/retrieve drill sessions; `setCurrentDrillSetup()`, `saveDrillSession()` |
| StatisticsService | `statistics.service.ts` | Calculate hit ratios, accuracy history; 5-min cache; call `invalidateCache(uid)` after drill |
| LeaderboardService | `leaderboard.service.ts` | Global and per-challenge leaderboards |
| ChallengeService | `challenge.service.ts` | Challenge CRUD, progress tracking, `updateDrillAttempt()` |
| BleService | `ble.service.ts` | BLE device scan/connect; `shotData$` observable for live shot coordinates |
| BulletsService | `bullets.service.ts` | Check/deduct bullet balance |
| UserService (core) | `user.service.ts` | User profile, search |
| FriendService | `friend.service.ts` | Friend requests, connections |
| MultiplayerService | `multiplayer.service.ts` | Session state (BehaviorSubject) |
| PresenceService | `presence.service.ts` | Online/offline status tracking |
| OnboardingService | `onboarding.service.ts` | Onboarding flow state |
| GuestService | `guest.service.ts` | Guest mode flag |
| TabRefreshService | `tab-refresh.service.ts` | Broadcasts `tabChange$` to reload tab data |
| NavigationService | `navigation.service.ts` | Navigation helpers |
| StorageService | `storage.service.ts` | Capacitor filesystem storage |
| TipsService | `tips.service.ts` | Random drill tips from Firestore |
| InAppPurchaseService | `in-app-purchase.service.ts` | RevenueCat IAP integration |
| LocationService | `location.service.ts` | GPS location |

### Shared Services (`src/app/shared/services/`)

| Service | File | Purpose |
|---------|------|---------|
| FirebaseService | `firebase.service.ts` | **SINGLE FIREBASE INIT.** Use `.auth` and `.db` |
| UserService (shared) | `user.service.ts` | User Firestore operations via FirebaseService.db |

---

## Models Reference

All exported from `src/app/models/index.ts`:

| Model | Key Fields |
|-------|-----------|
| `User` | uid, email, displayName, photoURL |
| `UserProfile` | uid, username, rank, bullets, stats |
| `DrillSetup` | weapon, distance, bulletCount, source ('training'|'challenge') |
| `DrillResult` | shots[], totalTime, avgSplitTime, avgDistance, hitRatio |
| `DrillSession` | setup, result, timestamp, challengeId? |
| `DrillSessionRecord` | Full shot-by-shot record with coordinates |
| `Shot` | x, y, timestamp, splitTime, distanceFromCenter |
| `Challenge` | id, name, type, difficulty, heroMetadata? |
| `ChallengeDrill` | id, challengeId, order, criteria |
| `ChallengeProgress` | challengeId, completedDrills, drillAttempts |
| `Friendship` | userId, friendId, status, createdAt |
| `PresenceStatus` | uid, online, lastSeen |
| `ShotData` | x, y, timestamp (raw BLE data) |

---

## Firestore Collections

| Collection | Path | Service |
|-----------|------|---------|
| User drill sessions | `users/{uid}/drills/{docId}` | DrillService, StatisticsService |
| User challenge progress | `users/{uid}/challengeProgress/{challengeId}` | ChallengeService |
| Drill attempts | `users/{uid}/challengeProgress/{challengeId}/drillAttempts/{drillId}` | ChallengeService |
| User profiles | `users/{uid}` | UserService |
| Global leaderboard | `user-scores/{uid}` | LeaderboardService |
| Challenge definitions | `challenges/{id}` | ChallengeService |
| Challenge drills | `challenges/{id}/drills/{drillId}` | ChallengeService |
| Challenge leaderboard | `challenges/{id}/leaderboard/{uid}` | LeaderboardService |
| Tips | `tips/{docId}` | TipsService |

---

## Core Drill Flow

1. **Training Page** — select weapon, distance, bullet count → `drillService.setCurrentDrillSetup()`
2. **BLE Check** — if not connected, navigate to `/ble-connection`
3. **Prepare Page** — confirm setup, display weapon/distance
4. **Countdown Page** — 3-2-1 timer
5. **Shooting Page** (`drill-shooting.page.ts`) — main engine:
   - Subscribes to `bleService.shotData$` for live shot coordinates
   - Demo mode available (random shots simulated)
   - Renders hit markers on target SVG
   - Calculates running stats per shot
6. **Completion** → `drillService.saveDrillSession()` → `statisticsService.invalidateCache()` → `leaderboardService.updateUserScore()` → show `DrillCompletionModalComponent`
7. **Challenge drill** also calls `challengeService.updateDrillAttempt()` and navigates back to `/challenge-drills/:id`

---

## Key Utilities

| Utility | File | Purpose |
|---------|------|---------|
| `bulletsUtils` | `utils/bullets.utils.ts` | Check balance, deduct, show purchase modal |
| `calculateADLScore()` | `utils/adl-score.util.ts` | Score + star rating from drill performance |

---

## Shared Components

| Component | Selector | Usage |
|-----------|---------|-------|
| SplashComponent | `app-splash` | Initial loading screen |
| UserHeaderComponent | `app-user-header` | Profile header with rank display |
| HitRatioChartComponent | `app-hit-ratio-chart` | Chart.js hit ratio visualization |
| ChallengeCardComponent | `app-challenge-card` | Single challenge card |
| MultiplayerPanelComponent | `app-multiplayer-panel` | Multiplayer session display |
| SpecialOffersBannerComponent | `app-special-offers-banner` | Promotions banner |

---

## Theming

**Brand Colors (CSS variables in `src/theme/variables.scss`):**

```css
--ion-color-primary: #f6ba16   /* TARGO Gold */
--brand-dark: #0a0a0a
--brand-success-green: #06d6a0
--brand-shooting-red: #e63946
```

**Spacing (8px base):** `--space-xs` (4px) → `--space-xxl` (48px)

**Touch targets:** 48px, 56px, 64px (glove-friendly)

**Z-index layers:** target-display(10), hit-marker(20), modal(1000), toast(2000)

**Font:** Lexend (entire app)

---

## Build & Deploy

```bash
# Dev server
npm run start

# Build APK
npm run build && npx cap sync android && cd android && ./gradlew assembleDebug

# Install to device
C:\Users\User\AppData\Local\Android\Sdk\platform-tools\adb.exe install -r android/app/build/outputs/apk/debug/app-debug.apk

# Launch
adb shell am start -n com.adl.targo/.MainActivity

# Logcat
adb logcat -s "Capacitor/Console"
```

**Test device UID:** `PMqgPfRbCChoPs7mO7As3yLzWzo2`

---

## Statistics Service Caching

`StatisticsService` caches results for **5 minutes** per UID. Two cache keys: full stats and home stats.

- After any drill completion, call `statisticsService.invalidateCache(uid)` to force reload.
- `getHomeStats(uid)` — lightweight subset for home dashboard
- `getFullStats(uid)` — complete analytics including leaderboard rank

---

## Tab Refresh Pattern

Pages that display data subscribe to `TabRefreshService.tabChange$` to reload when their tab becomes active:

```typescript
private tabRefresh = inject(TabRefreshService);

ngOnInit() {
  this.tabRefresh.tabChange$.pipe(
    filter(tab => tab === 'statistics'),
    takeUntilDestroyed(this.destroyRef)
  ).subscribe(() => this.loadData());
}
```

---

## Multiplayer Notes

- `MultiplayerService` state managed via BehaviorSubject
- Shooting page has spectator/betting/chat modes for multiplayer
- Multiplayer drill completion navigates to `/multiplayer-lobby` (not home)
- `PresenceService` tracks online status for lobby display

---

## Adding a New Feature Page

1. Create `src/app/features/{feature}/pages/{page}/{page}.page.ts` (standalone component)
2. Add lazy route to `app.routes.ts`:
   ```typescript
   { path: 'my-page', canActivate: [authGuard],
     loadComponent: () => import('./features/.../page').then(m => m.MyPage) }
   ```
3. Use `inject(FirebaseService)` for any Firestore access — never `inject(Firestore)`
4. Add feature flag to `feature-flags.ts` if conditionally shown
5. Subscribe to `TabRefreshService.tabChange$` if the page lives in a tab

---

## Environment

- `src/environments/environment.ts` — development config
- `src/environments/environment.prod.ts` — production config
- RevenueCat key in environment (test key in dev)
- Firebase config in environment (same project for dev/prod, `adl-backend`)
