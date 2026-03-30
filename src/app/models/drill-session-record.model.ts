export interface Shot {
  id: number; // Shot number (1, 2, 3...)
  x: number; // X position on target in PIXELS (absolute)
  y: number; // Y position on target in PIXELS (absolute)
  timestamp: number; // Total elapsed time when shot was fired (seconds)
  splitTime: number; // Time since previous shot (seconds)
  distanceFromCenter: number; // Distance from center in cm
}

export interface SessionStats {
  shotNumber: number; // Which shot this row represents
  avgSplitTime: number; // AVERAGE split time up to this shot
  avgDistance: number; // AVERAGE distance from center up to this shot
  totalTime: number; // Total elapsed time at this shot (timestamp)
}

export interface DrillSessionRecord {
  // Drill configuration
  drillSetup: {
    numberOfBullets: number;
    distance: number;
    weaponName: string;
    weaponType: string;
    weaponCategory: string;
  };

  // Shot data - each individual shot
  shots: Shot[];

  // Final statistics
  statistics: {
    totalShots: number;
    totalTime: number; // Final elapsed time
    avgSplitTime: number; // Final average split time
    avgDistance: number; // Final average distance from center
    grouping: number; // Max distance between any two shots
  };

  // Metadata
  completedAt: Date; // DateTime when drill was completed
  uid: string; // User ID

  // Challenge support (NEW)
  source: 'training' | 'challenge' | 'lahav'; // Where did this drill come from?
  challengeId?: string; // If from challenge
  challengeDrillId?: string; // If from challenge
  score?: number; // ADL Score (0-1000)
  stars?: number; // 0-3 stars
}
