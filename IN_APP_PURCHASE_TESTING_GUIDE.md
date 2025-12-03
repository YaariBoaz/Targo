# In-App Purchase Testing Guide

This guide will help you test in-app purchases **WITHOUT USING REAL MONEY** using RevenueCat and Google Play's test environment.

## 🎯 Overview

We're using **RevenueCat** as the in-app purchase backend because:
- ✅ Cross-platform (Android & iOS)
- ✅ Handles all the complex subscription logic
- ✅ Easy testing with sandbox purchases
- ✅ Free tier available for testing
- ✅ Great documentation and dashboard

## 📋 Prerequisites

1. **Google Play Console Account** (for Android testing)
2. **RevenueCat Account** (free tier - sign up at https://app.revenuecat.com)
3. **Test Gmail Account** (for making test purchases)

---

## Step 1: Set Up RevenueCat (15 minutes)

### 1.1 Create RevenueCat Account

1. Go to https://app.revenuecat.com/signup
2. Sign up for a free account
3. Create a new project called "Targo" or "Shooting App"

### 1.2 Add Android App to RevenueCat

1. In RevenueCat dashboard, click **"Apps"** → **"Add App"**
2. Choose **"Google Play Store"**
3. Enter your app details:
   - **App Name**: Targo
   - **Bundle ID**: `com.adl.targo` (or your actual package name)
4. You'll need a **Google Play Service Account JSON key**:
   - Go to Google Play Console → Setup → API access
   - Create a service account (follow Google's instructions)
   - Download the JSON key file
   - Upload it to RevenueCat

### 1.3 Get Your API Keys

1. In RevenueCat dashboard, go to **"API Keys"**
2. Copy your **Google Play public API key** (starts with `goog_`)
3. You'll have two keys:
   - **Test/Sandbox key** (for testing)
   - **Production key** (for real releases)

### 1.4 Add API Key to Your App

Open `src/environments/environment.ts` and replace the placeholder:

```typescript
revenueCatApiKey: 'goog_xxxxxxxxxxxx', // Your actual test API key from RevenueCat
```

---

## Step 2: Create Test Products in Google Play Console (20 minutes)

### 2.1 Create In-App Products

1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app
3. Navigate to: **Monetize → Products → In-app products**
4. Click **"Create product"**

### 2.2 Create These Test Products

Create the following products (these match the IDs in our service):

#### Product 1: Premium Monthly
- **Product ID**: `targo_premium_monthly`
- **Name**: Targo Premium Monthly
- **Description**: Unlimited drills and advanced features
- **Price**: $9.99 (or any amount - it won't charge in test mode)
- **Status**: Active

#### Product 2: Premium Yearly
- **Product ID**: `targo_premium_yearly`
- **Name**: Targo Premium Yearly
- **Description**: Unlimited drills and advanced features for a year
- **Price**: $99.99
- **Status**: Active

#### Product 3: Bullets Pack - Small
- **Product ID**: `targo_bullets_100`
- **Name**: 100 Bullets Pack
- **Description**: Get 100 bullets for training
- **Price**: $0.99
- **Status**: Active

#### Product 4: Bullets Pack - Medium
- **Product ID**: `targo_bullets_500`
- **Name**: 500 Bullets Pack
- **Description**: Get 500 bullets for training
- **Price**: $4.99
- **Status**: Active

#### Product 5: Bullets Pack - Large
- **Product ID**: `targo_bullets_1000`
- **Name**: 1000 Bullets Pack
- **Description**: Get 1000 bullets for training
- **Price**: $9.99
- **Status**: Active

**Important**: Make sure the Product IDs match exactly!

---

## Step 3: Configure Products in RevenueCat (10 minutes)

### 3.1 Add Products to RevenueCat

1. In RevenueCat dashboard, go to **"Products"**
2. Click **"Add Product"**
3. For each product you created in Google Play:
   - Enter the **Product ID** (e.g., `targo_premium_monthly`)
   - Select **"Google Play Store"**
   - Click **"Add"**

### 3.2 Create an Offering

1. Go to **"Offerings"** in RevenueCat dashboard
2. Create a new offering called **"Premium"**
3. Add packages:
   - **Monthly Package**: Link to `targo_premium_monthly`
   - **Yearly Package**: Link to `targo_premium_yearly`
4. Set this offering as **"Current Offering"**

### 3.3 Create Entitlements

1. Go to **"Entitlements"** in RevenueCat
2. Create an entitlement called **"premium"**
3. Attach the premium products to this entitlement
4. This allows you to check `isPremiumUser()` in the app

---

## Step 4: Set Up Test Account for Android (5 minutes)

### 4.1 Add License Testers

1. Go to Google Play Console
2. Navigate to: **Setup → License testing**
3. Add your **test Gmail account** email address
4. Set **"License response"** to **"RESPOND_NORMALLY"**

### 4.2 What This Does

- Purchases made with this account are **sandbox/test purchases**
- **NO REAL MONEY** is charged
- Purchases are **automatically cancelled/refunded** after a few minutes
- You can test unlimited times

---

## Step 5: Deploy and Test (15 minutes)

### 5.1 Build the App

```bash
# Sync Capacitor plugins
npx cap sync android

# Build the app
cd android
./gradlew assembleDebug
```

### 5.2 Upload to Internal Testing Track

1. Go to Google Play Console → **Testing → Internal testing**
2. Create a new release
3. Upload the APK you just built
4. Add your test Gmail account as a tester
5. Save and publish the release
6. Wait a few minutes for it to process

### 5.3 Install on Device

1. On your Android device, **log in with your test Gmail account**
2. Check your email for the Play Store testing invitation
3. Click the invitation link and install the app
4. Or download directly from Internal Testing track in Play Console

### 5.4 Test the Purchase Flow

1. Open the app and log in
2. Navigate to the Store page (add a button in Profile or Settings)
3. You should see the products you configured
4. Tap **"Purchase"** on any package
5. Google Play will show a dialog saying **"This is a test purchase"**
6. Complete the purchase (no money charged!)
7. Check that the app recognizes the purchase

---

## 🧪 Testing Checklist

- [ ] RevenueCat account created
- [ ] Android app added to RevenueCat
- [ ] API key added to `environment.ts`
- [ ] Test products created in Google Play Console
- [ ] Products added to RevenueCat
- [ ] Offering created in RevenueCat
- [ ] Entitlements configured
- [ ] Test account added to License testing
- [ ] App deployed to Internal Testing track
- [ ] App installed on test device with test account
- [ ] Purchase flow tested (shows "test purchase" dialog)
- [ ] App recognizes purchase (isPremium = true)
- [ ] Restore purchases works

---

## 🐛 Troubleshooting

### "No offerings available"
- Check that you created an offering in RevenueCat
- Verify the offering is set as "Current Offering"
- Make sure products are added to the offering

### "Product not found"
- Product IDs must match exactly between Google Play and RevenueCat
- Products must be **"Active"** in Google Play Console
- Wait a few minutes after creating products for them to sync

### "Purchase failed"
- Ensure you're logged into the test account on the device
- Check that the test account is added to License testers
- Try clearing Google Play Store cache
- Make sure the app is installed from Internal Testing track

### "Not a test purchase" / Real money being charged
- **STOP IMMEDIATELY**
- You must be using the Internal Testing track
- Your Gmail account must be in License testers list
- Try with a different test account

### RevenueCat initialization fails
- Check that the API key is correct in `environment.ts`
- Ensure you're using the **Google Play** API key (starts with `goog_`)
- Check RevenueCat dashboard for any errors

---

## 📱 How to Access the Store Page

### Option 1: Add Button to Profile

Add a "Go Premium" button in your Profile page:

```typescript
// In profile.page.ts
goToPremium() {
  this.router.navigate(['/store']);
}
```

### Option 2: Direct Navigation

In your browser/emulator, navigate to:
```
http://localhost:8100/store
```

Or add a temporary button anywhere in the app for testing.

---

## 🎓 Additional Resources

- **RevenueCat Documentation**: https://docs.revenuecat.com/
- **RevenueCat Capacitor SDK**: https://docs.revenuecat.com/docs/capacitor
- **Google Play Testing**: https://developer.android.com/google/play/billing/test
- **Testing In-App Purchases**: https://support.google.com/googleplay/android-developer/answer/6062777

---

## 💡 Important Notes

### Test Purchases are Safe
- ✅ **No real money is ever charged** when using license testing accounts
- ✅ Test purchases are automatically refunded/cancelled
- ✅ You can test unlimited times
- ✅ Test accounts can only make test purchases

### Production Purchases
- When you release to production, remove test API keys
- Use production API key in `environment.prod.ts`
- Remove test product IDs
- Real users will be charged real money

### Next Steps After Testing
1. ✅ Verify purchase flow works end-to-end
2. ✅ Test restore purchases functionality
3. ✅ Test premium features unlock correctly
4. ✅ Update UI to show premium status
5. ✅ Add premium-only features gating
6. ✅ Test on multiple devices
7. ✅ Switch to production keys before release

---

## 🚀 Quick Start Commands

```bash
# Install dependencies (already done)
npm install @revenuecat/purchases-capacitor

# Sync plugins
npx cap sync android

# Build Android
cd android && ./gradlew assembleDebug

# Run on device
npx cap run android
```

---

## 📞 Support

If you encounter any issues:
1. Check RevenueCat dashboard for errors
2. Check Android Logcat for detailed error messages
3. Review RevenueCat documentation
4. Contact RevenueCat support (very responsive for free tier)

Happy testing! 🎉
