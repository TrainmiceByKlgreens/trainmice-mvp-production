import { X, Calendar, Clock, MapPin, BookOpen, User } from 'lucide-react';
import { BookingWithCourse } from '../../types/database';
import { StatusBadge } from './StatusBadge';

interface BookingDetailsModalProps {
  booking: BookingWithCourse | null;
  onClose: () => void;
}

export function BookingDetailsModal({ booking, onClose }: BookingDetailsModalProps) {
  if (!booking) return null;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Date TBD';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDuration = (hours: number | null, unit: string | null) => {
    if (!hours) return 'Duration TBD';
    if (unit === 'days') {
      return `${hours} ${hours === 1 ? 'day' : 'days'}`;
    }
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Booking Details</h2>
            <div className="flex items-center gap-2 mt-2">
              <StatusBadge status={booking.status} size="md" />
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* Course Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Information</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-gray-900 text-lg">
                    {booking.courses?.title || 'Training Session'}
                  </h4>
                  {booking.courses?.description && (
                    <p className="text-sm text-gray-600 mt-1">{booking.courses.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span>
                    Duration: {formatDuration(
                      booking.courses?.duration_hours || null,
                      booking.courses?.duration_unit || null
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <BookOpen className="w-4 h-4 text-gray-500" />
                  <span className="capitalize">{booking.request_type || 'N/A'} Training</span>
                </div>
              </div>
            </div>

            {/* Booking Details */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Details</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>{formatDate(booking.requested_date)}</span>
                  {booking.requested_time && (
                    <span className="text-gray-500">• {booking.requested_time}</span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span>
                    {booking.location || 'Location TBD'}
                    {booking.city && booking.state && `, ${booking.city}, ${booking.state}`}
                    {booking.city && !booking.state && `, ${booking.city}`}
                    {!booking.city && booking.state && `, ${booking.state}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Request Information */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Information</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div>
                  <span className="font-medium">Request Type:</span>{' '}
                  <span className="capitalize">{booking.request_type || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium">Status:</span>{' '}
                  <StatusBadge status={booking.status} size="sm" />
                </div>
                <div>
                  <span className="font-medium">Requested:</span>{' '}
                  {new Date(booking.processed_at || booking.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

