import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MessageCircle, LogIn, Send, Image as ImageIcon, X, Trash2, EyeOff, Heart } from 'lucide-react';
import { notify } from '../../util/feedback';
import { uploadFile } from '../../util/uploadFile';
import { formatDate as formatDateUtil } from '../../util/date';
import { hilosApi, hilosPublic } from '../../util/hilosClient';

// Comentarios servidos por hilos.rest (el motor social compartido con
// lacharca.com). El historial de CapibaraTraductor ya vive ahi, migrado con sus
// fechas y autores originales.

interface HilosComment {
  id: number;
  content: string;
  parentCommentId: number | null;
  likesCount: number;
  liked?: boolean;
  createdAt: string;
  pending?: boolean;
  author: { handle: string; displayName: string | null; avatarUrl: string | null };
}

interface Props {
  /** Referencia del contenido: 'chapter:<id>' o 'manga:<mangaCustomId>'. */
  hilosRef: string;
  logged: boolean;
  user: any;
  organization?: any;
  onLogin?: () => void;
}

const MAX = 1000;
const R2_BASE = (import.meta.env['PUBLIC_R2_PUBLIC_URL'] || 'https://r2.capibaratraductor.com').replace(/\/$/, '');
// uploadFile devuelve la clave en R2; hilos guarda la URL absoluta en el texto.
const publicUrl = (key: string) => (/^https?:\/\//.test(key) ? key : `${R2_BASE}/${key.replace(/^\//, '')}`);
const isImg = (u: string) => /\.(png|jpe?g|gif|webp)(\?.*)?$/i.test(u);

const split = (content: string) => {
  const parts = (content || '').split(/\s+/);
  const imgs = parts.filter((w) => /^https?:\/\//.test(w) && isImg(w));
  const text = (content || '').split('\n').filter((l) => !imgs.includes(l.trim())).join('\n');
  return { text, imgs };
};

const HilosComments: React.FC<Props> = ({ hilosRef, logged, user, organization, onLogin }) => {
  const [postId, setPostId] = useState<number | null>(null);
  const [items, setItems] = useState<HilosComment[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<HilosComment | null>(null);
  const [posting, setPosting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [zoom, setZoom] = useState<string | null>(null);
  const boxRef = useRef<HTMLTextAreaElement>(null);

  const canModerate = !!user?.permissions?.find((p: any) => p.organizationId === organization?.id)?.canHideComment;

  const load = useCallback(async (p: number, replace: boolean) => {
    setLoading(true);
    try {
      const id = postId ?? (await hilosApi.postRef(hilosRef));
      if (!id) { setPostId(null); setItems([]); setLoading(false); return; }
      if (!postId) setPostId(id);
      const fn = logged ? hilosApi.comments : (pid: number, pg: number, lim: number) => hilosPublic(`/posts/${pid}/comments?page=${pg}&limit=${lim}`);
      const d = await fn(id, p, 100);
      const list: HilosComment[] = d?.items || [];
      setItems((prev) => (replace ? list : [...prev, ...list]));
      setHasMore(!!d?.hasMore);
      setTotal(d?.total ?? list.length);
    } catch {
      if (replace) setItems([]);
    } finally { setLoading(false); }
  }, [hilosRef, postId, logged]);

  useEffect(() => { setPostId(null); setPage(0); load(0, true); /* eslint-disable-next-line */ }, [hilosRef]);

  const byParent = useMemo(() => {
    const m = new Map<number, HilosComment[]>();
    for (const c of items) if (c.parentCommentId) m.set(c.parentCommentId, [...(m.get(c.parentCommentId) || []), c]);
    return m;
  }, [items]);
  const roots = useMemo(() => items.filter((c) => !c.parentCommentId), [items]);

  const pickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { notify.error('La imagen no puede pesar más de 5 MB'); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };
  const clearImage = () => { setFile(null); setPreview(null); };

  const submit = async () => {
    if (!logged) { onLogin?.(); return; }
    const body = text.trim();
    if ((!body && !file) || posting || !postId) return;
    setPosting(true);

    let imageUrl: string | null = null;
    if (file) {
      try { imageUrl = publicUrl(await uploadFile(file, undefined, 'comments')); }
      catch { notify.error('No se pudo subir la imagen'); setPosting(false); return; }
    }
    const content = [body, imageUrl].filter(Boolean).join('\n');

    // Optimista: el comentario aparece al instante y se reconcilia al responder.
    const tempId = -Date.now();
    const parentId = replyTo?.id;
    const optimistic: HilosComment = {
      id: tempId, content, parentCommentId: parentId ?? null, likesCount: 0, liked: false,
      createdAt: new Date().toISOString(), pending: true,
      author: { handle: user?.slug || 'tu', displayName: user?.username || 'Tú', avatarUrl: user?.imageUrl || null },
    };
    setItems((l) => [...l, optimistic]);
    setTotal((n) => n + 1);
    setText(''); clearImage(); setReplyTo(null);

    try {
      const created = await hilosApi.comment(postId, content, parentId);
      setItems((l) => l.map((c) => (c.id === tempId ? created : c)));
    } catch (e: any) {
      setItems((l) => l.filter((c) => c.id !== tempId));
      setTotal((n) => Math.max(0, n - 1));
      setText(body);
      notify.error(e?.message === 'rate_limited' ? 'Vas muy rápido, espera un momento' : 'No se pudo comentar');
    } finally { setPosting(false); }
  };

  const toggleLike = async (c: HilosComment) => {
    if (!logged) { onLogin?.(); return; }
    if (c.pending) return;
    const next = !c.liked;
    setItems((l) => l.map((x) => (x.id === c.id ? { ...x, liked: next, likesCount: Math.max(0, x.likesCount + (next ? 1 : -1)) } : x)));
    try {
      const r = await hilosApi.likeComment(c.id);
      setItems((l) => l.map((x) => (x.id === c.id ? { ...x, liked: r.liked, likesCount: r.likesCount } : x)));
    } catch {
      setItems((l) => l.map((x) => (x.id === c.id ? { ...x, liked: !next, likesCount: Math.max(0, x.likesCount + (next ? -1 : 1)) } : x)));
      notify.error('No se pudo registrar tu me gusta');
    }
  };

  const remove = async (c: HilosComment) => {
    if (!confirm('¿Eliminar tu comentario?')) return;
    const before = items;
    setItems((l) => l.filter((x) => x.id !== c.id));
    setTotal((n) => Math.max(0, n - 1));
    try { await hilosApi.removeComment(c.id); }
    catch { setItems(before); notify.error('No se pudo eliminar'); }
  };

  const hide = async (c: HilosComment) => {
    const before = items;
    setItems((l) => l.filter((x) => x.id !== c.id));
    try { await hilosApi.hideComment(c.id, true, organization?.slug); notify.success('Comentario oculto'); }
    catch { setItems(before); notify.error('No se pudo ocultar'); }
  };

  const startReply = (c: HilosComment) => {
    if (!logged) { onLogin?.(); return; }
    setReplyTo(c);
    boxRef.current?.focus();
  };

  const Avatar = ({ c, size = 40 }: { c: HilosComment['author']; size?: number }) =>
    c?.avatarUrl
      ? <img src={c.avatarUrl} alt="" style={{ width: size, height: size }} className="rounded-2xl object-cover flex-shrink-0" />
      : <div style={{ width: size, height: size }} className="rounded-2xl bg-zinc-800 flex items-center justify-center font-bold text-zinc-400 flex-shrink-0">
          {(c?.displayName || c?.handle || '?')[0]?.toUpperCase()}
        </div>;

  const Item = ({ c, nested = false }: { c: HilosComment; nested?: boolean }) => {
    const { text: body, imgs } = split(c.content);
    const replies = byParent.get(c.id) || [];
    const mine = logged && user?.slug && c.author?.handle === user.slug;
    return (
      <div className={nested ? 'mt-4' : 'py-4 border-b border-zinc-900 last:border-0'} style={c.pending ? { opacity: 0.55 } : undefined}>
        <div className="flex gap-3">
          <a href={`/profile/${c.author?.handle}`} className="flex-shrink-0"><Avatar c={c.author} size={nested ? 32 : 40} /></a>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <a href={`/profile/${c.author?.handle}`} className="text-sm font-bold text-white hover:text-cyan-400 transition-colors truncate">
                {c.author?.displayName || c.author?.handle}
              </a>
              <span className="text-[11px] text-zinc-600">
                {c.pending ? 'enviando…' : formatDateUtil(c.createdAt, 'es')}
              </span>
            </div>

            {body.trim() && <p className="text-sm text-zinc-300 mt-1 whitespace-pre-wrap break-words">{body}</p>}
            {imgs.map((u) => (
              <img key={u} src={u} alt="" loading="lazy" onClick={() => setZoom(u)}
                className="mt-2 max-h-64 rounded-2xl border border-zinc-800 cursor-zoom-in" />
            ))}

            <div className="flex items-center gap-4 mt-2">
              <button type="button" onClick={() => toggleLike(c)}
                className={`flex items-center gap-1.5 text-xs transition-colors ${c.liked ? 'text-rose-400' : 'text-zinc-500 hover:text-zinc-300'}`}>
                <Heart size={14} fill={c.liked ? 'currentColor' : 'none'} />
                {c.likesCount > 0 && <span className="tabular-nums">{c.likesCount}</span>}
              </button>
              <button type="button" onClick={() => startReply(c)} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                <MessageCircle size={14} /> Responder
              </button>
              {mine && !c.pending && (
                <button type="button" onClick={() => remove(c)} className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-red-400 transition-colors">
                  <Trash2 size={14} /> Eliminar
                </button>
              )}
              {canModerate && !c.pending && (
                <button type="button" onClick={() => hide(c)} className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-amber-400 transition-colors">
                  <EyeOff size={14} /> Ocultar
                </button>
              )}
            </div>

            {replies.length > 0 && (
              <div className="mt-2 pl-4 border-l border-zinc-900">
                {replies.map((r) => <Item key={r.id} c={r} nested />)}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!loading && postId === null) {
    return (
      <div className="bg-zinc-950/60 border border-zinc-900 rounded-3xl p-6 text-center">
        <MessageCircle size={22} className="mx-auto text-zinc-700 mb-2" />
        <p className="text-sm text-zinc-500">Los comentarios de esta página aún no están disponibles.</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-950/60 border border-zinc-900 rounded-3xl p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-5">
        <MessageCircle size={18} className="text-cyan-400" />
        <h3 className="text-base font-bold text-white">Comentarios</h3>
        {total > 0 && <span className="text-xs text-zinc-500 tabular-nums">{total.toLocaleString('es')}</span>}
      </div>

      {logged ? (
        <div className="mb-6 space-y-3">
          {replyTo && (
            <div className="flex items-center justify-between gap-2 bg-zinc-900/60 border border-zinc-800 rounded-2xl px-3 py-2">
              <span className="text-xs text-zinc-400 truncate">
                Respondiendo a <b className="text-zinc-200">{replyTo.author?.displayName || replyTo.author?.handle}</b>
              </span>
              <button type="button" onClick={() => setReplyTo(null)} className="text-zinc-500 hover:text-white transition-colors"><X size={14} /></button>
            </div>
          )}

          {preview && (
            <div className="relative inline-block">
              <img src={preview} alt="" className="max-h-32 rounded-2xl border border-zinc-800" />
              <button type="button" onClick={clearImage}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-400 rounded-full flex items-center justify-center transition-colors">
                <X size={14} />
              </button>
            </div>
          )}

          <div className="flex gap-3">
            <input type="file" accept="image/*" onChange={pickImage} className="hidden" id="hilos-comment-image" />
            <label htmlFor="hilos-comment-image"
              className="w-12 h-12 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-2xl flex items-center justify-center cursor-pointer transition-colors flex-shrink-0">
              <ImageIcon size={20} className="text-zinc-500" />
            </label>
            <textarea
              ref={boxRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
              placeholder={replyTo ? 'Escribir respuesta...' : 'Escribe un comentario...'}
              maxLength={MAX}
              rows={3}
              className="flex-1 bg-zinc-950 text-white p-4 rounded-2xl border border-zinc-800 focus:outline-none focus:border-cyan-500 resize-none"
            />
            <button type="button" onClick={submit} disabled={posting || (!text.trim() && !file)}
              className="w-12 h-12 bg-cyan-500 hover:bg-cyan-400 disabled:bg-zinc-800 disabled:cursor-not-allowed rounded-2xl flex items-center justify-center transition-colors flex-shrink-0">
              <Send size={20} className="text-zinc-950" />
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={onLogin}
          className="w-full mb-6 flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-2xl py-3 text-sm font-bold text-zinc-300 transition-colors">
          <LogIn size={16} /> Inicia sesión para comentar
        </button>
      )}

      {loading && items.length === 0 ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-2xl bg-zinc-900 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-28 bg-zinc-900 rounded" />
                <div className="h-3 w-3/4 bg-zinc-900 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : roots.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-8">Sé el primero en comentar.</p>
      ) : (
        <div>{roots.map((c) => <Item key={c.id} c={c} />)}</div>
      )}

      {hasMore && (
        <button type="button" onClick={() => { const n = page + 1; setPage(n); load(n, false); }} disabled={loading}
          className="w-full mt-4 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-sm font-bold text-zinc-300 transition-colors">
          {loading ? 'Cargando…' : 'Ver más comentarios'}
        </button>
      )}

      {zoom && (
        <div onClick={() => setZoom(null)} className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out">
          <img src={zoom} alt="" className="max-h-full max-w-full rounded-2xl" />
        </div>
      )}
    </div>
  );
};

export default HilosComments;
