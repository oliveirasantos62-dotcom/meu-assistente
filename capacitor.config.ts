import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.meuassistente.app',
  appName: 'Meu Assistente',
  webDir: 'dist',
  android: {
    backgroundColor: '#090b19',
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
