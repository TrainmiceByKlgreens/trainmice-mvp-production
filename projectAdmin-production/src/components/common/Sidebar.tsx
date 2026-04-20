import React, { useState, useEffect } from 'react';
import {
  Home,
  MessageSquare,
  Users,
  BookOpen,
  FileText,
  Calendar,
  Settings,
  Activity,
  LogOut,
  BarChart3,
  Image as ImageIcon,
} from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { useRealtime } from '../../hooks/useRealtime';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, onLogout }) => {
  const [counts, setCounts] = useState<{
    unreadMessages: number;
    pendingCourses: number;
    unreadBookings: number;
    unreadInHouseBookings: number;
    unreadPublicBookings: number;
    unreadCourseRequests: number;
    unreadTrainerNotes: number;
    unreadEventRegistrations: number;
    unreadContactSubmissions: number;
    unreadEventEnquiries: number;
  }>({
    unreadMessages: 0,
    pendingCourses: 0,
    unreadBookings: 0,
    unreadInHouseBookings: 0,
    unreadPublicBookings: 0,
    unreadCourseRequests: 0,
    unreadTrainerNotes: 0,
    unreadEventRegistrations: 0,
    unreadContactSubmissions: 0,
    unreadEventEnquiries: 0,
  });

  const fetchCounts = async () => {
    try {
      const data = await apiClient.getSidebarCounts();
      setCounts(data);
    } catch (error) {
      console.error('Error fetching sidebar counts:', error);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  useRealtime((payload) => {
    // Refresh counts when relevant tables change
    if ([
      'trainer_messages', 
      'messages', 
      'message_threads', 
      'courses', 
      'booking_requests', 
      'custom_course_requests',
      'course_notes',
      'event_registrations',
      'event_enquiries'
    ].includes(payload.table)) {
      fetchCounts();
    }
  });

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { 
      id: 'messages', 
      label: 'Messages', 
      icon: MessageSquare,
      hasDot: counts.unreadMessages > 0 || counts.unreadContactSubmissions > 0 || counts.unreadEventEnquiries > 0
    },
    { id: 'trainers', label: 'Trainers', icon: Users },
    { 
      id: 'courses', 
      label: 'Courses', 
      icon: BookOpen,
      hasDot: counts.pendingCourses > 0 || counts.unreadTrainerNotes > 0
    },
    { 
      id: 'events', 
      label: 'Events', 
      icon: Calendar,
      hasDot: counts.unreadEventRegistrations > 0 || counts.unreadInHouseBookings > 0
    },
    { 
      id: 'custom-requests', 
      label: 'Course Requests', 
      icon: FileText,
      hasDot: counts.unreadCourseRequests > 0
    },
    { 
      id: 'bookings', 
      label: 'Bookings', 
      icon: Calendar,
      hasDot: counts.unreadPublicBookings > 0
    },
    { id: 'feedback-analytics', label: 'Feedback Analytics', icon: BarChart3 },
    { id: 'admin-logs', label: 'Admin Logs', icon: Activity },
    { id: 'category-images', label: 'Category Images', icon: ImageIcon },
    { id: 'trainer-logs', label: 'Trainer Logs', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-gradient-to-b from-green-50 to-green-200 text-gray-800 h-screen fixed left-0 top-0 flex flex-col">
      <div className="p-6 border-b border-green-200 flex items-center justify-center">
        <img
          src="/TrainmiceTwinleaf.png"
          alt="Trainmice"
          className="h-32 w-auto object-contain"
        />
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive
                ? 'bg-green-600 text-white'
                : 'text-gray-700 hover:bg-green-100'
                }`}
            >
              <div className="relative">
                <Icon size={20} />
                {item.hasDot && (
                  <span className="absolute -top-1 -right-1 block h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-green-50 animate-pulse" />
                )}
              </div>
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-green-200">
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-red-100 hover:text-red-600 transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};
