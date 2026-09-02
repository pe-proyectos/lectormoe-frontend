import React, { useState, useEffect, useCallback } from 'react';
import { uploadFile } from '../../util/uploadFile';
import { useDialog } from '../ui/useDialog';

const API = import.meta.env.PUBLIC_API_URL as string;

interface RaffleAdmin {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  bannerUrl: string | null;
  ticketPrice: number;
  currency: string;
  minTickets: number;
  maxTickets: number;
  maxTicketsPerUser: number;
  winnersCount: number;
  eliminationIntervalMs: number;
  drawType: string;
  drawAt: string | null;
  status: string;
  cancelReason: string | null;
  sold: number;
  available: number;
  winner: any;
  createdAt: string;
}

interface Props { token: string }

const saFetch = async (path: string, token: string, options?: RequestInit) => {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options?.headers ?? {}),
    },
  });
  const json = await res.json();
  if (!json.status) throw new Error(json.message ?? 'Error');
  return json.data;
};

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// uploadFile returns the R2 object key (e.g. "tenants/superadmin/raffles/foo.png").
// We need an absolute URL — when PUBLIC_R2_PUBLIC_URL is unset we fall back to the
// production R2 host so admins editing in any environment still get loadable
// <img src> values instead of relative paths.
const R2_FALLBACK_BASE = 'https://r2.capibaratraductor.com';
const resolveR2Url = (key: string): string => {
  if (/^https?:\/\//i.test(key)) return key;
  const baseUrl = (import.meta.env.PUBLIC_R2_PUBLIC_URL || R2_FALLBACK_BASE).replace(/\/$/, '');
  return `${baseUrl}/${key.replace(/^\//, '')}`;
};

// Converts a UTC ISO string ("2026-04-26T18:00:00.000Z") to the local
// datetime-local input format ("YYYY-MM-DDTHH:MM") in the admin's timezone.
// Feeding raw ISO.slice(0, 16) into <input type="datetime-local"> would
// display the UTC clock value as if it were local — e.g. a 1pm-Lima draw
// (stored as 18:00 UTC) would show as "06:00 PM" in the input. This helper
// prevents that.
const isoToLocalDatetimeInput = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// Live multi-timezone preview for raffle draw datetimes. The input value is
// the local time of whoever is filling the form; we show what that wall-clock
// translates to in the LATAM markets the platform serves so the admin doesn't
// accidentally schedule the draw for 3am in Buenos Aires.
const TZ_PREVIEWS: Array<{ label: string; tz: string }> = [
  { label: 'Argentina', tz: 'America/Argentina/Buenos_Aires' },
  { label: 'Chile',     tz: 'America/Santiago' },
  { label: 'Perú',      tz: 'America/Lima' },
  { label: 'México',    tz: 'America/Mexico_City' },
];

const formatInTz = (iso: string, tz: string): string => {
  try {
    return new Intl.DateTimeFormat('es', {
      timeZone: tz,
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(iso));
  } catch {
    return '—';
  }
};

const DateTimeFriendly: React.FC<{
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  label?: string;
  hint?: string;
}> = ({ value, onChange, disabled, label = 'Fecha y hora del sorteo', hint = 'Hora local de tu dispositivo. Abajo te mostramos cómo se ve en otras zonas.' }) => {
  // value is the datetime-local string ("YYYY-MM-DDTHH:MM"). Browsers interpret
  // this as local time when constructing a Date, which is exactly what we want
  // for the per-TZ preview below.
  const previewIso = value ? new Date(value).toISOString() : '';
  return (
    <div>
      <label className="text-xs text-zinc-400 font-bold">{label}</label>
      <input
        type="datetime-local"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white disabled:opacity-50"
      />
      {hint && <p className="text-[10px] text-zinc-500 mt-1">{hint}</p>}
      {value && (
        <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px]">
          {TZ_PREVIEWS.map((tz) => (
            <div key={tz.tz} className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-md">
              <span className="text-zinc-500 font-bold">{tz.label}</span>
              <span className="text-zinc-200 font-mono">{formatInTz(previewIso, tz.tz)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors: Record<string, string> = {
    active: 'bg-green-500/20 text-green-400',
    drawing: 'bg-yellow-500/20 text-yellow-400 animate-pulse',
    completed: 'bg-blue-500/20 text-blue-400',
    cancelled: 'bg-red-500/20 text-red-400',
  };
  return (
    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${colors[status] ?? 'bg-zinc-700 text-zinc-300'}`}>
      {status}
    </span>
  );
};

const CreateModal: React.FC<{ onClose: () => void; onCreated: () => void; token: string }> = ({ onClose, onCreated, token }) => {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [ticketPrice, setTicketPrice] = useState(0);
  const [currency, setCurrency] = useState('USD');
  const [minTickets, setMinTickets] = useState(1);
  const [maxTickets, setMaxTickets] = useState(50);
  const [maxTicketsPerUser, setMaxTicketsPerUser] = useState(5);
  const [winnersCount, setWinnersCount] = useState(1);
  const [drawType, setDrawType] = useState<'countdown' | 'max-tickets'>('countdown');
  const [drawAt, setDrawAt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (!slugTouched) setSlug(slugify(title)); }, [title, slugTouched]);
  // Clamp winnersCount to a valid range whenever maxTickets changes so we
  // never submit a value the backend will reject.
  const winnersMax = Math.max(1, Math.min(maxTickets - 1, 100));
  useEffect(() => {
    if (winnersCount > winnersMax) setWinnersCount(winnersMax);
  }, [winnersMax, winnersCount]);

  const handleFileUpload = async (file: File, target: 'image' | 'banner') => {
    try {
      const key = await uploadFile(file, undefined, 'raffles', token);
      const fullUrl = resolveR2Url(key);
      if (target === 'image') setImageUrl(fullUrl);
      else setBannerUrl(fullUrl);
    } catch (err: any) {
      setError(err?.message || 'Error al subir el archivo.');
    }
  };

  const submit = async () => {
    setError('');
    setBusy(true);
    try {
      await saFetch('/api/superadmin/raffles', token, {
        method: 'POST',
        body: JSON.stringify({
          slug,
          title,
          description: description || null,
          imageUrl: imageUrl || null,
          bannerUrl: bannerUrl || null,
          ticketPrice,
          currency,
          minTickets,
          maxTickets,
          maxTicketsPerUser,
          winnersCount,
          drawType,
          drawAt: drawType === 'countdown' && drawAt ? new Date(drawAt).toISOString() : null,
        }),
      });
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al crear el sorteo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-black text-white mb-4">Nuevo sorteo</h2>
        {error && <div className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs text-zinc-400 font-bold">Nombre del sorteo</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Suscripción Premium 1 año" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white" />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-zinc-400 font-bold">URL del sorteo</label>
            <div className="flex items-center mt-1">
              <span className="px-3 py-2 bg-zinc-900 border border-r-0 border-zinc-800 rounded-l-lg text-xs text-zinc-500 font-mono">/luckys/</span>
              <input value={slug} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }} className="flex-1 bg-zinc-950 border border-zinc-800 rounded-r-lg px-3 py-2 text-sm text-white font-mono" />
            </div>
            <p className="text-[10px] text-zinc-500 mt-1">Se autocompleta a partir del nombre. Edítalo si quieres.</p>
          </div>
          <div className="col-span-2">
            <label className="text-xs text-zinc-400 font-bold">Descripción</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Cuenta de qué se trata el premio, condiciones, etc." className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 font-bold">Precio por ticket</label>
            <div className="flex items-center mt-1">
              <input type="number" step="0.01" min="0" value={ticketPrice} onChange={(e) => setTicketPrice(parseFloat(e.target.value) || 0)} className="flex-1 bg-zinc-950 border border-r-0 border-zinc-800 rounded-l-lg px-3 py-2 text-sm text-white" />
              <input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase().slice(0, 3))} className="w-16 bg-zinc-900 border border-zinc-800 rounded-r-lg px-2 py-2 text-sm text-white font-mono text-center" />
            </div>
            <p className="text-[10px] text-zinc-500 mt-1">{ticketPrice === 0 ? '🎁 Sorteo gratis (sin pago)' : `${ticketPrice.toFixed(2)} ${currency} por cada ticket`}</p>
          </div>
          <div>
            <label className="text-xs text-zinc-400 font-bold">Tipo de sorteo</label>
            <select value={drawType} onChange={(e) => setDrawType(e.target.value as any)} className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white">
              <option value="countdown">Por fecha límite</option>
              <option value="max-tickets">Cuando se vendan todos los tickets</option>
            </select>
            <p className="text-[10px] text-zinc-500 mt-1">{drawType === 'countdown' ? 'Se sortea automáticamente en la fecha que elijas.' : 'Se sortea apenas se llene el cupo máximo.'}</p>
          </div>
          <div>
            <label className="text-xs text-zinc-400 font-bold">Mínimo para que se realice</label>
            <input type="number" min="1" value={minTickets} onChange={(e) => setMinTickets(parseInt(e.target.value) || 1)} className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white" />
            <p className="text-[10px] text-zinc-500 mt-1">Si no se vende este mínimo, se cancela y se reembolsa.</p>
          </div>
          <div>
            <label className="text-xs text-zinc-400 font-bold">Máximo total de tickets</label>
            <input type="number" min="1" max="99999" value={maxTickets} onChange={(e) => setMaxTickets(parseInt(e.target.value) || 1)} className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white" />
            <p className="text-[10px] text-zinc-500 mt-1">Cupo total de la rifa. Hasta 99,999.</p>
          </div>
          <div>
            <label className="text-xs text-zinc-400 font-bold">Máximo por usuario</label>
            <input type="number" min="1" value={maxTicketsPerUser} onChange={(e) => setMaxTicketsPerUser(parseInt(e.target.value) || 1)} className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white" />
            <p className="text-[10px] text-zinc-500 mt-1">Cuántos tickets puede comprar una misma persona.</p>
          </div>
          <div>
            <label className="text-xs text-zinc-400 font-bold">Cantidad de ganadores</label>
            <input
              type="number"
              min="1"
              max={winnersMax}
              value={winnersCount}
              onChange={(e) => setWinnersCount(Math.max(1, Math.min(winnersMax, parseInt(e.target.value) || 1)))}
              className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white"
            />
            <p className="text-[10px] text-zinc-500 mt-1">Cuántos tickets sobreviven después de la ronda de eliminación. Mínimo 1.</p>
          </div>
          {drawType === 'countdown' && (
            <div className="col-span-2">
              <DateTimeFriendly value={drawAt} onChange={setDrawAt} />
            </div>
          )}
          <div>
            <label className="text-xs text-zinc-400 font-bold">Imagen (portada)</label>
            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'image')} className="w-full text-xs text-zinc-400" />
            {imageUrl && <p className="text-[10px] text-emerald-400 mt-1 truncate">✓ {imageUrl}</p>}
          </div>
          <div>
            <label className="text-xs text-zinc-400 font-bold">Imagen (banner)</label>
            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'banner')} className="w-full text-xs text-zinc-400" />
            {bannerUrl && <p className="text-[10px] text-emerald-400 mt-1 truncate">✓ {bannerUrl}</p>}
          </div>
        </div>
        <div className="mt-5 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-sm font-bold hover:bg-zinc-700">Cancelar</button>
          <button onClick={submit} disabled={busy || !title || !slug} className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-bold hover:bg-violet-500 disabled:opacity-50">
            {busy ? 'Creando...' : 'Crear sorteo'}
          </button>
        </div>
      </div>
    </div>
  );
};

const EditModal: React.FC<{ raffle: RaffleAdmin; onClose: () => void; onSaved: () => void; token: string }> = ({ raffle, onClose, onSaved, token }) => {
  const [title, setTitle] = useState(raffle.title);
  const [description, setDescription] = useState(raffle.description ?? '');
  const [ticketPrice, setTicketPrice] = useState(raffle.ticketPrice);
  const [currency, setCurrency] = useState(raffle.currency);
  const [minTickets, setMinTickets] = useState(raffle.minTickets);
  const [maxTickets, setMaxTickets] = useState(raffle.maxTickets);
  const [maxTicketsPerUser, setMaxTicketsPerUser] = useState(raffle.maxTicketsPerUser);
  const [winnersCount, setWinnersCount] = useState(raffle.winnersCount ?? 1);
  const [drawType, setDrawType] = useState<'countdown' | 'max-tickets'>(raffle.drawType as any);
  const [drawAt, setDrawAt] = useState(isoToLocalDatetimeInput(raffle.drawAt));
  const [imageUrl, setImageUrl] = useState(raffle.imageUrl ?? '');
  const [bannerUrl, setBannerUrl] = useState(raffle.bannerUrl ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = async (file: File, target: 'image' | 'banner') => {
    try {
      const key = await uploadFile(file, undefined, 'raffles', token);
      const fullUrl = resolveR2Url(key);
      if (target === 'image') setImageUrl(fullUrl);
      else setBannerUrl(fullUrl);
    } catch (err: any) {
      setError(err?.message || 'Error al subir el archivo.');
    }
  };

  const submit = async () => {
    setError('');
    setBusy(true);
    try {
      await saFetch(`/api/superadmin/raffles/${raffle.slug}`, token, {
        method: 'PATCH',
        body: JSON.stringify({
          title,
          description: description || null,
          imageUrl: imageUrl || null,
          bannerUrl: bannerUrl || null,
          ticketPrice,
          currency,
          minTickets,
          maxTickets,
          maxTicketsPerUser,
          winnersCount,
          drawType,
          drawAt: drawType === 'countdown' && drawAt ? new Date(drawAt).toISOString() : null,
        }),
      });
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al guardar.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-black text-white mb-1">Editar sorteo</h2>
        <p className="text-zinc-500 text-xs mb-4 font-mono">/{raffle.slug}</p>
        {raffle.sold > 0 && (
          <div className="mb-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-200 text-xs">
            Hay {raffle.sold} ticket(s) vendido(s). Como superadmin puedes editar todo igual — cambios económicos (precio, máximos, fecha) afectan a compradores existentes, así que ten cuidado.
          </div>
        )}
        {error && <div className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs text-zinc-400 font-bold">Título</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white" />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-zinc-400 font-bold">Descripción</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 font-bold">Precio del ticket</label>
            <input type="number" step="0.01" min="0" value={ticketPrice} onChange={(e) => setTicketPrice(parseFloat(e.target.value) || 0)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 font-bold">Moneda</label>
            <input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase().slice(0, 3))} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white font-mono" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 font-bold">Mín. tickets</label>
            <input type="number" min="1" value={minTickets} onChange={(e) => setMinTickets(parseInt(e.target.value) || 1)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 font-bold">Máx. tickets</label>
            <input type="number" min="1" max="99999" value={maxTickets} onChange={(e) => setMaxTickets(parseInt(e.target.value) || 1)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 font-bold">Máx. por usuario</label>
            <input type="number" min="1" value={maxTicketsPerUser} onChange={(e) => setMaxTicketsPerUser(parseInt(e.target.value) || 1)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 font-bold">Cantidad de ganadores</label>
            <input
              type="number"
              min="1"
              max={Math.max(1, Math.min(maxTickets - 1, 100))}
              value={winnersCount}
              onChange={(e) => setWinnersCount(parseInt(e.target.value) || 1)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white"
            />
            <p className="text-[10px] text-zinc-500 mt-1">Cuántos tickets sobreviven después de la ronda de eliminación. Mínimo 1.</p>
          </div>
          <div>
            <label className="text-xs text-zinc-400 font-bold">Tipo de sorteo</label>
            <select value={drawType} onChange={(e) => setDrawType(e.target.value as any)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white">
              <option value="countdown">Cuenta atrás</option>
              <option value="max-tickets">Al llenar</option>
            </select>
          </div>
          {drawType === 'countdown' && (
            <div className="col-span-2">
              <DateTimeFriendly value={drawAt} onChange={setDrawAt} />
            </div>
          )}
          <div>
            <label className="text-xs text-zinc-400 font-bold">Imagen (cover)</label>
            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'image')} className="w-full text-xs text-zinc-400" />
            {imageUrl && <p className="text-[10px] text-emerald-400 mt-1 truncate">✓ {imageUrl}</p>}
          </div>
          <div>
            <label className="text-xs text-zinc-400 font-bold">Banner</label>
            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'banner')} className="w-full text-xs text-zinc-400" />
            {bannerUrl && <p className="text-[10px] text-emerald-400 mt-1 truncate">✓ {bannerUrl}</p>}
          </div>
        </div>
        <div className="mt-5 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-sm font-bold hover:bg-zinc-700">Cancelar</button>
          <button onClick={submit} disabled={busy || !title} className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-bold hover:bg-violet-500 disabled:opacity-50">
            {busy ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};

const SuperadminRaffles: React.FC<Props> = ({ token }) => {
  const dlg = useDialog();
  const [raffles, setRaffles] = useState<RaffleAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<RaffleAdmin | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<'active' | 'completed' | 'all'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await saFetch(`/api/superadmin/raffles?status=${statusFilter}&limit=100`, token);
      setRaffles(data?.items ?? []);
    } catch (err: any) {
      setError(err?.message || 'Error al cargar sorteos.');
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const triggerDraw = async (slug: string) => {
    if (!(await dlg.confirm(`¿Sortear ahora "${slug}"?`))) return;
    setBusyId(-1);
    try {
      await saFetch(`/api/superadmin/raffles/${slug}/draw-now`, token, { method: 'POST' });
      await load();
    } catch (err: any) {
      dlg.alert(err?.message || 'Error al sortear.');
    } finally { setBusyId(null); }
  };

  const cancelRaffle = async (slug: string) => {
    const reason = await dlg.prompt('Razón de cancelación:', { defaultValue: 'cancelled-by-admin' });
    if (!reason) return;
    setBusyId(-1);
    try {
      await saFetch(`/api/superadmin/raffles/${slug}/cancel`, token, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      await load();
    } catch (err: any) {
      dlg.alert(err?.message || 'Error al cancelar.');
    } finally { setBusyId(null); }
  };

  const deleteRaffle = async (slug: string) => {
    if (!(await dlg.confirm(`¿Eliminar (soft delete) "${slug}"? Esto cancela y reembolsa.`))) return;
    setBusyId(-1);
    try {
      await saFetch(`/api/superadmin/raffles/${slug}`, token, { method: 'DELETE' });
      await load();
    } catch (err: any) {
      dlg.alert(err?.message || 'Error al eliminar.');
    } finally { setBusyId(null); }
  };

  return (
    <div className="space-y-4">
      <dlg.DialogHost />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">Sorteos</h2>
          <p className="text-zinc-500 text-sm">Crear, editar, sortear o cancelar.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white">
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="completed">Completados</option>
          </select>
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-bold hover:bg-violet-500">
            + Nuevo sorteo
          </button>
        </div>
      </div>

      {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}

      {loading && <p className="text-zinc-500">Cargando...</p>}

      {!loading && raffles.length === 0 && <p className="text-zinc-500">Sin sorteos aún.</p>}

      {!loading && raffles.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-zinc-950 text-zinc-400 text-left text-xs uppercase tracking-widest">
                <th className="px-4 py-3">Sorteo</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Tickets</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {raffles.map((r) => {
                const ticketsExist = r.sold > 0;
                return (
                  <tr key={r.id} className="hover:bg-zinc-950/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {r.imageUrl ? (
                          <img src={r.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center text-yellow-400">🎟️</div>
                        )}
                        <div>
                          <a href={`/luckys/${r.slug}`} className="text-white font-bold hover:text-yellow-400" target="_blank" rel="noreferrer">{r.title}</a>
                          <p className="text-xs text-zinc-500 font-mono">/{r.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-300">
                      {r.drawType}
                      {r.drawAt && <p className="text-[10px] text-zinc-500">{new Date(r.drawAt).toLocaleString('es-ES')}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold tabular-nums">
                      {r.ticketPrice === 0 ? <span className="text-emerald-400">GRATIS</span> : `$${r.ticketPrice.toFixed(2)} ${r.currency}`}
                    </td>
                    <td className="px-4 py-3 text-sm tabular-nums text-zinc-300">
                      {r.sold}/{r.maxTickets}
                      <p className="text-[10px] text-zinc-500">min {r.minTickets} · máx/user {r.maxTicketsPerUser}</p>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <button onClick={() => setEditing(r)} disabled={busyId !== null} className="px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded text-[10px] font-black uppercase hover:bg-cyan-500/30 disabled:opacity-50">Editar</button>
                        {r.status === 'active' && (
                          <>
                            <button onClick={() => triggerDraw(r.slug)} disabled={busyId !== null} className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded text-[10px] font-black uppercase hover:bg-yellow-500/30 disabled:opacity-50">Sortear</button>
                            <button onClick={() => cancelRaffle(r.slug)} disabled={busyId !== null} className="px-2 py-1 bg-red-500/20 text-red-300 rounded text-[10px] font-black uppercase hover:bg-red-500/30 disabled:opacity-50">Cancelar</button>
                          </>
                        )}
                        {!ticketsExist && (
                          <button onClick={() => deleteRaffle(r.slug)} disabled={busyId !== null} className="px-2 py-1 bg-zinc-800 text-zinc-400 rounded text-[10px] font-black uppercase hover:bg-zinc-700 disabled:opacity-50">Eliminar</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={load} token={token} />}
      {editing && <EditModal raffle={editing} onClose={() => setEditing(null)} onSaved={load} token={token} />}
    </div>
  );
};

export default SuperadminRaffles;
