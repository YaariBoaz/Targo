export type WeaponCategory = 'pistol' | 'rifle' | 'sniper';
export type DrillStatus = 'setup' | 'in_progress' | 'completed' | 'abandoned';

export interface DrillSetup {
  distance: number;
  weaponCategory: WeaponCategory;
  weaponType: string;
  weaponName: string;
  numberOfBullets: number;

  // Challenge context (optional - only for challenge drills)
  source?: 'training' | 'challenge';
  challengeId?: string;
  challengeDrillId?: string;
  challengeTitle?: string;
  challengeDrillTitle?: string;
  drillObjective?: string;
}

export interface DrillResult {
  totalShots: number;
  hits: number;
  misses: number;
  accuracy: number; // percentage
  timeElapsed: number; // in seconds
  avgTimePerShot?: number; // in seconds
}

export interface DrillSession {
  id?: string;
  userId: string;
  setup: DrillSetup;
  result?: DrillResult;
  status: DrillStatus;
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
