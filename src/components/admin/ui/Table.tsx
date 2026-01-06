import React from 'react';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export const Table: React.FC<TableProps> = ({ children, className = '' }) => {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full ${className}`}>{children}</table>
    </div>
  );
};

export const TableHeader: React.FC<TableProps> = ({ children }) => {
  return <thead className="bg-zinc-800/50 border-b border-zinc-700">{children}</thead>;
};

export const TableBody: React.FC<TableProps> = ({ children }) => {
  return <tbody className="divide-y divide-zinc-800">{children}</tbody>;
};

export const TableRow: React.FC<TableProps & { onClick?: () => void }> = ({ children, className = '', onClick }) => {
  return (
    <tr 
      className={`transition-colors ${onClick ? 'hover:bg-zinc-800/30 cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
};

export const TableHead: React.FC<TableProps> = ({ children, className = '' }) => {
  return (
    <th className={`px-4 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider ${className}`}>
      {children}
    </th>
  );
};

export const TableCell: React.FC<TableProps> = ({ children, className = '' }) => {
  return (
    <td className={`px-4 py-3 text-sm text-zinc-300 ${className}`}>
      {children}
    </td>
  );
};

