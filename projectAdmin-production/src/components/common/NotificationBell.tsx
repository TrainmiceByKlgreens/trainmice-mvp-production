import React, { useEffect, useState, useRef } from 'react';
import { apiClient } from '../../lib/api-client';
import { Bell, AlertCircle, FileWarning, Calendar } from 'lucide-react';
import { Badge } from './Badge';
import { useRealtime } from '../../hooks/useRealtime';
import { showToast } from './Toast';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  is_read: boolean;
  severity: 'info' | 'warning' | 'error' | 'success';
}

export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useRealtime((payload) => {
    // Refresh for any relevant data changes
    const tablesToRefresh = ['notifications', 'bookings', 'course_requests', 'booking_requests', 'trainer_messages', 'messages', 'event_enquiries'];
    if (tablesToRefresh.includes(payload.table)) {
      console.log('🔔 NotificationBell: Real-time update for table:', payload.table);
      fetchNotifications();

      // Show toast notifications for specific events
      if (payload.action === 'INSERT') {
        if (payload.table === 'trainer_messages' || payload.table === 'messages') {
          showToast('New message from trainer!', 'info');
        } else if (payload.table === 'event_enquiries') {
          showToast('New event enquiry received!', 'info');
        } else if (payload.table === 'course_requests') {
          showToast('New course request received!', 'info');
        } else if (payload.table === 'booking_requests') {
          showToast('New booking request received!', 'info');
        }
      }
    }
  });

  const fetchNotifications = async () => {
    try {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const today = new Date().toISOString().split('T')[0];

      // 1. Fetch standard notifications from database
      const stdNotifResponse = await apiClient.getNotifications({ isRead: false, limit: 20 });
      const standardNotifications: Notification[] = (stdNotifResponse.notifications || []).map((n: any) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        timestamp: n.createdAt,
        is_read: n.isRead,
        severity: n.type === 'ERROR' ? 'error' : (n.type === 'WARNING' ? 'warning' : (n.type === 'SUCCESS' ? 'success' : 'info')),
      }));

      // 2. Fetch expiring documents
      const documentsResponse = await apiClient.getAdminDocuments();
      const expiringDocs = (documentsResponse.documents || []).filter((doc: any) => {
        if (!doc.expiresAt) return false;
        const expiryDate = new Date(doc.expiresAt);
        const todayDate = new Date(today);
        return expiryDate >= todayDate && expiryDate <= thirtyDaysFromNow;
      });

      // 3. Fetch pending confirmations from bookings
      const bookingsResponse = await apiClient.getBookings();
      const pendingConfirmations = (bookingsResponse.bookings || []).filter((booking: any) => {
        if (booking.status !== 'CONFIRMED') return false;
        if (booking.finalConfirmation) return false;
        const bookingDate = new Date(booking.bookingDate || booking.startDate);
        return bookingDate >= new Date(today);
      });

      const systemNotifications: Notification[] = [...standardNotifications];

      expiringDocs.forEach((doc: any) => {
        const expiryDate = new Date(doc.expiresAt);
        const daysUntil = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

        systemNotifications.push({
          id: `cert-${doc.id}`,
          type: 'certificate_expiry',
          title: 'Certificate Expiring Soon',
          message: `${doc.trainer?.fullName || 'Trainer'}'s ${doc.documentType} expires in ${daysUntil} days`,
          timestamp: new Date().toISOString(),
          is_read: false,
          severity: daysUntil <= 7 ? 'error' : 'warning',
        });
      });

      pendingConfirmations.forEach((booking: any) => {
        const bookingDate = new Date(booking.bookingDate || booking.startDate);
        const absDaysUntil = Math.ceil((bookingDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        const isLate = bookingDate < new Date();

        systemNotifications.push({
          id: `confirm-${booking.id}`,
          type: 'reminder',
          title: isLate ? 'Booking Overdue Confirmation' : 'Final Confirmation Needed',
          message: `${booking.course?.title || 'Course'} with ${booking.trainer?.fullName || 'Trainer'} ${isLate ? 'was on' : 'in'} ${isLate ? bookingDate.toLocaleDateString() : absDaysUntil + ' days'} needs final confirmation`,
          timestamp: new Date().toISOString(),
          is_read: false,
          severity: isLate || absDaysUntil <= 2 ? 'error' : 'warning',
        });
      });

      systemNotifications.sort((a, b) => {
        if (a.is_read !== b.is_read) return a.is_read ? 1 : -1;
        if (a.severity === 'error' && b.severity !== 'error') return -1;
        if (a.severity !== 'error' && b.severity === 'error') return 1;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

      setNotifications(systemNotifications);
      setUnreadCount(systemNotifications.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.markAllNotificationsAsRead();
      showToast('All notifications marked as read', 'success');
      fetchNotifications();
    } catch (error: any) {
      showToast(error.message || 'Error marking all as read', 'error');
    }
  };

  const handleMarkAsRead = async (id: string) => {
    if (id.startsWith('cert-') || id.startsWith('confirm-')) return;
    try {
      await apiClient.markNotificationAsRead(id);
      fetchNotifications();
    } catch (error: any) {
      console.error('Error marking as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'certificate_expiry':
        return <FileWarning size={20} className="text-yellow-600" />;
      case 'import_failed':
        return <AlertCircle size={20} className="text-red-600" />;
      case 'reminder':
        return <Calendar size={20} className="text-blue-600" />;
      default:
        return <Bell size={20} className="text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string, isRead: boolean) => {
    if (isRead) return 'bg-white border-l-4 border-gray-200 opacity-60';
    switch (severity) {
      case 'error':
        return 'bg-red-50 border-l-4 border-red-500';
      case 'warning':
        return 'bg-yellow-50 border-l-4 border-yellow-500';
      case 'success':
        return 'bg-green-50 border-l-4 border-green-500';
      default:
        return 'bg-blue-50 border-l-4 border-blue-500';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell size={24} className="text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <h3 className="font-semibold text-gray-800">System Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="danger">{unreadCount} New</Badge>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell size={48} className="mx-auto mb-3 text-gray-300" />
                <p>No notifications</p>
                <p className="text-sm">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleMarkAsRead(notification.id)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${getSeverityColor(notification.severity, notification.is_read)}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm mb-1">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatTimeAgo(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50 flex gap-2">
              <button
                onClick={handleMarkAllAsRead}
                className="flex-1 text-center text-sm text-teal-600 hover:text-teal-700 font-bold bg-teal-50 py-2 rounded-md transition-colors"
                disabled={unreadCount === 0}
              >
                Mark All as Read
              </button>
              <button
                onClick={() => fetchNotifications()}
                className="px-3 text-center text-sm text-gray-500 hover:text-gray-700 font-medium bg-gray-100 py-2 rounded-md transition-colors"
              >
                Refresh
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
