import type React from 'react';
import { useState } from 'react';
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

  return (
    <div className="pt-24 pb-24 min-h-screen bg-zinc-950">
      <div className="max-w-7xl mx-auto px-3 md:px-8">
        <CapibaraPlans user={user} logged={logged} paypalClientId={paypalClientId} onVisible={setVisible} />

        {visible === false && (
          <div className="text-center py-24 space-y-3">
            <h1 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter uppercase">Suscripción Capibara</h1>
            <p className="text-zinc-400">Muy pronto: un solo plan para leer en todos los scans.</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default GlobalSubscriptionsPage;
