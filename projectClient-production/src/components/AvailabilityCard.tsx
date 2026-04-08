import { format } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';
import { TrainerAvailability } from '../lib/api-client';

type AvailabilityCardProps = {
  availability: TrainerAvailability;
  onBook?: (availability: TrainerAvailability) => void;
  onAppeal?: (availability: TrainerAvailability) => void;
};

export function AvailabilityCard({ availability, onBook, onAppeal }: AvailabilityCardProps) {
  const getStatusColor = () => {
    switch (availability.status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'tentative':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'booked':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = () => {
    switch (availability.status) {
      case 'available':
        return '✅';
      case 'tentative':
        return '🟡';
      case 'booked':
        return '🔴';
      default:
        return '⚪';
    }
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${getStatusColor()}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          <span className="font-semibold">
            {format(new Date(availability.date), 'EEEE, MMMM d, yyyy')}
          </span>
        </div>
        <span className="text-xl">{getStatusIcon()}</span>
      </div>

      {availability.time_slots && availability.time_slots.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">Available Time Slots:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {availability.time_slots.map((slot, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-white bg-opacity-70 rounded-md text-sm font-medium"
              >
                {slot}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium capitalize">Status: {availability.status}</span>
        {availability.status === 'available' && onBook && (
          <button
            onClick={() => onBook(availability)}
            className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
          >
            Book Now
          </button>
        )}
        {availability.status === 'tentative' && onAppeal && (
          <button
            onClick={() => onAppeal(availability)}
            className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
          >
            Request Confirmation
          </button>
        )}
        {availability.status === 'booked' && (
          <span className="text-sm font-medium text-red-800">Not Available</span>
        )}
      </div>
    </div>
  );
}
