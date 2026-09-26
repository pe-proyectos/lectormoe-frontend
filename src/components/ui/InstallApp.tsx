import React, { useEffect, useState } from 'react';
import { Download, X, Share, SquarePlus, WifiOff, Wifi } from 'lucide-react';

interface Props {
  /** Hay barra inferior móvil: el aviso se coloca encima de ella. */
  conBarraInferior?: boolean;
}

const CLAVE_VISITAS = 'capi-pwa-visitas';
const CLAVE_CERRADO = 'capi-pwa-cerrado';
const ESPERA_TRAS_CERRAR = 14 * 86400_000;

const esStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
const esIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

// Instalar la web como app (PWA) y aviso de "sin conexión".
// - Chrome/Android/Edge: guarda el evento beforeinstallprompt y ofrece el botón.
// - iPhone/iPad: Safari no tiene ese evento; se explican los pasos.
// El aviso sale desde la segunda visita y, si se cierra, no vuelve en 14 días.
// El menú puede abrirlo en cualquier momento con el evento 'capi:instalar'.
const InstallApp: React.FC<Props> = ({ conBarraInferior = true }) => {
  const [evento, setEvento] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  const [pasosIOS, setPasosIOS] = useState(false);
  const [offline, setOffline] = useState(false);
  const [volvio, setVolvio] = useState(false);

  useEffect(() => {
    if (esStandalone()) return;
    const visitas = Number(localStorage.getItem(CLAVE_VISITAS) || 0) + 1;
    localStorage.setItem(CLAVE_VISITAS, String(visitas));
    const cerrado = Number(localStorage.getItem(CLAVE_CERRADO) || 0);
    const puedeMostrar = visitas >= 2 && Date.now() - cerrado > ESPERA_TRAS_CERRAR;

    const alPrompt = (e: any) => {
      e.preventDefault();
      setEvento(e);
      (window as any).__capiPuedeInstalar = true;
      if (puedeMostrar) setVisible(true);
    };
    const alInstalar = () => {
      setVisible(false);
      setEvento(null);
      localStorage.setItem(CLAVE_CERRADO, String(Date.now() + 10 * 365 * 86400_000));
    };
    window.addEventListener('beforeinstallprompt', alPrompt);
    window.addEventListener('appinstalled', alInstalar);

    // iOS: sin evento; se ofrece con las instrucciones.
    if (esIOS()) {
      (window as any).__capiPuedeInstalar = true;
      if (puedeMostrar) setVisible(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', alPrompt);
      window.removeEventListener('appinstalled', alInstalar);
    };
  }, []);

  // Desde el menú: "Instalar app".
  useEffect(() => {
    const abrir = () => {
      if (esStandalone()) return;
      if (esIOS()) setPasosIOS(true);
      else if (evento) instalar();
      else setVisible(true);
    };
    window.addEventListener('capi:instalar', abrir);
    return () => window.removeEventListener('capi:instalar', abrir);
  }, [evento]);

  // Estado de la conexión.
  useEffect(() => {
    const sin = () => { setOffline(true); setVolvio(false); };
    const con = () => { setOffline(false); setVolvio(true); setTimeout(() => setVolvio(false), 3000); };
    setOffline(!navigator.onLine);
    window.addEventListener('offline', sin);
    window.addEventListener('online', con);
    return () => { window.removeEventListener('offline', sin); window.removeEventListener('online', con); };
  }, []);

  const cerrar = () => {
    setVisible(false);
    localStorage.setItem(CLAVE_CERRADO, String(Date.now()));
  };

  const instalar = async () => {
    if (esIOS()) { setPasosIOS(true); return; }
    if (!evento) return;
    evento.prompt();
    const { outcome } = await evento.userChoice.catch(() => ({ outcome: 'dismissed' }));
    setEvento(null);
    setVisible(false);
    if (outcome !== 'accepted') localStorage.setItem(CLAVE_CERRADO, String(Date.now()));
  };

  const abajo = conBarraInferior ? 'bottom-[calc(76px+env(safe-area-inset-bottom))] md:bottom-6' : 'bottom-[calc(16px+env(safe-area-inset-bottom))] md:bottom-6';

  return (
    <>
      {/* Conexión */}
      {(offline || volvio) && (
        <div className="fixed left-1/2 top-[calc(10px+env(safe-area-inset-top))] z-[120] -translate-x-1/2 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold shadow-xl ring-1 backdrop-blur-xl ${
            offline ? 'bg-zinc-900/95 text-amber-300 ring-amber-400/30' : 'bg-zinc-900/95 text-emerald-300 ring-emerald-400/30'
          }`}>
            {offline ? <WifiOff size={14} /> : <Wifi size={14} />}
            {offline ? (
              <>Sin conexión · viendo lo guardado <a href="/descargas" className="underline underline-offset-2 text-white">Descargas</a></>
            ) : 'Conexión recuperada'}
          </div>
        </div>
      )}

      {/* Aviso de instalación */}
      {visible && (evento || esIOS()) && (
        <div className={`fixed inset-x-3 md:inset-x-auto md:right-6 md:w-[380px] ${abajo} z-[90] animate-in fade-in slide-in-from-bottom-3 duration-300`}>
          <div className="flex items-center gap-3 rounded-2xl bg-zinc-900/95 p-3 pr-2 shadow-2xl shadow-black/60 ring-1 ring-zinc-700/70 backdrop-blur-xl">
            <img src="/icons/icon-192.png" alt="" className="h-12 w-12 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-white leading-tight">Instala CapibaraTraductor</p>
              <p className="text-xs text-zinc-400 leading-snug">Ábrela como app y lee tus descargas sin conexión.</p>
            </div>
            <button
              type="button"
              onClick={instalar}
              className="shrink-0 rounded-xl bg-cyan-500 px-3.5 py-2.5 text-xs font-black uppercase tracking-wider text-zinc-950 active:scale-95 transition-transform"
            >
              {esIOS() ? 'Cómo' : 'Instalar'}
            </button>
            <button type="button" onClick={cerrar} aria-label="Cerrar" className="shrink-0 rounded-lg p-2 text-zinc-500 hover:text-white">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Pasos en iPhone/iPad */}
      {pasosIOS && (
        <div className="fixed inset-0 z-[130] flex items-end md:items-center justify-center" role="dialog" aria-modal="true" aria-label="Instalar en iPhone">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setPasosIOS(false)} />
          <div className="relative w-full md:max-w-sm rounded-t-[28px] md:rounded-[28px] bg-zinc-950 p-6 pb-[calc(24px+env(safe-area-inset-bottom))] ring-1 ring-zinc-800 animate-in slide-in-from-bottom duration-300">
            <div className="mb-5 flex items-center gap-3">
              <img src="/icons/icon-192.png" alt="" className="h-12 w-12 rounded-xl" />
              <div>
                <p className="font-black text-white">Instalar en tu iPhone</p>
                <p className="text-xs text-zinc-400">Desde Safari, en dos pasos</p>
              </div>
              <button type="button" onClick={() => setPasosIOS(false)} aria-label="Cerrar" className="ml-auto rounded-lg p-2 text-zinc-500 hover:text-white"><X size={18} /></button>
            </div>
            <ol className="space-y-3">
              <li className="flex items-center gap-3 rounded-2xl bg-zinc-900 p-3 ring-1 ring-zinc-800">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-cyan-400"><Share size={18} /></span>
                <span className="text-sm text-zinc-200">Toca <b>Compartir</b> en la barra de Safari.</span>
              </li>
              <li className="flex items-center gap-3 rounded-2xl bg-zinc-900 p-3 ring-1 ring-zinc-800">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-cyan-400"><SquarePlus size={18} /></span>
                <span className="text-sm text-zinc-200">Elige <b>Agregar a inicio</b> y confirma.</span>
              </li>
            </ol>
            <p className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
              <Download size={14} /> Tus descargas se leen sin conexión desde la app.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default InstallApp;
