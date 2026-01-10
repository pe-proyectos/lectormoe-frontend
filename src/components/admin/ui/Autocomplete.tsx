import React, { useState, useRef, useEffect } from 'react';

interface AutocompleteProps<T> {
  options: T[];
  value: T | T[] | null;
  onChange: (event: any, newValue: T | T[] | null) => void;
  getOptionLabel: (option: T) => string;
  isOptionEqualToValue?: (option: T, value: T) => boolean;
  renderOption?: (props: React.HTMLAttributes<HTMLLIElement>, option: T) => React.ReactNode;
  renderInput?: (params: any) => React.ReactNode;
  multiple?: boolean;
  disablePortal?: boolean;
  getOptionDisabled?: (option: T) => boolean;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

export default function Autocomplete<T>({
  options,
  value,
  onChange,
  getOptionLabel,
  isOptionEqualToValue,
  renderOption,
  renderInput,
  multiple = false,
  getOptionDisabled,
  label,
  placeholder,
  disabled = false,
}: AutocompleteProps<T>) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedValues = multiple ? (value as T[] || []) : (value ? [value as T] : []);
  const isOptionSelected = (option: T) => {
    if (multiple) {
      return selectedValues.some(selected => 
        isOptionEqualToValue 
          ? isOptionEqualToValue(option, selected)
          : option === selected
      );
    }
    return isOptionEqualToValue 
      ? value && isOptionEqualToValue(option, value as T)
      : option === value;
  };

  const filteredOptions = options.filter(option => {
    if (getOptionDisabled && getOptionDisabled(option)) return false;
    const label = getOptionLabel(option).toLowerCase();
    return label.includes(inputValue.toLowerCase());
  });

  useEffect(() => {
    if (multiple) {
      setInputValue('');
    } else {
      setInputValue(value ? getOptionLabel(value as T) : '');
    }
  }, [value, multiple, getOptionLabel]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleOptionClick = (option: T) => {
    if (multiple) {
      const currentValues = (value as T[] || []);
      const isSelected = isOptionSelected(option);
      const newValue = isSelected
        ? currentValues.filter(v => 
            isOptionEqualToValue 
              ? !isOptionEqualToValue(option, v)
              : v !== option
          )
        : [...currentValues, option];
      onChange(null, newValue);
      setInputValue('');
    } else {
      onChange(null, option);
      setIsOpen(false);
      setInputValue(getOptionLabel(option));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev < filteredOptions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      handleOptionClick(filteredOptions[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      if (item) {
        item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [highlightedIndex]);

  const defaultRenderOption = (props: React.HTMLAttributes<HTMLLIElement>, option: T, index: number) => {
    return (
      <li
        {...props}
        className={`
          px-4 py-2 cursor-pointer hover:bg-zinc-800 transition-colors
          ${isOptionSelected(option) ? 'bg-zinc-800' : ''}
          ${highlightedIndex === index ? 'bg-zinc-700' : ''}
        `}
      >
        {getOptionLabel(option)}
      </li>
    );
  };

  const inputParams = {
    inputProps: {
      ref: inputRef,
      value: multiple ? inputValue : (inputValue || ''),
      onChange: handleInputChange,
      onFocus: handleInputFocus,
      onKeyDown: handleKeyDown,
      placeholder: placeholder || label,
      disabled,
      autoComplete: 'off',
    },
    InputLabelProps: {
      shrink: true,
    },
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {renderInput ? (
        renderInput(inputParams)
      ) : (
        <div className="flex flex-col gap-2">
          {label && (
            <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
              {label}
            </label>
          )}
          <div className="relative">
            <div className={`
              w-full min-h-[3rem] px-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-xl 
              focus-within:ring-2 focus-within:ring-cyan-500/50 focus-within:border-cyan-500
              transition-all
              flex flex-wrap items-center gap-1
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}>
              {multiple && selectedValues.length > 0 && (
                <>
                  {selectedValues.map((selected, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded-md"
                    >
                      {getOptionLabel(selected)}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const newValue = selectedValues.filter(v => 
                            isOptionEqualToValue 
                              ? !isOptionEqualToValue(selected, v)
                              : v !== selected
                          );
                          onChange(null, newValue);
                        }}
                        className="hover:text-white ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </>
              )}
              <input
                {...inputParams.inputProps}
                disabled={disabled}
                className={`
                  flex-1 min-w-[120px] bg-transparent border-none outline-none text-white 
                  placeholder:text-zinc-500
                  ${multiple && selectedValues.length > 0 ? 'py-1' : 'py-2'}
                  ${disabled ? 'cursor-not-allowed' : ''}
                `}
              />
            </div>
          </div>
        </div>
      )}
      {isOpen && filteredOptions.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-h-60 overflow-auto"
        >
          {filteredOptions.map((option, index) => {
            const optionProps = {
              key: index,
              onClick: () => handleOptionClick(option),
            };
            return renderOption
              ? renderOption(optionProps, option)
              : defaultRenderOption(optionProps, option, index);
          })}
        </ul>
      )}
    </div>
  );
}
