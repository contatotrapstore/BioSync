import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.neuroone.launcher',
  appName: 'NeuroOne',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    allowNavigation: [
      'https://biosync-jlfh.onrender.com',
      'https://biosync-jlfh.onrender.com'
    ]
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#0a0d1a'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0a0d1a',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSpinnerStyle: 'small',
      spinnerColor: '#ffd913'
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a0d1a'
    },
    Keyboard: {
      resize: 'body'
    }
  }
};

export default config;
