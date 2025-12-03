export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile extends User {
  // Additional profile fields
  phoneNumber?: string;
  dateOfBirth?: Date;
  firstName?: string;
  lastName?: string;
  nickname?: string;
  // Shooting-related preferences
  preferredHand?: 'left' | 'right';
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  // Weapon settings
  weaponSettings?: {
    weaponType?: string;
    preferredDistance?: number;
    targetType?: string;
  };
}
