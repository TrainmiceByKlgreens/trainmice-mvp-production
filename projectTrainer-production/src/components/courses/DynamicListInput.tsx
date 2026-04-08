import { Plus, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { TextareaWithLimit } from '../ui/TextareaWithLimit';

interface DynamicListInputProps {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  maxItems?: number;
  wordLimit?: number;
  placeholder?: string;
  error?: string;
  className?: string;
}

export function DynamicListInput({
  label,
  items,
  onChange,
  maxItems = 7,
  wordLimit,
  placeholder = 'Enter item...',
  error,
  className = ''
}: DynamicListInputProps) {
  const handleAdd = () => {
    if (items.length < maxItems) {
      onChange([...items, '']);
    }
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    onChange(newItems);
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <span className="text-xs text-gray-500">
          {items.length} / {maxItems} items
        </span>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="flex gap-2">
            <div className="flex-1">
              <TextareaWithLimit
                value={item}
                onChange={(e) => handleChange(index, e.target.value)}
                placeholder={`${placeholder} ${index + 1}`}
                wordLimit={wordLimit}
                rows={2}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleRemove(index)}
              className="px-3 self-start mt-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      {items.length < maxItems && (
        <Button
          type="button"
          variant="outline"
          onClick={handleAdd}
          className="w-full mt-3"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
