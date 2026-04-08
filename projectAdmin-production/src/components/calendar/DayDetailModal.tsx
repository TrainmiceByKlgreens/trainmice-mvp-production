import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { CalendarDay, BookingWithCourse } from '../../types/calendar';
import { StatusBadge } from './StatusBadge';
import { BookingDetailsModal } from './BookingDetailsModal';
import { Calendar, Clock, MapPin, User, Mail, CreditCard, AlertTriangle, CheckCircle2, Eye } from 'lucide-react';

interface DayDetailModalProps {
  day: CalendarDay | null;
  onClose: () => void;
  onEdit: (day: CalendarDay) => void;
}

export const DayDetailModal: React.FC<DayDetailModalProps> = ({ day, onClose, onEdit }) => {
  const [selectedBooking, setSelectedBooking] = useState<BookingWithCourse | null>(null);

  if (!day) return null;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  return (
    <Modal
      isOpen={!!day}
      onClose={onClose}
      title={
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-corporate-400 mb-1">Schedule Details</span>
          <span className="text-xl font-black text-corporate-900 uppercase tracking-tight">{formatDate(day.date)}</span>
        </div>
      }
      size="lg"
    >
      <div className="space-y-8 py-4">
        {/* Day Status Summary */}
        <div className="flex items-center justify-between p-6 rounded-3xl bg-corporate-50/50 border border-corporate-100 shadow-premium group transition-all hover:bg-white hover:border-corporate-200">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl shadow-lg shadow-corporate-900/10 group-hover:scale-110 transition-transform ${day.isBlocked ? 'bg-red-500 text-white' : 'bg-white border-2 border-corporate-900 text-corporate-900'}`}>
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-corporate-400 mb-1">Current Status</p>
              <div className="flex items-center gap-3">
                <StatusBadge status={day.status} />
                {day.isBlocked && (
                  <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-red-500 bg-red-50 px-3 py-1.5 rounded-full border border-red-100">
                    <AlertTriangle className="w-3 h-3" />
                    Recurring Block
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button
            onClick={() => onEdit(day)}
            className="bg-corporate-900 text-white rounded-2xl px-6 py-3 shadow-bold hover:scale-105 active:scale-95 transition-all text-[10px] font-black uppercase tracking-widest"
          >
            Modify Day
          </Button>
        </div>

        {/* Bookings Section */}
        <div className="space-y-6">
          <div className="flex items-baseline justify-between border-b border-corporate-100 pb-2">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-corporate-400">Scheduled Sessions</h4>
            <span className="text-[10px] font-black text-corporate-900 bg-corporate-100/50 px-3 py-1 rounded-full">{day.bookings.length} Events</span>
          </div>

          {day.bookings.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {day.bookings.map((booking, idx) => (
                <div
                  key={booking.id || idx}
                  className="relative group/booking overflow-hidden rounded-3xl border border-corporate-100 bg-white p-6 shadow-premium transition-all hover:border-corporate-300 hover:shadow-bold-soft"
                >
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="space-y-4 flex-1">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-corporate-50 rounded-2xl group-hover/booking:bg-corporate-100 transition-colors">
                          <CheckCircle2 className="w-5 h-5 text-corporate-900" />
                        </div>
                        <div>
                          <h5 className="text-lg font-black text-corporate-900 uppercase tracking-tight leading-tight group-hover/booking:text-accent-600 transition-colors">
                            {booking.courses?.title || 'Unknown Course'}
                          </h5>
                          <div className="flex flex-wrap items-center gap-3 mt-2">
                            <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-corporate-900 text-white rounded-lg shadow-sm">
                              {booking.request_type || 'Training'}
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-corporate-400 uppercase tracking-widest bg-corporate-50 px-2.5 py-1 rounded-lg">
                              <Clock className="w-3 h-3" />
                              {booking.requested_time || 'Full Day'}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-2xl bg-corporate-50/50 border border-corporate-100/50 group-hover/booking:border-corporate-200 transition-all">
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-corporate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <User className="w-3 h-3" /> Client
                          </p>
                          <p className="text-[11px] font-bold text-corporate-900 truncate">{booking.client_name || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-corporate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <MapPin className="w-3 h-3" /> Location
                          </p>
                          <p className="text-[11px] font-bold text-corporate-900 truncate">{booking.location || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-corporate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <CreditCard className="w-3 h-3" /> City
                          </p>
                          <p className="text-[11px] font-bold text-corporate-900 truncate">{booking.city || 'N/A'}</p>
                        </div>
                         <div className="space-y-1">
                          <p className="text-[9px] font-black text-corporate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Mail className="w-3 h-3" /> Contact
                          </p>
                          <p className="text-[11px] font-bold text-corporate-900 truncate">{booking.client_email || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="pt-2">
                        <Button
                          onClick={() => setSelectedBooking(booking)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-corporate-100/50 text-corporate-600 hover:bg-corporate-900 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-corporate-200/50"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Session Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 rounded-3xl bg-corporate-50/30 border-2 border-dashed border-corporate-100">
               <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                <Calendar className="w-8 h-8 text-corporate-200" />
               </div>
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-corporate-400">No events scheduled</p>
            </div>
          )}
        </div>

        {/* Manual Bookings Section */}
        {day.manualBooking && (
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-corporate-400 border-b border-corporate-100 pb-2">Manual Entries</h4>
            <div className="p-6 rounded-3xl bg-amber-50/30 border border-amber-200/50 flex justify-between items-center group/manual">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-amber-100 rounded-2xl group-hover/manual:rotate-3 transition-transform">
                   <AlertTriangle className="w-5 h-5 text-amber-600" />
                 </div>
                 <div>
                    <h5 className="text-[11px] font-black text-amber-900 uppercase tracking-widest">{day.manualBooking.title || 'Reserved (Self-Booked)'}</h5>
                    <p className="text-[10px] font-bold text-amber-700/70 mt-0.5">{day.manualBooking.notes || 'No manual notes added'}</p>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </Modal>
  );
};
