import React, { useMemo, useState } from 'react'

// Panel editable de importacion de libros (epub/docx/md). Recibe los capitulos
// ya parseados por /api/files/parse-book y permite revisar/ajustar titulo, tomo
// (volumen) y numero mostrado (displayNumber, por tomo) antes de crearlos en
// lote. General: sirve para cualquier obra, no es una solucion custom.

export interface ParsedChapter {
  title: string
  bodyMarkdown: string
  volumeNumber: number | null
}

export interface ParsedBook {
  bookTitle: string | null
  images: number
  warnings: string[]
  chapters: ParsedChapter[]
  kind: string
}

export interface CreateRow {
  title: string
  number: number
  bodyMarkdown: string
  volumeNumber: number | null
  displayNumber: number | null
  // Publicacion programada en ISO (null = publicar ya)
  publishAt: string | null
}

interface Row {
  title: string
  bodyMarkdown: string
  volume: string // input controlado
  display: string
  publishAt: string // datetime-local (hora local); vacio = publicar ya
}

// Date -> valor de <input type="datetime-local"> en hora local.
const toLocalInput = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

interface Props {
  data: ParsedBook
  baseNumber: number // ultimo numero global existente; los nuevos siguen desde aqui
  onCancel: () => void
  onConfirm: (rows: CreateRow[]) => Promise<void>
}

