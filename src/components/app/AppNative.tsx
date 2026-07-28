import { useEffect } from 'react';

// Configuración nativa de la app (Capacitor). Solo corre dentro de la app.
//
// Android 15+ (targetSdk 35+) fuerza edge-to-edge: el WebView se dibuja de borde
// a borde, bajo las barras de sistema. Lo correcto es ABRAZARLO (Capacitor 8 ya
// popula `env(safe-area-inset-*)` vía WindowInsets) y compensar con CSS, en vez
// de usar `setOverlaysWebView(false)` / `setBackgroundColor`, que son las APIs
// que Android 15 deprecó (causaban el warning de Play y, al desactivar el
// edge-to-edge, dejaban los insets en 0). Aquí solo ajustamos el color de los
// íconos de la barra con la API moderna (setAppearanceLightStatusBars) para que
// se vean claros sobre el fondo oscuro.
export default function AppNative() {
  useEffect(() => {
    const cap = (window as any).Capacitor;
    if (!cap?.isNativePlatform?.()) return;
    import('@capacitor/status-bar')
      .then(({ StatusBar, Style }) => {
        StatusBar.setStyle({ style: Style.Dark }).catch(() => {}); // íconos claros
      })
      .catch(() => {});
  }, []);
  return null;
}
