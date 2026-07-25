import React, { useEffect, useState } from 'react';
import {
  Smartphone,
  Mail,
  Gift,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  CalendarDays,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { callAPI } from '../../util/callApi';

interface Props {
  user?: any;
  logged?: boolean;
}

const GMAIL_RE = /^[a-z0-9._%+-]+@gmail\.com$/i;

type Existing = { id: number; name: string; gmail: string; status: string; createdAt: string } | null;

const statusLabel: Record<string, { text: string; cls: string }> = {
  pending: { text: 'En revisión', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  added: { text: 'Ya eres verificador', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  rejected: { text: 'No aprobada', cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
};

const BetaSignupPage: React.FC<Props> = ({ user, logged }) => {
  const [name, setName] = useState(user?.username || '');
  const [gmail, setGmail] = useState('');
  const [existing, setExisting] = useState<Existing>(null);
  const [loading, setLoading] = useState(!!logged);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!logged) return;
    callAPI('/api/beta/me')
      .then((rec: Existing) => {
        if (rec) {
          setExisting(rec);
          setName(rec.name);
          setGmail(rec.gmail);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [logged]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanName = name.trim();
    const cleanGmail = gmail.trim().toLowerCase();
    if (cleanName.length < 2) {
      setError('Ingresa tu nombre.');
      return;
    }
    if (!GMAIL_RE.test(cleanGmail)) {
      setError('El correo debe ser una cuenta de Gmail (termina en @gmail.com).');
      return;
    }
    setSubmitting(true);
    try {
      const rec = await callAPI('/api/beta/signup', {
        method: 'POST',
        body: JSON.stringify({ name: cleanName, gmail: cleanGmail }),
      });
      setExisting(rec);
      setEditing(false);
    } catch (err: any) {
      setError(err?.message || 'No se pudo registrar. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  // Bloque informativo reutilizable (se muestra siempre).
  const Info = (
    <div className="space-y-4">
      <div className="flex gap-3">
        <ShieldCheck className="text-cyan-400 shrink-0 mt-0.5" size={20} />
        <p className="text-sm text-zinc-300">
          Estamos abriendo <strong className="text-white">CapibaraTraductor</strong> en Google Play y necesitamos
          <strong className="text-white"> verificadores</strong> que prueben la app durante el periodo de prueba
          cerrada. Con tu ayuda podemos publicarla para todos.
        </p>
      </div>
      <div className="flex gap-3">
        <Smartphone className="text-cyan-400 shrink-0 mt-0.5" size={20} />
        <p className="text-sm text-zinc-300">
          Usa el <strong className="text-white">correo de Google que tienes iniciado en tu celular Android</strong>
          {' '}(el de la Play Store). Debe ser una cuenta <strong className="text-white">@gmail.com</strong>. Con ese
          correo te agregamos a la lista y podrás instalar la app de prueba.
        </p>
      </div>
      <div className="flex gap-3">
        <CalendarDays className="text-cyan-400 shrink-0 mt-0.5" size={20} />
        <p className="text-sm text-zinc-300">
          Google pide que la app se pruebe durante <strong className="text-white">16 días seguidos</strong>. Solo
          necesitas tenerla instalada y abrirla de vez en cuando.
        </p>
      </div>
      <div className="flex gap-3 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/25 p-4">
        <Gift className="text-cyan-300 shrink-0 mt-0.5" size={22} />
        <p className="text-sm text-zinc-200">
          <strong className="text-white">Sorteo de $20 USD</strong> entre todos los verificadores que completen los
          <strong className="text-white"> 16 días</strong> de prueba. ¡Gracias por apoyar el proyecto!
        </p>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-2xl mx-auto px-3 md:px-8 pt-24 pb-24">
        <div className="text-center mb-8">
          <span className="inline-block text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400 mb-3">
            Programa de verificadores
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Sé de los primeros en la app</h1>
          <p className="mt-3 text-zinc-400 text-sm md:text-base">
            Ayúdanos a lanzar CapibaraTraductor en Google Play y participa por $20 USD.
          </p>
        </div>

        <div className="rounded-3xl bg-zinc-900/60 border border-zinc-800 p-6 md:p-8 mb-6">{Info}</div>

        {/* Estado no logueado: pedir cuenta */}
        {!logged && (
          <div className="rounded-3xl bg-zinc-900/60 border border-zinc-800 p-6 md:p-8 text-center">
            <p className="text-sm text-zinc-300 mb-5">
              Necesitas una cuenta de CapibaraTraductor para registrarte como verificador.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/login?redirect=/beta"
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-cyan-500 text-zinc-950 font-black uppercase text-xs tracking-widest"
              >
                <LogIn size={16} /> Iniciar sesión
              </a>
              <a
                href="/register?redirect=/beta"
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-zinc-800 border border-zinc-700 text-white font-black uppercase text-xs tracking-widest"
              >
                <UserPlus size={16} /> Crear cuenta
              </a>
            </div>
          </div>
        )}

        {/* Estado logueado */}
        {logged && (
          <div className="rounded-3xl bg-zinc-900/60 border border-zinc-800 p-6 md:p-8">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-zinc-500">
                <Loader2 className="animate-spin" size={22} />
              </div>
            ) : existing && !editing ? (
              // Ya registrado
              <div className="text-center">
                <CheckCircle2 className="text-emerald-400 mx-auto mb-3" size={40} />
                <h2 className="text-xl font-black">¡Estás registrado!</h2>
                <p className="text-sm text-zinc-400 mt-1">Te agregaremos a la lista de verificadores de Google Play.</p>
                <div className="mt-5 inline-flex flex-col gap-2 items-center">
                  <span
                    className={`text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                      statusLabel[existing.status]?.cls || statusLabel.pending.cls
                    }`}
                  >
                    {statusLabel[existing.status]?.text || 'En revisión'}
                  </span>
                  <div className="mt-3 flex items-center gap-2 text-zinc-300 text-sm">
                    <Mail size={16} className="text-zinc-500" />
                    <span className="font-mono">{existing.gmail}</span>
                  </div>
                </div>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="text-xs font-bold text-cyan-400 hover:text-cyan-300 underline underline-offset-4"
                  >
                    Corregir mi nombre o correo
                  </button>
                </div>
                <p className="mt-6 text-xs text-zinc-500">
                  Cuando te agreguemos, recibirás acceso para instalar la app de prueba desde Google Play con ese
                  correo. Te avisaremos.
                </p>
              </div>
            ) : (
              // Formulario de alta / edición
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">
                    Tu nombre
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Cómo te llamas"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-white placeholder-zinc-600 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">
                    Correo de Gmail (el de tu Android)
                  </label>
                  <input
                    type="email"
                    inputMode="email"
                    autoCapitalize="none"
                    value={gmail}
                    onChange={(e) => setGmail(e.target.value)}
                    placeholder="tucorreo@gmail.com"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-white placeholder-zinc-600 focus:border-cyan-500 focus:outline-none font-mono"
                  />
                  <p className="mt-2 text-xs text-zinc-500">
                    Debe ser la cuenta de Google con la que entras a la Play Store en tu teléfono.
                  </p>
                </div>

                {error && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-cyan-500 text-zinc-950 font-black uppercase text-xs tracking-widest disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                  {existing ? 'Guardar cambios' : 'Registrarme como verificador'}
                </button>
                {existing && (
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="w-full text-xs font-bold text-zinc-500 hover:text-zinc-300"
                  >
                    Cancelar
                  </button>
                )}
              </form>
            )}
          </div>
        )}
      </div>
    </main>
  );
};

export default BetaSignupPage;
