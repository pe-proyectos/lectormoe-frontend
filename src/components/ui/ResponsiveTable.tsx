import React from 'react';

// Tabla en desktop, tarjetas apiladas en móvil. Desktop queda EXACTAMENTE igual
// (misma <table>); las tarjetas solo aparecen en max-md. Un mismo origen de datos
// para las dos vistas evita que se desincronicen.
//
// Uso:
//   <ResponsiveTable
//     columns={[
//       { key: 'name', header: 'Nombre', cell: (r) => r.name, primary: true },
//       { key: 'views', header: 'Vistas', cell: (r) => r.views },
//     ]}
//     rows={data}
//     rowKey={(r) => r.id}
//     actions={(r) => <button>...</button>}   // opcional
//   />

export interface ResponsiveColumn<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  // primary: en móvil se muestra como título de la tarjeta (más grande, sin etiqueta).
  primary?: boolean;
  // hideOnMobile: la columna no aparece en la tarjeta (ruido en pantalla chica).
  hideOnMobile?: boolean;
  // className aplicado a la celda/columna en la tabla desktop.
  className?: string;
  align?: 'left' | 'right' | 'center';
}

interface Props<T> {
  columns: ResponsiveColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  actions?: (row: T) => React.ReactNode;
  onRowClick?: (row: T) => void;
  empty?: React.ReactNode;
  tableClassName?: string;
  theadClassName?: string;
}

export function ResponsiveTable<T>({
  columns,
  rows,
  rowKey,
  actions,
  onRowClick,
  empty,
  tableClassName = '',
  theadClassName = '',
}: Props<T>) {
  if (rows.length === 0 && empty) {
    return <>{empty}</>;
  }

  const alignClass = (a?: string) => (a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left');

  return (
    <>
      {/* Desktop: tabla clásica (sin cambios respecto a hoy) */}
      <div className="hidden md:block overflow-x-auto">
        <table className={`w-full ${tableClassName}`}>
          <thead className={theadClassName}>
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={`${alignClass(c.align)} ${c.className || ''}`}>
                  {c.header}
                </th>
              ))}
              {actions && <th className="text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={onRowClick ? 'cursor-pointer' : undefined}
              >
                {columns.map((c) => (
                  <td key={c.key} className={`${alignClass(c.align)} ${c.className || ''}`}>
                    {c.cell(row)}
                  </td>
                ))}
                {actions && <td className="text-right">{actions(row)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Móvil: tarjetas apiladas */}
      <div className="md:hidden space-y-2.5">
        {rows.map((row) => {
          const primary = columns.find((c) => c.primary);
          const rest = columns.filter((c) => !c.primary && !c.hideOnMobile);
          return (
            <div
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 ${onRowClick ? 'active:scale-[0.99] transition-transform' : ''}`}
            >
              {primary && <div className="text-sm font-black text-white mb-2 break-words">{primary.cell(row)}</div>}
              {rest.length > 0 && (
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                  {rest.map((c) => (
                    <div key={c.key} className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 truncate">{c.header}</p>
                      <div className="text-sm text-zinc-200 break-words">{c.cell(row)}</div>
                    </div>
                  ))}
                </div>
              )}
              {actions && (
                <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-zinc-800" onClick={(e) => e.stopPropagation()}>
                  {actions(row)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

export default ResponsiveTable;
