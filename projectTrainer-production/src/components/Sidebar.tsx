import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  BarChart3,
  BookOpen,
  User,
  LogOut,
  Menu,
  X,
  CalendarDays
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api-client';
import { useRealtime } from '../hooks/useRealtime';

export function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [counts, setCounts] = useState({
    unreadAdminNotes: 0,
    newCourseStatus: 0,
    unreadMessages: 0,
    unreadBookingRequests: 0
  });
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

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
    if (['courses', 'admin_course_notes', 'trainer_messages', 'messages', 'message_threads', 'booking_requests'].includes(payload.table)) {
      fetchCounts();
    }
  });

  const navItems = [
    { 
      path: '/dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard,
      hasDot: counts.unreadBookingRequests > 0
    },
    { path: '/calendar', label: 'My Calendar', icon: Calendar },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { 
      path: '/courses', 
      label: 'My Courses', 
      icon: BookOpen,
      hasDot: counts.unreadAdminNotes > 0 || counts.newCourseStatus > 0
    },
    { path: '/events', label: 'Event Overview', icon: CalendarDays },
    { path: '/profile', label: 'Profile', icon: User }
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-corporate-900 border border-white/5 rounded-lg shadow-md"
      >
        {isMobileMenuOpen ? (
          <X className="w-6 h-6 text-accent-gold" />
        ) : (
          <Menu className="w-6 h-6 text-accent-gold" />
        )}
      </button>

      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-30"
          onClick={closeMobileMenu}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-white border-r border-corporate-100 z-40
          transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 shadow-sm
        `}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-corporate-50 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent-gold rounded-xl flex items-center justify-center text-black font-black shadow-gold-glow/20">
                {user?.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-corporate-950 truncate text-sm">{user?.full_name}</p>
                <p className="text-[10px] text-accent-gold-dark uppercase tracking-widest font-black leading-none mt-1">{user?.role}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${isActive
                      ? 'bg-accent-gold shadow-gold-glow/20 text-black font-black'
                      : 'text-corporate-500 hover:bg-gray-50 hover:text-corporate-950'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="relative">
                        <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-black' : 'text-corporate-400 group-hover:text-corporate-950'}`} />
                        {item.hasDot && (
                          <span className={`absolute -top-1 -right-1 block h-2 w-2 rounded-full bg-red-500 border-2 ${isActive ? 'border-accent-gold' : 'border-white'} animate-pulse`} />
                        )}
                      </div>
                      <span className="text-sm tracking-wide font-bold">{item.label}</span>
                      {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-black shadow-sm" />}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className="p-4 border-t border-corporate-50 bg-gray-50/30">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-corporate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-300 group font-bold"
            >
              <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
