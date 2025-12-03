/**
 * Update seed data to add weaponCategory to DrillRequirements
 */

const fs = require('fs');
const path = require('path');

// Helper function to determine weaponCategory based on drill details
function determineWeaponCategory(drill, challenge) {
  // Check distance - longer distances typically use rifles/snipers
  if (drill.requirements.distance >= 100) {
    return 'sniper';
  } else if (drill.requirements.distance >= 50) {
    return 'rifle';
  }

  // Check challenge category
  if (challenge.category === 'sniper' || challenge.title.toLowerCase().includes('sniper')) {
    return 'sniper';
  } else if (challenge.category === 'rifle' || challenge.title.toLowerCase().includes('rifle')) {
    return 'rifle';
  }

  // Default to pistol for shorter distances
  return 'pistol';
}

// Update a challenges file
function updateChallengesFile(filePath) {
  console.log(`\n📝 Updating ${path.basename(filePath)}...`);

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  let updated = 0;
  data.forEach((challenge) => {
    if (challenge.drills) {
      challenge.drills.forEach((drill) => {
        if (drill.requirements && !drill.requirements.weaponCategory) {
          drill.requirements.weaponCategory = determineWeaponCategory(drill, challenge);
          updated++;
          console.log(`  ✓ ${drill.title}: weaponCategory = ${drill.requirements.weaponCategory}`);
        }
      });
    }
  });

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`✅ Updated ${updated} drills in ${path.basename(filePath)}`);
}

// Main execution
const dataDir = path.join(__dirname, 'data');

console.log('🚀 Starting seed data update...');

// Update both files
updateChallengesFile(path.join(dataDir, 'global-challenges.json'));
updateChallengesFile(path.join(dataDir, 'heroes-challenges.json'));

console.log('\n✅ All seed data files updated successfully!');
console.log('\n📌 Next steps:');
console.log('1. Review the updated files');
console.log('2. Run: node scripts/seed-challenges.ts');
console.log('3. Verify in Firebase Console');
