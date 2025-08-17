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
  avgDistance: number;
  avgSplitTime: number;
}

export interface ShootingConfig {
  bullets: number;
  distance: number;
  weapon: string;
}

export interface ShootingSession {
  id?: string;
  userId: string;
  startTime: number;
  endTime?: number;
  mode: 'training' | 'challenge' | 'league';
  config: ShootingConfig;
  totalShots: number;
  elapsedTime: number;
  hitPoints: HitPoint[];
  shotStats: ShotStat[];
  results?: ShootingSessionResult;
  createdAt: number;
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

export interface User {
  nickname: string;
  password: string;
  level: UserLevel;
  email: string;
  location: string;
  imgUrl: string;
  isPro?: boolean;
}

export enum UserLevel {
  Recruit = 'Recruit',
  Marksman = 'Marksman',
  Pro = 'Pro',
}
