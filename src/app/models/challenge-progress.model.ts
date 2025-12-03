export interface ChallengeProgress {
  id: string; // Same as challengeId
  challengeId: string;
  userId: string;
  status: 'started' | 'in_progress' | 'completed';
  startedAt: Date;
  completedAt?: Date;
  completedDrills: number;
  totalDrills: number;
  progress: number; // 0-100
  lastActivityAt: Date;

  // Overall challenge score (sum of best drill scores)
  totalScore?: number;
  averageStars?: number;
}

export interface DrillAttempt {
  id: string; // Same as drillId
  drillId: string;
  challengeId: string;
  userId: string;
  status: 'locked' | 'available' | 'completed';
  attemptCount: number;

  // Best performance tracking
  bestScore: number;
  bestStars: number; // 0-3
  bestSessionId?: string; // Reference to /users/{uid}/drills/{sessionId}

  // All attempts
  attempts: AttemptSummary[];

  firstCompletedAt?: Date;
  lastAttemptAt: Date;
}

export interface AttemptSummary {
  sessionId: string;
  score: number;
  stars: number;
  completedAt: Date;
}
