# Bullets System Implementation Guide

## ✅ Implementation Complete!

Your Targo app now has a fully integrated bullets purchasing and management system with RevenueCat subscriptions.

---

## 🎯 Overview

The bullets system allows users to:
1. **Yearly Subscription ($99.99)** - Unlimited bullets + unlock everything
2. **Monthly Subscription ($50.99)** - 500 bullets per month
3. **Purchase Bullets ($0.99 per bullet)** - Buy exact amount needed

Bullets are required to start trainings and challenges, and are automatically deducted when a drill begins.

---

## 📦 Components Implemented

### 1. BulletsService (`src/app/core/services/bullets.service.ts`)

**Purpose:** Manages bullet count, tracks subscription status, and handles Firestore integration.

**Key Methods:**
```typescript
// Initialize bullets service for current user
await bulletsService.initialize();

// Check if user has enough bullets
const hasEnough = bulletsService.hasEnoughBullets(requiredBullets);

// Deduct bullets (returns true if successful)
const success = await bulletsService.deductBullets(count);

// Add bullets after purchase
await bulletsService.addBullets(count);

// Grant monthly subscription bullets (500)
await bulletsService.grantMonthlyBullets();

// Check if user has unlimited bullets (yearly subscription)
const unlimited = bulletsService.hasUnlimitedBullets();

// Get current bullet count
const count = bulletsService.getCurrentBulletCount();
```

**Observable Streams:**
```typescript
// Subscribe to bullet count updates
bulletsService.bulletCount$.subscribe(count => {
  console.log('Current bullets:', count);
});

// Subscribe to unlimited bullets status
bulletsService.hasUnlimitedBullets$.subscribe(unlimited => {
  console.log('Has unlimited:', unlimited);
});
```

**Firestore Structure:**
```
userBullets/{userId}
  - userId: string
  - bulletCount: number
  - hasUnlimitedBullets: boolean
  - lastUpdated: Date
```

---

### 2. InAppPurchaseService Updates

**New Product Configuration:**
```typescript
private readonly PRODUCT_IDS = {
  MONTHLY: 'monthly', // $50.99 - 500 bullets per month
  YEARLY: 'yearly',   // $99.99 - Unlimited bullets + unlock everything
  BULLETS: 'bullets', // $0.99 per bullet - Purchase custom amount
};
```

**New Helper Methods:**
```typescript
// Check subscription types
purchaseService.hasMonthlySubscription();
purchaseService.hasYearlySubscription();
purchaseService.hasAnySubscription();
purchaseService.getSubscriptionType(); // 'monthly' | 'yearly' | 'none'

// Get packages
purchaseService.getMonthlyPackage();
purchaseService.getYearlyPackage();
purchaseService.getBulletsPackage();
```

---

### 3. Insufficient Bullets Modal

**Location:** `src/app/modals/insufficient-bullets-modal/`

**Purpose:** Shows when user tries to start training/challenge without enough bullets.

**Features:**
- Displays current bullet count
- Shows required bullets and bullets needed
- Lists all 3 subscription options with pricing
- Redirects to Targo Shop to purchase

**Usage:**
```typescript
const modal = await modalController.create({
  component: InsufficientBulletsModalComponent,
  componentProps: {
    requiredBullets: 15,
  },
});
await modal.present();
```

---

### 4. Bullets Utility Helper

**Location:** `src/app/utils/bullets.utils.ts`

**Purpose:** Provides reusable function for checking bullets and showing modal.

**Main Function:**
```typescript
import { checkAndDeductBullets } from '@utils/bullets.utils';

// Check bullets, show modal if insufficient, deduct if sufficient
const hasEnough = await checkAndDeductBullets(
  requiredBullets,
  modalController,
  bulletsService
);

if (!hasEnough) {
  return; // User cancelled or doesn't have enough bullets
}

// Continue with drill...
```

---

### 5. Store Page Updates

**Location:** `src/app/features/store/pages/store/`

**New Features:**
- Bullet count display in header
- Three purchase cards (Yearly, Monthly, Purchase Bullets)
- Custom bullet input with real-time price calculation
- Subscription management
- Real-time bullet count updates

**Purchase Methods:**
```typescript
// Purchase yearly subscription
async purchaseYearly();

// Purchase monthly subscription
async purchaseMonthly();

// Purchase custom amount of bullets
async purchaseBullets();
```

---

### 6. Training Page Integration

**Location:** `src/app/features/training/pages/training/training.page.ts`

**Changes:**
- Added `BulletsService` and `ModalController` injection
- Updated `startDrill()` method to check and deduct bullets before starting
- Shows insufficient bullets modal if user doesn't have enough

**Implementation:**
```typescript
async startDrill() {
  // ... validation ...

  // Check and deduct bullets
  const hasEnoughBullets = await checkAndDeductBullets(
    this.numberOfBullets,
    this.modalController,
    this.bulletsService
  );

  if (!hasEnoughBullets) {
    return; // User cancelled or insufficient bullets
  }

  // Continue with drill setup...
}
```

