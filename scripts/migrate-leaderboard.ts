/**
 * Migration script to populate user-scores collection from existing drill sessions
 *
 * This script:
 * 1. Reads all drill sessions from all users
 * 2. Calculates average score for each user
 * 3. Populates the user-scores collection
 *
 * Run with: npx ts-node scripts/migrate-leaderboard.ts
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
  query,
  collectionGroup,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyCWCyHlbBwSzXnJ_7IpFJ2xLcZ--7v8S8Y',
  authDomain: 'adl-backend.firebaseapp.com',
  projectId: 'adl-backend',
  storageBucket: 'adl-backend.firebasestorage.app',
  messagingSenderId: '385051031881',
  appId: '1:385051031881:android:79a3aac5ca81eabae6c298',
};

async function migrateLeaderboard() {
  console.log('🚀 Starting leaderboard migration...\n');

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  try {
    // Get all users
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    console.log(`📊 Found ${usersSnapshot.size} users\n`);

    let processedUsers = 0;
    let totalDrillsSynced = 0;

    // Process each user
    for (const userDoc of usersSnapshot.docs) {
      const uid = userDoc.id;
      const userData = userDoc.data();

      console.log(`\n👤 Processing user: ${userData['displayName'] || uid}`);

      // Get all drill sessions for this user
      const drillsRef = collection(db, `users/${uid}/drills`);
      const drillsSnapshot = await getDocs(drillsRef);

      console.log(`  📝 Found ${drillsSnapshot.size} drill sessions`);

      if (drillsSnapshot.size === 0) {
        console.log(`  ⏭️  Skipping user (no drills)`);
        continue;
      }

      // Calculate average score from all scored sessions
      const scoredSessions = drillsSnapshot.docs.filter(
        (doc) => doc.data()['score'] !== undefined
      );

      let avgScore = 0;
      if (scoredSessions.length > 0) {
        const totalScore = scoredSessions.reduce(
          (sum, doc) => sum + (doc.data()['score'] || 0),
          0
        );
        avgScore = Math.round(totalScore / scoredSessions.length);
      }

      // If no scored sessions, use a default based on statistics
      if (avgScore === 0 && drillsSnapshot.size > 0) {
        // Calculate from accuracy - lower is better, so invert it
        const firstSession = drillsSnapshot.docs[0].data();
        const avgDistance = firstSession['statistics']?.avgDistance || 50;
        // Convert distance to score (lower distance = higher score)
        avgScore = Math.max(100, Math.round(1000 - avgDistance * 10));
      }

      // Update user-scores collection
      const userScoreRef = doc(db, `user-scores/${uid}`);
      await setDoc(
        userScoreRef,
        {
          displayName: userData['displayName'] || 'Unknown User',
          photoURL: userData['photoURL'] || null,
          ratingPoints: avgScore,
          totalDrills: drillsSnapshot.size,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      console.log(`  ✅ Updated leaderboard: ${avgScore} RP, ${drillsSnapshot.size} drills`);

      processedUsers++;
      totalDrillsSynced += drillsSnapshot.size;
    }

    console.log('\n\n✨ Migration completed successfully!');
    console.log(`📊 Stats:`);
    console.log(`   - Users processed: ${processedUsers}`);
    console.log(`   - Total drills synced: ${totalDrillsSynced}`);
    console.log('\n');

  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  }
}

// Run the migration
migrateLeaderboard()
  .then(() => {
    console.log('✅ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
