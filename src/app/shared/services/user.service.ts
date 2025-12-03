import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

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
}
