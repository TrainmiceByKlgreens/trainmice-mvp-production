import React, { useEffect, useState } from 'react';

import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { apiClient } from '../lib/api-client';
import { Users, BookOpen, Calendar, FileText, MessageSquare, AlertCircle, Clock, TrendingUp } from 'lucide-react';
import { formatDate } from '../utils/helpers';

interface DashboardMetrics {
  totalTrainers: number;
  totalClients: number;
  activeCourses: number;
  pendingBookings: number;
  pendingHRDCVerifications: number;
  unreadMessages: number;
  upcomingCourses: number;
}

interface Activity {
  id: string;
  actionType: string;
  entityType: string;
  description: string;
  createdAt: string;
  user?: {
    email: string;
    fullName: string;
    role: string;
  };
}

interface UpcomingCourse {
  id: string;
  title: string;
  startDate: string;
  trainer?: {
    fullName: string;
  };
  courseTrainers?: Array<{
    trainer: {
      fullName: string;
    };
  }>;
}

interface PendingBooking {
  id: string;
  requestedDate: string;
  status: string;
  course?: {
    title: string;
  };
  trainer?: {
    fullName: string;
  };
  client?: {
    userName: string;
  };
}

export const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [upcomingCourses, setUpcomingCourses] = useState<UpcomingCourse[]>([]);
  const [pendingBookings, setPendingBookings] = useState<PendingBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [metricsData, activitiesData, coursesData, bookingsData] = await Promise.all([
        apiClient.getDashboardMetrics(),
        apiClient.getActivityTimeline({ limit: 10 }),
        apiClient.getUpcomingCourses(),
        apiClient.getPendingBookingsSummary(),
      ]);

      setMetrics(metricsData);
      setActivities(activitiesData.activities || []);
      setUpcomingCourses(coursesData.courses || []);
      setPendingBookings(bookingsData.bookings || []);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeVariant = (actionType: string) => {
    switch (actionType) {
      case 'CREATE':
        return 'success';
      case 'UPDATE':
        return 'info';
      case 'DELETE':
        return 'danger';
      case 'APPROVE':
        return 'success';
      case 'REJECT':
        return 'danger';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in p-6 min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-teal-400/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-[30rem] h-[30rem] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 font-medium mt-1">System Overview & Analytics</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center gap-2"
        >
          Refresh
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        <div className="bg-white/80 backdrop-blur-xl border border-slate-100 shadow-xl rounded-2xl overflow-hidden hover:-translate-y-1 transition-transform duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Trainers</p>
                <p className="text-4xl font-black text-slate-900 mt-2 tracking-tight">{metrics?.totalTrainers || 0}</p>
              </div>
              <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-100/50 shadow-inner">
                <Users className="text-blue-600 w-7 h-7" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-slate-100 shadow-xl rounded-2xl overflow-hidden hover:-translate-y-1 transition-transform duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Clients</p>
                <p className="text-4xl font-black text-slate-900 mt-2 tracking-tight">{metrics?.totalClients || 0}</p>
              </div>
              <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-100/50 shadow-inner">
                <Users className="text-emerald-600 w-7 h-7" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-slate-100 shadow-xl rounded-2xl overflow-hidden hover:-translate-y-1 transition-transform duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Courses</p>
                <p className="text-4xl font-black text-slate-900 mt-2 tracking-tight">{metrics?.activeCourses || 0}</p>
              </div>
              <div className="p-4 bg-violet-50/80 rounded-2xl border border-violet-100/50 shadow-inner">
                <BookOpen className="text-violet-600 w-7 h-7" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-slate-100 shadow-xl rounded-2xl overflow-hidden hover:-translate-y-1 transition-transform duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pending Bookings</p>
                <p className="text-4xl font-black text-slate-900 mt-2 tracking-tight">{metrics?.pendingBookings || 0}</p>
              </div>
              <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-100/50 shadow-inner">
                <Calendar className="text-amber-500 w-7 h-7" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-slate-100 shadow-xl rounded-2xl overflow-hidden hover:-translate-y-1 transition-transform duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">HRDC Pending</p>
                <p className="text-4xl font-black text-slate-900 mt-2 tracking-tight">{metrics?.pendingHRDCVerifications || 0}</p>
              </div>
              <div className="p-4 bg-orange-50/80 rounded-2xl border border-orange-100/50 shadow-inner">
                <FileText className="text-orange-500 w-7 h-7" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-slate-100 shadow-xl rounded-2xl overflow-hidden hover:-translate-y-1 transition-transform duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Unread Messages</p>
                <p className="text-4xl font-black text-slate-900 mt-2 tracking-tight">{metrics?.unreadMessages || 0}</p>
              </div>
              <div className="p-4 bg-red-50/80 rounded-2xl border border-red-100/50 shadow-inner">
                <MessageSquare className="text-red-500 w-7 h-7" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-slate-100 shadow-xl rounded-2xl overflow-hidden hover:-translate-y-1 transition-transform duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Upcoming Courses</p>
                <p className="text-4xl font-black text-slate-900 mt-2 tracking-tight">{metrics?.upcomingCourses || 0}</p>
              </div>
              <div className="p-4 bg-teal-50/80 rounded-2xl border border-teal-100/50 shadow-inner">
                <TrendingUp className="text-teal-600 w-7 h-7" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        {/* Activity Timeline */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-100 shadow-xl overflow-hidden flex flex-col h-full">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center space-x-3">
              <div className="bg-teal-500 rounded-lg p-2 shadow-inner">
                <Clock className="text-white" size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Recent Activity</h2>
            </div>
          </div>
          <div className="p-6 flex-1 space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
            {activities.length === 0 ? (
              <p className="text-slate-500 text-center py-8 font-medium italic select-none">No recent activity</p>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <Badge variant={getActionBadgeVariant(activity.actionType)}>
                    {activity.actionType}
                  </Badge>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800 leading-snug">{activity.description}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-xs font-semibold text-slate-500">
                        {activity.user?.fullName || activity.user?.email || 'System'}
                      </span>
                      <span className="text-xs text-slate-300">•</span>
                      <span className="text-xs font-medium text-slate-400">
                        {new Date(activity.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Courses */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-100 shadow-xl overflow-hidden flex flex-col h-full">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 rounded-lg p-2 shadow-inner">
                <Calendar className="text-white" size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Upcoming Courses</h2>
            </div>
          </div>
          <div className="p-6 flex-1 space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
            {upcomingCourses.length === 0 ? (
              <p className="text-slate-500 text-center py-8 font-medium italic select-none">No upcoming courses</p>
            ) : (
              upcomingCourses.map((course) => (
                <div key={course.id} className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <h3 className="font-extrabold text-slate-900 text-base">{course.title}</h3>
                  <div className="flex items-center space-x-4 mt-3 text-xs font-semibold text-slate-600">
                    <span className="bg-slate-100 px-2 py-1 rounded-md">{formatDate(course.startDate)}</span>
                    {course.trainer && (
                      <span className="text-slate-500">Trainer: <span className="text-slate-800">{course.trainer.fullName}</span></span>
                    )}
                    {course.courseTrainers && course.courseTrainers.length > 0 && (
                      <span className="text-slate-500">
                        Trainers: <span className="text-slate-800">{course.courseTrainers.map((ct) => ct.trainer.fullName).join(', ')}</span>
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Pending Bookings */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-100 shadow-xl overflow-hidden relative z-10">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-amber-500 rounded-lg p-2 shadow-inner">
              <AlertCircle className="text-white" size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Pending Bookings</h2>
          </div>
          <div className="px-4 py-1.5 bg-amber-100 text-amber-800 font-bold text-sm rounded-full">
            {pendingBookings.length} Total
          </div>
        </div>
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Course</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Trainer</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Client</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Date</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingBookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium italic select-none">
                    No pending bookings
                  </td>
                </tr>
              ) : (
                pendingBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-slate-800">
                      {booking.course?.title || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                      {booking.trainer?.fullName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                      {booking.client?.userName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-600 whitespace-nowrap">
                      {booking.requestedDate ? formatDate(booking.requestedDate) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={booking.status === 'PENDING' ? 'warning' : 'default'}>
                        {booking.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
