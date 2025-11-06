import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.bustravel',
  appName: 'Bus Travel Manager',
  webDir: 'out',
  // During development you can point the native app to your running dev server.
  // Set the environment variable CAPACITOR_SERVER_URL to override the default.
  // Example: CAPACITOR_SERVER_URL="http://192.168.1.5:3000" npx cap copy android
  server: {
    // Use env override during development (CAPACITOR_SERVER_URL) or fall back
    // to the deployed Vercel URL for convenience. Keep as a string.
    url: process.env.CAPACITOR_SERVER_URL || 'https://travel-manage.vercel.app'
  }
};

export default config;
