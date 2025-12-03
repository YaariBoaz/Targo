export interface ChallengeDrill {
  id: string;
  challengeId: string;
  order: number; // 1, 2, 3, ... (for sequential unlocking)
  title: string;
  description: string;
  imageUrl: string;

  // Fixed drill requirements
  requirements: DrillRequirements;

  // ADL Score calculation criteria
  scoringCriteria: ScoringCriteria;

  // Display-only challenge info
  challengeInfo: {
    objective: string; // "Complete in under 30 seconds"
    focusArea: string; // "Speed & Accuracy"
  };
}

export interface DrillRequirements {
  numberOfBullets: number;
  distance: number; // meters
  targetType: string; // 'standard', 'precision', etc.
  weaponCategory: 'pistol' | 'rifle' | 'sniper';
  weaponType?: string; // e.g., 'glock-19', 'ar-15' (optional - user can choose)
  weaponName?: string; // e.g., 'Glock 19', 'AR-15' (optional - user can choose)
}

export interface ScoringCriteria {
  // Perfect benchmarks for 100% score in each category
  perfectTime: number; // seconds
  maxAcceptableDistance: number; // cm
  maxAcceptableGrouping: number; // cm

  // Star thresholds (total score out of 1000)
  threeStars: number; // 900
  twoStars: number; // 750
  oneStar: number; // 600
}
