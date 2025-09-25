import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lutonhospital.pharmacy',
  appName: 'Luton Hospital Pharmacy',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    StatusBar: {
      style: 'dark',
      backgroundColor: '#22c55e'
    }
  }
};

export default config;
