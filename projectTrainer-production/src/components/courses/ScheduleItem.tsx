import { useState, useEffect } from 'react';
import { Plus, X, Trash2 } from 'lucide-react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { calculateDurationInMinutes } from '../../lib/courseService';
import { ScheduleItemData } from '../../lib/courseService';

interface ScheduleItemProps {
  item: ScheduleItemData & { id: string; submodules: string[] };
  onChange: (item: ScheduleItemData & { id: string; submodules: string[] }) => void;
  onRemove: () => void;
}

export function ScheduleItem({ item, onChange, onRemove }: ScheduleItemProps) {
  const [autoCalculate, setAutoCalculate] = useState(true);

  const durationOptions = [
    { value: '15', label: '15 min' },
    { value: '30', label: '30 min' },
    { value: '45', label: '45 min' },
    { value: '60', label: '1 hr' },
    { value: '75', label: '1 hr 15 min' },
    { value: '90', label: '1 hr 30 min' },
    { value: '105', label: '1 hr 45 min' },
    { value: '120', label: '2 hr' }
  ];

  useEffect(() => {
    if (autoCalculate && item.start_time && item.end_time) {
      const calculatedMinutes = calculateDurationInMinutes(item.start_time, item.end_time);
      if (calculatedMinutes !== item.duration_minutes) {
        onChange({ ...item, duration_minutes: Math.max(0, calculatedMinutes) });
      }
    }
  }, [item.start_time, item.end_time, autoCalculate]);

  const handleAddSubmodule = () => {
    onChange({ ...item, submodules: [...item.submodules, ''] });
  };

  const handleRemoveSubmodule = (index: number) => {
    onChange({ ...item, submodules: item.submodules.filter((_, i) => i !== index) });
  };

  const handleSubmoduleChange = (index: number, value: string) => {
    const newSubmodules = [...item.submodules];
    newSubmodules[index] = value;
    onChange({ ...item, submodules: newSubmodules });
  };

  const handleDurationChange = (minutes: number) => {
    setAutoCalculate(false);
    onChange({ ...item, duration_minutes: minutes });
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-4 bg-white">
      <div className="flex items-start justify-between">
        <h4 className="font-medium text-gray-900">Schedule Item</h4>
        <Button
          type="button"
          variant="outline"
          onClick={onRemove}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          type="number"
          label="Day Number"
          min={1}
          value={item.day_number}
          onChange={(e) => onChange({ ...item, day_number: parseInt(e.target.value) || 1 })}
          placeholder="1"
        />

        <Select
          label="Duration"
          options={durationOptions}
          value={String(item.duration_minutes)}
          onChange={(e) => handleDurationChange(parseInt(e.target.value))}
        />

        <Input
          type="time"
          label="Start Time"
          value={item.start_time}
          onChange={(e) => {
            setAutoCalculate(true);
            onChange({ ...item, start_time: e.target.value });
          }}
        />

        <Input
          type="time"
          label="End Time"
          value={item.end_time}
          onChange={(e) => {
            setAutoCalculate(true);
            onChange({ ...item, end_time: e.target.value });
          }}
        />
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-600">Calculated Duration:</span>
        <span className="font-semibold text-gray-900">{item.duration_minutes} minutes</span>
      </div>

      <Input
        label="Module Title"
        value={item.module_title}
        onChange={(e) => onChange({ ...item, module_title: e.target.value })}
        placeholder="Enter module title"
        required
      />

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Submodules (Optional)</label>
          <Button
            type="button"
            variant="outline"
            onClick={handleAddSubmodule}
            className="text-xs py-1 px-2"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add
          </Button>
        </div>

        {item.submodules.length > 0 && (
          <div className="space-y-2">
            {item.submodules.map((submodule, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={submodule}
                  onChange={(e) => handleSubmoduleChange(index, e.target.value)}
                  placeholder={`Submodule ${index + 1}`}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleRemoveSubmodule(index)}
                  className="px-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
