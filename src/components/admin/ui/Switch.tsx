import React from 'react';

interface SwitchProps {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const Switch: React.FC<SwitchProps> = ({ label, checked, onChange, disabled = false }) => {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
        <div
          className={`
            w-11 h-6 rounded-full transition-colors
            ${checked ? 'bg-cyan-500' : 'bg-zinc-700'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        />
        <div
          className={`
            absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </div>
      {label && (
        <span className={`text-sm font-medium ${disabled ? 'text-zinc-600' : 'text-zinc-300'}`}>
          {label}
        </span>
      )}
    </label>
  );
};

export default Switch;

