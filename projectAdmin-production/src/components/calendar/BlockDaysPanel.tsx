import React, { useState } from 'react';
import { apiClient } from '../../lib/api-client';
import { Card, CardHeader, CardContent } from '../common/Card';
import { Button } from '../common/Button';
import { showToast } from '../common/Toast';
import { Check, ShieldAlert } from 'lucide-react';

interface BlockDaysPanelProps {
  trainerId: string;
  blockedDays: number[];
  onUpdate: () => void;
}

const DAYS = [
  { label: 'Sunday', value: 0 },
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 }
];

export const BlockDaysPanel: React.FC<BlockDaysPanelProps> = ({ trainerId, blockedDays, onUpdate }) => {
  const [selectedDays, setSelectedDays] = useState<number[]>(blockedDays);
  const [loading, setLoading] = useState(false);

  const toggleDay = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if ((apiClient as any).saveTrainerBlockedDays) {
        await (apiClient as any).saveTrainerBlockedDays(trainerId, selectedDays);
      } else {
        await apiClient.put(`/availability/trainer/${trainerId}/blocked-days`, { days: selectedDays });
      }
      showToast('Blocked days updated successfully', 'success');
      onUpdate();
    } catch (error: any) {
      showToast(error.message || 'Failed to update blocked days', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border border-gray-200 bg-white">
      <CardHeader className="bg-gray-50 border-b border-gray-200">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-500" />
          Block Recurring Days
        </h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-1">
          {DAYS.map(day => {
            const isBlocked = selectedDays.includes(day.value);
            return (
              <button
                key={day.value}
                onClick={() => toggleDay(day.value)}
                className={`flex items-center justify-between px-3 py-2 rounded transition-colors ${
                  isBlocked
                    ? 'bg-red-50 text-red-700'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="text-sm font-medium">{day.label}</span>
                {isBlocked && <Check className="w-4 h-4 text-red-600" />}
              </button>
            );
          })}
        </div>
        <Button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white"
        >
          {loading ? 'Updating...' : 'Save Blocked Days'}
        </Button>
      </CardContent>
    </Card>
  );
};
