import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
    label: string;
    value: string;
}

interface CustomDropdownProps {
    label?: string;
    options: Option[] | string[];
    value: string;
    onChange: (value: string) => void;
    className?: string;
    placeholder?: string;
}

export function CustomDropdown({ label, options, value, onChange, className, placeholder }: CustomDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const normalizedOptions = options.map(opt =>
        typeof opt === 'string' ? { label: opt, value: opt } : opt
    );

    const selectedOption = normalizedOptions.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {label && (
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 px-1">
                    {label}
                </label>
            )}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-5 py-3.5 bg-gray-50 border-none rounded-2xl text-sm font-black text-gray-800 hover:bg-gray-100 transition-all focus:ring-2 focus:ring-yellow-400/20"
            >
                <span className="truncate">{selectedOption ? selectedOption.label : placeholder || 'Select...'}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="max-h-60 overflow-y-auto no-scrollbar">
                        {normalizedOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-5 py-3 text-sm font-black transition-colors ${value === option.value
                                        ? 'bg-yellow-400 text-black'
                                        : 'text-gray-600 hover:bg-yellow-50 hover:text-gray-900'
                                    }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
