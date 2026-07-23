import { toast, type ToastOptions } from 'react-toastify';

// Feedback consistente en toda la app. En móvil los toasts van abajo-centro
// (por encima del MobileTabBar) y en desktop abajo-derecha, como hasta ahora.
const isMobile = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;

const baseOpts = (): ToastOptions => ({
  position: isMobile() ? 'bottom-center' : 'bottom-right',
  autoClose: 3000,
  hideProgressBar: isMobile(),
  theme: 'dark',
});

export const notify = {
  success: (msg: string, opts?: ToastOptions) => toast.success(msg, { ...baseOpts(), ...opts }),
  error: (msg: string, opts?: ToastOptions) => toast.error(msg, { ...baseOpts(), autoClose: 4500, ...opts }),
  info: (msg: string, opts?: ToastOptions) => toast.info(msg, { ...baseOpts(), ...opts }),
  loading: (msg: string) => toast.loading(msg, { ...baseOpts(), autoClose: false }),
  dismiss: (id?: string | number) => toast.dismiss(id),
};

// Acción optimista con reconciliación.
// 1) Aplica el cambio en la UI al instante (apply).
// 2) Llama al servidor.
// 3a) Éxito: si el servidor devuelve un valor distinto, se reconcilia (reconcile).
// 3b) Error: se revierte (rollback) y se avisa con un toast claro.
//
//   await optimistic({
//     apply:     () => setLiked(true),
//     rollback:  () => setLiked(false),
//     run:       () => callAPI('/api/like', { method: 'POST' }),
//     reconcile: (serverValue) => setLikes(serverValue.count),
//     errorMsg:  'No se pudo dar me gusta',
//   });
export async function optimistic<R>(args: {
  apply: () => void;
  rollback: () => void;
  run: () => Promise<R>;
  reconcile?: (result: R) => void;
  errorMsg?: string;
  successMsg?: string;
}): Promise<R | null> {
  args.apply();
  try {
    const result = await args.run();
    args.reconcile?.(result);
    if (args.successMsg) notify.success(args.successMsg);
    return result;
  } catch (e: any) {
    args.rollback();
    notify.error(args.errorMsg || e?.message || 'Algo salió mal. Intenta de nuevo.');
    return null;
  }
}
