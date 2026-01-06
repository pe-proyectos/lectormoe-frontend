import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const Card: React.FC<CardProps> = ({ children, className = '', padding = 'md' }) => {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div className={`bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl ${paddingStyles[padding]} ${className}`}>
      {children}
    </div>
  );
};

export default Card;

