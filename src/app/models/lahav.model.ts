import type { Timestamp } from 'firebase/firestore';

export type LahavSessionStatus = 'waiting' | 'active' | 'completed';

export interface LahavSession {
  sessionId: string;
  instructorName?: string;
  instructorId?: string;
  lane: string;
  drillType: string;
  totalSteps: number;
  shooters: any[];
  status: LahavSessionStatus;
  completedTurns: string[];
  scheduledTime?: Timestamp;
}

export interface LahavShooter {
  shooterId: string;
  name: string;
  email: string;
}

export interface LahavDrillStep {
  name: string;
  bullets: number;
}

export interface LahavDrillType {
  training_type: string;
  drills: LahavDrillStep[];
  range_meter: number;
  total_bullets: number;
}