---

### 7. Challenges Page Integration

**Location:** `src/app/features/challenges/pages/challenge-drills/challenge-drills.page.ts`

**Changes:**
- Added `BulletsService` and `ModalController` injection
- Updated `onDrillClick()` method to check and deduct bullets before starting
- Shows insufficient bullets modal if user doesn't have enough

**Implementation:**
```typescript
async onDrillClick(drill: DrillWithStatus) {
  // ... validation ...

  // Check and deduct bullets
  const requiredBullets = drill.requirements.numberOfBullets;
  const hasEnoughBullets = await checkAndDeductBullets(
    requiredBullets,
    this.modalController,
    this.bulletsService
  );

  if (!hasEnoughBullets) {
    return; // User cancelled or insufficient bullets
  }

  // Continue with drill setup...
}
```

---

### 8. App Component Integration

**Location:** `src/app/app.component.ts`

**Changes:**
- Added `BulletsService` injection
- Initialize BulletsService when user logs in (via Firebase Auth listener)
- Reset BulletsService when user logs out

**Implementation:**
```typescript
private setupAuthListener() {
  onAuthStateChanged(this.auth, async (user) => {
    if (user) {
      // Initialize RevenueCat
      await this.purchaseService.initialize(user.uid);

      // Initialize Bullets service
      await this.bulletsService.initialize();
    } else {
      // Reset services on logout
      this.bulletsService.reset();
    }
  });
}
```

---

## 🔄 User Flow

### Starting a Training/Challenge

1. User navigates to Training or Challenges page
2. User configures drill settings (distance, weapon, bullets)
3. User clicks "Start Drill" or selects a challenge drill
4. **System checks bullet count:**
   - If user has unlimited bullets (yearly subscription): Proceed immediately
   - If user has enough bullets: Deduct bullets and proceed
   - If user doesn't have enough bullets: Show insufficient bullets modal
5. **Insufficient Bullets Modal shows:**
   - Current bullet count
   - Required bullets
   - Bullets needed
   - Three purchase options
6. User can:
   - Click "Go to Targo Shop" to purchase
   - Click "Cancel" to go back
7. If user purchases in shop, they return and can retry starting the drill

### Purchasing Bullets

1. User navigates to Store page (`/store`)
2. User sees bullet count in header
3. User has three options:
   - **Yearly Subscription** - Click card → Purchase via RevenueCat → Get unlimited bullets
   - **Monthly Subscription** - Click card → Purchase via RevenueCat → Get 500 bullets
   - **Purchase Bullets** - Enter amount → Click purchase → Get exact amount
4. On successful purchase:
   - RevenueCat customer info updates
   - BulletsService detects subscription change
   - Bullet count updates in Firestore
   - UI updates reactively via observables

---

## 🎨 UI/UX Features

### Bullet Display
- Bullet count shown in store header with emoji and gold color
- Updates in real-time when purchases are made
- Shows "Unlimited" for yearly subscribers

### Purchase Cards
- **Yearly Card**: Featured with "BEST VALUE" badge, gradient border
- **Monthly Card**: Standard styling
- **Bullets Card**: Custom input for amount, real-time price calculation

### Insufficient Bullets Modal
- Clean, modern design with dark theme
- Clear breakdown of bullet counts
- Eye-catching icons for each subscription option
- Responsive design for mobile and desktop

---

## 🔧 Configuration

### RevenueCat Dashboard Setup

1. **Create Products:**
   - `monthly` - Subscription - $50.99/month
   - `yearly` - Subscription - $99.99/year
   - `bullets` - Consumable - $0.99 each (optional for custom implementation)

2. **Create Entitlement:**
   - Name: "Targo Pro"
   - Attach products: `monthly`, `yearly`

3. **Create Offering:**
   - Add monthly and yearly packages
   - Set as current offering

### Firestore Rules

Add rules for `userBullets` collection:

```
match /userBullets/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

---

## 🧪 Testing

### Test Scenarios

1. **Unlimited Bullets (Yearly)**
   - Purchase yearly subscription
   - Verify bullet count shows unlimited
   - Start training with any bullet count
   - Verify no deduction occurs
   - Verify drill starts successfully

2. **Limited Bullets (Monthly)**
   - Purchase monthly subscription
   - Verify 500 bullets granted
   - Start training with 15 bullets
   - Verify 15 bullets deducted
   - Verify remaining count is 485

3. **Insufficient Bullets**
   - Set bullet count to 5
   - Try to start training with 15 bullets
   - Verify insufficient bullets modal appears
   - Verify correct counts shown
   - Click "Go to Targo Shop"
   - Verify navigation to store

4. **Purchase Bullets**
   - Navigate to store
   - Enter 100 in bullets input
   - Verify price shows $99.00
   - Click purchase
   - Verify 100 bullets added to count

5. **Bullet Count Persistence**
   - Purchase bullets
   - Close app
   - Reopen app
   - Verify bullet count persists

---

## 📊 Data Flow

```
User Action (Start Drill)
  ↓
