import React, { useState, useRef, useEffect } from 'react';

interface PopoverProps {
  placement?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
}

interface PopoverContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  placement: 'top' | 'bottom' | 'left' | 'right';
}

const PopoverContext = React.createContext<PopoverContextType | null>(null);

export const Popover: React.FC<PopoverProps> = ({ placement = 'bottom', children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <PopoverContext.Provider value={{ isOpen, setIsOpen, placement }}>
      <div className="relative">
        {children}
      </div>
    </PopoverContext.Provider>
  );
};

export const PopoverHandler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const context = React.useContext(PopoverContext);
  if (!context) throw new Error('PopoverHandler must be used within Popover');

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    context.setIsOpen(!context.isOpen);
  };

  return (
    <div onClick={handleClick} className="cursor-pointer" data-popover-handler>
      {children}
    </div>
  );
};

export const PopoverContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const context = React.useContext(PopoverContext);
  const popoverRef = useRef<HTMLDivElement>(null);
  const handlerRef = useRef<HTMLDivElement | null>(null);

  if (!context) throw new Error('PopoverContent must be used within Popover');

  useEffect(() => {
    // Find the PopoverHandler element
    const findHandler = () => {
      const popover = popoverRef.current?.closest('.relative');
      if (popover) {
        const handler = popover.querySelector('[data-popover-handler]') as HTMLElement;
        if (handler) {
          handlerRef.current = handler;
        }
      }
    };

    if (context.isOpen) {
      findHandler();
    }
  }, [context.isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        if (handlerRef.current && !handlerRef.current.contains(event.target as Node)) {
          context.setIsOpen(false);
        }
      }
    };

    if (context.isOpen) {
      // Small delay to avoid immediate closing
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [context.isOpen, context]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        context.setIsOpen(false);
      }
    };

    if (context.isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [context.isOpen, context]);

  if (!context.isOpen) return null;

  const placementStyles = {
    top: 'bottom-full left-0 mb-2',
    bottom: 'top-full left-0 mt-2',
    left: 'right-full top-0 mr-2',
    right: 'left-full top-0 ml-2',
  };

  return (
    <div
      ref={popoverRef}
      className={`
        absolute z-50
        ${placementStyles[context.placement]}
        bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl
        p-4
        animate-in fade-in zoom-in-95 duration-200
      `}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
};

