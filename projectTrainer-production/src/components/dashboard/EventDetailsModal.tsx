import { X, Calendar, MapPin, Clock, BookOpen, FileText, Users, ShieldCheck, Zap } from 'lucide-react';

interface EventDetailsModalProps {
  event: {
    id: string;
    eventDate: string;
    startDate?: string | null;
    endDate?: string | null;
    venue: string | null;
    price: number | null;
    durationHours: number;
    durationUnit: string | null;
    category: string | null;
    courseType: string | string[];
    courseMode?: string | string[];
    hrdcClaimable?: boolean;
    maxPacks: number | null;
    status?: string;
    eventCode?: string | null;
    _count?: { registrations: number };
    course?: {
      id: string;
      title: string;
      courseCode: string | null;
      description?: string | null;
    };
    title?: string;
    description?: string | null;
    city?: string | null;
    state?: string | null;
  };
  onClose: () => void;
}

export function EventDetailsModal({ event, onClose }: EventDetailsModalProps) {
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-MY', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const title = event.course?.title || event.title || 'Event Title N/A';
  const description = event.course?.description || event.description;
  const eventCode = event.eventCode || event.course?.courseCode || 'OP-UNIT-ALPHA';

  const startDateStr = formatDate(event.startDate || event.eventDate);
  const endDateStr = formatDate(event.endDate);
  const dateRange = endDateStr && startDateStr !== endDateStr
    ? `${startDateStr} — ${endDateStr}`
    : startDateStr || 'Schedule Pending';

  const eventTime = event.eventDate ? new Date(event.eventDate).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }) : null;

  const duration = `${event.durationHours} ${event.durationUnit || 'HOURS'}`;
  const courseMode = Array.isArray(event.courseMode) ? event.courseMode.join(', ') : event.courseMode || 'ON-SITE';
  const location = event.venue || 'Logistics Pending';
  const fullLocation = event.city && event.state
    ? `${location}, ${event.city}, ${event.state}`
    : location;
  const participants = event._count?.registrations || 0;
  const maxParticipants = event.maxPacks;
  const status = (event.status || 'ACTIVE').toUpperCase();

  return (
    <div
      className="fixed inset-0 bg-corporate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-[2.5rem] shadow-modern-lg max-w-2xl w-full max-h-[90vh] overflow-hidden border border-corporate-100 flex flex-col animate-scale-in">
        {/* Header Section */}
        <div className="relative h-32 bg-corporate-900 overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-accent-600/20 to-transparent z-10" />
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-500 rounded-full blur-3xl -mr-32 -mt-32" />
          </div>

          <div className="absolute inset-0 p-8 flex items-start justify-between z-20">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-2.5 py-0.5 bg-accent-500/20 rounded-full border border-accent-500/30">
                  <span className="w-1.5 h-1.5 bg-accent-400 rounded-full animate-pulse" />
                  <p className="text-[10px] text-accent-100 font-black uppercase tracking-[0.2em]">Event Status</p>
                </div>
                <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border ${status === 'ACTIVE' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                  status === 'COMPLETED' ? 'bg-corporate-500/10 border-corporate-500/30 text-corporate-300' :
                    'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}>
                  {status}
                </span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight uppercase">Event Details</h2>
            </div>
            <button
              onClick={onClose}
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all duration-300 active:scale-90"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-10 space-y-10">
          {/* Identifiers & Overview */}
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-corporate-50/50 border border-corporate-100 p-6 rounded-3xl group transition-all duration-300 hover:border-accent-200">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-10 h-10 bg-white shadow-sm border border-corporate-100 rounded-xl flex items-center justify-center group-hover:bg-accent-50 transition-colors">
                  <ShieldCheck className="w-5 h-5 text-accent-600" />
                </div>
                <p className="text-[11px] text-corporate-400 font-bold uppercase tracking-widest">Event Code</p>
              </div>
              <p className="text-lg font-black text-corporate-900 tracking-tight font-mono">{eventCode}</p>
            </div>
          </div>

          {/* Core Info Display */}
          <div className="space-y-8 pb-4">
            {/* Title & Description */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-accent-500" />
                <h3 className="text-xs font-black text-corporate-400 uppercase tracking-widest leading-none mt-0.5">Course Information</h3>
              </div>
              <div className="space-y-3">
                <h4 className="text-2xl font-bold text-corporate-900 leading-snug tracking-tight">{title}</h4>
                {description && (
                  <p className="text-sm text-corporate-600 leading-relaxed font-medium">
                    {description}
                  </p>
                )}
              </div>
            </div>

            {/* Logistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12 pt-4">
              {/* Date Column */}
              <div className="flex gap-5 group">
                <div className="w-12 h-12 shrink-0 bg-accent-50 border border-accent-100 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-accent-100 transition-all">
                  <Calendar className="w-6 h-6 text-accent-600" />
                </div>
                <div>
                  <p className="text-[10px] text-corporate-400 font-black uppercase tracking-widest mb-1.5">Event Date</p>
                  <p className="text-sm font-bold text-corporate-900">{dateRange}</p>
                  {eventTime && <p className="text-xs text-corporate-500 font-medium mt-1 uppercase tracking-tight tabular-nums">{eventTime}</p>}
                </div>
              </div>

              {/* Venue Column */}
              <div className="flex gap-5 group">
                <div className="w-12 h-12 shrink-0 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-100 transition-all">
                  <MapPin className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[10px] text-corporate-400 font-black uppercase tracking-widest mb-1.5">Location</p>
                  <p className="text-sm font-bold text-corporate-900 leading-snug">{fullLocation}</p>
                </div>
              </div>

              {/* Duration Column */}
              <div className="flex gap-5 group">
                <div className="w-12 h-12 shrink-0 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-100 transition-all">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-[10px] text-corporate-400 font-black uppercase tracking-widest mb-1.5">Duration</p>
                  <p className="text-sm font-bold text-corporate-900 uppercase tracking-tight">{duration}</p>
                </div>
              </div>

              {/* Deployment Column */}
              <div className="flex gap-5 group">
                <div className="w-12 h-12 shrink-0 bg-corporate-50 border border-corporate-200 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-corporate-100 transition-all">
                  <Users className="w-6 h-6 text-corporate-600" />
                </div>
                <div>
                  <p className="text-[10px] text-corporate-400 font-black uppercase tracking-widest mb-1.5">Attendees</p>
                  <p className="text-sm font-bold text-corporate-900">
                    <span className="text-corporate-900 font-black tabular-nums">{participants}</span>
                    <span className="text-corporate-300 mx-1">/</span>
                    <span className="text-corporate-500 tabular-nums">{maxParticipants || '∞'}</span>
                    <span className="ml-2 text-corporate-400 text-xs font-bold uppercase tracking-widest">Total</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Data Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-corporate-50/30 p-5 rounded-2xl border border-corporate-100/50">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-3.5 h-3.5 text-corporate-400" />
                <p className="text-[9px] text-corporate-400 font-black uppercase tracking-widest">Category</p>
              </div>
              <p className="text-[11px] font-bold text-corporate-700 uppercase tracking-tight truncate leading-tight">{event.category || 'GENERAL'}</p>
            </div>
            <div className="bg-corporate-50/30 p-5 rounded-2xl border border-corporate-100/50">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-3.5 h-3.5 text-corporate-400" />
                <p className="text-[9px] text-corporate-400 font-black uppercase tracking-widest">Course Mode</p>
              </div>
              <p className="text-[11px] font-bold text-corporate-700 uppercase tracking-tight leading-tight">{courseMode}</p>
            </div>
          </div>

          {event.hrdcClaimable && (
            <div className="flex items-center gap-5 p-6 bg-accent-500/5 border border-accent-500/10 rounded-3xl group">
              <div className="w-10 h-10 bg-accent-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-accent-500/20">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-black text-accent-700 uppercase tracking-widest">HRDC Certification Verified</p>
                <p className="text-[11px] text-accent-600 font-medium leading-relaxed mt-0.5">This operation is fully indexed for Human Resource Development Corporation claimable logistics.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
