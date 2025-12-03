# Bullets System Testing Guide

## Quick Start Testing

### 1. Run the App

```bash
# Start development server
npm start

# Or build and run on Android device
npx cap run android
```

### 2. Test Flow Walkthrough

#### A. Initial Setup (First Time)
1. **Login/Register** to the app
2. Navigate to **Store** page (from Profile or direct navigation)
3. You should see:
   - Bullet count in header (should be 0 initially)
   - Three purchase cards (Yearly, Monthly, Purchase Bullets)

#### B. Test Insufficient Bullets Modal
1. Navigate to **Training** tab
2. Set up a drill with 15 bullets
3. Click **"Start Drill"**
4. **Expected Result:**
   - Insufficient bullets modal should appear
   - Shows current bullets: 0
   - Shows required bullets: 15
   - Shows bullets needed: 15
   - Three subscription options displayed
5. Click **"Go to Targo Shop"**
6. **Expected Result:**
   - Modal closes
   - Navigates to Store page

#### C. Test Bullet Purchase (Mock)
1. In Store page, scroll to **"Purchase Bullets"** card
2. Enter **50** in the input field
3. Total price should show: **$49.50**
4. Click **"Purchase"** button
5. Confirm the purchase dialog
6. **Expected Result:**
   - 50 bullets added
   - Bullet count in header updates to 50
   - Success alert shown

#### D. Test Bullet Deduction
1. Navigate back to **Training** tab
2. Set up a drill with 15 bullets
3. Click **"Start Drill"**
4. **Expected Result:**
   - No modal appears (you have enough bullets)
   - Bullets deducted: 50 - 15 = 35 remaining
   - Navigates to drill preparation screen
5. Go back to Store and verify bullet count is now **35**

#### E. Test Challenge Bullet Deduction
1. Navigate to **Challenges** tab
2. Select a challenge
3. Click on any available drill
4. **Expected Result:**
   - Bullets deducted based on drill requirements
   - Navigate to drill preparation screen

#### F. Test Monthly Subscription (Mock)
1. In Store page, click **"Monthly Subscription"** card
2. **Expected Result:**
   - Purchase confirmation (in test mode, this is mocked)
   - 500 bullets granted
   - Bullet count updates to 500

#### G. Test Yearly Subscription (Mock - Unlimited Bullets)
1. In Store page, click **"Yearly Subscription"** card
2. **Expected Result:**
   - Purchase confirmation
   - "Unlimited Bullets" banner appears at top of Store
   - Bullet count shows unlimited icon or high number
3. Try starting a drill
4. **Expected Result:**
   - No bullets deducted
   - Can start any drill regardless of bullet count

---

## Testing Checklist

### Store Page
- [ ] Bullet count displays correctly in header
- [ ] Three purchase cards render properly
- [ ] Custom bullet input accepts numbers
- [ ] Total price calculates correctly ($0.99 per bullet)
- [ ] Yearly card has "BEST VALUE" badge
- [ ] Cards have hover effects
- [ ] Purchase buttons are clickable

### Training Page
- [ ] Bullet check happens before drill starts
- [ ] Insufficient bullets modal appears when needed
- [ ] Bullets are deducted on successful start
- [ ] Modal redirects to Store when clicked

### Challenges Page
- [ ] Bullet check happens before drill starts
- [ ] Correct bullet amount is deducted based on drill requirements
- [ ] Insufficient bullets modal appears when needed

### Insufficient Bullets Modal
- [ ] Modal displays with dark theme
- [ ] Current, required, and needed bullets shown correctly
- [ ] Three subscription options displayed
- [ ] "Cancel" button closes modal
- [ ] "Go to Targo Shop" button navigates to Store

### Bullet Count Persistence
- [ ] Bullet count persists after app restart
- [ ] Bullet count updates in real-time across pages
- [ ] Firestore stores bullet count correctly

---

## Manual Testing Scenarios

### Scenario 1: New User Flow
1. Register new account
2. Navigate to Training
3. Try to start drill → See insufficient bullets modal
4. Go to Store → Purchase bullets
5. Return to Training → Start drill successfully

### Scenario 2: Subscription Management
1. Purchase monthly subscription
2. Verify 500 bullets granted
3. Start multiple drills
4. Check bullets deduct correctly
5. Purchase yearly subscription
6. Verify unlimited bullets
7. Start drills without deduction

### Scenario 3: Insufficient Bullets Edge Cases
1. Set bullet count to 10 (manually in Firestore for testing)
2. Try to start 15-bullet drill
3. Verify modal shows: Current: 10, Required: 15, Needed: 5
4. Purchase 5 bullets
5. Retry drill → Should work

### Scenario 4: Subscription Expiration
1. Mock expired monthly subscription
2. Verify bullets stay at current count (not reset to 0)
3. Verify "Unlimited Bullets" banner disappears for yearly

---

## Development Testing Tools

### Manually Set Bullet Count (Firestore)
```javascript
// In browser console or Firebase console
const db = firebase.firestore();
const userId = 'YOUR_USER_ID';

await db.collection('userBullets').doc(userId).set({
  userId: userId,
  bulletCount: 100, // Set any amount
  hasUnlimitedBullets: false,
  lastUpdated: new Date()
});
```

### Check Current Bullet Count
```javascript
// In browser console
const bulletsService = // Get service instance
console.log('Current bullets:', bulletsService.getCurrentBulletCount());
console.log('Has unlimited:', bulletsService.hasUnlimitedBullets());
```

### Simulate Purchase
```typescript
// In Store page component
async testAddBullets() {
  await this.bulletsService.addBullets(100);
  console.log('Added 100 bullets');
}
```

---

## Integration Testing with RevenueCat

### Prerequisites
1. RevenueCat products configured:
   - `monthly` - $50.99/month
   - `yearly` - $99.99/year
   - `bullets` - $0.99 each (optional)
