// Resaltado persistente de la seleccion mientras la barra de citas esta abierta.
// Usa la CSS Custom Highlight API (Chrome/Edge/Safari 17.2+). Si no hay soporte,
// hace no-op (la barra sigue funcionando con el texto ya capturado).
const NAME = 'quote-sel'

export const supportsHighlight = (): boolean =>
  typeof CSS !== 'undefined' &&
  // @ts-ignore
  !!(CSS as any).highlights &&
  typeof (window as any).Highlight === 'function'

// Pinta el rango y devuelve un cleanup.
export function paintRange(range: Range): () => void {
  if (!supportsHighlight()) return () => {}
  try {
    // @ts-ignore
    ;(CSS as any).highlights.set(NAME, new (window as any).Highlight(range.cloneRange()))
    return clearHighlight
  } catch {
    return () => {}
  }
}

export function clearHighlight(): void {
  try {
    // @ts-ignore
    if (supportsHighlight()) (CSS as any).highlights.delete(NAME)
  } catch {
    // noop
  }
}
