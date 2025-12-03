# Deploy Firestore Rules for Bullets System

## Quick Deploy Instructions

### Option 1: Firebase Console (Easiest)

1. **Go to Firebase Console**
   - Navigate to: https://console.firebase.google.com
   - Select your Targo project

2. **Open Firestore Rules Editor**
   - Click on "Firestore Database" in left menu
   - Click on "Rules" tab

3. **Copy and Paste Rules**
   - Open the file: `FIRESTORE_RULES_PRODUCTION.txt`
   - Copy all contents
   - Paste into the Firebase Console rules editor
   - Click "Publish"

4. **Verify Deployment**
   - Rules should take effect immediately
   - Test by purchasing bullets in the app

---

### Option 2: Firebase CLI (Recommended for Production)

#### Prerequisites
```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login
```

#### Create firestore.rules file
```bash
# Copy production rules to firestore.rules
cp FIRESTORE_RULES_PRODUCTION.txt firestore.rules
```

#### Deploy Rules
```bash
# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Or deploy everything
firebase deploy
```

---

## Updated Firestore Rules (Summary)

The updated rules add permissions for the `userBullets` collection:

```javascript
// User Bullets - users can read/write their own bullet count
match /userBullets/{userId} {
  allow read: if request.auth != null && request.auth.uid == userId;
  allow create: if request.auth != null && request.auth.uid == userId &&
                  request.resource.data.userId == userId;
  allow update: if request.auth != null && request.auth.uid == userId &&
                 request.resource.data.userId == userId;
  allow delete: if false; // Prevent deletion
}
```

### What This Allows:
- ✅ Users can read their own bullet count
- ✅ Users can create their bullet document (on first use)
- ✅ Users can update their bullet count (purchase/deduct)
- ❌ Users CANNOT delete their bullet document
- ❌ Users CANNOT access other users' bullet counts

---

## Testing After Deployment

### Test 1: Read Bullets
1. Log in to the app
2. Navigate to Store page (center tab button)
3. Check that bullet count displays correctly
4. **Expected:** No permission errors in console

### Test 2: Purchase Bullets
1. In Store page, go to "Purchase Bullets" card
2. Enter amount (e.g., 50)
3. Click "Purchase"
4. **Expected:** Bullets added successfully, count updates

### Test 3: Deduct Bullets
1. Navigate to Training tab
2. Set up a drill with 15 bullets
3. Click "Start Drill"
4. **Expected:** Bullets deducted, drill starts

### Test 4: View in Firestore
1. Go to Firebase Console → Firestore Database
2. Navigate to `userBullets` collection
3. Find your user document
4. **Expected:** See structure:
   ```
   {
     userId: "your-uid",
     bulletCount: 50,
     hasUnlimitedBullets: false,
     lastUpdated: Timestamp
   }
   ```

---

## Troubleshooting

### Error: "Missing or insufficient permissions"

**Cause:** Firestore rules not deployed

**Solution:**
1. Verify rules are deployed in Firebase Console
2. Check Rules tab shows the updated rules
3. Try publishing again
4. Clear browser cache and reload app

### Error: "Document already exists"

**Cause:** Trying to create document that exists

**Solution:**
- This is normal, the service handles it
- The error is caught and logged

### Rules not taking effect

**Cause:** Rules cache not cleared

**Solution:**
```bash
# Force re-publish rules
firebase deploy --only firestore:rules --force
```

---

## Production Deployment Checklist

Before deploying to production:

- [ ] Review all Firestore rules in `FIRESTORE_RULES_PRODUCTION.txt`
- [ ] Test rules in Firebase Console Rules Simulator
- [ ] Deploy rules to Firebase
- [ ] Test bullet purchase flow
- [ ] Test bullet deduction flow
- [ ] Verify security (users can't access other users' bullets)
- [ ] Monitor Firestore usage/costs
- [ ] Set up backup/export schedule

---

## Security Best Practices

### Current Implementation ✅
- Users can only access their own bullets
- Document ID matches user ID (enforced)
- Deletion is prevented
- All operations require authentication

### Additional Recommendations
1. **Add Rate Limiting** (via Cloud Functions)
   - Prevent rapid bullet manipulation
   - Limit purchases per user per day

2. **Add Validation** (in rules)
   ```javascript
   // Ensure bullet count is never negative
   allow update: if request.resource.data.bulletCount >= 0;

   // Ensure hasUnlimitedBullets is boolean
   allow update: if request.resource.data.hasUnlimitedBullets is bool;
   ```

3. **Add Audit Logging** (via Cloud Functions)
   - Log all bullet purchases
   - Log all bullet deductions
   - Track suspicious activity

---

## Monitoring

### Firebase Console Metrics
Monitor these in Firebase Console:

1. **Firestore Usage**
   - Document reads/writes
   - Storage usage
   - Bandwidth

2. **Error Logs**
   - Permission denied errors
   - Failed operations

3. **User Activity**
   - Number of bullet purchases
   - Average bullets per user

---

## Rollback Plan

If you need to revert the rules:

1. **Save Current Rules**
   ```bash
   firebase firestore:rules > backup-rules-$(date +%Y%m%d).txt
   ```

2. **Revert to Previous**
   - Go to Firebase Console → Firestore → Rules
   - Click "History" tab
   - Select previous version
   - Click "Restore"

---

## Next Steps After Deployment

1. ✅ Deploy Firestore rules
2. ✅ Test bullet purchasing
3. ✅ Test bullet deduction
4. ✅ Monitor for errors
5. ✅ Consider adding Cloud Functions for:
   - Monthly bullet grants (cron job)
   - Purchase validation
   - Fraud detection

---

## Quick Reference

**Deploy Command:**
```bash
firebase deploy --only firestore:rules
```

**Test Rules Locally:**
```bash
firebase emulators:start --only firestore
```

**View Current Rules:**
```bash
firebase firestore:rules
```

---

## Support

If you encounter issues:
1. Check Firebase Console error logs
2. Review browser console for errors
3. Verify user is authenticated
4. Check Firestore rules are deployed
5. Test with Rules Simulator in Firebase Console

---

**Rules Updated:** ✅ userBullets collection added
**Ready to Deploy:** ✅ Yes
**Breaking Changes:** ❌ No