const BookImportDialog: React.FC<Props> = ({ data, baseNumber, onCancel, onConfirm }) => {
  const [rows, setRows] = useState<Row[]>(() =>
    data.chapters.map((c) => ({
      title: c.title,
      bodyMarkdown: c.bodyMarkdown,
      volume: c.volumeNumber != null ? String(c.volumeNumber) : '',
      display: '',
      publishAt: '',
    }))
  )
  // "Publicar uno por dia": fecha/hora del primero; los siguientes, +1 dia.
  const [scheduleStart, setScheduleStart] = useState<string>(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    d.setHours(18, 0, 0, 0)
    return toLocalInput(d)
  })
  const [scheduleError, setScheduleError] = useState<string>('')
  const [baseVolume, setBaseVolume] = useState<string>('')
  const [creating, setCreating] = useState(false)

  const setRow = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  const removeRow = (i: number) => setRows((rs) => rs.filter((_, idx) => idx !== i))

  const assignVolumeToAll = () => {
    if (baseVolume.trim() === '') return
    setRows((rs) => rs.map((r) => ({ ...r, volume: baseVolume.trim() })))
  }

  // Auto-numera el "N mostrado" reiniciando por tomo: 1,2,3... dentro de cada
  // volumen (respeta el orden actual). Los .5 / 0 se ajustan a mano.
  const autoNumberPerVolume = () => {
    const counters = new Map<string, number>()
    setRows((rs) =>
      rs.map((r) => {
        const key = r.volume.trim() || '_'
        const n = (counters.get(key) ?? 0) + 1
        counters.set(key, n)
        return { ...r, display: String(n) }
      })
    )
  }

  // Asigna publishAt consecutivos (uno por dia) en el orden de la lista, que
  // es el orden de numero de capitulo. Cada fila se puede editar despues.
  const scheduleOnePerDay = () => {
    const start = new Date(scheduleStart)
    if (!scheduleStart || Number.isNaN(start.getTime())) {
      setScheduleError('Elige la fecha y hora del primer capítulo.')
      return
    }
    if (start.getTime() <= Date.now()) {
      setScheduleError('La fecha de inicio debe ser futura.')
      return
    }
    setScheduleError('')
    setRows((rs) =>
      rs.map((r, i) => {
        const d = new Date(start)
        d.setDate(d.getDate() + i)
        return { ...r, publishAt: toLocalInput(d) }
      })
    )
  }
  const clearSchedule = () => setRows((rs) => rs.map((r) => ({ ...r, publishAt: '' })))
  const scheduledCount = rows.filter((r) => r.publishAt).length

  const grouped = useMemo(() => {
    const g = new Map<string, number>()
    for (const r of rows) g.set(r.volume.trim() || 'sin tomo', (g.get(r.volume.trim() || 'sin tomo') ?? 0) + 1)
    return [...g.entries()]
  }, [rows])

  const confirm = async () => {
    setCreating(true)
    try {
      const payload: CreateRow[] = rows.map((r, i) => ({
        title: r.title.trim() || `Capitulo ${i + 1}`,
        number: baseNumber + i + 1, // identidad global secuencial
        bodyMarkdown: r.bodyMarkdown,
        volumeNumber: r.volume.trim() === '' ? null : Number(r.volume),
        displayNumber: r.display.trim() === '' ? null : Number(r.display),
        publishAt: r.publishAt ? new Date(r.publishAt).toISOString() : null,
      }))
      await onConfirm(payload)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onCancel}>
      <div
        className="w-full max-w-4xl max-h-[88vh] flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 pb-3 border-b border-zinc-800">
          <h3 className="text-white font-black text-lg">Importar libro</h3>
          <p className="text-zinc-400 text-sm">
            {data.kind.toUpperCase()} · {rows.length} capitulos{data.images ? ` · ${data.images} imagenes` : ''}
            {data.bookTitle ? ` · ${data.bookTitle}` : ''}
          </p>
          {data.warnings.length > 0 && (
            <p className="mt-1 text-[11px] text-amber-400/80">{data.warnings.length} aviso(s): {data.warnings[0]}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label className="text-[11px] text-zinc-400 font-bold">Tomo</label>
            <input
              value={baseVolume}
              onChange={(e) => setBaseVolume(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="ej. 1"
              className="w-16 px-2 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm"
            />
            <button type="button" onClick={assignVolumeToAll} className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold">
              Asignar tomo a todos
            </button>
            <button type="button" onClick={autoNumberPerVolume} className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold">
              Auto-numerar por tomo
            </button>
            <span className="text-[10px] text-zinc-600">Tomos: {grouped.map(([k, n]) => `${k} (${n})`).join(' · ')}</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label className="text-[11px] text-zinc-400 font-bold">Publicar uno por día desde</label>
            <input
              type="datetime-local"
              value={scheduleStart}
              onChange={(e) => setScheduleStart(e.target.value)}
              className="px-2 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm [color-scheme:dark]"
            />
            <button type="button" onClick={scheduleOnePerDay} className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold">
              Publicar uno por día
            </button>
            {scheduledCount > 0 && (
              <button type="button" onClick={clearSchedule} className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold">
                Quitar programación
              </button>
            )}
          </div>
          {scheduleError && <p className="mt-1 text-[11px] text-red-400">{scheduleError}</p>}
          <p className="mt-1 text-[10px] text-zinc-500">
            A diferencia de la fecha de salida (acceso anticipado), un capítulo programado no lo ve nadie hasta su fecha y hora; entonces se publica solo. Vacío = publicar ya.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
          <div className="grid grid-cols-[1fr_60px_70px_190px_28px] gap-2 px-1 text-[9px] font-black uppercase tracking-wider text-zinc-500">
            <span>Titulo</span><span>Tomo</span><span>N° most.</span><span>Programar publicación</span><span></span>
          </div>
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-[1fr_60px_70px_190px_28px] gap-2 items-center">
              <input
                value={r.title}
                onChange={(e) => setRow(i, { title: e.target.value })}
                className="px-2 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm truncate"
              />
              <input
                value={r.volume}
                onChange={(e) => setRow(i, { volume: e.target.value.replace(/[^0-9]/g, '') })}
                placeholder="—"
                className="px-2 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm text-center"
              />
              <input
                value={r.display}
                onChange={(e) => setRow(i, { display: e.target.value.replace(/[^0-9.]/g, '') })}
                placeholder="—"
                className="px-2 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm text-center"
              />
              <input
                type="datetime-local"
                value={r.publishAt}
                onChange={(e) => setRow(i, { publishAt: e.target.value })}
                title="Vacío = publicar ya"
                className="px-2 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs [color-scheme:dark]"
              />
              <button type="button" onClick={() => removeRow(i)} title="Quitar" className="h-7 w-7 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-white/5 flex items-center justify-center text-lg leading-none">
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-zinc-800 flex gap-3">
          <button type="button" onClick={onCancel} disabled={creating} className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-800 text-zinc-300 text-sm font-bold hover:bg-zinc-800 transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button type="button" onClick={confirm} disabled={creating || rows.length === 0} className="flex-1 px-4 py-2.5 rounded-xl bg-cyan-500 text-zinc-950 text-sm font-black hover:bg-cyan-400 transition-colors disabled:opacity-50">
            {creating
              ? 'Creando...'
              : `Crear ${rows.length} capítulos${scheduledCount ? ` (${scheduledCount} programados)` : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default BookImportDialog
