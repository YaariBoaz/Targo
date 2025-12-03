import { ShotData } from './ble.model';

export interface ShootingSession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  shots: ShotData[];
  targetType: string;
  distance?: number; // Distance to target in meters
  totalShots: number;
  status: 'active' | 'completed' | 'paused';
  metadata?: {
    weather?: string;
    notes?: string;
  };
}

export interface SessionStatistics {
  sessionId: string;
  accuracy: number; // Percentage
  averageScore: number;
  totalShots: number;
  duration: number; // In seconds
  bestShot?: ShotData;
}
