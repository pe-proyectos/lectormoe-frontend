import type React from 'react';
import { useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import CapibaraPlans from './CapibaraPlans';

interface Props {
  user: any;
  logged: boolean;
  paypalClientId?: string;
}

/**
 * Pagina general de suscripciones (/subscriptions). No hay scan de origen:
 * el 25% que se llevaria el scan que trae al suscriptor se suma al reparto
 * por lectura.
 */
const GlobalSubscriptionsPage: React.FC<Props> = ({ user, logged, paypalClientId }) => {
  const [visible, setVisible] = useState<boolean | null>(null);
  const go = (path: string) => { window.location.href = path; };

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar
        user={user}
        logged={logged}
        activeView="home"
        onOpenLogin={() => go('/login')}
        onOpenRegister={() => go('/register')}
        onGoHome={() => go('/')}
        onGoExplore={() => go('/scans')}
        onGoSearch={() => go('/search')}
      />

      <main className="relative pt-24 pb-24 overflow-hidden">
        {/* Mismo fondo que la pagina de suscripciones de cada scan. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1100px] h-[600px] rounded-full bg-cyan-500/10 blur-[140px]" />
          <div className="absolute top-40 right-[8%] w-[420px] h-[420px] rounded-full bg-amber-400/[0.06] blur-[120px]" />
          <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-3 md:px-8">
          <CapibaraPlans user={user} logged={logged} paypalClientId={paypalClientId} onVisible={setVisible} />

          {visible === false && (
            <div className="text-center py-24 space-y-3">
              <h1 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter uppercase">Suscripción Capibara</h1>
              <p className="text-zinc-400">Muy pronto: un solo plan para leer en todos los scans.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default GlobalSubscriptionsPage;
