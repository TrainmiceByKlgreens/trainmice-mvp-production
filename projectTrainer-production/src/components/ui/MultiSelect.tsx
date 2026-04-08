import { useState, KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';

interface MultiSelectProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  helperText?: string;
  error?: string;
  maxItems?: number;
}

export function MultiSelect({
  label,
  value = [],
  onChange,
  disabled = false,
  placeholder = 'Type and press Enter to add',
  helperText,
  error,
  maxItems
}: MultiSelectProps) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();

      if (maxItems && value.length >= maxItems) {
        return;
      }

      const newValue = inputValue.trim();
      if (!value.includes(newValue)) {
        onChange([...value, newValue]);
      }
      setInputValue('');
    }
  };

  const handleRemove = (item: string) => {
    onChange(value.filter(v => v !== item));
  };

  const handleAddClick = () => {
    if (inputValue.trim() && (!maxItems || value.length < maxItems)) {
      const newValue = inputValue.trim();
      if (!value.includes(newValue)) {
        onChange([...value, newValue]);
      }
      setInputValue('');
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-corporate-700 ml-0.5">
        {label}
        {maxItems && (
          <span className="ml-2 text-xs text-corporate-400 font-normal">
            ({value.length}/{maxItems})
          </span>
        )}
      </label>

      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || (maxItems ? value.length >= maxItems : false)}
          placeholder={placeholder}
          className={`flex-1 px-4 py-2.5 bg-white border rounded-xl transition-all duration-300 outline-none shadow-sm text-sm placeholder:text-corporate-400 ${error ? 'border-red-400 focus:ring-4 focus:ring-red-500/10' : 'border-corporate-200 focus:border-accent-500 focus:ring-4 focus:ring-accent-500/10'
            } ${disabled ? 'bg-corporate-50 cursor-not-allowed opacity-60' : ''}`}
        />
        <button
          type="button"
          onClick={handleAddClick}
          disabled={disabled || !inputValue.trim() || (maxItems ? value.length >= maxItems : false)}
          className="px-4 py-2 bg-accent-600 text-white rounded-xl hover:bg-accent-700 disabled:bg-corporate-200 disabled:text-corporate-400 disabled:cursor-not-allowed transition-all duration-300 shadow-sm"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 p-1">
          {value.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent-50 text-accent-700 border border-accent-100 rounded-lg text-xs font-bold uppercase tracking-wider animate-scale-in"
            >
              {item}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(item)}
                  className="hover:bg-accent-200 rounded-md p-0.5 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {helperText && !error && (
        <p className="text-xs text-gray-500">{helperText}</p>
      )}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
