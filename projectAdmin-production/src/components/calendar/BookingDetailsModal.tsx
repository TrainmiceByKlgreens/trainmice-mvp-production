import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { BookingWithCourse } from '../../types/calendar';
import { StatusBadge } from './StatusBadge';
import { 
  User, Mail, MapPin, Calendar, Clock, 
  FileText, Info, CheckCircle2 
} from 'lucide-react';

interface BookingDetailsModalProps {
  booking: BookingWithCourse;
  onClose: () => void;
}

export const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({ booking, onClose }) => {
  const course = booking.courses;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-corporate-400 mb-1">Booking Reference</span>
          <span className="text-xl font-black text-corporate-900 uppercase tracking-tight">Session Details</span>
        </div>
      }
      size="xl"
    >
      <div className="space-y-8 py-4">
        {/* Course Header Card */}
        <div className="relative overflow-hidden rounded-3xl bg-corporate-900 p-8 text-white shadow-2xl">
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <StatusBadge status={booking.status} />
              <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">
                {booking.request_type || 'Internal'}
              </span>
            </div>
            <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight leading-tight mb-4">
              {course?.title || 'Training Session'}
            </h3>
            <div className="flex flex-wrap gap-6 text-white/70">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">{booking.requested_date || 'TBD'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">{booking.requested_time || 'Full Day'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">{booking.location || 'Remote/TBD'}</span>
              </div>
            </div>
          </div>
          {/* Decorative Background Element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-500/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Course Summary */}
            <div className="space-y-4">
              <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-corporate-400">
                <FileText className="w-3.5 h-3.5" /> Course Summary
              </h4>
              <div className="p-6 rounded-3xl bg-corporate-50 border border-corporate-100 italic text-corporate-700 leading-relaxed">
                {course?.description || 'No description provided for this course.'}
              </div>
            </div>

            {/* Learning Objectives */}
            {course?.learning_objectives && (
              <div className="space-y-4">
                <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-corporate-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Objectives
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(Array.isArray(course.learning_objectives) ? course.learning_objectives : []).map((obj: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-corporate-100 shadow-sm group hover:border-corporate-300 transition-colors">
                      <div className="mt-1 w-1.5 h-1.5 rounded-full bg-corporate-900 group-hover:scale-150 transition-transform"></div>
                      <span className="text-xs font-bold text-corporate-600 leading-tight">{obj}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Client Info Column */}
          <div className="space-y-8">
            <div className="p-8 rounded-3xl bg-white border border-corporate-100 shadow-premium space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-corporate-400 border-b border-corporate-100 pb-4">
                Client Contact
              </h4>
              <div className="space-y-6">
                <div className="flex items-center gap-4 group">
                  <div className="p-3 bg-corporate-50 rounded-2xl text-corporate-900 group-hover:bg-corporate-900 group-hover:text-white transition-all">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-corporate-400">Full Name</p>
                    <p className="text-[13px] font-black text-corporate-900 truncate">{booking.client_name || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 group">
                  <div className="p-3 bg-corporate-50 rounded-2xl text-corporate-900 group-hover:bg-corporate-900 group-hover:text-white transition-all">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-corporate-400">Email Address</p>
                    <p className="text-[13px] font-black text-corporate-900 truncate">{booking.client_email || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 group">
                  <div className="p-3 bg-corporate-50 rounded-2xl text-corporate-900 group-hover:bg-corporate-900 group-hover:text-white transition-all">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-corporate-400">Location</p>
                    <p className="text-[13px] font-black text-corporate-900 truncate">{booking.city ? `${booking.city}, ${booking.state || ''}` : booking.location || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions/Info */}
            <div className="p-6 rounded-3xl bg-accent-50 border border-accent-100 space-y-3">
               <div className="flex items-center gap-2 text-accent-700">
                  <Info className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Internal Note</span>
               </div>
               <p className="text-[11px] font-medium text-accent-700/80 leading-relaxed italic">
                 "This session is confirmed. Please ensure all training materials are prepared 24 hours prior."
               </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
           <Button
             onClick={onClose}
             className="px-12 py-4 rounded-3xl bg-corporate-900 text-white text-[11px] font-black uppercase tracking-widest shadow-bold-soft active:scale-95 transition-all"
           >
             Close Details
           </Button>
        </div>
      </div>
    </Modal>
  );
};
