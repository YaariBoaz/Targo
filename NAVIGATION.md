# Navigation Architecture

## Overview

The TARGO app uses a **Hybrid Navigation System** combining Angular Router with Ionic's IonNav for a truly native mobile experience.

## Architecture Pattern

```
├── Splash Screen (Router)
│
├── Auth Flow (Router)
│   ├── Login
│   └── Register
│
└── Tabs (Router - Tab Level)
    ├── Home Tab (IonNav - Stack Navigation)
    │   ├── HomePage (root)
    │   └── → SessionDetailPage
    │       └── → SessionResultsPage
    │
    ├── Training Tab (IonNav - Stack Navigation)
    │   ├── TrainingPage (root)
    │   └── → TrainingDetailPage
    │
    ├── Challenges Tab (IonNav - Stack Navigation)
    │   ├── ChallengesPage (root)
    │   └── → ChallengeDetailPage
    │
    └── Statistics Tab (IonNav - Stack Navigation)
        ├── StatisticsPage (root)
        └── → DetailedStatsPage
```

## Why This Approach?

✅ **Native Feel** - iOS/Android-style stack navigation
✅ **Component Persistence** - Pages stay in memory when navigating
✅ **Smooth Animations** - Native slide/fade transitions
✅ **State Preservation** - No component re-creation on back
✅ **Tab Independence** - Each tab has its own navigation stack
✅ **Best of Both Worlds** - Router for tabs, IonNav for stacks

## Services

### 1. NavigationService

Handles **tab-level** navigation using Angular Router.

**Location:** `src/app/core/services/navigation.service.ts`

**Usage:**
```typescript
constructor(private nav: NavigationService) {}

// Navigate to a tab
this.nav.navigateToTab('home');

// Navigate to auth
this.nav.navigateToLogin();

// Navigate with animation
this.nav.navigateForward('/some/path');
this.nav.goBack();
```

### 2. StackNavigationService

Handles **stack navigation within tabs** using IonNav.

**Location:** `src/app/core/services/stack-navigation.service.ts`

**Usage:**
```typescript
constructor(private stackNav: StackNavigationService) {}

// Push a page onto the stack
await this.stackNav.push(DetailPage, { id: 123 });

// Go back
await this.stackNav.pop();

// Go to root of tab
await this.stackNav.popToRoot();

// Replace root
await this.stackNav.setRoot(NewRootPage);

// Check if can go back
const canGoBack = await this.stackNav.canGoBack();
```

## Tab Containers

Each tab has a container component that wraps IonNav:

- `TabsHomeComponent` - Wraps Home stack
- `TabsTrainingComponent` - Wraps Training stack
- `TabsChallengesComponent` - Wraps Challenges stack
- `TabsStatisticsComponent` - Wraps Statistics stack

These containers:
1. Initialize IonNav with root page
2. Register nav controller with StackNavigationService
3. Maintain independent navigation stacks
4. Preserve state when switching tabs

## Creating New Stack Pages

### Step 1: Create Page Component

```typescript
import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/angular/standalone';
import { StackNavigationService } from '@core/services/stack-navigation.service';

@Component({
  selector: 'app-detail',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button (click)="goBack()">
            <ion-icon name="arrow-back"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Detail</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <p>Detail content here</p>
    </ion-content>
  `
})
export class DetailPage {
  constructor(private stackNav: StackNavigationService) {}

  goBack() {
    this.stackNav.pop();
  }
}
```

### Step 2: Navigate to It

```typescript
// From any page within a tab
constructor(private stackNav: StackNavigationService) {}

openDetail() {
  this.stackNav.push(DetailPage, { id: 123 });
}
```

## Navigation Patterns

### Pattern 1: Tab Navigation (Top Level)

```typescript
// Use NavigationService
this.navigationService.navigateToTab('training');
```

### Pattern 2: Stack Navigation (Within Tab)

```typescript
// Use StackNavigationService
this.stackNav.push(DetailPage);
```

### Pattern 3: Modal Presentation

```typescript
// Use Ionic ModalController (separate from navigation)
const modal = await this.modalController.create({
  component: SessionModalComponent
});
await modal.present();
```

### Pattern 4: Deep Linking

```typescript
// Navigate to tab then push to stack
this.navigationService.navigateToTab('home');
// Then push to stack after tab loads
this.stackNav.push(SessionDetailPage, { id: 123 });
```

## Animations

### Default Animations

- **iOS**: Slide from right (push), slide to right (pop)
- **Android**: Material fade + elevation
- Automatically applied by IonNav

### Custom Animations

You can customize transitions per navigation:

```typescript
await this.stackNav.push(DetailPage, { id: 123 }, {
  animated: true,
  animation: 'ios-transition' // or 'md-transition'
});
```

## Back Button Handling

### Hardware Back Button (Android)

Ionic automatically handles hardware back button:
1. Pops stack if pages exist
2. Exits app if on root page

### Custom Back Button in Header

```typescript
async goBack() {
  const canGoBack = await this.stackNav.canGoBack();
  if (canGoBack) {
    this.stackNav.pop();
  } else {
    // On root, maybe navigate to another tab or show exit prompt
  }
}
```

## State Management

### Tab State Persistence

When you switch tabs, the navigation stack is **preserved**:

1. User is on Home → Detail → Edit
2. User switches to Training tab
3. User switches back to Home tab
4. User is still on Edit page (state preserved!)

### Clearing Tab Stack

To reset a tab to its root:

```typescript
await this.stackNav.popToRoot('home');
```

## Best Practices

✅ **DO** use NavigationService for tab-level navigation
✅ **DO** use StackNavigationService for in-tab stack navigation
✅ **DO** pass data via navigation params
✅ **DO** implement proper back button handling
✅ **DO** check canGoBack() before popping

❌ **DON'T** mix Router.navigate() with stack navigation
❌ **DON'T** destroy components manually
❌ **DON'T** use browser back button (disable it)
❌ **DON'T** navigate directly to pages that should be in a stack

## Troubleshooting

### Issue: Component not displaying
**Solution:** Check that the tab container is registered with StackNavigationService

### Issue: Back button not working
**Solution:** Ensure you're calling `stackNav.pop()` not `router.back()`

### Issue: State lost on tab switch
**Solution:** This shouldn't happen. Check that you're using IonNav properly.

### Issue: Animation not smooth
**Solution:** Ensure page has proper ion-header/ion-content structure

## Example: Complete Flow

```typescript
// 1. User logs in (NavigationService)
this.navigationService.navigateToHome();

// 2. User taps on session card (StackNavigationService)
this.stackNav.push(SessionDetailPage, { sessionId: '123' });

// 3. User taps "View Results" (StackNavigationService)
this.stackNav.push(SessionResultsPage, { sessionId: '123' });

// 4. User taps back twice
this.stackNav.pop(); // Back to SessionDetailPage
this.stackNav.pop(); // Back to HomePage

// 5. User switches to Training tab (NavigationService)
this.navigationService.navigateToTab('training');

// 6. User switches back to Home tab
// Still on HomePage (stack was preserved)
```

---

**This architecture provides a native app experience while leveraging Angular's powerful routing for top-level navigation.**
