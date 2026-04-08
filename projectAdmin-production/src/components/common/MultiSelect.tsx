import React, { useState, KeyboardEvent } from 'react';
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

export const MultiSelect: React.FC<MultiSelectProps> = ({
    label,
    value = [],
    onChange,
    disabled = false,
    placeholder = 'Type and press Enter to add',
    helperText,
    error,
    maxItems
}) => {
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
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
                {label}
                {maxItems && (
                    <span className="ml-2 text-xs text-gray-500">
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
                    className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-300' : 'border-gray-300'
                        } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                />
                <button
                    type="button"
                    onClick={handleAddClick}
                    disabled={disabled || !inputValue.trim() || (maxItems ? value.length >= maxItems : false)}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            {value.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                    {value.map((item) => (
                        <span
                            key={item}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                            {item}
                            {!disabled && (
                                <button
                                    type="button"
                                    onClick={() => handleRemove(item)}
                                    className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                                >
                                    <X className="w-3 h-3" />
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
};
