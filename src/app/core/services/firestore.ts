import { Injectable, inject } from '@angular/core';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { User, UserProfile } from '../../models/user.model';
import { FirebaseService } from '../../shared/services/firebase.service';

@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
  private firebase = inject(FirebaseService);

  async createOrUpdateUser(firebaseUser: FirebaseUser): Promise<void> {
    try {
      const userRef = doc(this.firebase.db, `users/${firebaseUser.uid}`);
      const userDoc = await getDoc(userRef);

      const userData: any = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
      };

      if (firebaseUser.displayName) {
        userData.displayName = firebaseUser.displayName;
      }
      if (firebaseUser.photoURL) {
        userData.photoURL = firebaseUser.photoURL;
      }

      if (userDoc.exists()) {
        const cleanedData = Object.entries(userData).reduce((acc, [key, value]) => {
          if (value !== undefined) acc[key] = value;
          return acc;
        }, {} as Record<string, any>);

        await updateDoc(userRef, {
          ...cleanedData,
          updatedAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        });
        console.log('User updated in Firestore:', firebaseUser.uid);
      } else {
        await setDoc(userRef, {
          ...userData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          registeredDate: serverTimestamp(),
          lastLogin: serverTimestamp(),
        });
        console.log('New user created in Firestore:', firebaseUser.uid);
      }
    } catch (error) {
      console.error('Error creating/updating user in Firestore:', error);
      throw error;
    }
  }

  async getUser(uid: string): Promise<User | null> {
    try {
      const userRef = doc(this.firebase.db, `users/${uid}`);
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

  async updateUserProfile(uid: string, profileData: Partial<UserProfile>): Promise<void> {
    try {
      const userRef = doc(this.firebase.db, `users/${uid}`);

      const cleanedData = Object.entries(profileData).reduce((acc, [key, value]) => {
        if (value !== undefined) acc[key] = value;
        return acc;
      }, {} as Record<string, any>);

      await updateDoc(userRef, {
        ...cleanedData,
        updatedAt: serverTimestamp(),
      });
      console.log('User profile updated:', uid);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }
}
