export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
  registeredDate?: Date;
  lastLogin?: Date;
}

export interface UserProfile extends User {
  // Additional profile fields
  phoneNumber?: string;
  dateOfBirth?: Date;
  firstName?: string;
  lastName?: string;
  nickname?: string;
  location?: string;
  // Shooting-related preferences
  preferredHand?: 'left' | 'right';
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  shooterLevel?: 'recruit' | 'marksman' | 'pro';
  // Weapon settings
  weaponSettings?: {
    weaponType?: string;
    preferredDistance?: number;
    targetType?: string;
  };
  // Score and ranking
  adlScore?: number; // ADL score displayed in the app
  rank?: number; // User's rank position
}
