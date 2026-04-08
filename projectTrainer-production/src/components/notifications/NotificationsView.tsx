import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Button } from '../ui/Button';
import { apiClient } from '../../lib/api-client';
import { CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react';
import { formatDate } from '../../utils/helpers';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
    isRead: boolean;
    createdAt: string;
}

export function NotificationsView() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

    useEffect(() => {
        if (user?.id) {
            fetchNotifications();
            markAllAsRead();
        }
    }, [user?.id, filter]);

    const markAllAsRead = async () => {
        try {
            await apiClient.markAllNotificationsAsRead();
            window.dispatchEvent(new CustomEvent('notification:read'));
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const params: any = { page: 1 };
            if (filter === 'unread') {
                params.isRead = false;
            } else if (filter === 'read') {
                params.isRead = true;
            }

            const response = await apiClient.getNotifications(params);
            setNotifications(response.notifications || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            await apiClient.markNotificationAsRead(notificationId);
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
            );
            window.dispatchEvent(new CustomEvent('notification:read'));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'SUCCESS':
                return <CheckCircle className="w-4 h-4 text-green-600" />;
            case 'WARNING':
                return <AlertCircle className="w-4 h-4 text-yellow-600" />;
            case 'ERROR':
                return <XCircle className="w-4 h-4 text-red-600" />;
            default:
                return <Info className="w-4 h-4 text-accent-600" />;
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.isRead;
        if (filter === 'read') return n.isRead;
        return true;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Filter Tabs */}
            <div className="px-6 pt-6 border-b border-corporate-100 flex gap-6">
                {[
                    { id: 'all', label: 'All' },
                    { id: 'unread', label: 'Unread' },
                    { id: 'read', label: 'History' }
                ].map((btn) => (
                    <button
                        key={btn.id}
                        onClick={() => setFilter(btn.id as any)}
                        className={`pb-4 px-1 text-[10px] font-black uppercase tracking-widest transition-all relative ${filter === btn.id
                                ? 'text-corporate-900 border-b-2 border-accent-500'
                                : 'text-corporate-400 hover:text-corporate-600'
                            }`}
                    >
                        {btn.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-corporate-50/20">
                {filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-6">
                        <h3 className="text-sm font-black text-corporate-900 uppercase tracking-widest">Queue Clear</h3>
                        <p className="text-xs text-corporate-500 mt-2 font-medium">No system log entries detected.</p>
                    </div>
                ) : (
                    filteredNotifications.map((notification) => (
                        <div
                            key={notification.id}
                            onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                            className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer ${!notification.isRead
                                    ? 'bg-white border-accent-100 shadow-sm hover:border-accent-300'
                                    : 'bg-white/50 border-corporate-100 opacity-80'
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${notification.type === 'SUCCESS' ? 'bg-green-50' :
                                        notification.type === 'WARNING' ? 'bg-yellow-50' :
                                            notification.type === 'ERROR' ? 'bg-red-50' : 'bg-accent-50'
                                    }`}>
                                    {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="text-sm font-bold text-corporate-900 tracking-tight leading-tight">
                                            {notification.title}
                                        </h4>
                                        <span className="text-[9px] font-bold text-corporate-300 tabular-nums">
                                            {formatDate(notification.createdAt)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-corporate-600 font-medium leading-relaxed mb-4">
                                        {notification.message}
                                    </p>
                                    {!notification.isRead && (
                                        <Button
                                            onClick={() => handleMarkAsRead(notification.id)}
                                            size="sm"
                                            variant="outline"
                                            className="h-8 rounded-lg text-[9px] font-black uppercase tracking-widest border-accent-200 text-accent-700 hover:bg-accent-50"
                                        >
                                            Mark as Read
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
