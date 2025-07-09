import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tesis.descuentos.test',
  appName: 'Central de Descuentos',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
      showSpinner: true,
      spinnerColor: "#3b82f6"
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '862960295371-vnp5bmdqkffvbsoapd5l2cun69vu1lhs.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    }
  }
};

export default config;
