import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EngagementCard } from '../components/dashboard/EngagementCard';
import { TrainingRequestCard } from '../components/dashboard/TrainingRequestCard';
import { EngagementDetailsModal } from '../components/dashboard/EngagementDetailsModal';
import { EventDetailsModal } from '../components/dashboard/EventDetailsModal';
import { BookingWithCourse } from '../types/database';
import { apiClient } from '../lib/api-client';
import { useRealtime } from '../hooks/useRealtime';
import { Calendar, Inbox } from 'lucide-react';

interface EventEngagement {
  id: string;
  eventDate: string;
  course?: {
    id: string;
    title: string;
    courseCode: string | null;
  };
  venue: string | null;
  _count?: {
    registrations: number;
  };
  eventCode?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  type: 'event';
}

type CombinedEngagement = (BookingWithCourse & { type?: 'booking' }) | (EventEngagement & { type: 'event' });

export function Dashboard() {
  const { user } = useAuth();
  const [engagements, setEngagements] = useState<CombinedEngagement[]>([]);
  const [requests, setRequests] = useState<BookingWithCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'engagements' | 'requests'>('engagements');
  const [selectedEngagement, setSelectedEngagement] = useState<CombinedEngagement | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id]);

  useRealtime((payload) => {
    const relevantTables = ['bookings', 'events', 'courses', 'booking_requests', 'event_enquiries'];
    if (relevantTables.includes(payload.table)) {
      console.log('🔄 Trainer Dashboard: Real-time update for table:', payload.table);
      fetchDashboardData();
    }
  });

  const fetchDashboardData = async () => {
    if (!user?.id) return;

    try {
      // Fetch bookings
      const response = await apiClient.get<{ bookingRequests: BookingWithCourse[] }>('/bookings');
      const all = response.bookingRequests || [];

      const trainerBookings = all.filter((b) => b.trainer_id === user.id);

      const upcomingBookings = trainerBookings
        .filter((b) => (b.status || '').toLowerCase() === 'booked')
        .map((b) => ({ ...b, type: 'booking' as const }));

      const pendingRequests = trainerBookings
        .filter((b) => (b.status || '').toLowerCase() === 'pending')
        .sort((a, b) => {
          const ca = a.created_at ? new Date(a.created_at).getTime() : 0;
          const cb = b.created_at ? new Date(b.created_at).getTime() : 0;
          return cb - ca;
        });

      // Fetch events (booked events with future dates and ACTIVE status only)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const events = await apiClient.getEvents({ trainerId: user.id });
      const upcomingEvents: any[] = events
        .filter((e: any) => {
          const eventDate = e.eventDate ? new Date(e.eventDate) : null;
          const eventStatus = (e.status || 'ACTIVE').toUpperCase();
          // Only include events that are ACTIVE and have future dates
          return eventDate && eventDate >= today && eventStatus === 'ACTIVE';
        })
        .map((e: any) => ({
          id: e.id,
          eventDate: e.eventDate || e.event_date || e.startDate || e.start_date,
          course: e.course ? { title: e.course.title } : (e.title ? { title: e.title } : undefined),
          venue: e.venue,
          price: e.price,
          durationHours: e.durationHours || e.duration_hours,
          durationUnit: e.durationUnit || e.duration_unit,
          category: e.category,
          courseType: e.courseType || e.course_type,
          courseMode: e.courseMode || e.course_mode,
          hrdcClaimable: e.hrdcClaimable || e.hrdc_claimable,
          maxPacks: e.maxPacks || e.max_packs,
          status: e.status || 'ACTIVE',
          city: e.city,
          state: e.state,
          title: e.title,
          description: e.description,
          _count: e._count || { registrations: 0 },
          eventCode: e.eventCode || e.event_code,
          startDate: e.startDate || e.start_date || e.eventDate || e.event_date,
          endDate: e.endDate || e.end_date,
          type: 'event' as const,
        }));

      // Fetch manual bookings from trainer-bookings table
      // This is the robust way to distinguish them from system bookings
      const manualBookingRecords = await apiClient.getTrainerBookings(user.id, {
        startDate: today.toISOString().split('T')[0],
      });
      
      const manualBookings = (manualBookingRecords || [])
        .filter((b: any) => b.status === 'confirmed' || b.status === 'CONFIRMED') // Filter out tentative from upcoming engagements
        .map((b: any) => ({
          id: b.id,
          requested_date: b.bookingDate || b.booking_date,
          status: (b.status || 'booked').toLowerCase(),
          location: 'Self-Booked Entry',
          client_name: b.notes || 'Personal entry',
          courses: { title: b.notes || 'Self-Booked Session' },
          type: 'booking' as const,
          isManual: true,
        }));

      // Combine bookings, events, and manual bookings, sort by date ascending
      const allEngagements: CombinedEngagement[] = [
        ...upcomingBookings,
        ...upcomingEvents,
        ...manualBookings,
      ].sort((a, b) => {
        const dateA = a.type === 'event'
          ? new Date(a.eventDate).getTime()
          : (a.requested_date ? new Date(a.requested_date).getTime() : 0);
        const dateB = b.type === 'event'
          ? new Date(b.eventDate).getTime()
          : (b.requested_date ? new Date(b.requested_date).getTime() : 0);
        return dateA - dateB;
      });

      setEngagements(allEngagements);
      setRequests(pendingRequests);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRequestRead = async (requestId: string) => {
    try {
      // Optimistic update
      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, isRead: true } : r));
      await apiClient.markBookingRequestAsRead(requestId);
    } catch (error) {
      console.error('Error marking request as read:', error);
    }
  };

  const handleConfirmRequest = async (requestId: string) => {
    try {
      const bookingRequest = requests.find(r => r.id === requestId);
      if (!bookingRequest) {
        throw new Error('Booking request not found');
      }

      await apiClient.updateBookingStatus(requestId, 'APPROVED');

      setRequests(prev => prev.filter(r => r.id !== requestId));
      await fetchDashboardData();
    } catch (error) {
      console.error('Error confirming request:', error);
      alert('Failed to confirm request. Please try again.');
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      await apiClient.updateBookingStatus(requestId, 'DENIED');

      setRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (error) {
      console.error('Error declining request:', error);
      alert('Failed to decline request. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="animate-slide-in-bottom">
        <h1 className="text-3xl font-bold text-corporate-950 tracking-tight underline decoration-accent-gold decoration-4 underline-offset-8">Welcome, <span className="text-black font-black">{user?.full_name}</span></h1>
        <p className="text-corporate-500 mt-4 text-base font-medium">Monitoring all training programs</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-corporate-100">
        <nav className="flex space-x-12 scrollbar-hide overflow-x-auto" aria-label="Dashboard sections">
          <button
            onClick={() => setActiveTab('engagements')}
            className={`${activeTab === 'engagements'
              ? 'border-black text-black'
              : 'border-transparent text-corporate-400 hover:text-corporate-600 hover:border-corporate-200'
              } whitespace-nowrap py-5 px-1 border-b-2 font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 transition-all duration-300 outline-none`}
          >
            <Calendar className={`w-4 h-4 transition-colors ${activeTab === 'engagements' ? 'text-accent-gold' : 'text-corporate-400'}`} />
            Upcoming Engagements
            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${activeTab === 'engagements'
              ? 'bg-black text-accent-gold'
              : 'bg-corporate-100 text-corporate-500'
              } transition-all duration-300`}>
              {engagements.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`${activeTab === 'requests'
              ? 'border-black text-black'
              : 'border-transparent text-corporate-400 hover:text-corporate-600 hover:border-corporate-200'
              } whitespace-nowrap py-5 px-1 border-b-2 font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 transition-all duration-300 outline-none`}
          >
            <Inbox className={`w-4 h-4 transition-colors ${activeTab === 'requests' ? 'text-accent-gold' : 'text-corporate-400'}`} />
            Training Requests
            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${activeTab === 'requests'
              ? 'bg-black text-accent-gold'
              : 'bg-corporate-100 text-corporate-500'
              } transition-all duration-300`}>
              {requests.length}
            </span>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'engagements' ? (
          <div className="space-y-4">
            {engagements.length === 0 ? (
              <Card className="bg-white border-dashed border-2 border-corporate-200 shadow-none">
                <div className="p-16 text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-corporate-100">
                    <Calendar className="w-10 h-10 text-corporate-300" />
                  </div>
                  <h3 className="text-lg font-bold text-corporate-900">No upcoming engagements</h3>
                  <p className="text-corporate-500 mt-2 max-w-xs mx-auto text-sm">Your schedule is currently clear. Approved training bookings and events will appear here.</p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
                {engagements.map((engagement) => (
                  <EngagementCard
                    key={engagement.id}
                    engagement={engagement as any}
                    onViewDetails={(eng) => setSelectedEngagement(eng as CombinedEngagement)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="animate-fade-in">
            {requests.length === 0 ? (
              <Card className="bg-white border-dashed border-2 border-corporate-200 shadow-none">
                <div className="p-16 text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-corporate-100">
                    <Inbox className="w-10 h-10 text-corporate-300" />
                  </div>
                  <h3 className="text-lg font-bold text-corporate-900">No pending requests</h3>
                  <p className="text-corporate-500 mt-2 max-w-xs mx-auto text-sm">You're all caught up! New training requests from administrators will appear here for your review.</p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {requests.map((request) => (
                  <TrainingRequestCard
                    key={request.id}
                    request={request}
                    onConfirm={handleConfirmRequest}
                    onDecline={handleDeclineRequest}
                    onMarkRead={handleMarkRequestRead}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedEngagement && selectedEngagement.type === 'event' && (
        <EventDetailsModal
          event={selectedEngagement as any}
          onClose={() => setSelectedEngagement(null)}
        />
      )}

      {selectedEngagement && selectedEngagement.type !== 'event' && (
        <EngagementDetailsModal
          engagement={selectedEngagement as BookingWithCourse}
          onClose={() => setSelectedEngagement(null)}
        />
      )}

    </div>
  );
}
