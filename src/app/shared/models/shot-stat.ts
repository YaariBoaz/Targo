export interface ShotStat {
  shotNumber: number;
  splitTime: number;
  distanceFromCenter: number;
  totalElapsed: number;
}

export interface ShootingSessionResult {
  totalShots: number;
  bullseyes: number;
  hitRate: number;
  bestSplitTime: number;
}

export interface UserStats {
  totalDrills: number;
  totalShots: number;
  bullseyesHit: number;
  averageAccuracy: number;
  fastestSplit: number;
  challengeWins: number;
}

export interface Shot {
  x: number;
  y: number;
  distanceFromCenter: number;
  timestamp: number; // seconds from start
}

export interface HitPoint {
  x: number;
  y: number;
  distanceFromCenter: number;
  timestamp: number; // ← Add this!
}
