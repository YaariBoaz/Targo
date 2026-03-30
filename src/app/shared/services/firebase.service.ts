import { Injectable } from '@angular/core';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth, initializeAuth, indexedDBLocalPersistence } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';
import { firebaseConfig, lahavFirebaseConfig } from '../../firebase-config';

const LAHAV_APP_NAME = 'lahav-backoffice';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  public auth: Auth;
  public db: Firestore;
  public lahavDb: Firestore;

  constructor() {
    // Use the already-initialized Firebase app (from AngularFire providers),
    // or initialize one if none exists yet. This avoids duplicate-app errors.
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

    // On native Capacitor (Android/iOS), use indexedDB persistence so auth
    // survives app restarts. On web, fall back to getAuth (uses localStorage).
    if (Capacitor.isNativePlatform()) {
      try {
        this.auth = initializeAuth(app, {
          persistence: indexedDBLocalPersistence,
        });
      } catch {
        // initializeAuth throws if auth was already initialized — fall back to getAuth
        this.auth = getAuth(app);
      }
    } else {
      this.auth = getAuth(app);
    }

    this.db = getFirestore(app);

    // Secondary Firebase app for lahav-backoffice project
    const lahavApp = getApps().find(a => a.name === LAHAV_APP_NAME)
      ?? initializeApp(lahavFirebaseConfig, LAHAV_APP_NAME);
    this.lahavDb = getFirestore(lahavApp);
  }
}
