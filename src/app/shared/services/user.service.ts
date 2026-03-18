import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private firebase: FirebaseService) {}

  getUser(uid: string) {
    const ref = doc(this.firebase.db, 'users', uid);
    return getDoc(ref);
  }

  async createUser(uid: string, data: any) {
    const ref = doc(this.firebase.db, 'users', uid);
    await setDoc(ref, data);
  }

  async updateUser(uid: string, updates: any) {
    const ref = doc(this.firebase.db, 'users', uid);
    await updateDoc(ref, updates);
  }

  async getAllUsers(): Promise<any[]> {
    try {
      console.log('UserService: Getting users collection...');
      console.log('UserService: Firebase DB instance:', this.firebase.db);
      console.log('UserService: Auth user:', this.firebase.auth.currentUser?.uid);

      const usersCol = collection(this.firebase.db, 'users');
      console.log('UserService: Collection created, fetching docs...');

      const snapshot = await getDocs(usersCol);
      console.log('UserService: Got snapshot with', snapshot.size, 'documents');

      const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as any[];
      // Sort in memory instead
      return users.sort((a: any, b: any) => {
        const nameA = (a.displayName || '').toLowerCase();
        const nameB = (b.displayName || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
    } catch (error: any) {
      console.error('Error in getAllUsers:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      throw error;
    }
  }

  async searchUsers(searchTerm: string): Promise<any[]> {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return [];
    }

    const allUsers = await this.getAllUsers();
    const searchLower = searchTerm.toLowerCase();

    return allUsers.filter(user =>
      user.displayName?.toLowerCase().includes(searchLower)
    );
  }

  async getUserProfile(userId: string): Promise<any> {
    const userDoc = await getDoc(doc(this.firebase.db, 'users', userId));
    if (userDoc.exists()) {
      return { uid: userId, ...userDoc.data() };
    }
    return null;
  }
}
