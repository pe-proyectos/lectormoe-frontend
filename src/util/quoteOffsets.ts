// Offsets de caracteres de un rango dentro del texto renderizado de un elemento.
// Permite compartir una cita como ?q=<inicio>-<fin> (corto, sin el texto) y
// reconstruir el rango al abrir el enlace. Usa el textContent concatenado de
// los nodos de texto (deterministico para el mismo capitulo).

export function getRangeOffsets(root: HTMLElement, range: Range): { start: number; end: number } | null {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let acc = 0
  let start = -1
  let end = -1
  let n: Node | null = walker.nextNode()
  while (n) {
    const len = (n.nodeValue || '').length
    if (n === range.startContainer) start = acc + range.startOffset
    if (n === range.endContainer) end = acc + range.endOffset
    acc += len
    n = walker.nextNode()
  }
  if (start < 0 || end < 0 || end <= start) return null
  return { start, end }
}

export function rangeFromOffsets(root: HTMLElement, start: number, end: number): Range | null {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let acc = 0
  let sNode: Node | null = null
  let sOff = 0
  let eNode: Node | null = null
  let eOff = 0
  let n: Node | null = walker.nextNode()
  while (n) {
    const len = (n.nodeValue || '').length
    if (!sNode && start <= acc + len) { sNode = n; sOff = start - acc }
    if (!eNode && end <= acc + len) { eNode = n; eOff = end - acc; break }
    acc += len
    n = walker.nextNode()
  }
  if (!sNode || !eNode) return null
  try {
    const r = document.createRange()
    r.setStart(sNode, Math.max(0, Math.min(sOff, (sNode.nodeValue || '').length)))
    r.setEnd(eNode, Math.max(0, Math.min(eOff, (eNode.nodeValue || '').length)))
    return r.collapsed ? null : r
  } catch {
    return null
  }
}
