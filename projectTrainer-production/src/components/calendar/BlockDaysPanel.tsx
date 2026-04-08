import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { WEEKDAY_NAMES } from '../../lib/calendarUtils';
import { XCircle } from 'lucide-react';
import { apiClient } from '../../lib/api-client';

interface BlockDaysPanelProps {
  trainerId: string;
  blockedDays: number[];
  onUpdate: () => void;
}

export function BlockDaysPanel({ trainerId, blockedDays, onUpdate }: BlockDaysPanelProps) {
  const [selectedDays, setSelectedDays] = useState<number[]>(blockedDays);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedDays(blockedDays);
  }, [blockedDays]);

  const toggleDay = (dayOfWeek: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayOfWeek)
        ? prev.filter((d) => d !== dayOfWeek)
        : [...prev, dayOfWeek]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      await apiClient.saveTrainerBlockedDays(trainerId, selectedDays);

      onUpdate();
    } catch (err) {
      console.error('Error saving blocked days:', err);
      setError(err instanceof Error ? err.message : 'Failed to save blocked days');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = JSON.stringify(selectedDays.sort()) !== JSON.stringify(blockedDays.sort());

  return (
    <Card className="shadow-modern-lg border-corporate-100 bg-white/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="bg-corporate-50/50 border-b border-corporate-100 p-6">
        <h3 className="text-xs font-black text-corporate-900 uppercase tracking-[0.2em]">Block Recurring Days</h3>
        <p className="text-[10px] text-corporate-400 mt-1 font-bold uppercase tracking-widest leading-tight">
          Select days of the week to block for all future dates
        </p>
      </CardHeader>
      <CardContent className="p-8">
        <div className="space-y-3">
          {WEEKDAY_NAMES.map((day, index) => (
            <label
              key={index}
              className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${selectedDays.includes(index)
                  ? 'border-red-200 bg-red-50/50 shadow-modern-sm scale-100'
                  : 'border-corporate-100 hover:border-corporate-200 hover:bg-corporate-50 scale-100'
                }`}
            >
              <input
                type="checkbox"
                checked={selectedDays.includes(index)}
                onChange={() => toggleDay(index)}
                className="w-5 h-5 text-red-600 border-corporate-200 rounded-lg focus:ring-red-500/20 bg-white"
              />
              <span className={`text-sm font-bold tracking-tight transition-colors ${selectedDays.includes(index) ? 'text-red-900' : 'text-corporate-700'
                }`}>
                {day}
              </span>
              {selectedDays.includes(index) && (
                <XCircle className="w-5 h-5 text-red-500 ml-auto animate-pulse" />
              )}
            </label>
          ))}
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-xs font-bold text-red-700 uppercase tracking-widest">{error}</p>
          </div>
        )}

        {hasChanges && (
          <div className="mt-6 flex gap-3">
            <Button
              onClick={handleSave}
              disabled={saving}
              variant="primary"
              className="flex-1 py-3 bg-red-600 hover:bg-red-700 border-red-600 text-white rounded-xl shadow-modern-sm uppercase text-[10px] font-black tracking-widest"
            >
              {saving ? (
                <>
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                  <span>Saving...</span>
                </>
              ) : (
                'Save Block Rules'
              )}
            </Button>
            <Button
              onClick={() => setSelectedDays(blockedDays)}
              disabled={saving}
              variant="outline"
              className="py-3 px-6 rounded-xl border-corporate-200 text-corporate-600 hover:bg-corporate-50 uppercase text-[10px] font-black tracking-widest"
            >
              Cancel
            </Button>
          </div>
        )}

        {selectedDays.length > 0 && (
          <div className="mt-6 p-4 bg-mustard-50 border border-mustard-100 rounded-2xl">
            <p className="text-[10px] uppercase font-bold text-mustard-800 tracking-widest">
              Blocked days will only apply to future dates and won't affect existing bookings
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
