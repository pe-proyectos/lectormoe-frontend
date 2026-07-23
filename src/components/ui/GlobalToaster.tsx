import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Contenedor único de toasts para las páginas que usan LandingLayout (antes no
// tenían ninguno, así que su feedback no aparecía). La posición por defecto la
// fija cada toast vía util/feedback (abajo-centro en móvil, abajo-derecha en
// desktop); aquí solo damos el fallback y el estilo oscuro.
const GlobalToaster: React.FC = () => (
  <>
    <ToastContainer theme="dark" position="bottom-right" newestOnTop />
    <style
      dangerouslySetInnerHTML={{
        __html: `
      @media (max-width: 767px) {
        .Toastify__toast-container {
          width: 100%;
          left: 0;
          right: 0;
          padding: 0 12px calc(env(safe-area-inset-bottom) + 76px);
          bottom: 0;
        }
        .Toastify__toast {
          border-radius: 16px;
          margin-bottom: 8px;
        }
      }
    `,
      }}
    />
  </>
);

export default GlobalToaster;
