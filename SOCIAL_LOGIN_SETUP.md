# Social Login Setup - TARGO App

## Overview
The TARGO app now has fully functional social login with **Google** and **Facebook**, with automatic user persistence to Firestore.

## Automatic User Persistence
Every time a user logs in (email, Google, or Facebook), their data is automatically saved to Firestore in the `users/{uid}` collection.

**Saved Data:**
- uid: Firebase user ID
- email: User's email address
- displayName: User's display name (from social profile)
- photoURL: Profile picture URL (from social profile)
- createdAt: Timestamp when user first registered
- updatedAt: Timestamp of last login

**Benefits:**
- Users stay logged in after closing the app
- User data persists across sessions
- Profile data accessible throughout the app
- Can query and manage users in Firestore Console

## Implementation

### FirestoreService
Location: src/app/core/services/firestore.ts

Methods:
- createOrUpdateUser() - Automatically called on every login
- getUser() - Retrieve user data from Firestore
- updateUserProfile() - Update user profile information

### Auth Integration
All login methods in AuthService automatically save user data:
- loginWithEmail() ✅
- registerWithEmail() ✅
- loginWithGoogle() ✅
- loginWithFacebook() ✅

## Firestore Database Structure

Collection: users
Document ID: {user_uid}

Example document:
{
  "uid": "abc123xyz",
  "email": "user@example.com",
  "displayName": "John Doe",
  "photoURL": "https://...",
  "createdAt": "2025-01-14T10:00:00Z",
  "updatedAt": "2025-01-14T10:00:00Z"
}

## Firebase Console Setup Required

1. Enable Firestore Database in Firebase Console
2. Set up security rules (recommended):

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}

## Testing

1. Log in with Facebook or Google
2. Open Firebase Console → Firestore Database
3. Navigate to users collection
4. You should see your user document with all data

## Success!
Users are now automatically saved to Firestore on every login!
