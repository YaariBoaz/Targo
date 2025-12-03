import { Injectable, inject } from '@angular/core';
import {
  Firestore as FirebaseFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  DocumentReference,
} from '@angular/fire/firestore';
import { User as FirebaseUser } from '@angular/fire/auth';
import { User, UserProfile } from '../../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
  private firestore = inject(FirebaseFirestore);

  /**
   * Create or update user document in Firestore
   * This is called after successful authentication
   */
  async createOrUpdateUser(firebaseUser: FirebaseUser): Promise<void> {
    try {
      const userRef = doc(this.firestore, `users/${firebaseUser.uid}`);
      const userDoc = await getDoc(userRef);

      const userData: Partial<User> = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || undefined,
        photoURL: firebaseUser.photoURL || undefined,
        updatedAt: new Date(),
      };

      if (userDoc.exists()) {
        // Update existing user
        await updateDoc(userRef, {
          ...userData,
          updatedAt: serverTimestamp(),
        });
        console.log('User updated in Firestore:', firebaseUser.uid);
      } else {
        // Create new user
        await setDoc(userRef, {
          ...userData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        console.log('New user created in Firestore:', firebaseUser.uid);
      }
    } catch (error) {
      console.error('Error creating/updating user in Firestore:', error);
      throw error;
    }
  }

  /**
   * Get user document from Firestore
   */
  async getUser(uid: string): Promise<User | null> {
    try {
      const userRef = doc(this.firestore, `users/${uid}`);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        return userDoc.data() as User;
      }
      return null;
    } catch (error) {
      console.error('Error getting user from Firestore:', error);
      return null;
    }
  }

  /**
   * Update user profile information
   */
  async updateUserProfile(
    uid: string,
    profileData: Partial<UserProfile>
  ): Promise<void> {
    try {
      const userRef = doc(this.firestore, `users/${uid}`);
      await updateDoc(userRef, {
        ...profileData,
        updatedAt: serverTimestamp(),
      });
      console.log('User profile updated:', uid);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }
}
