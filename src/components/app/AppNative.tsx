import { useEffect } from 'react';

// Configuración nativa de la app (Capacitor). Solo corre dentro de la app.
// Problema: en Android el WebView es edge-to-edge y se dibuja BAJO la barra de
// estado; `env(safe-area-inset-top)` no lo compensa como en iOS (suele ser 0),
// así que el contenido queda tapado por la barra. Solución: pedirle al plugin
// StatusBar que NO superponga el WebView, de modo que el sistema reserve el
// espacio de la barra. Se aplica al primer render y persiste toda la sesión.
export default function AppNative() {
  useEffect(() => {
    const cap = (window as any).Capacitor;
    if (!cap?.isNativePlatform?.()) return;
    import('@capacitor/status-bar')
      .then(({ StatusBar, Style }) => {
        StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
        StatusBar.setStyle({ style: Style.Dark }).catch(() => {}); // texto/íconos claros sobre fondo oscuro
        StatusBar.setBackgroundColor({ color: '#09090b' }).catch(() => {});
      })
      .catch(() => {});
  }, []);
  return null;
}
