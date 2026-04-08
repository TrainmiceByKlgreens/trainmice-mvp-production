import { ChevronDown, ChevronUp, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { SelectedSlot } from '../lib/api-client';
import { formatDateDisplay, calculateProgress, slotsToDays } from '../utils/calendarHelpers';

type SelectionSummaryProps = {
  selectedSlots: SelectedSlot[];
  requiredSlots: number;
  onRemoveSlot: (index: number) => void;
};

export function SelectionSummary({
  selectedSlots,
  requiredSlots,
  onRemoveSlot,
}: SelectionSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const currentSlotCount = selectedSlots.length;
  const remainingSlots = Math.max(0, requiredSlots - currentSlotCount);
  const progress = calculateProgress(currentSlotCount, requiredSlots);
  const isComplete = currentSlotCount >= requiredSlots;

  return (
    <div className="border-t border-gray-200 bg-gray-50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-gray-900">Selection Summary</h3>
          {isComplete && (
            <span className="flex items-center gap-1 text-sm text-green-700 bg-green-100 px-2 py-1 rounded">
              <CheckCircle className="w-4 h-4" />
              Complete
            </span>
          )}
          {!isComplete && currentSlotCount > 0 && (
            <span className="text-sm text-gray-600 bg-gray-200 px-2 py-1 rounded">
              {currentSlotCount} of {requiredSlots} slots
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">
                Required: {requiredSlots} slot{requiredSlots !== 1 ? 's' : ''} ({slotsToDays(requiredSlots)})
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isComplete ? 'bg-green-600' : 'bg-teal-600'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="text-xs text-gray-600 text-right">
              {progress}% Complete
            </div>
          </div>

          {selectedSlots.length > 0 ? (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 text-sm">Your Selection:</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedSlots.map((slot, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start gap-2 flex-1">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-900">
                        {formatDateDisplay(slot.date, slot.slot)}
                      </span>
                    </div>
                    <button
                      onClick={() => onRemoveSlot(index)}
                      className="text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
                      title="Remove this slot"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">
                    Total: {currentSlotCount} slot{currentSlotCount !== 1 ? 's' : ''} ({slotsToDays(currentSlotCount)})
                  </span>
                  {!isComplete && (
                    <span className="flex items-center gap-1 text-yellow-700">
                      <AlertTriangle className="w-4 h-4" />
                      Need {remainingSlots} more slot{remainingSlots !== 1 ? 's' : ''} ({slotsToDays(remainingSlots)})
                    </span>
                  )}
                  {isComplete && (
                    <span className="flex items-center gap-1 text-green-700">
                      <CheckCircle className="w-4 h-4" />
                      Ready to submit
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <p className="text-sm">No slots selected yet</p>
              <p className="text-xs mt-1">Click on available dates to select time slots</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
