import { useState, useCallback } from 'react';

// Imagen con reintento opcional. Cuando `retryable` está activo (p. ej. las
// páginas del lector) y la imagen falla al cargar, muestra un botón para
// recargar SOLO esa hoja (con cache-buster para saltarse la caché del fallo).
export const LazyImage = ({ src, alt, retryable = false, className, style, ...rest }) => {
  const [tick, setTick] = useState(0);
  const [status, setStatus] = useState('loading'); // loading | loaded | error

  const bustedSrc =
    tick > 0 && src ? src + (src.includes('?') ? '&' : '?') + 'r=' + tick : src;

  const retry = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setStatus('loading');
    setTick((t) => t + 1);
  }, []);

  const noSelect = {
    onContextMenu: (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    },
    onMouseDown: (e) => {
      if (e.button === 2) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    },
  };

  if (retryable && status === 'error') {
    return (
      <div
        className={className}
        style={{
          ...style,
          minHeight: 240,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          background: '#18181b',
          color: '#a1a1aa',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600 }}>Esta página no cargó</span>
        <button
          type="button"
          onClick={retry}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            minHeight: 44,
            padding: '0 20px',
            borderRadius: 12,
            border: 0,
            background: '#06b6d4',
            color: '#09090b',
            fontWeight: 800,
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            cursor: 'pointer',
          }}
        >
          {'↻'} Reintentar página
        </button>
      </div>
    );
  }

  return (
    <img
      src={bustedSrc}
      alt={alt}
      className={className}
      style={style}
      onError={() => {
        if (retryable) setStatus('error');
      }}
      onLoad={() => {
        if (retryable && status !== 'loaded') setStatus('loaded');
      }}
      {...noSelect}
      {...rest}
    />
  );
};
