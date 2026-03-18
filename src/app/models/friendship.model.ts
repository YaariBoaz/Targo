export interface Friendship {
  id: string; // Document ID in Firestore
  user1: string; // userId (alphabetically first)
  user2: string; // userId (alphabetically second)
  status: 'pending' | 'accepted' | 'blocked';
  initiatedBy: string; // userId who sent the request
  createdAt: Date;
  acceptedAt?: Date;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserPhotoURL?: string;
  toUserId: string;
  createdAt: Date;
}

export interface FriendWithPresence {
  uid: string;
  displayName: string;
  photoURL?: string;
  email: string;
  isOnline: boolean;
  lastSeen?: Date;
}
