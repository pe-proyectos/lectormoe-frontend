import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, Inbox, Send, ArrowLeft, LogIn } from 'lucide-react';
import { callAPI } from '../../util/callApi';

interface Props {
  user: any;
  logged: boolean;
}

interface ThreadSummary {
  id: number;
  category: string;
  subject: string;
  status: string;
  lastMessageAt: string;
  unread: number;
  organization: { name: string; slug: string; logoUrl: string | null };
}

interface Message {
  id: number;
  isStaffReply: boolean;
  body: string;
  createdAt: string;
  sender: { username: string; slug: string; imageUrl: string | null };
}

const CAT_LABEL: Record<string, string> = { gracias: 'Agradecimiento', sugerencia: 'Sugerencia', queja: 'Queja', unirme: 'Unirme', otro: 'Otro' };

const relTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'ahora';
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  return new Date(iso).toLocaleDateString('es');
};

const MessagesInbox: React.FC<Props> = ({ logged }) => {
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<ThreadSummary | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [closed, setClosed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await callAPI('/api/messages/me'); setThreads(res || []); } catch { setThreads([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (logged) load(); else setLoading(false); }, [logged, load]);

  const open = async (th: ThreadSummary) => {
    setActive(th); setThreadLoading(true); setMessages([]); setClosed(th.status === 'closed');
    try {
      const res = await callAPI(`/api/messages/${th.id}`);
      setMessages(res.messages || []);
      setThreads((prev) => prev.map((t) => (t.id === th.id ? { ...t, unread: 0 } : t)));
    } catch { /* noop */ } finally { setThreadLoading(false); }
  };

  const send = async () => {
    if (!active || reply.trim().length < 1) return;
    setSending(true);
    try {
      await callAPI(`/api/messages/${active.id}/reply`, { method: 'POST', body: JSON.stringify({ body: reply.trim() }) });
      setReply('');
      const res = await callAPI(`/api/messages/${active.id}`);
      setMessages(res.messages || []);
    } catch (e: any) { alert(e?.message || 'No se pudo enviar.'); } finally { setSending(false); }
  };

  if (!logged) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <LogIn className="mx-auto mb-3 text-zinc-600" />
        <p className="text-zinc-400 mb-4">Inicia sesión para ver tus mensajes con los scans.</p>
        <a href="/login" className="inline-block bg-cyan-500 text-zinc-950 rounded-xl px-5 py-2.5 font-black text-xs uppercase tracking-widest">Iniciar sesión</a>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-black text-white mb-1">Mis mensajes</h1>
      <p className="text-zinc-500 text-sm mb-5">Conversaciones con los scans a los que escribiste.</p>
      <div className="grid md:grid-cols-[320px_1fr] gap-4">
        <div className={active ? 'hidden md:block' : ''}>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-zinc-600" /></div>
          ) : threads.length === 0 ? (
            <div className="text-center py-10 text-zinc-600"><Inbox className="mx-auto mb-2" /><p className="text-sm">Aún no tienes mensajes.</p></div>
          ) : (
            <div className="space-y-2">
              {threads.map((th) => (
                <button key={th.id} onClick={() => open(th)} className={`w-full text-left p-3 rounded-xl border transition-colors ${active?.id === th.id ? 'border-cyan-500 bg-zinc-800' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-black text-white truncate">{th.organization.name}</span>
                    {th.unread > 0 && <span className="bg-cyan-500 text-zinc-950 text-[10px] font-black rounded-full px-1.5">{th.unread}</span>}
                  </div>
                  <p className="text-xs text-zinc-400 truncate">{th.subject}</p>
                  <p className="text-[11px] text-zinc-600">{CAT_LABEL[th.category] || th.category} · {relTime(th.lastMessageAt)}{th.status === 'closed' ? ' · cerrada' : ''}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={`${active ? '' : 'hidden md:flex md:items-center md:justify-center'} bg-zinc-900 border border-zinc-800 rounded-2xl min-h-[420px] flex flex-col`}>
          {!active ? (
            <p className="text-zinc-600 text-sm">Selecciona una conversación.</p>
          ) : (
            <>
              <div className="flex items-center gap-2 p-4 border-b border-zinc-800">
                <button className="md:hidden" onClick={() => setActive(null)}><ArrowLeft size={18} className="text-zinc-400" /></button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white truncate">{active.organization.name}</p>
                  <p className="text-xs text-zinc-500 truncate">{active.subject}</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {threadLoading ? <div className="flex justify-center py-6"><Loader2 className="animate-spin text-zinc-600" /></div> : messages.map((m) => (
                  <div key={m.id} className={`flex ${m.isStaffReply ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 ${m.isStaffReply ? 'bg-zinc-800 text-zinc-100' : 'bg-cyan-500 text-zinc-950'}`}>
                      <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                      <p className={`text-[10px] mt-1 ${m.isStaffReply ? 'text-zinc-500' : 'text-zinc-800'}`}>{m.isStaffReply ? active.organization.name : 'Tú'} · {relTime(m.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
              {closed ? (
                <p className="p-3 border-t border-zinc-800 text-center text-xs text-zinc-500">El scan cerró esta conversación.</p>
              ) : (
                <div className="p-3 border-t border-zinc-800 flex gap-2">
                  <input value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()} placeholder="Escribe un mensaje…" className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-white text-sm focus:border-cyan-500 outline-none" />
                  <button onClick={send} disabled={sending || !reply.trim()} className="bg-cyan-500 text-zinc-950 rounded-xl px-4 font-bold disabled:opacity-40">{sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesInbox;
