import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EngagementCard } from '../components/dashboard/EngagementCard';
import { TrainingRequestCard } from '../components/dashboard/TrainingRequestCard';
import { EngagementDetailsModal } from '../components/dashboard/EngagementDetailsModal';
import { EventDetailsModal } from '../components/dashboard/EventDetailsModal';
import { MessageAdminModal } from '../components/messages/MessageAdminModal';
import { EventChatModal } from '../components/messages/EventChatModal';
import { BookingWithCourse } from '../types/database';
import { apiClient } from '../lib/api-client';
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
  const [messageEngagement, setMessageEngagement] = useState<CombinedEngagement | null>(null);
  const [eventChatEngagement, setEventChatEngagement] = useState<EventEngagement | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id]);

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
          type: 'event' as const,
        }));

      // Combine bookings and events, sort by date ascending
      const allEngagements: CombinedEngagement[] = [
        ...upcomingBookings,
        ...upcomingEvents,
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

  const handleMessageAdmin = (engagement: CombinedEngagement) => {
    if (engagement.type === 'event') {
      setEventChatEngagement(engagement as EventEngagement);
    } else {
      setMessageEngagement(engagement);
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.full_name}!</h1>
        <p className="text-gray-600 mt-1">Manage your upcoming engagements and training requests.</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('engagements')}
            className={`${
              activeTab === 'engagements'
                ? 'border-teal-500 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
          >
            <Calendar className="w-5 h-5" />
            Upcoming Engagements
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              activeTab === 'engagements'
                ? 'bg-teal-100 text-teal-700'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {engagements.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`${
              activeTab === 'requests'
                ? 'border-teal-500 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
          >
            <Inbox className="w-5 h-5" />
            Training Requests
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              activeTab === 'requests'
                ? 'bg-teal-100 text-teal-700'
                : 'bg-gray-100 text-gray-600'
            }`}>
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
              <Card>
                <div className="p-12 text-center">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No upcoming engagements</p>
                  <p className="text-sm text-gray-400 mt-1">Approved bookings will appear here</p>
                </div>
              </Card>
            ) : (
              engagements.map((engagement) => (
                <EngagementCard
                  key={engagement.id}
                  engagement={engagement as any}
                  onViewDetails={(eng) => setSelectedEngagement(eng as CombinedEngagement)}
                  onMessage={handleMessageAdmin as any}
                />
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {requests.length === 0 ? (
              <Card>
                <div className="p-12 text-center">
                  <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No pending requests</p>
                  <p className="text-sm text-gray-400 mt-1">New training requests will appear here</p>
                </div>
              </Card>
            ) : (
              requests.map((request) => (
                <TrainingRequestCard
                  key={request.id}
                  request={request}
                  onConfirm={handleConfirmRequest}
                  onDecline={handleDeclineRequest}
                />
              ))
            )}
          </div>
        )}
      </div>

      {selectedEngagement && selectedEngagement.type === 'event' && (
        <EventDetailsModal
          event={selectedEngagement as any}
          onClose={() => setSelectedEngagement(null)}
          onMessage={() => {
            setSelectedEngagement(null);
            handleMessageAdmin(selectedEngagement);
          }}
        />
      )}

      {selectedEngagement && selectedEngagement.type !== 'event' && (
        <EngagementDetailsModal
          engagement={selectedEngagement as BookingWithCourse}
          onClose={() => setSelectedEngagement(null)}
        />
      )}

      {messageEngagement && messageEngagement.type !== 'event' && (
        <MessageAdminModal
          engagement={{
            id: messageEngagement.id,
            type: messageEngagement.type || 'booking',
            courses: messageEngagement.courses ? { title: messageEngagement.courses.title } : undefined,
            requested_date: messageEngagement.requested_date || undefined,
          }}
          onClose={() => setMessageEngagement(null)}
          onSuccess={() => {
            // Optionally refresh data or show success message
          }}
        />
      )}

      {eventChatEngagement && eventChatEngagement.course && (
        <EventChatModal
          event={{
            id: eventChatEngagement.id,
            eventDate: eventChatEngagement.eventDate,
            course: {
              id: eventChatEngagement.course.id || '',
              title: eventChatEngagement.course.title,
            },
            venue: eventChatEngagement.venue,
          }}
          onClose={() => setEventChatEngagement(null)}
          onSuccess={() => {
            // Optionally refresh data
          }}
        />
      )}
    </div>
  );
}
