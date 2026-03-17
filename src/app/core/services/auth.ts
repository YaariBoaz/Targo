import { Injectable, inject } from '@angular/core';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithCredential,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { BehaviorSubject, Observable } from 'rxjs';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Capacitor } from '@capacitor/core';
import { FirestoreService } from './firestore';
import { GuestService } from './guest.service';
import { BulletsService } from './bullets.service';
import { FirebaseService } from '../../shared/services/firebase.service';
import { UserProfile } from '../../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private firebase = inject(FirebaseService);
  private firestoreService = inject(FirestoreService);
  private guestService = inject(GuestService);
  private bulletsService = inject(BulletsService);
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> =
    this.currentUserSubject.asObservable();

  constructor() {
    // Listen to auth state changes with error handling
    try {
      onAuthStateChanged(this.firebase.auth, (user) => {
        this.currentUserSubject.next(user);
        // Initialize bullets as soon as auth state is confirmed
        if (user) {
          this.bulletsService.initialize(user.uid);
        } else {
          this.bulletsService.reset();
        }
      });
    } catch (error) {
      console.error('Error setting up auth state listener:', error);
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
        this.firebase.auth,
        email,
        password
      );

      // Disable guest mode when user logs in
      this.guestService.disableGuestMode();

      // Save user to Firestore in the background — don't block navigation
      this.saveUserToFirestore(credential.user);

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
        this.firebase.auth,
        email,
        password
      );

      // Disable guest mode when user registers
      this.guestService.disableGuestMode();

      // Save new user to Firestore
      await this.saveUserToFirestore(credential.user);

      return credential.user;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Email/Password Registration with Profile Data
  async registerWithEmailAndProfile(
    email: string,
    password: string,
    profileData: Partial<UserProfile>
  ): Promise<User> {
    try {
      const credential = await createUserWithEmailAndPassword(
        this.firebase.auth,
        email,
        password
      );

      // Disable guest mode when user registers
      this.guestService.disableGuestMode();

      // Update Firebase Auth profile with displayName and photoURL
      if (profileData.nickname || profileData.photoURL) {
        await updateProfile(credential.user, {
          displayName: profileData.nickname || null,
          photoURL: profileData.photoURL || null,
        });
      }

      // Save new user to Firestore with additional profile data
      await this.saveUserToFirestore(credential.user);

      // Update Firestore with additional profile information
      if (Object.keys(profileData).length > 0) {
        await this.firestoreService.updateUserProfile(credential.user.uid, profileData);
      }

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
      const result = await signInWithCredential(this.firebase.auth, credential);

      // Disable guest mode when user logs in with Google
      this.guestService.disableGuestMode();

      // Save user to Firestore in the background — don't block navigation
      this.saveUserToFirestore(result.user);

      return result.user;
    } catch (error: any) {
      console.error('Google login error:', error);

      // Handle specific error cases
      if (error.message?.includes('12501') || error.code === '12501') {
        throw new Error('Google sign-in was cancelled');
      }
      if (error.message?.includes('10:') || error.code === '10' || error.message?.includes('DEVELOPER_ERROR')) {
        throw new Error('Google sign-in configuration error (code 10). The app SHA-1 fingerprint may not be registered in Firebase Console.');
      }
      if (error.message?.includes('12500') || error.code === '12500') {
        throw new Error('Google sign-in failed. Please try again.');
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

      console.log('Facebook login result:', result);
      console.log('Result credential:', result.credential);

      // Check if we have a credential with access token
      if (!result.credential || !result.credential.accessToken) {
        throw new Error('Failed to get Facebook access token');
      }

      // Create a Facebook credential using the access token
      const credential = FacebookAuthProvider.credential(result.credential.accessToken);

      console.log('Signing in with credential...');

      // Sign in to Firebase with the Facebook credential
      const userCredential = await signInWithCredential(this.firebase.auth, credential);

      console.log('Successfully signed in:', userCredential.user.uid);

      // Disable guest mode when user logs in with Facebook
      this.guestService.disableGuestMode();

      // Save user to Firestore in the background — don't block navigation
      this.saveUserToFirestore(userCredential.user);

      return userCredential.user;
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
      await signOut(this.firebase.auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  // Send Password Reset Email
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.firebase.auth, email);
      console.log('Password reset email sent to:', email);
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw this.handleAuthError(error);
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
