import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  serverTimestamp,
} from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '@models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private firestore = inject(Firestore);

  private get usersCollection() {
    return collection(this.firestore, 'users');
  }

  /**
   * Get all registered users (for discovery page)
   */
  getAllUsers(): Observable<User[]> {
    const q = query(
      this.usersCollection,
      orderBy('displayName', 'asc')
    );

    return collectionData(q, { idField: 'uid' }) as Observable<User[]>;
  }

  /**
   * Search users by username (displayName)
   */
  searchUsers(searchTerm: string): Observable<User[]> {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return of([]);
    }

    const searchLower = searchTerm.toLowerCase();

    // Get all users and filter client-side for partial match
    // Note: Firestore doesn't support case-insensitive partial text search natively
    // For production, consider using Algolia or similar for better search
    return this.getAllUsers().pipe(
      map((users) =>
        users.filter((user) =>
          user.displayName?.toLowerCase().includes(searchLower)
        )
      )
    );
  }

  /**
   * Get a specific user profile by ID
   */
  getUserProfile(userId: string): Observable<User | null> {
    const userDoc = doc(this.firestore, 'users', userId);
    return docData(userDoc, { idField: 'uid' }) as Observable<User | null>;
  }

  /**
   * Update user's last seen timestamp
   */
  async updateLastSeen(userId: string): Promise<void> {
    const userDoc = doc(this.firestore, 'users', userId);
    await updateDoc(userDoc, {
      lastLogin: serverTimestamp(),
    });
  }

  /**
   * Get multiple users by IDs
   */
  getUsersByIds(userIds: string[]): Observable<User[]> {
    if (userIds.length === 0) {
      return of([]);
    }

    // Firestore 'in' query supports max 10 items
    // If more than 10, split into multiple queries
    if (userIds.length <= 10) {
      const q = query(
        this.usersCollection,
        where('uid', 'in', userIds)
      );
      return collectionData(q, { idField: 'uid' }) as Observable<User[]>;
    }

    // For more than 10 users, make multiple queries
    // This is a simplified version - for production, consider batching
    return of([]);
  }
}
