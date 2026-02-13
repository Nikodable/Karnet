import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.karnet.app',
  appName: 'Karnet',
  webDir: 'dist',
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    }
  },
  server: {
    androidScheme: 'https'
  }
};

export default config;
