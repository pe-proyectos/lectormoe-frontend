// Cómo se nombra cada entrega de una obra. La mayoría de mangas se publican
// por capítulos, pero muchas novelas salen por tomos y ahí el número de tomo
// es el que importa. El scan lo elige por obra.

export type ChapterLabelMode = 'chapter' | 'volume' | 'both'

interface ChapterLike {
  number: number
  displayNumber?: number | null
  volumeNumber?: number | null
  title?: string | null
}

export function normalizeLabelMode(value: any): ChapterLabelMode {
  return value === 'volume' || value === 'both' ? value : 'chapter'
}

/**
 * Etiqueta corta de una entrega, p. ej. "Capítulo 12", "Tomo 3" o
 * "Tomo 3 · Capítulo 12".
 *
 * En modo 'volume', cuando un tomo tiene varias entregas se numeran como
 * "Tomo 3 - 2" para poder distinguirlas sin sacar el capítulo global.
 */
export function chapterLabel(
  chapter: ChapterLike,
  mode: ChapterLabelMode = 'chapter',
  opts: { positionInVolume?: number; totalInVolume?: number; short?: boolean } = {},
): string {
  const num = chapter.displayNumber ?? chapter.number
  const cap = opts.short ? `Cap. ${num}` : `Capítulo ${num}`
  const vol = chapter.volumeNumber

  if (mode === 'chapter' || vol == null) return cap

  if (mode === 'volume') {
    const parte =
      opts.totalInVolume && opts.totalInVolume > 1 && opts.positionInVolume
        ? ` - ${opts.positionInVolume}`
        : ''
    return `Tomo ${vol}${parte}`
  }

  return `Tomo ${vol} · ${cap}`
}

/** Posición de cada capítulo dentro de su tomo, para el modo 'volume'. */
export function volumePositions(chapters: ChapterLike[]): Map<number, { pos: number; total: number }> {
  const porVolumen = new Map<number, ChapterLike[]>()
  for (const c of chapters) {
    if (c.volumeNumber == null) continue
    const lista = porVolumen.get(c.volumeNumber) || []
    lista.push(c)
    porVolumen.set(c.volumeNumber, lista)
  }

  const salida = new Map<number, { pos: number; total: number }>()
  for (const [, lista] of porVolumen) {
    lista.sort((a, b) => a.number - b.number)
    lista.forEach((c, i) => salida.set(c.number, { pos: i + 1, total: lista.length }))
  }
  return salida
}
