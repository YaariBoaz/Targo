# Leaderboard Manual Fix

Since the leaderboard is empty, you can manually populate it by running this in your browser console while logged in:

## Step 1: Open Browser Console
Press F12 and go to the Console tab

## Step 2: Run this code

```javascript
// Get the Angular injector
const injector = window.ng.getInjector(document.querySelector('app-root'));

// Get the services
const leaderboardService = injector.get('LeaderboardService');
const auth = injector.get('Auth');
const firestore = injector.get('Firestore');

// Get current user
const user = auth.currentUser;

if (user) {
  // Manually update your score
  const score = 570; // Or whatever score you want to use

  leaderboardService.updateUserScore(
    user.uid,
    user.displayName || 'Anonymous',
    score,
    user.photoURL || null
  ).then(() => {
    console.log('✅ Leaderboard updated successfully!');
    alert('Leaderboard updated! Refresh the statistics page.');
  }).catch(error => {
    console.error('❌ Error updating leaderboard:', error);
  });
} else {
  console.error('No user logged in');
}
```

## Alternative: Check Firestore directly

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project: adl-backend
3. Go to Firestore Database
4. Look for `user-scores` collection
5. If it doesn't exist, create it manually
6. Add a document with ID = your user UID
7. Add these fields:
   - displayName: (your name)
   - photoURL: (your photo URL or null)
   - ratingPoints: 570 (or any number)
   - totalDrills: 10 (or any number)
   - updatedAt: (current timestamp)

Then refresh the statistics page.
