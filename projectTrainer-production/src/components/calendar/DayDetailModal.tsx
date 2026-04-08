import { CalendarDay, BookingWithCourse } from '../../types/database';
import { StatusBadge } from './StatusBadge';
import { X, Calendar, Clock, MapPin, Edit2, Eye } from 'lucide-react';
import { Button } from '../ui/Button';
import { BookingDetailsModal } from './BookingDetailsModal';
import { useState } from 'react';

interface DayDetailModalProps {
  day: CalendarDay | null;
  onClose: () => void;
  onEdit: (day: CalendarDay) => void;
}

export function DayDetailModal({ day, onClose, onEdit }: DayDetailModalProps) {
  const [selectedBooking, setSelectedBooking] = useState<BookingWithCourse | null>(null);

  if (!day) return null;

  // Filter to show ALL relevant bookings for this day
  const displayBookings = day.bookings.filter((b) => {
    const status = (b.status || '').toLowerCase();
    return ['approved', 'tentative', 'confirmed', 'booked', 'pending', 'quoted', 'paperwork_in_progress'].includes(status);
  });

  // Separate bookings by status for better display
  const tentativeBookings = displayBookings.filter((b) => {
    const status = (b.status || '').toLowerCase();
    return ['approved', 'tentative', 'quoted', 'pending', 'paperwork_in_progress'].includes(status);
  });

  const bookedBookings = displayBookings.filter((b) => {
    const status = (b.status || '').toLowerCase();
    return status === 'confirmed' || status === 'booked';
  });

  const formattedDate = day.date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const isPast = day.date < new Date(new Date().setHours(0, 0, 0, 0));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{formattedDate}</h2>
            <div className="flex items-center gap-2 mt-2">
              <StatusBadge status={day.status} size="md" />
              {day.isBlocked && (
                <span className="text-sm text-red-600 font-medium">Recurring Block Applied</span>
              )}
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
          {day.availability?.status === 'tentative' && displayBookings.length === 0 && (
            <div className="mb-4 p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge status="tentative" size="sm" />
                <span className="text-sm font-medium text-gray-900">Tentative Availability</span>
              </div>
              <p className="text-sm text-gray-600">
                This day has tentative or pending bookings. Review details below.
              </p>
            </div>
          )}

          {/* Personal Manual Booking Notes */}
          {day.availability?.notes && (
            <div className="mb-6 p-4 border border-blue-200 bg-blue-50 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-bold text-blue-900 uppercase tracking-wider">Personal Note</span>
              </div>
              <p className="text-gray-700 font-medium italic">
                "{day.availability.notes}"
              </p>
            </div>
          )}
          {displayBookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No bookings for this day</p>
              <p className="text-gray-500 text-sm mt-2">
                {day.status === 'available'
                  ? 'This day is available for booking'
                  : day.status === 'blocked'
                    ? 'This day is blocked'
                    : day.status === 'tentative'
                      ? 'This day has tentative bookings'
                      : `This day is marked as ${day.status.replace(/_/g, ' ')}`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Booked/Confirmed Bookings */}
              {bookedBookings.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Confirmed Bookings ({bookedBookings.length})
                  </h3>
                  <div className="space-y-3">
                    {bookedBookings.map((booking, index) => (
                      <div
                        key={booking.id}
                        className="p-4 border border-blue-200 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                              {index + 1}
                            </span>
                            <StatusBadge status={booking.status} size="sm" />
                          </div>
                        </div>

                        <h4 className="font-semibold text-gray-900 mb-3">
                          {booking.courses?.title || 'Training Session'}
                        </h4>

                        <div className="space-y-2 text-sm text-gray-700">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span>{booking.requested_date || 'Date TBD'}</span>
                          </div>
                          {booking.requested_time && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span>{booking.requested_time}</span>
                            </div>
                          )}
                          {booking.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-500" />
                              <span>{booking.location}</span>
                            </div>
                          )}
                        </div>

                        {booking.courses?.description && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm text-gray-600">{booking.courses.description}</p>
                          </div>
                        )}

                        <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2">
                          <Button
                            onClick={() => setSelectedBooking(booking)}
                            variant="outline"
                            className="flex-1 text-sm"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                        </div>

                        <div className="mt-2 text-xs text-gray-500">
                          Confirmed: {new Date(booking.processed_at || booking.created_at).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tentative Bookings */}
              {tentativeBookings.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Tentative/Pending Bookings ({tentativeBookings.length})
                  </h3>
                  <div className="space-y-3">
                    {tentativeBookings.map((booking, index) => (
                      <div
                        key={booking.id}
                        className="p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                              {index + 1}
                            </span>
                            <StatusBadge status={booking.status} size="sm" />
                          </div>
                        </div>

                        <h4 className="font-semibold text-gray-900 mb-3">
                          {booking.courses?.title || 'Training Session'}
                        </h4>

                        <div className="space-y-2 text-sm text-gray-700">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span>{booking.requested_date || 'Date TBD'}</span>
                          </div>
                          {booking.requested_time && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span>{booking.requested_time}</span>
                            </div>
                          )}
                          {booking.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-500" />
                              <span>{booking.location}</span>
                            </div>
                          )}
                        </div>

                        {booking.courses?.description && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm text-gray-600">{booking.courses.description}</p>
                          </div>
                        )}

                        <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2">
                          <Button
                            onClick={() => setSelectedBooking(booking)}
                            variant="outline"
                            className="flex-1 text-sm"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                        </div>

                        <div className="mt-2 text-xs text-gray-500">
                          Approved: {new Date(booking.processed_at || booking.created_at).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between gap-3 p-6 border-t border-gray-200">
          <Button
            onClick={onClose}
            variant="outline"
          >
            Close
          </Button>
          {!isPast && !day.isBlocked && (
            <Button
              onClick={() => onEdit(day)}
              variant="primary"
              className="flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Edit Availability
            </Button>
          )}
        </div>
      </div>

      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </div>
  );
}
