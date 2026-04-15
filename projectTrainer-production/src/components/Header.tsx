import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, MessageSquare } from 'lucide-react';
import { apiClient } from '../lib/api-client';
import { useAuth } from '../contexts/AuthContext';
import { useRealtime } from '../hooks/useRealtime';

export function Header() {
  const location = useLocation();
  const { user } = useAuth();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const unreadMessagesRef = useRef(0);

  useEffect(() => {
    unreadMessagesRef.current = unreadMessages;
  }, [unreadMessages]);

  useEffect(() => {
    if (user?.id) {
      fetchUnreadCounts();
    }
  }, [user?.id, location.pathname]);

  // Refresh counts when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user?.id) {
        fetchUnreadCounts();
      }
    };

    // Listen for custom events to refresh counts
    const handleNotificationRead = () => {
      fetchUnreadCounts();
    };
    const handleMessageRead = () => {
      fetchUnreadCounts();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('notification:read', handleNotificationRead);
    window.addEventListener('message:read', handleMessageRead);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('notification:read', handleNotificationRead);
      window.removeEventListener('message:read', handleMessageRead);
    };
  }, [user?.id]);

  const fetchUnreadCounts = async () => {
    if (!user?.id) return;

    let nextUnreadNotifications = unreadNotifications;
    let nextUnreadMessages = unreadMessagesRef.current;

    try {
      const [notificationsResult, sidebarCountsResult] = await Promise.allSettled([
        apiClient.getNotifications({ page: 1, limit: 1, isRead: false }),
        apiClient.getSidebarCounts(),
      ]);

      if (notificationsResult.status === 'fulfilled') {
        nextUnreadNotifications = notificationsResult.value.total || notificationsResult.value.notifications?.length || 0;
      } else {
        console.error('Error fetching unread notifications:', notificationsResult.reason);
      }

      if (sidebarCountsResult.status === 'fulfilled') {
        nextUnreadMessages = sidebarCountsResult.value.unreadMessages || 0;
      } else {
        console.error('Error fetching unread messages:', sidebarCountsResult.reason);
      }

      // If we are currently on the notifications page, we don't show the red dot
      if (window.location.pathname === '/notifications') {
        setUnreadNotifications(0);
      } else {
        setUnreadNotifications(nextUnreadNotifications);
      }
      setUnreadMessages(nextUnreadMessages);
    } catch (error) {
      console.error('Error fetching unread counts:', error);
    }

    return {
      unreadNotifications: nextUnreadNotifications,
      unreadMessages: nextUnreadMessages,
    };
  };

  useRealtime(async (payload) => {
    const payloadTrainerId = payload.data?.trainerId || payload.data?.trainer_id;
    const isMessageUpdateForCurrentTrainer = (
      ['messages', 'trainer_messages', 'message_threads'].includes(payload.table) &&
      ['CREATE', 'UPDATE'].includes(payload.action) &&
      payloadTrainerId === user?.id
    );

    if (
      isMessageUpdateForCurrentTrainer
    ) {
      const counts = await fetchUnreadCounts();

      if (
        counts &&
        location.pathname !== '/messages' &&
        counts.unreadMessages > unreadMessagesRef.current
      ) {
        window.dispatchEvent(new CustomEvent('app:toast', {
          detail: { message: 'New message from Admin', type: 'info' }
        }));
      }

      return;
    }

    if (
      payload.table === 'notifications' &&
      ['CREATE', 'UPDATE'].includes(payload.action) &&
      payload.data?.userId === user?.id
    ) {
      fetchUnreadCounts();
    }
  });

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 h-16 bg-white border-b border-corporate-100 z-30 flex items-center justify-end px-4 lg:px-8 font-sans">
      <div className="flex items-center gap-4 lg:gap-6">
        {/* Messages Icon */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('drawer:messages'))}
          className="relative p-2.5 text-corporate-400 hover:text-black hover:bg-gray-50 rounded-xl transition-all duration-300 group"
          title={`Messages${unreadMessages > 0 ? ` (${unreadMessages} unread)` : ''}`}
        >
          <MessageSquare className="w-[20px] h-[20px] group-hover:scale-110 transition-transform" />
          {unreadMessages > 0 && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-white"></span>
          )}
        </button>

        {/* Notifications Icon */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('drawer:notifications'))}
          className="relative p-2.5 text-corporate-400 hover:text-black hover:bg-gray-50 rounded-xl transition-all duration-300 group"
          title={`Notifications${unreadNotifications > 0 ? ` (${unreadNotifications} unread)` : ''}`}
        >
          <Bell className="w-[20px] h-[20px] group-hover:scale-110 transition-transform" />
          {unreadNotifications > 0 && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-white"></span>
          )}
        </button>
      </div>
    </header>
  );
}
