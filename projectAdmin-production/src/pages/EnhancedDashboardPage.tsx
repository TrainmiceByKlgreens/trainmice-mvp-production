import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { CourseRequestWidget } from '../components/dashboard/CourseRequestWidget';
import { apiClient } from '../lib/api-client';
import { useRealtime } from '../hooks/useRealtime';
import { Bell, Calendar, FileText, AlertCircle } from 'lucide-react';

interface DashboardMetrics {
  unread_notifications: number;
  pending_bookings: number;
  pending_requests: number;
  total_trainers: number;
  active_courses: number;
  upcoming_sessions: number;
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
  expires_at: string;
  days_until_expiry: number;
}

interface DashboardPageProps {
  onNavigate?: (page: string) => void;
}

export const EnhancedDashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([]);
  const [expiringDocs, setExpiringDocs] = useState<ExpiringDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useRealtime((payload) => {
    const relevantTables = ['bookings', 'course_requests', 'booking_requests', 'notifications', 'trainers', 'courses'];
    if (relevantTables.includes(payload.table)) {
      console.log('📊 Real-time update for dashboard metrics:', payload.table);
      fetchDashboardData();
    }
  });

  const fetchDashboardData = async () => {
    try {
      const data = await apiClient.getDashboardMetrics() as any;

      setMetrics({
        unread_notifications: data.unreadNotifications || 0,
        pending_bookings: data.pendingBookings || 0,
        pending_requests: data.pendingRequests || 0,
        total_trainers: data.totalTrainers || 0,
        active_courses: data.activeCourses || 0,
        upcoming_sessions: data.upcomingSessions?.length || 0,
        expiring_documents: data.expiringDocuments?.length || 0,
        pending_confirmations: data.pendingConfirmations || 0,
      });

      setUpcomingSessions(data.upcomingSessions || []);
      setExpiringDocs(data.expiringDocuments || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
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
      value: metrics?.unread_notifications || 0,
      icon: Bell,
      color: 'from-blue-500 to-blue-600',
      badge: metrics?.unread_notifications ? 'warning' : 'success',
      clickable: true,
      page: 'notifications',
    },
    {
      title: 'Pending Bookings',
      value: metrics?.pending_bookings || 0,
      icon: Calendar,
      color: 'from-purple-500 to-purple-600',
      badge: metrics?.pending_bookings ? 'warning' : 'success',
      clickable: true,
      page: 'bookings',
    },
    {
      title: 'Course Requests',
      value: metrics?.pending_requests || 0,
      icon: FileText,
      color: 'from-orange-500 to-orange-600',
      badge: metrics?.pending_requests ? 'warning' : 'success',
      clickable: true,
      page: 'custom-requests',
    },
  ];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard Overview</h1>
        <p className="text-gray-600">Welcome to Trainmice Admin Portal</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metricCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              onClick={() => card.clickable && card.page && onNavigate && onNavigate(card.page)}
              className={card.clickable ? 'cursor-pointer' : ''}
            >
              <Card
                className={`hover:shadow-lg transition-shadow ${card.clickable ? 'cursor-pointer' : ''}`}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${card.color}`}>
                      <Icon className="text-white" size={24} />
                    </div>
                    <Badge variant={card.badge as 'default' | 'success' | 'info' | 'warning' | 'danger'}>
                      {card.value > 0 && card.badge === 'warning' ? 'Action Required' : 'All Clear'}
                    </Badge>
                  </div>
                  <h3 className="text-gray-600 text-sm font-medium mb-1">{card.title}</h3>
                  <p className="text-3xl font-bold text-gray-800">{card.value}</p>
                </div>
              </Card>
            </div>
          );
        })}
      </div>

      {(metrics?.pending_confirmations || 0) > 0 && (
        <Card className="border-l-4 border-red-500">
          <div className="p-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="text-red-500" size={24} />
              <div>
                <h3 className="font-semibold text-gray-800">Urgent: Final Confirmations Needed</h3>
                <p className="text-gray-600">
                  {metrics?.pending_confirmations} booking{metrics?.pending_confirmations !== 1 ? 's' : ''} require
                  final confirmation before the training session.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {expiringDocs.length > 0 && (
        <Card className="border-l-4 border-yellow-500">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertCircle className="text-yellow-500" size={24} />
              <div>
                <h3 className="font-semibold text-gray-800">Expiring HRDC Certificates of Attendance</h3>
                <p className="text-gray-600 text-sm">
                  {expiringDocs.length} document{expiringDocs.length !== 1 ? 's' : ''} expiring in the next 30 days
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {expiringDocs.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{doc.trainer_name}</p>
                    <p className="text-sm text-gray-600">{doc.document_type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-yellow-700">
                      {doc.days_until_expiry} day{doc.days_until_expiry !== 1 ? 's' : ''} left
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(doc.expires_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      <Card title="Course Request View">
        <CourseRequestWidget onNavigate={onNavigate} />
      </Card>

      <Card title="Upcoming Training Sessions (Next 7 Days)">
        <div className="space-y-3">
          {upcomingSessions.length === 0 ? (
            <p className="text-gray-500 text-sm py-4">No upcoming sessions in the next 7 days</p>
          ) : (
            upcomingSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-teal-100 rounded-lg">
                    <Calendar size={18} className="text-teal-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{session.course_title}</p>
                    <p className="text-sm text-gray-600">{session.trainer_name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-800">{formatDate(session.booking_date)}</p>
                  <Badge variant={session.status?.toUpperCase() === 'CONFIRMED' ? 'success' : 'warning'}>
                    {session.status}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card title="Quick Actions">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onNavigate && onNavigate('trainers')}
            className="flex-1 min-w-[200px] px-4 py-3 bg-gray-50 hover:bg-teal-50 rounded-lg transition-colors border border-transparent hover:border-teal-200"
          >
            <div className="font-medium text-gray-800">Manage Trainers</div>
            <div className="text-sm text-gray-600">View and update trainer profiles</div>
          </button>
          <button
            onClick={() => onNavigate && onNavigate('courses')}
            className="flex-1 min-w-[200px] px-4 py-3 bg-gray-50 hover:bg-teal-50 rounded-lg transition-colors border border-transparent hover:border-teal-200"
          >
            <div className="font-medium text-gray-800">Manage Courses</div>
            <div className="text-sm text-gray-600">Create and edit training courses</div>
          </button>
          <button
            onClick={() => onNavigate && onNavigate('bookings')}
            className="flex-1 min-w-[200px] px-4 py-3 bg-gray-50 hover:bg-teal-50 rounded-lg transition-colors border border-transparent hover:border-teal-200"
          >
            <div className="font-medium text-gray-800">Confirm Bookings</div>
            <div className="text-sm text-gray-600">Review and confirm training sessions</div>
          </button>
          <button
            onClick={() => onNavigate && onNavigate('custom-requests')}
            className="flex-1 min-w-[200px] px-4 py-3 bg-gray-50 hover:bg-teal-50 rounded-lg transition-colors border border-transparent hover:border-teal-200"
          >
            <div className="font-medium text-gray-800">Review Course Requests</div>
            <div className="text-sm text-gray-600">Handle custom course inquiries</div>
          </button>
        </div>
      </Card>
    </div>
  );
};
