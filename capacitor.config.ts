import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.adl.targo',
  appName: 'Targo',
  webDir: 'www',
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: false,
      backgroundColor: '#000000',
      showSpinner: false,
      androidScaleType: 'FIT_XY',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      overlay: true, // CRITICAL: Allow content to go under status bar
      style: 'dark', // Dark style = light content (white icons)
      backgroundColor: '#0A0A0A',
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId:
        '385051031881-leean8bo1m9oghf6ocbhrgera8q3j0hk.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
    FirebaseAuthentication: {
      providers: ['facebook.com', 'google.com'],
    },
  },
  ios: {
    contentInset: 'automatic',
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
