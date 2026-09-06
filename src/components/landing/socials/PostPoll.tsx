import React, { useState } from 'react'
import { Check } from 'lucide-react'
import { callAPI } from '../../../util/callApi'

interface Opt { text: string; votes: number }
export interface Poll { id: number; options: Opt[]; votesCount: number; endsAt: string; myVote: number | null }

interface Props { poll: Poll; logged: boolean; language?: string; onLogin?: () => void }

function timeLeft(endsAt: string, en: boolean): string {
  const ms = new Date(endsAt).getTime() - Date.now()
  if (ms <= 0) return en ? 'Final results' : 'Resultados finales'
  const h = Math.floor(ms / 3600000)
  if (h >= 24) { const d = Math.floor(h / 24); return en ? `${d}d left` : `Quedan ${d}d` }
  if (h >= 1) return en ? `${h}h left` : `Quedan ${h}h`
  const m = Math.max(1, Math.floor(ms / 60000)); return en ? `${m}m left` : `Quedan ${m}m`
}

const PostPoll: React.FC<Props> = ({ poll: initial, logged, language = 'es', onLogin }) => {
  const en = language === 'en'
  const [poll, setPoll] = useState<Poll>(initial)
  const [busy, setBusy] = useState(false)
  const ended = new Date(poll.endsAt).getTime() < Date.now()
  const voted = poll.myVote != null
  const showResults = voted || ended
  const total = poll.votesCount || 0

  const vote = async (i: number) => {
    if (!logged) { onLogin?.(); return }
    if (busy || voted || ended) return
    setBusy(true)
    try {
      const r: any = await callAPI(`/api/polls/${poll.id}/vote`, { method: 'POST', body: JSON.stringify({ optionIndex: i }) })
      setPoll({ ...poll, options: r.options, votesCount: r.votesCount, myVote: r.myVote })
    } catch (e: any) { if (String(e?.message).includes('votaste')) setPoll({ ...poll, myVote: i }) } finally { setBusy(false) }
  }

  return (
    <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
      {poll.options.map((o, i) => {
        const pct = total > 0 ? Math.round((o.votes / total) * 100) : 0
        const mine = poll.myVote === i
        return (
          <button key={i} type="button" onClick={() => vote(i)} disabled={busy || showResults}
            className={`relative w-full text-left rounded-xl overflow-hidden border transition ${showResults ? 'border-white/10 cursor-default' : 'border-white/15 hover:border-cyan-400/60 cursor-pointer'}`}>
            {showResults && <div className={`absolute inset-y-0 left-0 ${mine ? 'bg-cyan-500/25' : 'bg-white/[0.06]'}`} style={{ width: `${pct}%`, transition: 'width 500ms cubic-bezier(0.22,1,0.36,1)' }} />}
            <div className="relative flex items-center justify-between px-4 py-2.5">
              <span className={`text-sm font-semibold ${mine ? 'text-cyan-200' : 'text-white/90'} flex items-center gap-1.5`}>{mine && <Check size={14} className="text-cyan-300" />}{o.text}</span>
              {showResults && <span className="text-sm font-bold text-white/70 tabular-nums">{pct}%</span>}
            </div>
          </button>
        )
      })}
      <p className="text-[12px] text-white/40 pt-0.5">{total} {en ? 'votes' : 'votos'} · {timeLeft(poll.endsAt, en)}</p>
    </div>
  )
}

export default PostPoll