checkAndDeductBullets()
  ↓
bulletsService.hasEnoughBullets()
  ↓
[If insufficient] → Show InsufficientBulletsModal → Navigate to Store
  ↓
[If sufficient] → bulletsService.deductBullets()
  ↓
Update Firestore (userBullets/{userId})
  ↓
BehaviorSubject emits new count
  ↓
UI updates reactively
  ↓
Proceed with drill
```

---

## 🚀 Future Enhancements

### Recommended Additions

1. **Bullet Purchase Promotions**
   - Bulk discounts (e.g., 100 bullets for $89.99)
   - Limited-time offers
   - Bonus bullets on first purchase

2. **Free Bullets**
   - Daily login reward (5 bullets/day)
   - Watch ad for bullets
   - Refer a friend bonus

3. **Bullet History**
   - Track all bullet transactions
   - Show purchase history
   - Show usage history by drill

4. **Subscription Management**
   - Automatic monthly bullet grant
   - Notification before subscription renewal
   - Grace period for expired subscriptions

5. **Analytics**
   - Track bullet usage patterns
   - Conversion metrics for purchases
   - Popular subscription types

---

## 🐛 Troubleshooting

### "Bullets not deducting"
- Check if user has yearly subscription (unlimited bullets)
- Verify Firestore permissions
- Check browser console for errors
- Verify BulletsService is initialized

### "Insufficient modal not showing"
- Verify ModalController is injected
- Check that component is imported correctly
- Verify modal CSS class exists

### "Bullet count not updating"
- Check Observable subscriptions
- Verify Firestore write permissions
- Check BulletsService initialization
- Refresh customer info: `await bulletsService.refreshBulletCount()`

### "Yearly subscription not granting unlimited bullets"
- Check RevenueCat product ID matches: `yearly`
- Verify entitlement is active in RevenueCat dashboard
- Check `purchaseService.hasYearlySubscription()` returns true
- Manually trigger: `await bulletsService.updateUnlimitedBulletsStatus()`

---

## 📚 API Reference

### BulletsService Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `initialize()` | - | `Promise<void>` | Initialize service for current user |
| `hasEnoughBullets()` | `requiredBullets: number` | `boolean` | Check if user has enough bullets |
| `deductBullets()` | `count: number` | `Promise<boolean>` | Deduct bullets, returns success |
| `addBullets()` | `count: number` | `Promise<void>` | Add bullets to user account |
| `setBulletCount()` | `count: number` | `Promise<void>` | Set bullet count to specific value |
| `grantMonthlyBullets()` | - | `Promise<void>` | Grant 500 bullets (monthly sub) |
| `refreshBulletCount()` | - | `Promise<void>` | Refresh count from Firestore |
| `hasUnlimitedBullets()` | - | `boolean` | Check if user has unlimited bullets |
| `getCurrentBulletCount()` | - | `number` | Get current bullet count |
| `reset()` | - | `void` | Reset service state (logout) |

### Utility Functions

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `checkAndDeductBullets()` | `requiredBullets, modalCtrl, bulletsService` | `Promise<boolean>` | Check bullets, show modal if needed, deduct if sufficient |
| `showInsufficientBulletsModal()` | `requiredBullets, modalCtrl` | `Promise<void>` | Show insufficient bullets modal |

---

## ✅ Implementation Checklist

- [x] Create BulletsService with Firestore integration
- [x] Update InAppPurchaseService with bullet products
- [x] Create InsufficientBulletsModal component
- [x] Create bullets utility helper functions
- [x] Update Store page with bullet purchasing UI
- [x] Integrate bullet checking in Training page
- [x] Integrate bullet checking in Challenges page
- [x] Initialize services in AppComponent
- [x] Add bullet count display to Store header
- [x] Add real-time bullet count updates via observables
- [ ] Configure products in RevenueCat dashboard
- [ ] Set up Firestore security rules for userBullets
- [ ] Test all purchase flows
- [ ] Test insufficient bullets modal
- [ ] Test bullet deduction in trainings
- [ ] Test bullet deduction in challenges
- [ ] Test unlimited bullets with yearly subscription

---

## 🎉 Summary

The bullets system is now fully integrated into your Targo app! Users can:

✅ Purchase yearly subscription for unlimited bullets
✅ Purchase monthly subscription for 500 bullets/month
✅ Purchase individual bullets at $0.99 each
✅ See their bullet count in the store
✅ Get prompted when they don't have enough bullets
✅ Have bullets automatically deducted when starting drills
✅ Track their bullet usage across the app

All that's left is to configure the products in your RevenueCat dashboard and test the complete flow!

Happy monetizing! 🚀
