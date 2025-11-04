import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.bustravel',
  appName: 'Bus Travel Manager',
  webDir: 'out',
  // During development you can point the native app to your running dev server.
  // Set the environment variable CAPACITOR_SERVER_URL to override the default.
  // Example: CAPACITOR_SERVER_URL="http://192.168.1.5:3000" npx cap copy android
  server: {
    url: process.env.CAPACITOR_SERVER_URL || 'http://10.10.10.170:3000'
  }
};

export default config;
