import React, { useEffect, useState } from 'react';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { CourseRequestWidget } from '../components/dashboard/CourseRequestWidget';
import { apiClient } from '../lib/api-client';
import { useRealtime } from '../hooks/useRealtime';
import {
  AlertCircle,
  ArrowRight,
  Bell,
  Calendar,
  Clock3,
  FileText,
  MapPin,
  Users,
} from 'lucide-react';

interface DashboardMetrics {
  unread_notifications: number;
  pending_bookings: number;
  pending_requests: number;
  total_trainers: number;
  active_courses: number;
  active_events: number;
  upcoming_events: number;
  event_registrations_pending: number;
  expiring_documents: number;
  pending_confirmations: number;
}

interface UpcomingSession {
  id: string;
  course_title: string;
  trainer_name: string;
  booking_date: string;
  status: string;
}

interface ExpiringDocument {
  id: string;
  trainer_name: string;
  document_type: string;
  expires_at: string | null;
  days_until_expiry: number | null;
}

interface UpcomingEvent {
  id: string;
  title: string;
  course_title: string;
  trainer_name: string;
  event_date: string;
  end_date: string | null;
  venue: string | null;
  city: string | null;
  state: string | null;
  status: string;
  registrations_count: number;
}

interface DashboardPageProps {
  onNavigate?: (page: string) => void;
}

const metricDefaults: DashboardMetrics = {
  unread_notifications: 0,
  pending_bookings: 0,
  pending_requests: 0,
  total_trainers: 0,
  active_courses: 0,
  active_events: 0,
  upcoming_events: 0,
  event_registrations_pending: 0,
  expiring_documents: 0,
  pending_confirmations: 0,
};

