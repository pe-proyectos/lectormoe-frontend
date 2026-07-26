import type { CapacitorConfig } from '@capacitor/cli';

// App Android de CapibaraTraductor.
// Estrategia: el WebView carga el sitio en vivo (todas las páginas SSR y features
// funcionan sin duplicar código) con el puente nativo de Capacitor inyectado, así
// el código web puede usar Filesystem/Preferences para las descargas cifradas.
// El modo offline lo cubre el service worker (PWA) + el lector offline nativo.
const config: CapacitorConfig = {
  appId: 'com.capibaratraductor.app',
  appName: 'CapibaraTraductor',
  // webDir es el shell local de arranque/offline (se genera en public/app-shell).
  webDir: 'capacitor-shell',
  backgroundColor: '#09090b',
  server: {
    // Carga el sitio en vivo cuando hay conexión. El bridge nativo se mantiene
    // porque este es el origin principal del WebView.
    url: 'https://capibaratraductor.com',
    hostname: 'capibaratraductor.com',
    androidScheme: 'https',
    // Orígenes a los que la app puede navegar sin salir del WebView. Incluye
    // discord.com para que el login/OAuth de "vincular Discord" ocurra DENTRO de
    // la app y el callback vuelva a capibaratraductor.com sin abrir el navegador
    // del sistema (si no, el OAuth se completa fuera y la app queda sin vincular).
    allowNavigation: [
      'capibaratraductor.com',
      '*.capibaratraductor.com',
      'r2.capibaratraductor.com',
      'discord.com',
      '*.discord.com',
    ],
  },
  android: {
    // Permite que el service worker de la PWA sirva el offline dentro del WebView.
    webContentsDebuggingEnabled: false,
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 900,
      backgroundColor: '#09090b',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#09090b',
    },
  },
};

export default config;
