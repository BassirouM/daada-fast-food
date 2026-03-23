import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.daada.fastfood',
  appName: 'Daada Fast Food',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    // Uncomment for local dev with live reload
    // url: 'http://192.168.1.X:3000',
    // cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0A0A0A',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0A0A0A',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#FF6B00',
    },
  },
  ios: {
    contentInset: 'automatic',
    scheme: 'Daada',
  },
  android: {
    // buildOptions configured at release time (keystorePath, keystoreAlias)
  },
}

export default config
