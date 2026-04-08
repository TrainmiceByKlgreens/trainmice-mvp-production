import { X, AlertTriangle } from 'lucide-react';
import { TrainerAvailability, SelectedSlot } from '../lib/api-client';
import { format, parseISO } from 'date-fns';
import { isSlotAvailable, isSlotTentative, formatSlotTime } from '../utils/calendarHelpers';

type SlotSelectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  dateAvailability: TrainerAvailability[];
  schedulingType: 'slot_based' | 'full_day';
  requiredSlots: number;
  currentSelectionCount: number;
  onSelectSlots: (slots: SelectedSlot[]) => void;
  allowMultipleSlots: boolean;
};

export function SlotSelectionModal({
  isOpen,
  onClose,
  date,
  dateAvailability,
  schedulingType,
  requiredSlots,
  currentSelectionCount,
  onSelectSlots,
  allowMultipleSlots,
}: SlotSelectionModalProps) {
  if (!isOpen) return null;

  const formattedDate = format(parseISO(date), 'EEEE, MMMM d, yyyy');

  const morningAvailable = isSlotAvailable(dateAvailability, 'morning');
  const afternoonAvailable = isSlotAvailable(dateAvailability, 'afternoon');
  const morningTentative = isSlotTentative(dateAvailability, 'morning');
  const afternoonTentative = isSlotTentative(dateAvailability, 'afternoon');

  const getAvailabilityIdForSlot = (slot: 'morning' | 'afternoon' | 'full_day'): string | undefined => {
    const targetTime = slot === 'morning'
      ? { start: '09:00', end: '13:00' }
      : slot === 'afternoon'
      ? { start: '14:00', end: '18:00' }
      : { start: '09:00', end: '18:00' };

    const availability = dateAvailability.find(
      a => a.start_time?.substring(0, 5) === targetTime.start &&
           a.end_time?.substring(0, 5) === targetTime.end
    );

    return availability?.id;
  };

  const handleRadioSelection = (slot: 'morning' | 'afternoon') => {
    const selectedSlots: SelectedSlot[] = [{
      date,
      slot,
      time: formatSlotTime(slot),
      availability_id: getAvailabilityIdForSlot(slot),
    }];
    onSelectSlots(selectedSlots);
    onClose();
  };

  const handleCheckboxSelection = () => {
    const checkboxes = document.querySelectorAll<HTMLInputElement>(
      'input[name="slot-checkbox"]:checked'
    );
    const selectedSlots: SelectedSlot[] = [];

    checkboxes.forEach(checkbox => {
      const slot = checkbox.value as 'morning' | 'afternoon';
      selectedSlots.push({
        date,
        slot,
        time: formatSlotTime(slot),
        availability_id: getAvailabilityIdForSlot(slot),
      });
    });

    if (selectedSlots.length > 0) {
      onSelectSlots(selectedSlots);
      onClose();
    }
  };

  const remainingSlots = requiredSlots - currentSelectionCount;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Select Time Slot</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">{formattedDate}</p>

          {allowMultipleSlots ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">
                Select one or both slots (Need {remainingSlots} more slot{remainingSlots !== 1 ? 's' : ''})
              </p>

              <label
                className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  morningAvailable
                    ? morningTentative
                      ? 'border-yellow-300 bg-yellow-50 hover:border-yellow-400'
                      : 'border-gray-200 hover:border-blue-500'
                    : 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-60'
                }`}
              >
                <input
                  type="checkbox"
                  name="slot-checkbox"
                  value="morning"
                  disabled={!morningAvailable}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">Morning Slot</span>
                    {morningTentative && (
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600">9:00 AM - 1:00 PM</p>
                  {morningTentative && (
                    <p className="text-xs text-yellow-700 mt-1">
                      Tentative - May need confirmation
                    </p>
                  )}
                </div>
              </label>

              <label
                className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  afternoonAvailable
                    ? afternoonTentative
                      ? 'border-yellow-300 bg-yellow-50 hover:border-yellow-400'
                      : 'border-gray-200 hover:border-blue-500'
                    : 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-60'
                }`}
              >
                <input
                  type="checkbox"
                  name="slot-checkbox"
                  value="afternoon"
                  disabled={!afternoonAvailable}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">Afternoon Slot</span>
                    {afternoonTentative && (
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600">2:00 PM - 6:00 PM</p>
                  {afternoonTentative && (
                    <p className="text-xs text-yellow-700 mt-1">
                      Tentative - May need confirmation
                    </p>
                  )}
                </div>
              </label>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Choose a time slot</p>

              <label
                className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  morningAvailable
                    ? morningTentative
                      ? 'border-yellow-300 bg-yellow-50 hover:border-yellow-400'
                      : 'border-gray-200 hover:border-blue-500'
                    : 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-60'
                }`}
                onClick={() => morningAvailable && handleRadioSelection('morning')}
              >
                <input
                  type="radio"
                  name="slot-radio"
                  value="morning"
                  disabled={!morningAvailable}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  readOnly
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">Morning Slot</span>
                    {morningTentative && (
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600">9:00 AM - 1:00 PM</p>
                  {morningTentative && (
                    <p className="text-xs text-yellow-700 mt-1">
                      Tentative - May need confirmation
                    </p>
                  )}
                </div>
              </label>

              <label
                className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  afternoonAvailable
                    ? afternoonTentative
                      ? 'border-yellow-300 bg-yellow-50 hover:border-yellow-400'
                      : 'border-gray-200 hover:border-blue-500'
                    : 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-60'
                }`}
                onClick={() => afternoonAvailable && handleRadioSelection('afternoon')}
              >
                <input
                  type="radio"
                  name="slot-radio"
                  value="afternoon"
                  disabled={!afternoonAvailable}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  readOnly
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">Afternoon Slot</span>
                    {afternoonTentative && (
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600">2:00 PM - 6:00 PM</p>
                  {afternoonTentative && (
                    <p className="text-xs text-yellow-700 mt-1">
                      Tentative - May need confirmation
                    </p>
                  )}
                </div>
              </label>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          {allowMultipleSlots && (
            <button
              onClick={handleCheckboxSelection}
              className="flex-1 px-4 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors"
            >
              Confirm Selection
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