const formatDashboardDate = (value?: string | null) => {
  if (!value) return 'TBA';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const getEventLocation = (event: UpcomingEvent) =>
  [event.venue, event.city, event.state].filter(Boolean).join(', ') || 'Venue to be confirmed';

const getStatusVariant = (status?: string) => {
  switch ((status || '').toUpperCase()) {
    case 'ACTIVE':
    case 'CONFIRMED':
    case 'APPROVED':
      return 'success';
    case 'TENTATIVE':
    case 'REGISTERED':
    case 'PENDING':
      return 'warning';
    case 'CANCELLED':
    case 'DENIED':
      return 'danger';
    case 'COMPLETED':
      return 'info';
    default:
      return 'default';
  }
};

export const EnhancedDashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [metrics, setMetrics] = useState<DashboardMetrics>(metricDefaults);
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([]);
  const [expiringDocs, setExpiringDocs] = useState<ExpiringDocument[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useRealtime((payload) => {
    const relevantTables = [
      'notifications',
      'booking_requests',
      'bookings',
      'custom_course_requests',
      'course_requests',
      'events',
      'event_registrations',
      'trainers',
      'courses',
      'trainer_documents',
    ];

    if (relevantTables.includes(payload.table)) {
      fetchDashboardData(true);
    }
  });

  const fetchDashboardData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const data = await apiClient.getDashboardMetrics();

      setMetrics({
        unread_notifications: data.unreadNotifications || 0,
        pending_bookings: data.pendingBookings || 0,
        pending_requests: data.pendingRequests || 0,
        total_trainers: data.totalTrainers || 0,
        active_courses: data.activeCourses || 0,
        active_events: data.activeEvents || 0,
        upcoming_events: data.upcomingEventsCount || data.upcomingEvents?.length || 0,
        event_registrations_pending: data.pendingEventRegistrations || 0,
        expiring_documents: data.expiringDocuments?.length || 0,
        pending_confirmations: data.pendingConfirmations || 0,
      });

      setUpcomingSessions(data.upcomingSessions || []);
      setExpiringDocs(data.expiringDocuments || []);
      setUpcomingEvents(data.upcomingEvents || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const metricCards = [
    {
      title: 'Unread Notifications',
      value: metrics.unread_notifications,
      helper: 'Messages that still need attention',
      icon: Bell,
      page: 'notifications',
      tone: 'from-blue-500/15 to-blue-50',
      accent: 'text-blue-600',
    },
    {
      title: 'Pending Bookings',
      value: metrics.pending_bookings,
      helper: 'Booking requests waiting for review',
      icon: Calendar,
      page: 'bookings',
      tone: 'from-violet-500/15 to-violet-50',
      accent: 'text-violet-600',
    },
    {
      title: 'Course Requests',
      value: metrics.pending_requests,
      helper: 'Custom requests still in the queue',
      icon: FileText,
      page: 'custom-requests',
      tone: 'from-orange-500/15 to-orange-50',
      accent: 'text-orange-600',
    },
    {
      title: 'Active Events',
      value: metrics.active_events,
      helper: `${metrics.upcoming_events} scheduled ahead`,
      icon: Calendar,
      page: 'events',
      tone: 'from-green-500/15 to-green-50',
      accent: 'text-green-600',
    },
    {
      title: 'Event Registrations',
      value: metrics.event_registrations_pending,
      helper: 'Registrations waiting for admin handling',
      icon: Users,
      page: 'events',
      tone: 'from-teal-500/15 to-teal-50',
      accent: 'text-teal-600',
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border border-emerald-100 shadow-md">
        <div className="bg-gradient-to-r from-green-50 via-white to-teal-50 p-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-600">
                Dashboard Overview
              </p>
              <h1 className="mt-2 text-3xl font-bold text-gray-900">
                Events are now part of the main admin operating view
              </h1>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                Keep an eye on live events, registrations, pending bookings, and urgent follow-ups from one place.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Trainers</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{metrics.total_trainers}</p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Active Courses</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{metrics.active_courses}</p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Upcoming Events</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{metrics.upcoming_events}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="primary" onClick={() => onNavigate && onNavigate('events')}>
              Open Events
              <ArrowRight size={16} className="ml-2" />
            </Button>
            <Button variant="outline" onClick={() => onNavigate && onNavigate('bookings')}>
              Review Bookings
            </Button>
            <Button variant="outline" onClick={() => fetchDashboardData()}>
              Refresh Overview
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title}>
              <Card
                onClick={card.page && onNavigate ? () => onNavigate(card.page as string) : undefined}
                className="h-full border border-gray-100 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className={`h-full bg-gradient-to-br ${card.tone} p-5`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className={`rounded-2xl bg-white p-3 shadow-sm ${card.accent}`}>
                      <Icon size={20} />
                    </div>
                    <Badge variant={card.value > 0 ? 'warning' : 'success'}>
                      {card.value > 0 ? 'Needs review' : 'Up to date'}
                    </Badge>
                  </div>

                  <div className="mt-5">
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{card.value}</p>
                    <p className="mt-2 text-sm leading-6 text-gray-500">{card.helper}</p>
                  </div>
                </div>
              </Card>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,1fr)]">
        <Card className="overflow-hidden border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/70 px-6 py-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Upcoming Events</h2>
              <p className="text-sm text-gray-500">A dashboard view of the events admins are actively managing</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => onNavigate && onNavigate('events')}>
              Manage Events
            </Button>
          </div>

          <div className="space-y-4 p-6">
            {upcomingEvents.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-5 py-10 text-center text-sm text-gray-500">
                No upcoming events are scheduled right now.
              </div>
            ) : (
              upcomingEvents.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => onNavigate && onNavigate('events')}
                  className="w-full rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={getStatusVariant(event.status)}>{event.status}</Badge>
                        <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                          Event
                        </span>
                      </div>
                      <h3 className="mt-3 text-lg font-semibold text-gray-900">
                        {event.title || event.course_title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {event.course_title}
                        {event.trainer_name ? ` • ${event.trainer_name}` : ''}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <Calendar size={15} className="text-teal-600" />
                          <span>{formatDashboardDate(event.event_date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={15} className="text-teal-600" />
                          <span>{getEventLocation(event)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users size={15} className="text-teal-600" />
                          <span>{event.registrations_count} registration{event.registrations_count !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm font-medium text-teal-700">
                      <span>Open Events</span>
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="overflow-hidden border border-amber-100 shadow-sm">
            <div className="border-b border-amber-100 bg-amber-50/80 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white p-2 text-amber-600 shadow-sm">
                  <AlertCircle size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Action Watchlist</h2>
                  <p className="text-sm text-gray-500">The items most likely to need admin follow-up next</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 p-6">
              <div className="rounded-2xl border border-gray-100 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Pending event registrations</p>
                    <p className="text-sm text-gray-500">New registrations waiting for review inside Events</p>
                  </div>
                  <Badge variant={metrics.event_registrations_pending > 0 ? 'warning' : 'success'}>
                    {metrics.event_registrations_pending}
                  </Badge>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Booking confirmations due</p>
                    <p className="text-sm text-gray-500">Approved or tentative bookings happening soon</p>
                  </div>
                  <Badge variant={metrics.pending_confirmations > 0 ? 'warning' : 'success'}>
                    {metrics.pending_confirmations}
                  </Badge>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Expiring documents</p>
                    <p className="text-sm text-gray-500">Trainer documents expiring within the next 30 days</p>
                  </div>
                  <Badge variant={metrics.expiring_documents > 0 ? 'warning' : 'success'}>
                    {metrics.expiring_documents}
                  </Badge>
                </div>
              </div>

              {expiringDocs.length > 0 ? (
                <div className="space-y-3 pt-2">
                  {expiringDocs.map((doc) => (
                    <div key={doc.id} className="rounded-2xl bg-amber-50/70 p-4">
                      <p className="font-medium text-gray-900">{doc.trainer_name}</p>
                      <p className="mt-1 text-sm text-gray-600">{doc.document_type}</p>
                      <div className="mt-2 flex items-center justify-between text-xs text-amber-700">
                        <span>{doc.days_until_expiry ?? 0} day{doc.days_until_expiry !== 1 ? 's' : ''} left</span>
                        <span>{formatDashboardDate(doc.expires_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </Card>

          <Card className="overflow-hidden border border-gray-100 shadow-sm">
            <div className="border-b border-gray-100 bg-gray-50/70 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-teal-50 p-2 text-teal-600">
                  <Clock3 size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Upcoming Sessions</h2>
                  <p className="text-sm text-gray-500">Training sessions arriving within the next 7 days</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 p-6">
              {upcomingSessions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                  No upcoming training sessions in the next 7 days.
                </div>
              ) : (
                upcomingSessions.map((session) => (
                  <div key={session.id} className="rounded-2xl border border-gray-100 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900">{session.course_title}</p>
                        <p className="mt-1 text-sm text-gray-500">{session.trainer_name}</p>
                      </div>
                      <Badge variant={getStatusVariant(session.status)}>{session.status}</Badge>
                    </div>
                    <p className="mt-3 text-sm text-gray-600">{formatDashboardDate(session.booking_date)}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.95fr)]">
        <Card className="overflow-hidden border border-gray-100 shadow-sm">
          <div className="border-b border-gray-100 bg-gray-50/70 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Course Request View</h2>
            <p className="text-sm text-gray-500">Keep custom requests visible alongside bookings and events</p>
          </div>
          <div className="p-6">
            <CourseRequestWidget onNavigate={onNavigate} />
          </div>
        </Card>

        <Card className="overflow-hidden border border-gray-100 shadow-sm">
          <div className="border-b border-gray-100 bg-gray-50/70 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            <p className="text-sm text-gray-500">Jump straight into the busiest admin workflows</p>
          </div>

          <div className="space-y-3 p-6">
            <button
              onClick={() => onNavigate && onNavigate('events')}
              className="w-full rounded-2xl border border-gray-100 bg-white px-4 py-4 text-left transition-all hover:border-teal-200 hover:bg-teal-50"
            >
              <div className="font-medium text-gray-900">Manage Events</div>
              <div className="mt-1 text-sm text-gray-500">Review event schedules, registrations, and statuses</div>
            </button>
            <button
              onClick={() => onNavigate && onNavigate('trainers')}
              className="w-full rounded-2xl border border-gray-100 bg-white px-4 py-4 text-left transition-all hover:border-teal-200 hover:bg-teal-50"
            >
              <div className="font-medium text-gray-900">Manage Trainers</div>
              <div className="mt-1 text-sm text-gray-500">View profiles, documents, and trainer availability</div>
            </button>
            <button
              onClick={() => onNavigate && onNavigate('courses')}
              className="w-full rounded-2xl border border-gray-100 bg-white px-4 py-4 text-left transition-all hover:border-teal-200 hover:bg-teal-50"
            >
              <div className="font-medium text-gray-900">Manage Courses</div>
              <div className="mt-1 text-sm text-gray-500">Update course content and keep schedules aligned</div>
            </button>
            <button
              onClick={() => onNavigate && onNavigate('bookings')}
              className="w-full rounded-2xl border border-gray-100 bg-white px-4 py-4 text-left transition-all hover:border-teal-200 hover:bg-teal-50"
            >
              <div className="font-medium text-gray-900">Review Bookings</div>
              <div className="mt-1 text-sm text-gray-500">Handle pending requests and final confirmations</div>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};
