import React from 'react';
import { ArrowLeft, ArrowRight, BookMarked, Download, MessagesSquare, Layers, X as XIcon, Eye as EyeIcon, EyeOff as EyeOffIcon } from 'lucide-react';

// Marco común de las pantallas de cuenta (entrar, registrarse, recuperar y
// restablecer contraseña): marca real de Capibara (o Capibara × scan), panel de
// beneficios en escritorio y el formulario en una tarjeta.

interface AuthShellProps {
  organization?: any;
  title: string;
  subtitle?: string;
  /** Icono o ilustración sobre el título (p. ej. un check al terminar). */
  hero?: React.ReactNode;
  children: React.ReactNode;
  /** Enlace secundario al pie de la tarjeta (cambiar entre entrar/registrarse). */
  footer?: React.ReactNode;
}

const esRed = () => typeof window !== 'undefined' && window.location.pathname.startsWith('/red');

export const AuthShell: React.FC<AuthShellProps> = ({ organization, title, subtitle, hero, children, footer }) => {
  const red = esRed();
  const scan = organization?.slug ? organization : null;
  const volverHref = scan ? `/${scan.slug}` : red ? '/red' : '/';
  const glow = red ? 'bg-red-500/15' : 'bg-cyan-500/15';
  const acento = red ? 'text-red-400' : 'text-cyan-400';

  const beneficios = [
    { Icon: Layers, titulo: 'Una cuenta para todos los scans', texto: 'Entra una vez y lee en cualquier scan de la plataforma.' },
    { Icon: BookMarked, titulo: 'Tu progreso siempre contigo', texto: 'Historial, Mi lista y favoritos sincronizados en todos tus dispositivos.' },
    { Icon: Download, titulo: 'Lee sin conexión', texto: 'Descarga capítulos y léelos donde no tengas señal.' },
    { Icon: MessagesSquare, titulo: 'Comenta en La Charca', texto: 'Habla de cada capítulo con otros lectores y con los scans.' },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950">
      {/* Fondo: brillo y cuadrícula suave, como el resto del sitio */}
      <div className={`pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[520px] w-[900px] rounded-full ${glow} blur-[140px]`} />
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_top,black_25%,transparent_70%)]" />

      {/* Barra superior: marca y volver */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-4 md:px-8 pt-5 md:pt-7">
        <a href={red ? '/red' : '/'} className="flex items-center gap-2.5 group">
          <img
            src={red ? '/images/redlogocaptrad.png' : '/images/logocaptrad.png'}
            alt="CapibaraTraductor"
            className="h-10 w-10 object-contain transition-transform group-hover:scale-105"
          />
          <span className="hidden sm:inline text-lg font-bold tracking-tight text-white">
            {red && <span className="text-red-500">Red </span>}Capibara<span className={red ? 'text-red-500' : 'text-cyan-500'}>Traductor</span>
          </span>
        </a>
        <a
          href={volverHref}
          className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900/80 px-3.5 py-2 text-xs font-bold text-zinc-300 ring-1 ring-zinc-800 transition-colors hover:text-white hover:ring-zinc-600"
        >
          <ArrowLeft size={14} /> {scan ? `Volver a ${scan.name}` : 'Volver al inicio'}
        </a>
      </header>

      <main className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-4 md:px-8 py-10 md:py-14 lg:min-h-[calc(100vh-88px)] lg:grid-cols-2">
        {/* Panel de marca (escritorio) */}
        <section className="hidden lg:block">
          {scan ? (
            <div className="mb-8 flex items-center gap-4">
              <img src={red ? '/images/redlogocaptrad.png' : '/images/logocaptrad.png'} alt="" className="h-14 w-14 object-contain" />
              <XIcon size={18} className="text-zinc-600" />
              {scan.logoUrl ? (
                <img src={scan.logoUrl} alt={scan.name} className="h-16 w-16 rounded-2xl object-cover ring-2 ring-zinc-800" />
              ) : (
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800 text-2xl font-black text-white">{scan.name?.[0]}</span>
              )}
            </div>
          ) : null}
          <p className={`mb-3 text-[11px] font-black uppercase tracking-[0.25em] ${acento}`}>
            {scan ? `${scan.name} en CapibaraTraductor` : 'La casa de los scans en español'}
          </p>
          <h2 className="max-w-lg text-5xl font-black uppercase italic leading-[0.95] tracking-tighter text-white">
            Tu lectura, en todos tus dispositivos
          </h2>
          <ul className="mt-10 max-w-md space-y-5">
            {beneficios.map(({ Icon, titulo, texto }) => (
              <li key={titulo} className="flex items-start gap-4">
                <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 ring-1 ring-zinc-800 ${acento}`}>
                  <Icon size={19} />
                </span>
                <span>
                  <span className="block text-[15px] font-bold text-zinc-100">{titulo}</span>
                  <span className="block text-sm leading-snug text-zinc-500">{texto}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Tarjeta del formulario */}
        <section className="mx-auto w-full max-w-md animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="rounded-[32px] bg-zinc-900/70 p-7 shadow-2xl shadow-black/60 ring-1 ring-zinc-800 backdrop-blur-xl md:p-9">
            {scan && (
              <div className="mb-6 flex items-center justify-center gap-3 lg:hidden">
                <img src={red ? '/images/redlogocaptrad.png' : '/images/logocaptrad.png'} alt="" className="h-10 w-10 object-contain" />
                <XIcon size={14} className="text-zinc-600" />
                {scan.logoUrl ? (
                  <img src={scan.logoUrl} alt={scan.name} className="h-11 w-11 rounded-xl object-cover ring-1 ring-zinc-700" />
                ) : (
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-800 font-black text-white">{scan.name?.[0]}</span>
                )}
              </div>
            )}

            <div className="mb-8 text-center">
              {hero}
              <h1 className="text-3xl font-black uppercase italic leading-none tracking-tighter text-white">{title}</h1>
              {subtitle && <p className="mt-2 text-sm leading-relaxed text-zinc-400">{subtitle}</p>}
              {scan && (
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-zinc-800/70 px-3 py-1 text-[11px] font-bold text-zinc-400">
                  <Layers size={12} className={acento} /> Tu cuenta sirve en todos los scans
                </p>
              )}
            </div>

            {children}

            {footer && <div className="mt-8 border-t border-zinc-800 pt-6 text-center">{footer}</div>}
          </div>

          <p className="mt-6 text-center text-xs leading-relaxed text-zinc-600">
            Al continuar aceptas los{' '}
            <a href="/terms" className="text-zinc-400 underline underline-offset-4 hover:text-white">Términos</a> y la{' '}
            <a href="/privacy" className="text-zinc-400 underline underline-offset-4 hover:text-white">Política de privacidad</a>.
          </p>
        </section>
      </main>
    </div>
  );
};

// ─── Piezas de formulario compartidas ───────────────────────────────────────

interface AuthFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: React.ElementType;
  hint?: string;
  /** Acción a la derecha de la etiqueta (p. ej. "¿Olvidaste tu contraseña?"). */
  labelAction?: React.ReactNode;
  /** Botón dentro del campo, a la derecha (p. ej. mostrar contraseña). */
  trailing?: React.ReactNode;
}

export const AuthField: React.FC<AuthFieldProps> = ({ label, icon: Icon, hint, labelAction, trailing, id, ...input }) => {
  const campoId = id || `f-${label.toLowerCase().replace(/[^a-z]+/g, '-')}`;
  return (
    <div className="space-y-1.5">
      <div className="flex items-end justify-between px-1">
        <label htmlFor={campoId} className="text-xs font-bold text-zinc-400">{label}</label>
        {labelAction}
      </div>
      <div className="group relative">
        <Icon size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-cyan-400" />
        <input
          id={campoId}
          {...input}
          className={`w-full rounded-2xl border border-zinc-800 bg-zinc-950/70 py-3.5 pl-12 ${trailing ? 'pr-12' : 'pr-4'} text-base text-white placeholder-zinc-600 transition-all focus:border-cyan-500 focus:outline-none focus:ring-4 focus:ring-cyan-500/10`}
        />
        {trailing && <div className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</div>}
      </div>
      {hint && <p className="px-1 text-[11px] text-zinc-500">{hint}</p>}
    </div>
  );
};

export const AuthSubmit: React.FC<{ loading: boolean; children: React.ReactNode }> = ({ loading, children }) => (
  <button
    type="submit"
    disabled={loading}
    className={`flex w-full min-h-[52px] items-center justify-center gap-2 rounded-2xl text-sm font-black uppercase tracking-[0.15em] transition-all active:scale-[0.98] ${
      loading
        ? 'cursor-wait bg-zinc-800 text-zinc-500'
        : 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-zinc-950 shadow-lg shadow-cyan-500/20 hover:from-cyan-300 hover:to-cyan-400'
    }`}
  >
    {loading ? (
      <>
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-300" /> Procesando…
      </>
    ) : (
      <>
        {children} <ArrowRight size={17} />
      </>
    )}
  </button>
);

export const AuthError: React.FC<{ message?: string }> = ({ message }) =>
  message ? (
    <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
      {message}
    </div>
  ) : null;

export const AuthSuccessIcon: React.FC<{ Icon: React.ElementType }> = ({ Icon }) => (
  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30">
    <Icon size={30} />
  </div>
);

export const PasswordToggle: React.FC<{ visible: boolean; onToggle: () => void }> = ({ visible, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
    className="rounded-lg p-2 text-zinc-500 transition-colors hover:text-cyan-400"
  >
    {visible ? <EyeOffIcon /> : <EyeIcon />}
  </button>
);

export default AuthShell;
