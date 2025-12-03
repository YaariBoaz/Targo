export type ChallengeType = 'global' | 'heroes';
export type ChallengeDifficulty = 'easy' | 'medium' | 'hard';

export interface Challenge {
  id: string;
  type: ChallengeType;
  title: string;
  description: string;
  imageUrl: string; // Local path: /assets/bg/challenges/ch1.png
  difficulty: ChallengeDifficulty;
  category: string; // 'precision', 'speed', 'tactical', 'memorial'
  drillsCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Hero-specific metadata (only for type='heroes')
  heroMetadata?: HeroMetadata;

  // Badge earned on completion
  completionBadge: {
    title: string;
    description: string;
    imageUrl: string;
    rarity: 'common' | 'rare' | 'legendary';
  };
}

export interface HeroMetadata {
  heroName: string;
  rank: string;
  branch: string; // "U.S. Army", "Marines", "NYPD", etc.
  dateOfBirth?: string;
  dateOfService: string;
  story: string; // Full memorial text
  quote?: string;

  // Media
  mediaType: 'image' | 'video';
  mediaUrl: string; // Local path: /assets/heroes/smith-memorial.mp4
  thumbnailUrl?: string;

  // Recognition
  awards?: string[];

  // Future: External links
  memorialFundUrl?: string;
  tributeUrl?: string;
}
