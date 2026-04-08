import { useState, useEffect } from 'react';
import { List } from 'lucide-react';

interface ArrayBuilderProps {
    label: string;
    items: string[];
    onChange: (items: string[]) => void;
    placeholder?: string;
    error?: string;
    className?: string;
}

export function ArrayBuilder({ label, items, onChange, placeholder, error, className = '' }: ArrayBuilderProps) {
    const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');
    const [text, setText] = useState(() => items.join('\n'));

    // Sync from props if external change
    useEffect(() => {
        const incomingLines = items.join('\n');
        // Basic check to prevent rewriting user text while they type if arrays match
        if (items.join('\n') !== text.trimEnd() && items.join('\n') !== text) {
            if (items.length > 0 && items[0] !== '') {
                setText(incomingLines);
            }
        }
    }, [items]);

    const handleTextChange = (val: string) => {
        setText(val);
        const newItems = val.split('\n').filter(line => line.trim() !== '');
        onChange(newItems.length > 0 ? newItems : ['']);
    };

    return (
        <div className={`space-y-4 ${className}`}>
            <div className="flex items-center justify-between bg-white/10 p-4 rounded-xl border border-white/20">
                <div className="flex items-center gap-2">
                    <List className="w-5 h-5 text-current opacity-70" />
                    <h3 className="font-bold text-current">{label}</h3>
                </div>
                <div className="flex bg-black/20 p-1.5 rounded-lg border border-white/10">
                    <button
                        type="button"
                        onClick={() => setViewMode('editor')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${viewMode === 'editor' ? 'bg-white text-black shadow-sm' : 'text-current opacity-70 hover:opacity-100 hover:bg-white/10'}`}
                    >
                        Editor
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('preview')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${viewMode === 'preview' ? 'bg-white text-black shadow-sm' : 'text-current opacity-70 hover:opacity-100 hover:bg-white/10'}`}
                    >
                        Preview
                    </button>
                </div>
            </div>

            {viewMode === 'editor' ? (
                <div className="space-y-2">
                    <textarea
                        className="w-full h-48 p-4 bg-black/10 rounded-xl border border-white/20 focus:ring-2 focus:ring-white/30 focus:border-white/50 text-current placeholder:text-current/40 font-mono text-sm resize-y custom-scrollbar"
                        placeholder={placeholder || 'Enter items, one per line...'}
                        value={text}
                        onChange={(e) => handleTextChange(e.target.value)}
                    />
                    {error && <p className="text-xs font-bold text-red-500 bg-red-50 p-2 rounded-lg">{error}</p>}
                </div>
            ) : (
                <div className="bg-black/10 rounded-xl border border-white/20 p-6 min-h-[12rem] overflow-y-auto custom-scrollbar">
                    {items.length === 0 || (items.length === 1 && items[0] === '') ? (
                        <p className="text-sm opacity-50 italic text-center py-8">No content provided.</p>
                    ) : (
                        <ul className="list-disc pl-5 space-y-2 text-sm max-w-none">
                            {items.map((item, idx) => (
                                item.trim() ? <li key={idx} className="leading-relaxed">{item}</li> : null
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
