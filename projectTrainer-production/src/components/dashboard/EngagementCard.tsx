import { Calendar, MapPin, Users } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { BookingWithCourse } from '../../types/database';

interface EventEngagement {
  id: string;
  eventDate: string;
  course?: { title: string };
  venue: string | null;
  _count?: { registrations: number };
  type: 'event';
}

type CombinedEngagement = (BookingWithCourse & { type?: 'booking', isManual?: boolean }) | EventEngagement;

interface EngagementCardProps {
  engagement: CombinedEngagement;
  onViewDetails: (engagement: CombinedEngagement) => void;
}

export function EngagementCard({ engagement, onViewDetails }: EngagementCardProps) {
  const formatDate = (dateStr: string | null, timeStr: string | null) => {
    if (!dateStr) return 'Date TBD';
    const date = new Date(dateStr);
    const dateFormatted = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    return timeStr ? `${dateFormatted} at ${timeStr}` : dateFormatted;
  };

  const isEvent = engagement.type === 'event';
  const bookingEngagement = engagement as BookingWithCourse;
  const eventEngagement = engagement as EventEngagement;

  const title = isEvent
    ? eventEngagement.course?.title || 'Event Title N/A'
    : bookingEngagement.courses?.title || 'Course Title N/A';
  const date = isEvent
    ? new Date(eventEngagement.eventDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
    : formatDate(bookingEngagement.requested_date, bookingEngagement.requested_time);
  const location = isEvent
    ? eventEngagement.venue || 'Location TBD'
    : bookingEngagement.location || 'Location TBD';
  const status = isEvent
    ? 'Booked'
    : (engagement as any).isManual
      ? 'Self-Booked'
      : bookingEngagement.status?.charAt(0).toUpperCase() + bookingEngagement.status?.slice(1) || 'Booked';
  const participants = isEvent
    ? `${eventEngagement._count?.registrations || 0} participants`
    : bookingEngagement.client_name || 'Client Name N/A';

  return (
    <Card className="hover:shadow-modern-lg transition-all duration-300 border-l-4 border-l-black bg-white border border-corporate-100 relative overflow-hidden group h-full flex flex-col font-sans">
      <div className="absolute inset-0 bg-gradient-to-br from-accent-gold/5 ml-1 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <CardContent className="p-5 relative z-10 flex flex-col h-full bg-white">
        <div className="space-y-4">
          <div className="mb-auto">
            <h3 className="text-sm font-black text-corporate-950 mb-4 group-hover:text-black transition-colors tracking-tight line-clamp-2 uppercase leading-relaxed">
              {title}
            </h3>
            <div className="flex items-center gap-2">
              <span className="inline-block px-3 py-1.5 text-[9px] font-black uppercase tracking-widest bg-black text-accent-gold border border-black rounded-lg shadow-sm">
                {status}
              </span>
              {isEvent && (
                <span className="inline-block px-3 py-1.5 text-[9px] font-black uppercase tracking-widest bg-accent-gold text-black border border-accent-gold rounded-lg shadow-sm">
                  Public Event
                </span>
              )}
            </div>
          </div>

          <div className="space-y-4 my-6">
            <div className="flex items-center gap-3 text-xs font-bold text-corporate-600">
              <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center border border-corporate-100 shrink-0">
                <MapPin className="w-3.5 h-3.5 text-corporate-400 group-hover:text-black transition-colors" />
              </div>
              <span className="truncate">{location}</span>
            </div>

            <div className="flex items-center gap-3 text-xs font-bold text-corporate-600">
              <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center border border-corporate-100 shrink-0">
                <Calendar className="w-3.5 h-3.5 text-corporate-400 group-hover:text-black transition-colors" />
              </div>
              <span>{date}</span>
            </div>

            <div className="flex items-center gap-3 text-xs font-bold text-corporate-600">
              <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center border border-corporate-100 shrink-0">
                <Users className="w-3.5 h-3.5 text-corporate-400 group-hover:text-black transition-colors" />
              </div>
              <span className="truncate">{participants}</span>
            </div>
          </div>

          <div className="pt-4 mt-auto">
            <Button
              onClick={() => onViewDetails(engagement)}
              size="sm"
              variant="outline"
              className="w-full font-black text-[10px] uppercase tracking-[0.2em] transition-all h-10 border-black text-black hover:bg-black hover:text-accent-gold"
            >
              Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
