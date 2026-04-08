import React, { useEffect, useState, useRef } from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { apiClient } from '../lib/api-client';
import { useRealtime } from '../hooks/useRealtime';
import { Notification } from '../types';
import { formatDateTime } from '../utils/helpers';
import { Check, CheckCheck, Trash2 } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);

  // Refs to give real-time callback access to current state without stale closures
  const filterRef = useRef(filter);
  const pageRef = useRef(currentPage);
  useEffect(() => { filterRef.current = filter; }, [filter]);
  useEffect(() => { pageRef.current = currentPage; }, [currentPage]);

  // Only show the full-page spinner on the very first load
  const hasFetchedOnce = useRef(false);

  useEffect(() => {
    // On page/filter change: show spinner only if it's the first ever fetch
    fetchNotifications(!hasFetchedOnce.current ? false : true);
  }, [currentPage, filter]);

  // Real-time handler — uses useRealtime directly so the internal handlerRef keeps it current
  useRealtime((payload: any) => {
    if (payload.table === 'notifications') {
      console.log('🔔 New notification received, refreshing list silently...');
      // Silent refresh — passes current filter/page via refs
      fetchNotifications(true, filterRef.current, pageRef.current);
    }
  });

  // Accept optional currentFilter/currentPage params for real-time callbacks
  const fetchNotifications = async (silent = false, currentFilter?: string, page?: number) => {
    const activeFilter = currentFilter ?? filter;
    const activePage = page ?? currentPage;
    try {
      if (!silent) setLoading(true);
      hasFetchedOnce.current = true;

      const params: any = { page: activePage, limit: 10 };
      if (activeFilter === 'unread') {
        params.isRead = false;
      }

      const response = await apiClient.getNotifications(params);
      const notificationsData = response.notifications || [];

      // Map backend camelCase to frontend snake_case
      const mappedNotifications: Notification[] = notificationsData.map((n: any) => ({
        id: n.id,
        title: n.title || '',
        message: n.message || '',
        type: (n.type?.toLowerCase() || 'info') as 'info' | 'warning' | 'success' | 'error',
        is_read: n.isRead || false,
        related_entity_type: n.relatedEntityType || null,
        related_entity_id: n.relatedEntityId || null,
        created_at: n.createdAt || new Date().toISOString(),
      }));

      setNotifications(mappedNotifications);
      setTotalPages(response.totalPages || 1);

      // Update unread count from the response
      if (activeFilter === 'all') {
        setUnreadCount(notificationsData.filter((n: any) => !n.isRead).length);
      }

    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await apiClient.markNotificationAsRead(id);

      setNotifications(notifications.map(n =>
        n.id === id ? { ...n, is_read: true } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.markAllNotificationsAsRead();

      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await apiClient.deleteNotification(id);

      setNotifications(notifications.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const filteredNotifications = notifications; // Already filtered server-side

  // Only show the full spinner on the absolute first page load
  if (loading && !hasFetchedOnce.current) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const getTypeVariant = (type: string) => {
    switch (type) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'danger';
      default: return 'info';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Notifications</h1>
          <p className="text-gray-600 mt-1">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setFilter(filter === 'all' ? 'unread' : 'all')}
          >
            {filter === 'all' ? 'Show Unread' : 'Show All'}
          </Button>
          {unreadCount > 0 && (
            <Button variant="primary" size="sm" onClick={markAllAsRead}>
              <CheckCheck size={16} className="mr-2" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      <Card>
        <div className="divide-y divide-gray-200">
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No notifications to display
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-6 hover:bg-gray-50 transition-colors ${!notification.is_read ? 'bg-blue-50' : ''
                  }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-gray-800">
                        {notification.title}
                      </h3>
                      <Badge variant={getTypeVariant(notification.type)}>
                        {notification.type}
                      </Badge>
                      {!notification.is_read && (
                        <Badge variant="warning">New</Badge>
                      )}
                    </div>
                    <p className="text-gray-600 mb-2">{notification.message}</p>
                    <p className="text-sm text-gray-500">
                      {formatDateTime(notification.created_at)}
                    </p>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    {!notification.is_read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Mark as read"
                      >
                        <Check size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card className="mt-4">
          <div className="p-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
