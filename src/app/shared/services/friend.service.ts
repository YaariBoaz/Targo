import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  orderBy,
} from 'firebase/firestore';

export interface Friendship {
  id: string;
  user1: string;
  user2: string;
  status: 'pending' | 'accepted' | 'blocked';
  initiatedBy: string;
  createdAt: Date;
  acceptedAt?: Date;
}

@Injectable({
  providedIn: 'root',
})
export class FriendService {
  constructor(private firebase: FirebaseService) {}

  private generateFriendshipId(userId1: string, userId2: string): string {
    return userId1 < userId2 ? `${userId1}_${userId2}` : `${userId2}_${userId1}`;
  }

  async sendFriendRequest(fromUserId: string, toUserId: string): Promise<void> {
    if (fromUserId === toUserId) {
      throw new Error('Cannot send friend request to yourself');
    }

    const friendshipId = this.generateFriendshipId(fromUserId, toUserId);
    const user1 = fromUserId < toUserId ? fromUserId : toUserId;
    const user2 = fromUserId < toUserId ? toUserId : fromUserId;

    const friendshipDoc = doc(this.firebase.db, 'friendships', friendshipId);
    const existingFriendship = await getDoc(friendshipDoc);

    if (existingFriendship.exists()) {
      const data = existingFriendship.data() as Friendship;
      if (data.status === 'accepted') {
        throw new Error('You are already friends');
      } else if (data.status === 'pending') {
        throw new Error('Friend request already sent');
      }
    }

    await setDoc(friendshipDoc, {
      user1,
      user2,
      status: 'pending',
      initiatedBy: fromUserId,
      createdAt: Timestamp.now(),
    });
  }

  async acceptFriendRequest(friendshipId: string): Promise<void> {
    const friendshipDoc = doc(this.firebase.db, 'friendships', friendshipId);
    await updateDoc(friendshipDoc, {
      status: 'accepted',
      acceptedAt: Timestamp.now(),
    });
  }

  async declineFriendRequest(friendshipId: string): Promise<void> {
    const friendshipDoc = doc(this.firebase.db, 'friendships', friendshipId);
    await deleteDoc(friendshipDoc);
  }

  async cancelFriendRequest(friendshipId: string): Promise<void> {
    await this.declineFriendRequest(friendshipId);
  }

  async removeFriend(friendshipId: string): Promise<void> {
    const friendshipDoc = doc(this.firebase.db, 'friendships', friendshipId);
    await deleteDoc(friendshipDoc);
  }

  async getFriends(userId: string): Promise<any[]> {
    const friendsCol = collection(this.firebase.db, 'friendships');

    const q1 = query(
      friendsCol,
      where('user1', '==', userId),
      where('status', '==', 'accepted')
    );

    const q2 = query(
      friendsCol,
      where('user2', '==', userId),
      where('status', '==', 'accepted')
    );

    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

    const friendIds: string[] = [];
    snap1.forEach(doc => {
      const data = doc.data();
      friendIds.push(data['user2']);
    });
    snap2.forEach(doc => {
      const data = doc.data();
      friendIds.push(data['user1']);
    });

    // Get user details for each friend
    const friends = await Promise.all(
      friendIds.map(async (id) => {
        const userDoc = await getDoc(doc(this.firebase.db, 'users', id));
        if (userDoc.exists()) {
          return { uid: id, ...userDoc.data() };
        }
        return null;
      })
    );

    return friends.filter(f => f !== null);
  }

  async getFriendshipStatus(
    userId1: string,
    userId2: string
  ): Promise<'none' | 'pending' | 'accepted' | 'sent'> {
    const friendshipId = this.generateFriendshipId(userId1, userId2);
    const friendshipDoc = doc(this.firebase.db, 'friendships', friendshipId);
    const friendship = await getDoc(friendshipDoc);

    if (!friendship.exists()) {
      return 'none';
    }

    const data = friendship.data() as Friendship;

    if (data.status === 'accepted') {
      return 'accepted';
    }

    if (data.status === 'pending') {
      if (data.initiatedBy === userId1) {
        return 'sent';
      } else {
        return 'pending';
      }
    }

    return 'none';
  }

  getFriendshipId(userId1: string, userId2: string): string {
    return this.generateFriendshipId(userId1, userId2);
  }
}
