import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className={`relative z-[10000] w-full ${sizeStyles[size]} max-h-[95vh] sm:max-h-[90vh] pointer-events-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-800 flex-shrink-0">
            <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight pr-2 truncate">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors group flex-shrink-0"
              aria-label="Close modal"
            >
              <X size={20} className="text-zinc-400 group-hover:text-white group-hover:rotate-90 transition-all" />
            </button>
          </div>
          
          {/* Content - Scrollable */}
          <div className="px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto flex-1 min-h-0 max-h-[calc(95vh-120px)] sm:max-h-[calc(90vh-140px)]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );

  // Render modal using portal to body
  return createPortal(modalContent, document.body);
};

export default Modal;

