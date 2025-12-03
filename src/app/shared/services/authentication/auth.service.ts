import { Injectable } from '@angular/core';
import {
  createUserWithEmailAndPassword,
  FacebookAuthProvider,
  signInWithEmailAndPassword,
  signOut,
  UserCredential,
} from 'firebase/auth';
import { FirebaseService } from '../firebase.service';
import { signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { UserStoreService } from './user-store.service';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { User, UserLevel } from '../../models/shot-stat';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private firebase: FirebaseService,
    private userStoreService: UserStoreService
  ) {}
  static readonly KEY = 'user';

  isLoggedIn(): boolean {
    return !!localStorage.getItem(AuthService.KEY);
  }

  login(user: any) {
    localStorage.setItem(AuthService.KEY, JSON.stringify(user));
  }

  async logout(): Promise<void> {
    return this.logoutFromAllProviders();
  }

  getUser() {
    const raw = localStorage.getItem(AuthService.KEY);
    return raw ? JSON.parse(raw) : null;
  }

  registerWithEmailAndPassword(
    email: string,
    password: string
  ): Promise<UserCredential> {
    return createUserWithEmailAndPassword(this.firebase.auth, email, password);
  }

  loginWithEmailAndPassword(
    email: string,
    password: string
  ): Promise<UserCredential> {
    return signInWithEmailAndPassword(this.firebase.auth, email, password);
  }


  async loginWithGoogle(): Promise<any> {
    try {
      console.log('Starting Google login...');
      const result = await FirebaseAuthentication.signInWithGoogle();

      const credential = GoogleAuthProvider.credential(
        result.credential?.idToken
      );
      const userCred = await signInWithCredential(this.firebase.auth, credential);
      console.log('Google sign-in successful:', userCred);
      
      const googleData = userCred.user.providerData[0];
      const user: User = {
        email: googleData.email || '',
        imgUrl: googleData.photoURL || '',
        nickname: googleData.displayName || '',
        password: '',
        level: UserLevel.Recruit,
        location: '',
      };
      this.userStoreService.user = user;
      return userCred;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  }

  async loginWithFacebook(): Promise<any> {
    try {
      console.log('Starting Facebook login...');
      console.log('Firebase auth instance:', this.firebase.auth);

      const result = await FirebaseAuthentication.signInWithFacebook();
      console.log('Facebook auth result:', result);
      console.log('Access token present:', !!result.credential?.accessToken);

      if (!result.credential?.accessToken) {
        throw new Error('No access token received from Facebook');
      }

      const credential = FacebookAuthProvider.credential(
        result.credential.accessToken
      );
      console.log('Firebase credential created:', credential);

      const userCred = await signInWithCredential(
        this.firebase.auth,
        credential
      );
      console.log('Firebase sign-in successful:', userCred);
      const fbData = userCred.user.providerData[0];
      const user: User = {
        email: fbData.displayName || '',
        imgUrl: fbData.photoURL || '',
        nickname: fbData.displayName || '',
        password: '',
        level: UserLevel.Recruit,
        location: '',
      };
      this.userStoreService.user = user;
      return userCred;
    } catch (error) {
      console.error('Facebook login error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
  }

  async logoutFromAllProviders(): Promise<void> {
    try {
      // Sign out from Capacitor Firebase Authentication (Google/Facebook)
      await FirebaseAuthentication.signOut();
      
      // Sign out from Firebase Auth (Email/Password and web auth)
      await signOut(this.firebase.auth);
      
      // Clear local storage
      localStorage.removeItem(AuthService.KEY);
      
      // Clear user store
      this.userStoreService.user = null;
      
      console.log('Successfully logged out from all providers');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local data even if remote logout fails
      localStorage.removeItem(AuthService.KEY);
      this.userStoreService.user = null;
      throw error;
    }
  }
}
