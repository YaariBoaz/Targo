import { Injectable, inject } from '@angular/core';
import {
  Auth as FirebaseAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithCredential,
  onAuthStateChanged,
} from '@angular/fire/auth';
import { BehaviorSubject, Observable } from 'rxjs';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Capacitor } from '@capacitor/core';
import { FirestoreService } from './firestore';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(FirebaseAuth);
  private firestoreService = inject(FirestoreService);
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> =
    this.currentUserSubject.asObservable();

  constructor() {
    // Listen to auth state changes with error handling
    try {
      onAuthStateChanged(this.auth, (user) => {
        this.currentUserSubject.next(user);
      });
    } catch (error) {
      console.error('Error setting up auth state listener:', error);
      // Initialize with null user if auth setup fails
      this.currentUserSubject.next(null);
    }
  }

  // Get current user
  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Check if user is authenticated
  get isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  // Helper method to save user to Firestore after successful authentication
  private async saveUserToFirestore(user: User): Promise<void> {
    try {
      await this.firestoreService.createOrUpdateUser(user);
    } catch (error) {
      console.error('Failed to save user to Firestore:', error);
      // Don't throw error - authentication succeeded, Firestore save is secondary
    }
  }

  // Email/Password Login
  async loginWithEmail(email: string, password: string): Promise<User> {
    try {
      const credential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );

      // Save user to Firestore
      await this.saveUserToFirestore(credential.user);

      return credential.user;
    } catch (error: any) {
      console.error('Login error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Email/Password Registration
  async registerWithEmail(email: string, password: string): Promise<User> {
    try {
      const credential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );

      // Save new user to Firestore
      await this.saveUserToFirestore(credential.user);

      return credential.user;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Google Login
  async loginWithGoogle(): Promise<User> {
    try {
      // Check if running on native platform
      if (!Capacitor.isNativePlatform()) {
        throw new Error('Google login is only available on mobile devices. Please use the mobile app.');
      }

      // Initialize Google Auth with server client ID
      try {
        await GoogleAuth.initialize({
          clientId: '385051031881-leean8bo1m9oghf6ocbhrgera8q3j0hk.apps.googleusercontent.com',
          scopes: ['profile', 'email'],
          grantOfflineAccess: true,
        });
      } catch (initError) {
        console.warn('GoogleAuth.initialize() failed or not needed:', initError);
      }

      // Sign in with Google using Capacitor plugin
      const googleUser = await GoogleAuth.signIn();

      // Validate response
      if (!googleUser || !googleUser.authentication || !googleUser.authentication.idToken) {
        throw new Error('Failed to get Google authentication token');
      }

      // Create Firebase credential from Google token
      const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);

      // Sign in to Firebase with the credential
      const result = await signInWithCredential(this.auth, credential);

      // Save user to Firestore
      await this.saveUserToFirestore(result.user);

      return result.user;
    } catch (error: any) {
      console.error('Google login error:', error);

      // Handle specific error cases
      if (error.message?.includes('12501')) {
        throw new Error('Google sign-in was cancelled');
      }
      if (error.message?.includes('10')) {
        throw new Error('Google Play Services not available. Please update Google Play Services.');
      }

      throw new Error(error.message || 'Google login failed. Please try again.');
    }
  }

  // Facebook Login
  async loginWithFacebook(): Promise<User> {
    try {
      // Check if running on native platform
      if (!Capacitor.isNativePlatform()) {
        throw new Error('Facebook login is only available on mobile devices. Please use the mobile app.');
      }

      // Sign in with Facebook using Firebase Authentication plugin
      const result = await FirebaseAuthentication.signInWithFacebook();

      // Validate response
      if (!result || !result.user) {
        throw new Error('Facebook login was cancelled or failed');
      }

      // Get the current user from Firebase Auth (this ensures we have the correct User type)
      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        throw new Error('Failed to get authenticated user');
      }

      // Save user to Firestore
      await this.saveUserToFirestore(currentUser);

      return currentUser;
    } catch (error: any) {
      console.error('Facebook login error:', error);

      // Handle cancelled login
      if (error.message?.includes('cancel') || error.code === 'auth/cancelled') {
        throw new Error('Facebook sign-in was cancelled');
      }

      throw new Error(error.message || 'Facebook login failed. Please try again.');
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  // Handle Firebase Auth errors
  private handleAuthError(error: any): Error {
    let message = 'An error occurred during authentication';

    switch (error.code) {
      case 'auth/user-not-found':
        message = 'No account found with this email';
        break;
      case 'auth/wrong-password':
        message = 'Incorrect password';
        break;
      case 'auth/email-already-in-use':
        message = 'An account with this email already exists';
        break;
      case 'auth/weak-password':
        message = 'Password should be at least 6 characters';
        break;
      case 'auth/invalid-email':
        message = 'Invalid email address';
        break;
      case 'auth/too-many-requests':
        message = 'Too many failed attempts. Please try again later';
        break;
      default:
        message = error.message || message;
    }

    return new Error(message);
  }
}
