import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '../../firebase-config';
@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  app;
  public auth: Auth;
  public db: Firestore;

  constructor() {
    this.app = initializeApp(firebaseConfig);
    console.log('FirebaseService initialized', this.app.name);
    this.auth = getAuth(this.app);
    this.db = getFirestore(this.app);
  }
}
