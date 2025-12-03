export interface Badge {
  id: string;
  userId: string;
  type: 'challenge_completion' | 'perfect_score' | 'speedrun' | 'memorial';
  challengeId: string;
  title: string;
  description: string;
  imageUrl: string;
  rarity: 'common' | 'rare' | 'legendary';
  earnedAt: Date;

  // Associated data
  metadata?: {
    totalScore?: number;
    completionTime?: number;
    heroName?: string; // For memorial badges
  };
}
