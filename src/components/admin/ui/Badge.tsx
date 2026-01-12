import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  className?: string;
  onClick?: () => void;
}

const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '', onClick }) => {
  const variantStyles = {
    default: 'bg-zinc-800 text-zinc-300',
    outline: 'bg-transparent border border-zinc-700 text-zinc-400',
    success: 'bg-green-500/20 text-green-400 border border-green-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    danger: 'bg-red-500/20 text-red-400 border border-red-500/30',
    info: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
  };

  const Component = onClick ? 'button' : 'span';
  const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider';
  const clickableStyles = onClick ? 'cursor-pointer transition-all hover:opacity-80' : '';

  return (
    <Component
      onClick={onClick}
      className={`${baseStyles} ${variantStyles[variant]} ${clickableStyles} ${className}`}
    >
      {children}
    </Component>
  );
};

export default Badge;

