import { useState } from 'react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { formatDate, getDateRange } from '../../lib/calendarUtils';
import { apiClient } from '../../lib/api-client';
import { Calendar } from 'lucide-react';

interface BulkStatusUpdateProps {
  trainerId: string;
  onUpdate: () => void;
}

export function BulkStatusUpdate({ trainerId, onUpdate }: BulkStatusUpdateProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<'available' | 'not_available'>('available');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      setError('Start date must be before end date');
      return;
    }

    setUpdating(true);
    setError(null);

    try {
      const dates = getDateRange(start, end);
      const payload = dates.map((date) => ({
        date: formatDate(date),
        status: status === 'available' ? 'AVAILABLE' : 'NOT_AVAILABLE',
      }));

      await apiClient.createAvailability(trainerId, payload);

      onUpdate();
      setStartDate('');
      setEndDate('');
    } catch (err) {
      console.error('Error updating availability:', err);
      setError(err instanceof Error ? err.message : 'Failed to update availability');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900">Bulk Status Update</h3>
        <p className="text-sm text-gray-600 mt-1">
          Set availability status for a date range
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={formatDate(new Date())}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || formatDate(new Date())}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Set Status
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setStatus('available')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  status === 'available'
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                Available
              </button>
              <button
                onClick={() => setStatus('not_available')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  status === 'not_available'
                    ? 'bg-gray-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                Not Available
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {startDate && endDate && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <Calendar className="w-4 h-4" />
                <span>
                  Updating {getDateRange(new Date(startDate), new Date(endDate)).length} days
                </span>
              </div>
            </div>
          )}

          <Button
            onClick={handleUpdate}
            disabled={updating || !startDate || !endDate}
            variant="primary"
            className="w-full"
          >
            {updating ? (
              <>
                <LoadingSpinner />
                <span>Updating...</span>
              </>
            ) : (
              'Update Availability'
            )}
          </Button>

          <p className="text-xs text-gray-500">
            This will update all dates in the selected range. Existing bookings will not be affected.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
