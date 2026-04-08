import { useState } from 'react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { BookingWithCourse } from '../../types/database';
import { StatusBadge } from './StatusBadge';
import { Calendar, Clock, MapPin, X, Eye } from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { BookingDetailsModal } from './BookingDetailsModal';

interface TentativeBookingsListProps {
  bookings: BookingWithCourse[];
  onUpdate: () => void;
}

export function TentativeBookingsList({ bookings, onUpdate }: TentativeBookingsListProps) {
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithCourse | null>(null);

  // Only show PENDING bookings in the "Pending Approval" card
  const pendingBookings = bookings
    .filter((b) => {
      const status = (b.status || '').toLowerCase();
      return status === 'pending';
    })
    .sort((a, b) => new Date(a.processed_at || a.created_at).getTime() - new Date(b.processed_at || b.created_at).getTime());

  const handleCancel = async (bookingId: string) => {
    setCancelingId(bookingId);

    try {
      await apiClient.updateBookingStatus(bookingId, 'CANCELLED');

      onUpdate();
      setShowConfirm(null);
    } catch (err) {
      console.error('Error canceling booking:', err);
      alert('Failed to cancel booking. Please try again.');
    } finally {
      setCancelingId(null);
    }
  };

  if (pendingBookings.length === 0) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Pending Approval</h3>
          <p className="text-sm text-gray-600 mt-1">
            Bookings awaiting final confirmation (sorted by request time)
          </p>
        </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {pendingBookings.map((booking, index) => (
            <div
              key={booking.id}
              className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-yellow-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </span>
                      <StatusBadge status="pending" size="sm" />
                </div>
                {showConfirm === booking.id ? (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleCancel(booking.id)}
                      disabled={cancelingId === booking.id}
                      variant="outline"
                      className="text-xs bg-red-600 text-white hover:bg-red-700"
                    >
                      Confirm Cancel
                    </Button>
                    <Button
                      onClick={() => setShowConfirm(null)}
                      variant="outline"
                      className="text-xs"
                    >
                      Keep
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowConfirm(booking.id)}
                    className="p-1 hover:bg-red-100 rounded transition-colors"
                    title="Cancel booking"
                  >
                    <X className="w-4 h-4 text-red-600" />
                  </button>
                )}
              </div>

              <h4 className="font-semibold text-gray-900 mb-2">
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

              <div className="mt-3 pt-3 border-t border-yellow-200 flex gap-2">
                <Button
                  onClick={() => setSelectedBooking(booking)}
                  variant="outline"
                  className="flex-1 text-sm"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View Details
                </Button>
                {showConfirm === booking.id ? (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleCancel(booking.id)}
                      disabled={cancelingId === booking.id}
                      variant="outline"
                      className="text-xs bg-red-600 text-white hover:bg-red-700"
                    >
                      Confirm Cancel
                    </Button>
                    <Button
                      onClick={() => setShowConfirm(null)}
                      variant="outline"
                      className="text-xs"
                    >
                      Keep
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowConfirm(booking.id)}
                    className="p-2 hover:bg-red-100 rounded transition-colors"
                    title="Cancel booking"
                  >
                    <X className="w-4 h-4 text-red-600" />
                  </button>
                )}
              </div>

              <div className="mt-2 text-xs text-gray-500">
                Requested: {new Date(booking.processed_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

    {selectedBooking && (
      <BookingDetailsModal
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
      />
    )}
    </>
  );
}
