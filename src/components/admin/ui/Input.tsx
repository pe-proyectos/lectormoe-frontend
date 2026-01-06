import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-4 py-3 
          bg-zinc-800/50 border border-zinc-700 
          rounded-xl text-white 
          placeholder:text-zinc-500 
          focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all
          ${error ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <span className="text-xs text-red-400 font-medium">{error}</span>
      )}
    </div>
  );
};

export default Input;

