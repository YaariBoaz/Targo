# How to Run the Seed Script

## The Problem
The seed script is getting a "PERMISSION_DENIED" error because Firestore rules are blocking writes to the `challenges` collection.

## The Solution

### Step 1: Update Firestore Rules (Temporary)

1. Go to **Firebase Console** → Your Project → **Firestore Database** → **Rules**
2. Copy the contents of `FIRESTORE_RULES_TEMP.txt`
3. Paste it into the Firebase Console rules editor
4. Click **Publish**

The key change is:
```javascript
match /challenges/{challengeId} {
  allow read: if true;
  allow write: if true; // ⚠️ TEMPORARY - allows seed script to write
```

### Step 2: Run the Seed Script

```bash
cd scripts
npx ts-node seed-challenges.ts
```

You should see:
```
🚀 Starting challenge seed process...

📦 Seeding challenge: Global Combat Series
   Type: global
   Difficulty: hard
   Drills: 5
   ✓ Challenge document created
   ✓ 5 drills created
   ✅ Global Combat Series seeded successfully!

... (continues for all 7 challenges)

═══════════════════════════════════════
✅ SEED PROCESS COMPLETE!
   Total Challenges: 7
   Total Drills: 35
═══════════════════════════════════════
```

### Step 3: Lock Down the Rules (IMPORTANT!)

1. Go back to **Firebase Console** → **Firestore Database** → **Rules**
2. Copy the contents of `FIRESTORE_RULES_PRODUCTION.txt`
3. Paste it into the Firebase Console rules editor
4. Click **Publish**

This changes it back to:
```javascript
match /challenges/{challengeId} {
  allow read: if true;
  allow write: if false; // 🔒 Locked - prevents unauthorized modifications
```

---

## Alternative: Use Firebase Admin SDK (Better for Production)

If you want to avoid temporarily opening permissions, you can modify the seed script to use the Admin SDK:

### 1. Get Service Account Key
1. Go to **Firebase Console** → Project Settings → Service Accounts
2. Click **Generate new private key**
3. Save as `scripts/serviceAccountKey.json`
4. Add to `.gitignore`

### 2. Update seed script to use Admin SDK

```typescript
import * as admin from 'firebase-admin';
import * as serviceAccount from './serviceAccountKey.json';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
});

const db = admin.firestore();

// Rest of the script stays the same...
```

### 3. Install Admin SDK
```bash
npm install firebase-admin
```

With Admin SDK, you bypass security rules entirely (it has full access).

---

## Verification

After seeding, verify in Firebase Console:

1. Go to **Firestore Database** → **Data**
2. You should see a `challenges` collection
3. Expand it to see 7 challenge documents
4. Each challenge should have a `drills` subcollection with 5 drills

---

## Cleanup

After successful seeding:
- ✅ Challenges are in Firebase
- ✅ Production rules are in place (write: false)
- ✅ App can read challenges but not modify them
- ✅ Only you (via Admin SDK or temp rules) can update challenges

---

## Current Rules Issue

Your current rules file has a problem - you have duplicate `match /challenges/{challengeId}` blocks:

```javascript
// First block (lines ~33-36)
match /challenges/{challengeId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null;
}

// Second block (lines ~87-95)
match /challenges/{challengeId} {
  allow read: if true;
  allow write: if false;
}
```

The **second block overrides the first**, so writes are blocked. Use the PRODUCTION rules file I provided to clean this up.
