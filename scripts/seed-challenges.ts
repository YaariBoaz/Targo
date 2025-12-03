import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import * as globalChallenges from './data/global-challenges.json';
import * as heroesChallenges from './data/heroes-challenges.json';

// Firebase configuration
// TODO: Replace with your Firebase project configuration
const firebaseConfig = {
  apiKey: 'AIzaSyCWCyHlbBwSzXnJ_7IpFJ2xLcZ--7v8S8Y',
  authDomain: 'adl-backend.firebaseapp.com',
  projectId: 'adl-backend',
  storageBucket: 'adl-backend.firebasestorage.app',
  messagingSenderId: '385051031881',
  appId: '1:385051031881:android:79a3aac5ca81eabae6c298',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedChallenges() {
  console.log('🚀 Starting challenge seed process...\n');

  const allChallenges = [
    ...(globalChallenges as any).default,
    ...(heroesChallenges as any).default,
  ];

  let totalChallenges = 0;
  let totalDrills = 0;

  for (const challenge of allChallenges) {
    console.log(`📦 Seeding challenge: ${challenge.title}`);
    console.log(`   Type: ${challenge.type}`);
    console.log(`   Difficulty: ${challenge.difficulty}`);
    console.log(`   Drills: ${challenge.drills.length}`);

    try {
      // Create challenge document
      const challengeRef = doc(db, 'challenges', challenge.id);
      const { drills, ...challengeData } = challenge;

      await setDoc(challengeRef, {
        ...challengeData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`   ✓ Challenge document created`);

      // Create drills subcollection in batches
      const batch = writeBatch(db);
      drills.forEach((drill: any, index: number) => {
        const drillRef = doc(
          db,
          `challenges/${challenge.id}/drills`,
          `drill-${index + 1}`
        );
        batch.set(drillRef, {
          ...drill,
          challengeId: challenge.id,
        });
      });

      await batch.commit();
      console.log(`   ✓ ${drills.length} drills created`);

      totalChallenges++;
      totalDrills += drills.length;

      console.log(`   ✅ ${challenge.title} seeded successfully!\n`);
    } catch (error) {
      console.error(`   ❌ Error seeding ${challenge.title}:`, error);
      console.error('\n');
    }
  }

  console.log('═══════════════════════════════════════');
  console.log('✅ SEED PROCESS COMPLETE!');
  console.log(`   Total Challenges: ${totalChallenges}`);
  console.log(`   Total Drills: ${totalDrills}`);
  console.log('═══════════════════════════════════════\n');
}

// Run the seed script
seedChallenges()
  .then(() => {
    console.log('Script finished successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
