import { X, Users, Building2, AlertCircle } from 'lucide-react';
import { Course, Trainer } from '../lib/api-client';

type BookingSelectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelectPublic: () => void;
  onSelectInHouse: () => void;
  course: Course;
  trainer: Trainer | null;
};

export function BookingSelectionModal({
  isOpen,
  onClose,
  onSelectPublic,
  onSelectInHouse,
  course,
  trainer,
}: BookingSelectionModalProps) {
  if (!isOpen) return null;

  const hasTrainer = !!trainer;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Request Custom Schedule</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-gray-600 text-center mb-6">
            Choose your preferred booking option for <strong>{course.title}</strong>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={onSelectPublic}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all text-left group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Request for Public</h3>
              </div>
              <p className="text-sm text-gray-600">
                Request an alternative public session. The trainer will review and propose specific dates.
              </p>
            </button>

            <button
              onClick={onSelectInHouse}
              disabled={!hasTrainer}
              className={`p-6 border-2 rounded-lg transition-all text-left group relative ${
                hasTrainer
                  ? 'border-gray-200 hover:border-blue-600 hover:bg-blue-50 cursor-pointer'
                  : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                    hasTrainer
                      ? 'bg-blue-100 group-hover:bg-blue-200'
                      : 'bg-gray-200'
                  }`}
                >
                  <Building2
                    className={`w-6 h-6 ${
                      hasTrainer ? 'text-blue-600' : 'text-gray-400'
                    }`}
                  />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Request for In-House</h3>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Request custom training for your team with calendar-based scheduling.
              </p>
              {!hasTrainer && (
                <div className="flex items-start gap-2 mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-800">
                    Trainer not yet assigned. Please check back later or choose public option.
                  </p>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
