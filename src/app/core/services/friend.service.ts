import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from '@angular/fire/firestore';
import { Observable, combineLatest, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Friendship, FriendWithPresence } from '@models/friendship.model';
import { User } from '@models/user.model';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root',
})
export class FriendService {
  private firestore = inject(Firestore);
  private userService = inject(UserService);

  private get friendshipsCollection() {
    return collection(this.firestore, 'friendships');
  }

  /**
   * Generate friendship document ID (alphabetically sorted user IDs)
   */
  private generateFriendshipId(userId1: string, userId2: string): string {
    return userId1 < userId2 ? `${userId1}_${userId2}` : `${userId2}_${userId1}`;
  }

  /**
   * Get ordered user IDs (alphabetically)
   */
  private getOrderedUserIds(userId1: string, userId2: string): { user1: string; user2: string } {
    return userId1 < userId2
      ? { user1: userId1, user2: userId2 }
      : { user1: userId2, user2: userId1 };
  }

  /**
   * Send a friend request
   */
  async sendFriendRequest(fromUserId: string, toUserId: string): Promise<void> {
    if (fromUserId === toUserId) {
      throw new Error('Cannot send friend request to yourself');
    }

    const friendshipId = this.generateFriendshipId(fromUserId, toUserId);
    const { user1, user2 } = this.getOrderedUserIds(fromUserId, toUserId);

    // Check if friendship already exists
    const friendshipDoc = doc(this.firestore, 'friendships', friendshipId);
    const existingFriendship = await getDoc(friendshipDoc);

    if (existingFriendship.exists()) {
      const data = existingFriendship.data() as Friendship;
      if (data.status === 'accepted') {
        throw new Error('You are already friends');
      } else if (data.status === 'pending') {
        throw new Error('Friend request already sent');
      } else if (data.status === 'blocked') {
        throw new Error('Cannot send friend request');
      }
    }

    // Create new friendship request
    const friendship: Omit<Friendship, 'id'> = {
      user1,
      user2,
      status: 'pending',
      initiatedBy: fromUserId,
      createdAt: Timestamp.now() as any,
    };

    await setDoc(friendshipDoc, friendship);
  }

  /**
   * Accept a friend request
   */
  async acceptFriendRequest(friendshipId: string): Promise<void> {
    const friendshipDoc = doc(this.firestore, 'friendships', friendshipId);
    await updateDoc(friendshipDoc, {
      status: 'accepted',
      acceptedAt: serverTimestamp(),
    });
  }

  /**
   * Decline a friend request
   */
  async declineFriendRequest(friendshipId: string): Promise<void> {
    const friendshipDoc = doc(this.firestore, 'friendships', friendshipId);
    await deleteDoc(friendshipDoc);
  }

  /**
   * Cancel a sent friend request
   */
  async cancelFriendRequest(friendshipId: string): Promise<void> {
    await this.declineFriendRequest(friendshipId);
  }

  /**
   * Remove a friend (delete friendship)
   */
  async removeFriend(friendshipId: string): Promise<void> {
    const friendshipDoc = doc(this.firestore, 'friendships', friendshipId);
    await deleteDoc(friendshipDoc);
  }

  /**
   * Get all friends for a user (accepted friendships)
   */
  getFriends(userId: string): Observable<User[]> {
    // Query where user is either user1 or user2 and status is accepted
    const q1 = query(
      this.friendshipsCollection,
      where('user1', '==', userId),
      where('status', '==', 'accepted')
    );

    const q2 = query(
      this.friendshipsCollection,
      where('user2', '==', userId),
      where('status', '==', 'accepted')
    );

    return combineLatest([
      collectionData(q1, { idField: 'id' }) as Observable<Friendship[]>,
      collectionData(q2, { idField: 'id' }) as Observable<Friendship[]>,
    ]).pipe(
      map(([friendships1, friendships2]) => {
        const allFriendships = [...friendships1, ...friendships2];
        // Extract friend user IDs
        return allFriendships.map((f) =>
          f.user1 === userId ? f.user2 : f.user1
        );
      }),
      switchMap((friendIds) => {
        if (friendIds.length === 0) {
          return of([]);
        }
        // Get user details for all friends
        // Note: This is simplified - for production, batch these queries
        return combineLatest(
          friendIds.map((id) => this.userService.getUserProfile(id))
        ).pipe(
          map((users) => users.filter((u) => u !== null) as User[])
        );
      })
    );
  }

  /**
   * Get pending friend requests received by user
   */
  getPendingRequestsReceived(userId: string): Observable<Friendship[]> {
    const q1 = query(
      this.friendshipsCollection,
      where('user1', '==', userId),
      where('status', '==', 'pending')
    );

    const q2 = query(
      this.friendshipsCollection,
      where('user2', '==', userId),
      where('status', '==', 'pending')
    );

    return combineLatest([
      collectionData(q1, { idField: 'id' }) as Observable<Friendship[]>,
      collectionData(q2, { idField: 'id' }) as Observable<Friendship[]>,
    ]).pipe(
      map(([friendships1, friendships2]) => {
        const allRequests = [...friendships1, ...friendships2];
        // Filter only requests where current user is NOT the initiator
        return allRequests.filter((f) => f.initiatedBy !== userId);
      })
    );
  }

  /**
   * Get pending friend requests sent by user
   */
  getPendingRequestsSent(userId: string): Observable<Friendship[]> {
    const q = query(
      this.friendshipsCollection,
      where('initiatedBy', '==', userId),
      where('status', '==', 'pending')
    );

    return collectionData(q, { idField: 'id' }) as Observable<Friendship[]>;
  }

  /**
   * Check if two users are friends
   */
  async isFriend(userId1: string, userId2: string): Promise<boolean> {
    const friendshipId = this.generateFriendshipId(userId1, userId2);
    const friendshipDoc = doc(this.firestore, 'friendships', friendshipId);
    const friendship = await getDoc(friendshipDoc);

    if (!friendship.exists()) {
      return false;
    }

    const data = friendship.data() as Friendship;
    return data.status === 'accepted';
  }

  /**
   * Get friendship status between two users
   */
  async getFriendshipStatus(
    userId1: string,
    userId2: string
  ): Promise<'none' | 'pending' | 'accepted' | 'sent'> {
    const friendshipId = this.generateFriendshipId(userId1, userId2);
    const friendshipDoc = doc(this.firestore, 'friendships', friendshipId);
    const friendship = await getDoc(friendshipDoc);

    if (!friendship.exists()) {
      return 'none';
    }

    const data = friendship.data() as Friendship;

    if (data.status === 'accepted') {
      return 'accepted';
    }

    if (data.status === 'pending') {
      // Check if current user sent the request
      if (data.initiatedBy === userId1) {
        return 'sent';
      } else {
        return 'pending';
      }
    }

    return 'none';
  }

  /**
   * Get friendship ID for two users
   */
  getFriendshipId(userId1: string, userId2: string): string {
    return this.generateFriendshipId(userId1, userId2);
  }
}
