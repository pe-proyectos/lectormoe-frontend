import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, Inbox, Send, CheckCircle2, ArrowLeft } from 'lucide-react';
import { callAPI } from '../../util/callApi';

interface Props {
  organization: any;
  user: any;
  organizationSlug: string;
}

interface ThreadSummary {
  id: number;
  category: string;
  subject: string;
  status: string;
  lastMessageAt: string;
  unread: number;
  user: { username: string; slug: string; imageUrl: string | null };
}

interface Message {
  id: number;
  isStaffReply: boolean;
  body: string;
  createdAt: string;
  sender: { username: string; slug: string; imageUrl: string | null };
}

const CAT_LABEL: Record<string, string> = { gracias: 'Agradecimiento', sugerencia: 'Sugerencia', queja: 'Queja', unirme: 'Quiere unirse', otro: 'Otro' };
const CAT_COLOR: Record<string, string> = { gracias: 'bg-green-500/15 text-green-400', sugerencia: 'bg-cyan-500/15 text-cyan-400', queja: 'bg-red-500/15 text-red-400', unirme: 'bg-purple-500/15 text-purple-400', otro: 'bg-zinc-500/15 text-zinc-400' };

const relTime = (iso: string) => {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'ahora';
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  return new Date(iso).toLocaleDateString('es');
};

const AdminMessages: React.FC<Props> = () => {
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [statusFilter, setStatusFilter] = useState<'open' | 'closed' | 'all'>('open');
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<ThreadSummary | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const loadThreads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await callAPI(`/api/organization/messages?status=${statusFilter}`);
      setThreads(res || []);
    } catch { setThreads([]); } finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { loadThreads(); }, [loadThreads]);

  const openThread = async (th: ThreadSummary) => {
    setActive(th); setThreadLoading(true); setMessages([]);
    try {
      const res = await callAPI(`/api/messages/${th.id}`);
      setMessages(res.messages || []);
      setThreads((prev) => prev.map((t) => (t.id === th.id ? { ...t, unread: 0 } : t)));
    } catch { /* noop */ } finally { setThreadLoading(false); }
  };

  const sendReply = async () => {
    if (!active || reply.trim().length < 1) return;
    setSending(true);
    try {
      await callAPI(`/api/messages/${active.id}/reply`, { method: 'POST', body: JSON.stringify({ body: reply.trim() }) });
      setReply('');
      const res = await callAPI(`/api/messages/${active.id}`);
      setMessages(res.messages || []);
    } catch (e: any) { alert(e?.message || 'No se pudo enviar.'); } finally { setSending(false); }
  };

  const closeThread = async () => {
    if (!active) return;
    await callAPI(`/api/messages/${active.id}/close`, { method: 'PATCH' });
    setActive(null); loadThreads();
  };

  return (
    <div className="grid md:grid-cols-[340px_1fr] gap-4 mt-4">
      {/* Lista */}
      <div className={`${active ? 'hidden md:block' : ''}`}>
        <div className="flex gap-1 mb-3">
          {(['open', 'closed', 'all'] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${statusFilter === s ? 'bg-cyan-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400'}`}>
              {s === 'open' ? 'Abiertas' : s === 'closed' ? 'Cerradas' : 'Todas'}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-zinc-600" /></div>
        ) : threads.length === 0 ? (
          <div className="text-center py-10 text-zinc-600"><Inbox className="mx-auto mb-2" /><p className="text-sm">No hay conversaciones.</p></div>
        ) : (
          <div className="space-y-2">
            {threads.map((th) => (
              <button key={th.id} onClick={() => openThread(th)} className={`w-full text-left p-3 rounded-xl border transition-colors ${active?.id === th.id ? 'border-cyan-500 bg-zinc-800' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CAT_COLOR[th.category] || CAT_COLOR.otro}`}>{CAT_LABEL[th.category] || th.category}</span>
                  {th.unread > 0 && <span className="bg-cyan-500 text-zinc-950 text-[10px] font-black rounded-full px-1.5">{th.unread}</span>}
                </div>
                <p className="text-sm font-bold text-white truncate">{th.subject}</p>
                <p className="text-xs text-zinc-500 truncate">de @{th.user.username} · {relTime(th.lastMessageAt)}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hilo */}
      <div className={`${active ? '' : 'hidden md:flex md:items-center md:justify-center'} bg-zinc-900 border border-zinc-800 rounded-2xl min-h-[400px] flex flex-col`}>
        {!active ? (
          <p className="text-zinc-600 text-sm">Selecciona una conversación.</p>
        ) : (
          <>
            <div className="flex items-center gap-2 p-4 border-b border-zinc-800">
              <button className="md:hidden" onClick={() => setActive(null)}><ArrowLeft size={18} className="text-zinc-400" /></button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-white truncate">{active.subject}</p>
                <p className="text-xs text-zinc-500">@{active.user.username}</p>
              </div>
              {active.status === 'open' && <button onClick={closeThread} className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white"><CheckCircle2 size={14} /> Cerrar</button>}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {threadLoading ? <div className="flex justify-center py-6"><Loader2 className="animate-spin text-zinc-600" /></div> : messages.map((m) => (
                <div key={m.id} className={`flex ${m.isStaffReply ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 ${m.isStaffReply ? 'bg-cyan-500 text-zinc-950' : 'bg-zinc-800 text-zinc-100'}`}>
                    <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                    <p className={`text-[10px] mt-1 ${m.isStaffReply ? 'text-zinc-800' : 'text-zinc-500'}`}>{m.isStaffReply ? 'Staff' : `@${m.sender.username}`} · {relTime(m.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-zinc-800 flex gap-2">
              <input value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendReply()} placeholder="Escribe una respuesta…" className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-white text-sm focus:border-cyan-500 outline-none" />
              <button onClick={sendReply} disabled={sending || !reply.trim()} className="bg-cyan-500 text-zinc-950 rounded-xl px-4 font-bold disabled:opacity-40">{sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminMessages;
