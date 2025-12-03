export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  photoURL?: string;
  score: number;
  stars: number;
  completedAt: Date;

  // Drill-specific stats
  time?: number;
  accuracy?: number;
  grouping?: number;
}

export interface DrillLeaderboard {
  challengeId: string;
  drillId: string;
  entries: LeaderboardEntry[]; // Top 100
  lastUpdated: Date;
}

export interface ChallengeLeaderboard {
  challengeId: string;
  entries: LeaderboardEntry[]; // Top 100 overall
  lastUpdated: Date;
}
