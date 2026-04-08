import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Button } from '../components/ui/Button';
import { apiClient } from '../lib/api-client';
import { useRealtime } from '../hooks/useRealtime';
import { Calendar, Users, MapPin, Clock, DollarSign, RefreshCw } from 'lucide-react';
// Helper function to format date
const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-MY', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

interface Event {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  eventDate: string;
  endDate: string | null;
  venue: string | null;
  price: number | null;
  durationHours: number;
  durationUnit: string | null;
  category: string | null;
  courseType: string;
  hrdcClaimable: boolean;
  maxPacks: number | null;
  status?: string; // Event status (ACTIVE, COMPLETED, CANCELLED, etc.)
  totalParticipants?: number; // Total participants (sum of numberOfParticipants from registrations)
  isFromEventsTable?: boolean;
  _count: {
    registrations: number;
  };
  course?: {
    id: string;
    title: string;
    courseCode: string | null;
  };
}

export function EventOverlook() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'>('all');

  const isTrainerAssignedToCourse = useCallback((course: any, trainerId: string) => {
    if (course.trainerId === trainerId || course.trainer_id === trainerId) {
      return true;
    }

    const assignedTrainers = [
      ...(Array.isArray(course.courseTrainers) ? course.courseTrainers : []),
      ...(Array.isArray(course.course_trainers) ? course.course_trainers : []),
    ];

    return assignedTrainers.some((assignment: any) =>
      assignment?.trainerId === trainerId || assignment?.trainer_id === trainerId
    );
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch events for this trainer (include all statuses to show status changes)
      // Don't filter by status - we want to show all events regardless of status
      const [eventsResponse, coursesResponse] = await Promise.all([
        apiClient.getEvents({ trainerId: user!.id }), // Fetch all events for trainer
        apiClient.getCourses({ trainerId: user!.id, status: 'APPROVED' }),
      ]);

      // getEvents returns an array directly (not { events: [...] })
      const eventsArray = Array.isArray(eventsResponse) ? eventsResponse : [];
      const eventsFromTable = eventsArray.map((event: any) => {
        // Normalize status - ensure it's one of the valid event statuses
        let normalizedStatus = (event.status || event.eventStatus || 'ACTIVE').toUpperCase();
        // Map any invalid statuses to ACTIVE
        if (!['ACTIVE', 'COMPLETED', 'CANCELLED'].includes(normalizedStatus)) {
          normalizedStatus = 'ACTIVE';
        }
        return {
          ...event,
          eventDate: event.eventDate || event.event_date || event.startDate || event.start_date,
          endDate: event.endDate || event.end_date || null,
          status: normalizedStatus,
          isFromEventsTable: true,
          // Ensure _count is included
          _count: event._count || { registrations: 0 },
        };
      });

      // getCourses returns courses array directly, not { courses: [...] }
      const coursesArray = Array.isArray(coursesResponse)
        ? coursesResponse
        : (coursesResponse as any)?.courses || [];

      // Convert courses with fixed_date to event-like objects
      // Filter to only show courses for this trainer
      const eventsFromCourses = coursesArray
        .filter((course: any) =>
          (course.fixedDate || course.fixed_date) &&
          isTrainerAssignedToCourse(course, user!.id)
        )
        .map((course: any) => ({
          id: `course-${course.id}`,
          courseId: course.id,
          title: course.title,
          description: course.description,
          eventDate: course.fixedDate || course.fixed_date,
          endDate: course.endDate || course.end_date || null,
          venue: course.venue,
          price: course.price,
          durationHours: course.durationHours || course.duration_hours,
          durationUnit: course.durationUnit || course.duration_unit,
          category: course.category,
          courseType: course.courseType || course.course_type,
          hrdcClaimable: course.hrdcClaimable || course.hrdc_claimable,
          status: 'ACTIVE', // Courses with fixed_date are considered ACTIVE
          maxPacks: null,
          _count: {
            registrations: 0, // Courses with fixed_date don't have registrations yet
          },
          course: {
            id: course.id,
            title: course.title,
            courseCode: course.courseCode || course.course_code,
          },
          isFromEventsTable: false,
        }));

      // Combine and sort by date
      const allEvents = [...eventsFromTable, ...eventsFromCourses].sort((a, b) => {
        const dateA = new Date(a.eventDate).getTime();
        const dateB = new Date(b.eventDate).getTime();
        return dateA - dateB;
      });

      setEvents(allEvents);

      // Debug logging
      console.log('[EventOverlook] Events fetched:', {
        fromTable: eventsFromTable.length,
        fromCourses: eventsFromCourses.length,
        total: allEvents.length,
        eventsWithStatus: eventsFromTable.filter((e: Event) => e.status).length,
        sampleEventStatus: eventsFromTable[0]?.status,
      });
    } catch (err: any) {
      console.error('[EventOverlook] Error fetching events:', err);
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [isTrainerAssignedToCourse, user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchEvents();
    }
  }, [user?.id, fetchEvents]);

  useRealtime((payload) => {
    if (payload.table === 'events' || payload.table === 'courses') {
      console.log('📅 Trainer Events: Real-time update, refreshing list...');
      fetchEvents();
    }
  });

  // Auto-refresh events when page becomes visible (in case admin updated status)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user?.id && !loading) {
        // Refresh events when page becomes visible (e.g., user switches back to tab)
        // Only refresh if not already loading to avoid unnecessary requests
        fetchEvents();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id, loading, fetchEvents]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchEvents}
            className="px-4 py-2 bg-mustard-600 text-white rounded-lg hover:bg-mustard-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Filter events based on active tab
  const filteredEvents = events.filter((event) => {
    if (activeTab === 'all') return true;
    const eventStatus = (event.status || 'ACTIVE').toUpperCase();
    return eventStatus === activeTab;
  });

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="animate-slide-in-right">
          <h1 className="text-4xl font-bold text-corporate-900 tracking-tight">Event Overview</h1>
          <p className="text-corporate-500 mt-2 text-lg font-medium tracking-tight">Summary of all events</p>
        </div>
        <Button
          onClick={fetchEvents}
          variant="outline"
          className="bg-white/80 backdrop-blur-md border-corporate-100 hover:bg-corporate-50 rounded-xl h-12 gap-3"
          title="Re-synchronize database"
        >
          <RefreshCw className={`w-4 h-4 text-accent-600 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Status Tabs */}
      <div className="bg-corporate-100/50 p-1.5 rounded-2xl flex flex-wrap gap-1 w-fit border border-corporate-100/50">
        {[
          { id: 'all', label: 'All Events', count: events.length },
          { id: 'ACTIVE', label: 'Active', count: events.filter(e => (e.status || 'ACTIVE').toUpperCase() === 'ACTIVE').length },
          { id: 'COMPLETED', label: 'Completed', count: events.filter(e => (e.status || 'ACTIVE').toUpperCase() === 'COMPLETED').length },
          { id: 'CANCELLED', label: 'Cancelled', count: events.filter(e => (e.status || 'ACTIVE').toUpperCase() === 'CANCELLED').length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`
              px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300
              ${activeTab === tab.id
                ? 'bg-corporate-900 text-white shadow-modern-sm scale-[1.02]'
                : 'text-corporate-500 hover:text-corporate-900 hover:bg-white/50'}
            `}
          >
            <span className="flex items-center gap-3">
              {tab.label}
              <span className={`
                px-2 py-0.5 rounded-md text-[9px] font-bold
                ${activeTab === tab.id ? 'bg-accent-500 text-corporate-900' : 'bg-corporate-200 text-corporate-600'}
              `}>
                {tab.count}
              </span>
            </span>
          </button>
        ))}
      </div>

      {filteredEvents.length === 0 ? (
        <Card className="border-none shadow-modern overflow-hidden">
          <CardContent className="py-24">
            <div className="text-center">
              <div className="w-24 h-24 bg-corporate-50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                <Calendar className="w-10 h-10 text-corporate-200" />
              </div>
              <h3 className="text-2xl font-bold text-corporate-900 tracking-tight">Operational Void</h3>
              <p className="text-corporate-500 mt-4 max-w-md mx-auto font-medium leading-relaxed">
                {activeTab === 'all'
                  ? 'No mission parameters have been initialized. Events synchronize upon registration lifecycle commencement.'
                  : `Currently zero ${activeTab.toLowerCase()} operations are indexed in the terminal.`}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredEvents.map((event, i) => {
            const eventDate = event.eventDate || (event as any).event_date;
            const endDate = event.endDate || (event as any).end_date;
            const maxPacks = event.maxPacks || (event as any).max_packs;
            const totalParticipants = event.totalParticipants !== undefined
              ? event.totalParticipants
              : (event._count?.registrations || 0);
            const participantsAvailable = maxPacks ? maxPacks - totalParticipants : null;
            const fillPercentage = maxPacks ? Math.min((totalParticipants / maxPacks) * 100, 100) : 0;

            return (
              <Card
                key={event.id}
                className="group border-none shadow-modern hover:shadow-modern-lg transition-all duration-500 animate-slide-in-bottom overflow-hidden flex flex-col"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className={`h-1.5 w-full bg-corporate-100`}>
                  <div
                    className={`h-full transition-all duration-1000 ${event.status === 'CANCELLED' ? 'bg-red-500' :
                      event.status === 'COMPLETED' ? 'bg-corporate-400' : 'bg-accent-500 glow-effect'
                      }`}
                    style={{ width: `${fillPercentage}%` }}
                  />
                </div>

                <CardHeader className="p-7 pb-4">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-accent-600 uppercase tracking-[0.2em] mb-1">
                        {event.course?.courseCode ?? 'OP-UNIT'}
                      </p>
                      <h3 className="text-lg font-bold text-corporate-900 leading-tight group-hover:text-accent-600 transition-colors line-clamp-2">
                        {event.title}
                      </h3>
                    </div>
                    {event.status && (
                      <span className={`
                        px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border
                        ${event.status === 'ACTIVE' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                          event.status === 'COMPLETED' ? 'bg-corporate-50 border-corporate-100 text-corporate-500' :
                            event.status === 'CANCELLED' ? 'bg-red-50 border-red-100 text-red-500' :
                              'bg-corporate-50 border-corporate-200 text-corporate-600'}
                      `}>
                        {event.status}
                      </span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-7 pt-0 flex-1">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                      {eventDate && (
                        <div className="flex items-center gap-3 p-3 bg-corporate-50/50 rounded-xl border border-corporate-100/50">
                          <Calendar className="w-4 h-4 text-corporate-400" />
                          <span className="text-xs font-bold text-corporate-700">
                            {formatDate(new Date(eventDate))}
                            {endDate && ` - ${formatDate(new Date(endDate))}`}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-3 p-3 bg-corporate-50/50 rounded-xl border border-corporate-100/50">
                        <Clock className="w-4 h-4 text-corporate-400" />
                        <span className="text-xs font-bold text-corporate-700 uppercase tracking-tight">
                          {event.durationHours} {event.durationUnit || 'HOURS'} OPERATIONAL
                        </span>
                      </div>

                      {event.venue && (
                        <div className="flex items-center gap-3 p-3 bg-corporate-50/50 rounded-xl border border-corporate-100/50">
                          <MapPin className="w-4 h-4 text-corporate-400" />
                          <span className="text-xs font-medium text-corporate-600 truncate">{event.venue}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <div />

                      {event.hrdcClaimable && (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-accent-500/10 text-accent-700 rounded-full text-[9px] font-black uppercase tracking-widest border border-accent-500/20">
                          <DollarSign className="w-3 h-3" />
                          HRDC Claimable
                        </span>
                      )}
                    </div>

                    <div className="pt-6 border-t border-corporate-100 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-corporate-400" />
                          <span className="text-[10px] font-black text-corporate-400 uppercase tracking-widest">Participants</span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-black text-corporate-900">{totalParticipants}</span>
                          {maxPacks && <span className="text-xs font-bold text-corporate-300 ml-1">/ {maxPacks}</span>}
                        </div>
                      </div>

                      {maxPacks && (
                        <div className="space-y-2">
                          <div className="w-full bg-corporate-100 rounded-full h-1.5 overflow-hidden shadow-inner">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${fillPercentage > 90 ? 'bg-red-500' : fillPercentage > 70 ? 'bg-orange-500' : 'bg-accent-500'
                                }`}
                              style={{ width: `${fillPercentage}%` }}
                            />
                          </div>
                          <p className="text-[10px] font-bold text-corporate-400 text-right uppercase tracking-widest">
                            {participantsAvailable !== null && participantsAvailable > 0
                              ? `${participantsAvailable} Packs Remaining`
                              : 'Max Packs Reached'}
                          </p>
                        </div>
                      )}

                      {!event.isFromEventsTable && (
                        <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                          <p className="text-[10px] text-amber-700 font-bold uppercase leading-tight tracking-tight">
                            Status: Initializing...
                            <span className="block font-medium normal-case mt-1 opacity-80 italic">Course will promote to Event status upon first registration packet receipt.</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
