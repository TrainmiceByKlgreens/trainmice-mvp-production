import { useState, FormEvent } from 'react';
import { CalendarDay } from '../../types/database';
import { X, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { formatDate } from '../../lib/calendarUtils';
import { apiClient } from '../../lib/api-client';

interface DateEditModalProps {
  day: CalendarDay | null;
  trainerId: string;
  onClose: () => void;
  onUpdate: () => void;
}

type EditableStatus = 'available' | 'not_available' | 'tentative' | 'booked';

const STATUS_OPTIONS: { value: EditableStatus; label: string; description: string; borderColor: string }[] = [
  {
    value: 'available',
    label: 'Available',
    description: 'Mark this date as available for bookings',
    borderColor: 'border-green-500'
  },
  {
    value: 'not_available',
    label: 'Not Available',
    description: 'Mark this date as unavailable',
    borderColor: 'border-gray-400'
  },
  {
    value: 'tentative',
    label: 'Tentative',
    description: 'Mark this date as tentative (e.g., pending confirmation)',
    borderColor: 'border-yellow-500'
  },
  {
    value: 'booked',
    label: 'Booked',
    description: 'Self Booking (Personal)',
    borderColor: 'border-blue-900'
  }
];

export function DateEditModal({ day, trainerId, onClose, onUpdate }: DateEditModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<EditableStatus>(
    (day?.status as EditableStatus) || 'available'
  );
  const [notes, setNotes] = useState(day?.availability?.notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!day) return null;

  const formattedDate = day.date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const hasBookings = day.bookings.length > 0;
  // const isReadOnlyStatus = day.status === 'booked' || day.status === 'tentative';
  // Allow manual override even if it was booked/tentative by the system, if needed?
  // User said "mark their date as tentative, and also as Booked"
  const isPast = day.date < new Date(new Date().setHours(0, 0, 0, 0));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (isPast) {
      setError('Cannot edit past dates');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const dateString = formatDate(day.date);
      const isManual = selectedStatus === 'booked' || selectedStatus === 'tentative';

      if (isManual) {
        // Save to TrainerBooking table (robust way)
        if (day.manualBooking) {
          await apiClient.updateTrainerBooking(day.manualBooking.id, {
            status: (selectedStatus === 'booked' ? 'CONFIRMED' : selectedStatus.toUpperCase()),
            notes: notes
          });
        } else {
          await apiClient.createTrainerBooking({
            trainerId,
            bookingDate: dateString,
            status: (selectedStatus === 'booked' ? 'CONFIRMED' : selectedStatus.toUpperCase()),
            notes: notes
          });
        }
      } else {
        // Just update availability for available/not_available
        await apiClient.createAvailability(trainerId, {
          date: dateString,
          status: selectedStatus.toUpperCase(),
          notes: ''
        });
        
        // If there was a manual booking, delete it?
        if (day.manualBooking) {
          await apiClient.deleteTrainerBooking(day.manualBooking.id);
        }
      }

      setSuccess(true);
      setTimeout(() => {
        onUpdate();
        onClose();
      }, 500);
    } catch (err) {
      console.error('Error updating date availability:', err);
      setError(err instanceof Error ? err.message : 'Failed to update availability');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Edit Availability</h2>
              <p className="text-xs text-gray-600">{formattedDate}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={saving}
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {isPast && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800">
                This date is in the past and cannot be edited.
              </p>
            </div>
          )}

          {hasBookings && (
            <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
              Has {day.bookings.length} booking{day.bookings.length > 1 ? 's' : ''}. Changing status won't affect existing bookings.
            </div>
          )}

          <div className="space-y-2 mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Availability Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedStatus === option.value
                    ? `${option.borderColor} bg-gray-50`
                    : 'border-gray-200 hover:border-gray-300'
                    } ${isPast ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={option.value}
                    checked={selectedStatus === option.value}
                    onChange={(e) => setSelectedStatus(e.target.value as EditableStatus)}
                    disabled={isPast || saving}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="font-medium text-gray-900 text-[11px] leading-tight">{option.label}</div>
                </label>
              ))}
            </div>
          </div>

          {(selectedStatus === 'booked' || selectedStatus === 'tentative') && (
            <div className="animate-fade-in mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5 uppercase tracking-wider text-[10px]">
                Notes / Description
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={`Why is this date ${selectedStatus}?`}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-corporate-100 bg-white hover:border-corporate-300 transition-all duration-300 text-sm focus:border-corporate-900 outline-none min-h-[100px] resize-none"
                disabled={isPast || saving}
              />
            </div>
          )}

          {error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
              Availability updated successfully!
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              disabled={saving}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={saving || isPast || success}
              className="flex-1"
            >
              {saving ? (
                <>
                  <LoadingSpinner />
                  <span>Saving...</span>
                </>
              ) : success ? (
                'Saved!'
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
