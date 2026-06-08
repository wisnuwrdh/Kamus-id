import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.kamusid.app',
  appName: 'Kamus ID',
  webDir: 'out',
  plugins: {
    SplashScreen: {
      launchShowDuration: 1000,
      backgroundColor: '#0a0a0c',
      androidSplashResourceName: 'splash',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a0a0c',
    },
  },
  server: {
    androidScheme: 'https',
  },
}

export default config