2. Entitlement "Targo Pro" created
3. Offering created and set as current
4. Test user added in Google Play Console

### Test Purchase Flow (Real)
1. **Install app on physical Android device**
   ```bash
   cd android
   ./gradlew assembleDebug
   adb install app/build/outputs/apk/debug/app-debug.apk
   ```

2. **Sign in with test Google account**

3. **Navigate to Store page**

4. **Purchase Monthly Subscription**
   - Click Monthly card
   - Google Play payment sheet appears
   - Complete test purchase
   - Verify: 500 bullets granted
   - Check Firestore: `hasUnlimitedBullets: false`

5. **Purchase Yearly Subscription**
   - Click Yearly card
   - Complete test purchase
   - Verify: "Unlimited Bullets" banner appears
   - Check Firestore: `hasUnlimitedBullets: true`
   - Start drill without deduction

6. **Test Customer Center**
   - Click "Manage Subscription" button
   - RevenueCat Customer Center opens
   - Verify purchase history shown
   - Test cancel/reactivate flows

---

## Debugging

### Common Issues

**Issue: Bullets not deducting**
- Check console for errors
- Verify BulletsService is initialized
- Check Firestore permissions
- Verify user is logged in

**Solution:**
```typescript
// Check service status
console.log('Bullets service ready:', bulletsService.isReady());
await bulletsService.refreshBulletCount();
```

**Issue: Modal not appearing**
- Check ModalController is imported
- Verify component is in imports array
- Check console for component errors

**Solution:**
```typescript
// Test modal directly
const modal = await modalController.create({
  component: InsufficientBulletsModalComponent,
  componentProps: { requiredBullets: 15 }
});
await modal.present();
```

**Issue: Bullet count not updating**
- Check Observable subscriptions
- Verify Firestore write succeeded
- Check browser network tab

**Solution:**
```typescript
// Force refresh
await bulletsService.refreshBulletCount();

// Check subscription
bulletsService.bulletCount$.subscribe(count => {
  console.log('Bullet count updated:', count);
});
```

**Issue: Yearly subscription not granting unlimited bullets**
- Check product ID matches: `yearly`
- Verify RevenueCat customer info
- Check entitlement is active

**Solution:**
```typescript
// Check subscription status
console.log('Has yearly:', purchaseService.hasYearlySubscription());
console.log('Subscription type:', purchaseService.getSubscriptionType());
await bulletsService.updateUnlimitedBulletsStatus();
```

---

## Browser DevTools Testing

### Chrome DevTools Console

```javascript
// Get Angular component instance (in browser)
const component = ng.getComponent(document.querySelector('app-store'));

// Check bullet count
console.log('Bullets:', component.bulletCount);

// Get service
const bulletsService = ng.probe(document.querySelector('app-root'))
  .injector.get(BulletsService);

// Test methods
await bulletsService.addBullets(50);
await bulletsService.deductBullets(10);
console.log('Current:', bulletsService.getCurrentBulletCount());
```

### Firestore Console

1. Go to Firebase Console → Firestore Database
2. Navigate to `userBullets` collection
3. Find your user document
4. Verify structure:
   ```
   {
     userId: "abc123",
     bulletCount: 50,
     hasUnlimitedBullets: false,
     lastUpdated: Timestamp
   }
   ```

---

## Performance Testing

### Load Testing
1. Create 100 rapid bullet deductions
2. Verify Firestore handles writes correctly
3. Check for race conditions

### Memory Testing
1. Navigate between pages rapidly
2. Monitor for memory leaks
3. Check Observable subscriptions are cleaned up

---

## End-to-End Test Script

```bash
# 1. Start fresh
npm start

# 2. In browser (http://localhost:8100):
# - Register new account
# - Navigate to /store
# - Verify bullet count is 0
# - Click "Purchase Bullets"
# - Enter 50, click Purchase
# - Verify count updates to 50

# 3. Navigate to /tabs/training
# - Set 15 bullets
# - Click Start Drill
# - Verify navigation to /drill/prepare
# - Go back to /store
# - Verify count is now 35

# 4. Navigate to /tabs/challenges
# - Select any challenge
# - Click available drill
# - Verify bullets deducted
# - Verify navigation to /drill/prepare

# 5. Test insufficient bullets
# - Manually set bullets to 5 in Firestore
# - Try to start 15-bullet drill
# - Verify modal appears
# - Click "Go to Targo Shop"
# - Verify navigation to /store

# ✅ All tests passed!
```

---

## Production Testing Checklist

Before releasing to production:

- [ ] Test API key switched to production
- [ ] Real products created in Google Play Console
- [ ] RevenueCat products linked to Google Play
- [ ] Firestore security rules deployed
- [ ] Test purchases with real money (small amounts)
- [ ] Test restore purchases flow
- [ ] Test subscription cancellation
- [ ] Test subscription renewal
- [ ] Verify analytics tracking
- [ ] Test on multiple devices
- [ ] Test with different Android versions
- [ ] Test offline behavior
- [ ] Test error handling
- [ ] Verify refund flow
- [ ] Test family sharing (if enabled)

---

## Support & Troubleshooting

### Logs to Check
- Browser console
- RevenueCat dashboard (customer view)
- Firestore database logs
- Android logcat (for native errors)

### Key Metrics to Monitor
- Bullet purchases per user
- Subscription conversion rate
- Average bullets per drill
- Churn rate
- Revenue per user

---

## Next Steps After Testing

1. ✅ All tests pass locally
2. ✅ Configure RevenueCat products
3. ✅ Deploy Firestore security rules
4. ✅ Test on physical device
5. ✅ Verify real purchases work
6. ✅ Deploy to production

---

Happy Testing! 🎯
