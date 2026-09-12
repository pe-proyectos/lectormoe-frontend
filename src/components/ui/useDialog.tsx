import React, { useCallback, useState } from 'react'

// Hook de dialogos in-app (reemplazo de window.confirm/prompt/alert). Devuelve
// funciones que resuelven una promesa y un DialogHost para montar el modal.
// Uso:
//   const dlg = useDialog()
//   if (await dlg.confirm('¿Seguro?')) { ... }
//   return (<>...<dlg.DialogHost /></>)

type DialogKind = 'confirm' | 'prompt' | 'alert'

interface DialogState {
  kind: DialogKind
  title: string
  message: string
  value: string
  /** Campo de varias líneas, para textos largos. */
  multiline?: boolean
  placeholder?: string
  confirmLabel: string
  cancelLabel: string
  danger?: boolean
  resolve: (v: boolean | string | null) => void
}

export interface UseDialog {
  confirm: (message: string, opts?: { title?: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean }) => Promise<boolean>
  prompt: (message: string, opts?: { title?: string; defaultValue?: string; placeholder?: string; confirmLabel?: string; required?: boolean; multiline?: boolean }) => Promise<string | null>
  alert: (message: string, opts?: { title?: string }) => Promise<void>
  DialogHost: React.FC
}

export function useDialog(): UseDialog {
  const [state, setState] = useState<DialogState | null>(null)
  const [required, setRequired] = useState(false)

  const confirm = useCallback<UseDialog['confirm']>((message, opts) => {
    return new Promise<boolean>((resolve) => {
      setState({
        kind: 'confirm', title: opts?.title || 'Confirmar', message, value: '',
        confirmLabel: opts?.confirmLabel || 'Confirmar', cancelLabel: opts?.cancelLabel || 'Cancelar',
        danger: opts?.danger, resolve: (v) => resolve(!!v),
      })
    })
  }, [])

  const prompt = useCallback<UseDialog['prompt']>((message, opts) => {
    setRequired(!!opts?.required)
    return new Promise<string | null>((resolve) => {
      setState({
        kind: 'prompt', title: opts?.title || '', message, value: opts?.defaultValue || '',
        placeholder: opts?.placeholder, confirmLabel: opts?.confirmLabel || 'Aceptar', cancelLabel: 'Cancelar',
        multiline: !!opts?.multiline,
        resolve: (v) => resolve(v === false ? null : (v as string)),
      })
    })
  }, [])

  const alert = useCallback<UseDialog['alert']>((message, opts) => {
    return new Promise<void>((resolve) => {
      setState({
        kind: 'alert', title: opts?.title || 'Aviso', message, value: '',
        confirmLabel: 'Entendido', cancelLabel: '', resolve: () => resolve(),
      })
    })
  }, [])

  const close = (result: boolean | string | null) => {
    if (state) state.resolve(result)
    setState(null)
  }

  const DialogHost: React.FC = () => {
    if (!state) return null
    const canConfirm = state.kind !== 'prompt' || !required || state.value.trim().length > 0
    return (
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={() => close(state.kind === 'alert' ? null : false)}
        role="dialog"
        aria-modal="true"
      >
        <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          {state.title ? <h3 className="text-white font-black text-base mb-1">{state.title}</h3> : null}
          <p className="text-zinc-400 text-sm whitespace-pre-line mb-4">{state.message}</p>
          {state.kind === 'prompt' && (
            (state as any).multiline ? (
              <textarea
                autoFocus
                rows={10}
                value={state.value}
                placeholder={state.placeholder}
                onChange={(e) => setState({ ...state, value: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm font-mono focus:outline-none focus:border-cyan-500 mb-1 resize-y"
              />
            ) : (
            <input
              autoFocus
              type="text"
              value={state.value}
              placeholder={state.placeholder}
              onChange={(e) => setState({ ...state, value: e.target.value })}
              onKeyDown={(e) => { if (e.key === 'Enter' && canConfirm) close(state.value) }}
              className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-cyan-500 mb-1"
            />
            )
          )}
          <div className="flex gap-3 mt-4">
            {state.cancelLabel ? (
              <button type="button" onClick={() => close(state.kind === 'prompt' ? null : false)} className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-800 text-zinc-300 text-sm font-bold hover:bg-zinc-800 transition-colors">
                {state.cancelLabel}
              </button>
            ) : null}
            <button
              type="button"
              disabled={!canConfirm}
              onClick={() => close(state.kind === 'prompt' ? state.value : true)}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-black transition-colors disabled:opacity-40 ${state.danger ? 'bg-red-500 text-white hover:bg-red-400' : 'bg-cyan-500 text-zinc-950 hover:bg-cyan-400'}`}
            >
              {state.confirmLabel}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return { confirm, prompt, alert, DialogHost }
}
