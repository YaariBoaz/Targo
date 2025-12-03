# Auto-Login Implementation Guide

## Overview
The TARGO app automatically keeps users logged in across app restarts. Users only need to log in once, and Firebase Authentication handles session persistence.

## How It Works

### 1. Firebase Auth Session Persistence
Firebase Authentication automatically:
- Saves the user session when they log in
- Persists the session locally on the device
- Restores the session when the app restarts
- Handles token refresh automatically

### 2. Auth State Listener
Location: src/app/core/services/auth.ts:29-38

When the app starts, the onAuthStateChanged listener:
- Fires automatically
- Checks for an existing Firebase session
- If session exists, provides the user object
- Updates currentUserSubject with the user
- Makes isAuthenticated return true

### 3. Splash Screen Check
Location: src/app/shared/components/splash/splash.component.ts:38-53

On app startup:
1. Splash screen shows for 5 seconds
2. After splash, checkAuthAndNavigate() runs
3. Waits 500ms for Firebase Auth to initialize
4. Checks if user is authenticated
5. Routes accordingly:
   - Authenticated → Navigate to /tabs/home
   - Not authenticated → Navigate to /auth/welcome

### 4. Auth Guard Protection
Location: src/app/core/guards/auth.guard.ts

Protected routes (tabs, profile, challenges):
- Check authService.isAuthenticated
- Allow access if true
- Redirect to /auth/welcome if false

## User Flow Examples

### First Time User
1. Opens app → Splash screen
2. No session → Redirected to /auth/welcome
3. Logs in with Facebook/Google/Email
4. User data saved to Firestore
5. Navigated to /tabs/home

### Returning User (Auto-Login)
1. Opens app → Splash screen
2. Firebase Auth detects existing session
3. onAuthStateChanged fires with user object
4. isAuthenticated returns true
5. Automatically navigated to /tabs/home
6. NO LOGIN REQUIRED!

### After Logout
1. User clicks logout
2. Firebase Auth clears session
3. currentUserSubject set to null
4. isAuthenticated returns false
5. User must log in again

## Technical Implementation

### AuthService Properties
- currentUser$ (Observable<User | null>) - Stream of auth state changes
- currentUser (User | null) - Current user object or null
- isAuthenticated (boolean) - True if user is logged in

### Session Duration
- Firebase sessions persist indefinitely until:
  - User explicitly logs out
  - Token expires (Firebase handles refresh automatically)
  - User clears app data/cache
  - App is uninstalled

### Security
- Sessions are stored securely by Firebase SDK
- Tokens are encrypted
- Automatic token refresh prevents expiration
- Server validates all requests

## Testing Auto-Login

1. Login with any method (Facebook, Google, Email)
2. Navigate around the app
3. Close the app completely (force close)
4. Reopen the app
5. Expected: Splash screen → Automatically logged in to /tabs/home

## Debugging

If auto-login is not working:

1. Check console for Firebase Auth errors
2. Verify onAuthStateChanged is firing:
   ```typescript
   console.log('Auth state changed:', user);
   ```
3. Check if isAuthenticated is correct:
   ```typescript
   console.log('Is authenticated:', this.authService.isAuthenticated);
   ```
4. Verify splash screen navigation:
   ```typescript
   console.log('Navigating to:', isAuthenticated ? '/tabs/home' : '/auth/welcome');
   ```

## Code Reference

Key Files:
- src/app/core/services/auth.ts (Auth state management)
- src/app/shared/components/splash/splash.component.ts (Auto-login check)
- src/app/core/guards/auth.guard.ts (Route protection)
- src/app/app.routes.ts (Route configuration)

## Summary

✅ Users log in ONCE
✅ Session persists across app restarts
✅ Automatic navigation on app open
✅ Secure token management by Firebase
✅ Works with all login methods (Email, Google, Facebook)

The auto-login feature is fully implemented and requires no additional user action!
