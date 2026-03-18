export interface PresenceStatus {
  online: boolean;
  lastSeen: number; // timestamp
  status: 'online' | 'offline' | 'away' | 'in-game';
}

export interface UserPresence extends PresenceStatus {
  userId: string;
}
