# Re-Seeding Challenges with Updated Data

## Why Re-Seed?

The `DrillRequirements` model was updated to make `weaponCategory` a required field. All 35 challenge drills in the seed data have been updated with appropriate weapon categories (pistol, rifle, or sniper).

You need to re-seed the Firebase database to apply these changes.

## Quick Steps

### 1. Update Firestore Rules (Temporary)

Open Firebase Console → Firestore Database → Rules

Replace with the temporary rules from `FIRESTORE_RULES_TEMP.txt`:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // ... other rules ...

    // Challenges (TEMPORARY - allow writes for seeding)
    match /challenges/{challengeId} {
      allow read: if true;
      allow write: if true; // ⚠️ TEMPORARY for seeding

      match /drills/{drillId} {
        allow read: if true;
        allow write: if true; // ⚠️ TEMPORARY for seeding
      }
    }

    // ... other rules ...
  }
}
```

Click **Publish**

### 2. Run the Seed Script

```bash
cd c:\ADL-NEW\Targo-2.0\targo-app
node scripts/seed-challenges.ts
```

Expected output:
```
🚀 Starting challenge seed process...

📦 Seeding Challenge: Global Combat Series
  ✓ Challenge document created
  ✓ 5 drills seeded

📦 Seeding Challenge: Precision League
  ✓ Challenge document created
  ✓ 5 drills seeded

📦 Seeding Challenge: CQB Championship
  ✓ Challenge document created
  ✓ 5 drills seeded

📦 Seeding Challenge: Team Tactics
  ✓ Challenge document created
  ✓ 5 drills seeded

📦 Seeding Challenge: Sgt. Michael Smith Memorial
  ✓ Challenge document created
  ✓ 5 drills seeded

📦 Seeding Challenge: Lt. Sarah Johnson Tribute
  ✓ Challenge document created
  ✓ 5 drills seeded

📦 Seeding Challenge: Cpl. David Martinez Legacy
  ✓ Challenge document created
  ✓ 5 drills seeded

✅ Successfully seeded 7 challenges with 35 total drills!
```

### 3. Restore Production Rules

Open Firebase Console → Firestore Database → Rules

Replace with the production rules from `FIRESTORE_RULES_PRODUCTION.txt`:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // ... other rules ...

    // Challenges (read-only for users)
    match /challenges/{challengeId} {
      allow read: if true;
      allow write: if false; // ⚠️ PRODUCTION - locked

      match /drills/{drillId} {
        allow read: if true;
        allow write: if false; // ⚠️ PRODUCTION - locked
      }
    }

    // ... other rules ...
  }
}
```

Click **Publish**

## Verification

### Check in Firebase Console

1. Open Firebase Console → Firestore Database
2. Navigate to `challenges` collection
3. Select any challenge → `drills` subcollection
4. Open any drill document
5. Check `requirements` object
6. Verify `weaponCategory` field exists with value: `pistol`, `rifle`, or `sniper`

### Example Drill Document:

```javascript
{
  order: 1,
  title: "Speed Challenge",
  description: "Complete 10 shots in record time...",
  requirements: {
    numberOfBullets: 10,
    distance: 15,
    targetType: "standard",
    weaponCategory: "pistol" // ✅ This should be present
  },
  scoringCriteria: { ... },
  challengeInfo: { ... }
}
```

### Check in the App

1. Open the app
2. Navigate to Challenges tab
3. Select a challenge (e.g., "Global Combat Series")
4. Click "Let's Go" on the first drill
5. Verify it navigates to pre-drill screen without errors
6. Check browser console for any TypeScript errors

## Weapon Category Distribution

After re-seeding, the weapon categories are distributed as follows:

### Global Challenges (20 drills):
- **Pistol**: 17 drills
- **Rifle**: 3 drills
- **Sniper**: 0 drills

### Heroes Challenges (15 drills):
- **Pistol**: 14 drills
- **Rifle**: 1 drill
- **Sniper**: 0 drills

### By Challenge:

**Global Combat Series** (Hard, Tactical):
1. Speed Challenge - Pistol (15m)
2. Precision Test - Pistol (25m)
3. Tactical Reload - Pistol (15m)
4. Distance Master - Rifle (50m)
5. Combat Final - Pistol (30m)

**Precision League** (Medium):
1. Bullseye Basics - Pistol (15m)
2. Steady Hand - Pistol (20m)
3. Mid-Range Excellence - Pistol (30m)
4. Sniper Test - Rifle (75m)
5. Precision Master - Rifle (50m)

**CQB Championship** (Hard):
1. Rapid Fire - Pistol (10m)
2. Room Clearing - Pistol (7m)
3. Stress Test - Pistol (10m)
4. Hostage Rescue - Pistol (12m)
5. CQB Master - Pistol (10m)

**Team Tactics** (Medium):
1. Cover Fire - Pistol (20m)
2. Sector Control - Pistol (25m)
3. Bounding Overwatch - Pistol (30m)
4. Crossfire Setup - Pistol (20m)
5. Team Leader - Pistol (25m)

**Sgt. Michael Smith Memorial** (Hard, U.S. Army):
1. Foundation of Excellence - Pistol (15m)
2. Discipline Under Fire - Pistol (20m)
3. Leadership Through Action - Pistol (25m)
4. Service Above Self - Pistol (30m)
5. Legacy of Honor - Rifle (50m)

**Lt. Sarah Johnson Tribute** (Medium, U.S. Marines):
1. Breaking Barriers - Pistol (15m)
2. Leading from the Front - Pistol (20m)
3. Tactical Precision - Pistol (25m)
4. Unwavering Courage - Pistol (30m)
5. Johnson's Legacy - Pistol (35m)

**Cpl. David Martinez Legacy** (Hard, NYPD):
1. First Responder - Pistol (10m)
2. Urban Defender - Pistol (15m)
3. Crisis Management - Pistol (20m)
4. Guardian's Duty - Pistol (25m)
5. Martinez's Promise - Pistol (30m)

## Troubleshooting

### Error: "Permission Denied"
**Solution**: Make sure you're using the temporary rules from step 1

### Error: "Missing required field"
**Solution**: Run `node scripts/update-seed-data.js` first to update the JSON files

### Drills not showing weapon category
**Solution**: Re-seed the data - the old data doesn't have weaponCategory field

### App crashes when starting challenge drill
**Solution**: Clear app data and re-seed Firebase with updated challenge data

## Important Notes

⚠️ **Do not skip step 3** - Restore production rules after seeding to prevent unauthorized writes

✅ **Safe to re-run** - The seed script overwrites existing challenges, so it's safe to run multiple times

📝 **Backup not required** - Challenges are template data, not user data

---

**After completing these steps, the challenge drill flow should work perfectly!**
