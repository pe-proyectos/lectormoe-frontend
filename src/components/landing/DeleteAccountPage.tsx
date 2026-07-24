import React, { useState } from 'react';
import { Trash2, ShieldAlert, Loader2, CheckCircle2, LogIn, Eraser } from 'lucide-react';
import { callAPI } from '../../util/callApi';

interface Props { user?: any; logged?: boolean }

// Página pública de eliminación de cuenta (requisito de Google Play). Explica
// qué datos se borran y, si el usuario ha iniciado sesión, le permite eliminarla
// él mismo confirmando con su contraseña.
const DeleteAccountPage: React.FC<Props> = ({ user, logged }) => {
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [clearingData, setClearingData] = useState(false);

  const clearData = async () => {
    if (!confirm('Se borrarán tu lista, favoritos, notificaciones e historial de lectura. Tu cuenta seguirá activa. ¿Continuar?')) return;
    setClearingData(true);
    try {
      await callAPI('/api/user/delete-data', { method: 'POST' });
      alert('Tus datos de actividad fueron eliminados. Tu cuenta sigue activa.');
    } catch (e: any) {
      alert(e?.message || 'No se pudieron borrar los datos.');
    } finally {
      setClearingData(false);
    }
  };

  const submit = async () => {
    if (confirmText.trim().toUpperCase() !== 'ELIMINAR') { setError('Escribe ELIMINAR para confirmar.'); return; }
    if (!password) { setError('Ingresa tu contraseña.'); return; }
    setBusy(true); setError(null);
    try {
      await callAPI('/api/user/delete-account', { method: 'POST', body: JSON.stringify({ password }) });
      setDone(true);
      // Cierra la sesión localmente.
      setTimeout(() => { window.location.href = '/logout'; }, 3500);
    } catch (e: any) {
      setError(e?.message || 'No se pudo eliminar la cuenta. Intenta de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-start justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-2 text-red-400 font-black text-[10px] uppercase tracking-[0.3em] mb-2">
          <ShieldAlert size={14} /> Cuenta y datos
        </div>
        <h1 className="text-3xl font-black text-white mb-3">Eliminar mi cuenta</h1>
        <p className="text-zinc-400 mb-6">
          Puedes solicitar la eliminación de tu cuenta de CapibaraTraductor y de los datos personales asociados. Esta acción es permanente.
        </p>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Qué se elimina</p>
          <ul className="space-y-2 text-sm text-zinc-300">
            <li>· Tus datos personales: correo, nombre de usuario y foto de perfil (se anonimizan de forma irreversible).</li>
            <li>· Tu lista personal, favoritos y notificaciones.</li>
            <li>· El acceso a la cuenta: no podrás volver a iniciar sesión con ella.</li>
            <li>· Tus descargas offline viven solo en tu dispositivo; bórralas desde la sección Descargas de la app.</li>
          </ul>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-4 mb-2">Qué se conserva y por qué</p>
          <p className="text-xs text-zinc-500">
            Por obligaciones legales y contables, los registros de pagos/transacciones se conservan de forma disociada de tu identidad. Tus comentarios públicos pueden permanecer, ya anonimizados.
          </p>
        </div>

        {done ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-5 text-center">
            <CheckCircle2 size={28} className="text-green-400 mx-auto mb-2" />
            <p className="text-green-300 font-bold">Tu cuenta fue eliminada.</p>
            <p className="text-zinc-500 text-sm mt-1">Cerrando sesión…</p>
          </div>
        ) : logged ? (
          <>
          {/* Opción 1: borrar solo los datos, conservando la cuenta. */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Eraser size={16} className="text-amber-400" />
              <p className="text-sm font-black text-white">Borrar mis datos (mantener la cuenta)</p>
            </div>
            <p className="text-zinc-500 text-sm mb-4">Elimina tu lista personal, favoritos, notificaciones e historial de lectura. Tu cuenta sigue activa y puedes seguir usándola.</p>
            <button
              onClick={clearData}
              disabled={clearingData}
              className="inline-flex items-center gap-2 border border-amber-500/30 text-amber-400 hover:bg-amber-500 hover:text-zinc-950 rounded-xl px-5 py-2.5 min-h-[44px] font-black text-[10px] uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              {clearingData ? <Loader2 size={15} className="animate-spin" /> : <Eraser size={15} />} Borrar mis datos de actividad
            </button>
          </div>

          {/* Opción 2: eliminar la cuenta por completo. */}
          <div className="bg-zinc-900 border border-red-500/20 rounded-2xl p-5">
            <p className="text-zinc-300 text-sm mb-4">
              <span className="font-black text-white">Eliminar la cuenta.</span> Sesión iniciada como <span className="font-black text-white">@{user?.username}</span>. Para confirmar, ingresa tu contraseña y escribe <span className="font-black text-white">ELIMINAR</span>.
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tu contraseña"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white text-sm mb-3 focus:border-red-500 outline-none"
            />
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Escribe ELIMINAR"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white text-sm mb-1 focus:border-red-500 outline-none"
            />
            <p className={`text-[11px] mb-4 min-h-[16px] ${error ? 'text-red-400' : 'text-zinc-600'}`}>{error || ' '}</p>
            <button
              onClick={submit}
              disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 bg-red-500 text-white rounded-xl py-3 min-h-[44px] font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Eliminar mi cuenta permanentemente
            </button>
          </div>
          </>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <p className="text-zinc-300 text-sm mb-4">
              Para eliminar tu cuenta, primero inicia sesión. Si no puedes acceder, escríbenos a <a href="mailto:contacto@capibaratraductor.com" className="text-cyan-400 hover:underline">contacto@capibaratraductor.com</a> desde el correo de tu cuenta y procesaremos la eliminación.
            </p>
            <a href="/login?redirect=/eliminar-cuenta" className="w-full inline-flex items-center justify-center gap-2 bg-cyan-500 text-zinc-950 rounded-xl py-3 min-h-[44px] font-black text-[10px] uppercase tracking-widest hover:bg-white transition-colors">
              <LogIn size={16} /> Iniciar sesión para eliminar mi cuenta
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeleteAccountPage;
