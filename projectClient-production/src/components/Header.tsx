import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, LogOut, Menu, X, HelpCircle, Calendar } from 'lucide-react';
import { auth, type User as AuthUser } from '../lib/auth';
import { apiClient } from '../lib/api-client';
import trainMICELogo from '../TrainMICE logo.png';

type HeaderProps = {
  onLoginClick: () => void;
  onSignupClick: () => void;
};

export function Header({ onLoginClick, onSignupClick }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);

  useEffect(() => {
    // Get initial session
    auth.getSession().then(({ user }) => {
      setUser(user);
      if (user) {
        fetchUserName(user.id, user);
      }
    });

    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChange((user) => {
      setUser(user);
      if (user) {
        fetchUserName(user.id, user);
      } else {
        setUserName('');
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUserName = async (_userId: string, freshUser?: any) => {
    // 1. Try the freshly returned user object first (avoids stale closure on state)
    if (freshUser?.fullName) {
      setUserName(freshUser.fullName);
      return;
    }
    // 2. Try the current auth state user
    const currentUser = auth.getUser();
    if (currentUser?.fullName) {
      setUserName(currentUser.fullName);
      return;
    }
    // 3. Fetch full profile from database as authoritative source
    try {
      const { client } = await apiClient.getClientProfile();
      const name = client?.fullName || client?.full_name || client?.name || client?.userName || '';
      if (name) setUserName(name);
    } catch {
      // silently ignore — user will just see 'USER'
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    setUser(null);
    setUserName('');
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  const trainerUrl = import.meta.env.VITE_FRONTEND_URL_TRAINER || '';

  const handleBecomeTrainer = () => {
    if (trainerUrl) {
      window.location.href = trainerUrl;
    }
  };

  return (
    <header className="bg-white/70 backdrop-blur-xl backdrop-saturate-[180%] border-b border-black/10 sticky top-0 z-50 shadow-sm">
      <div className="w-full px-6">
        <div className="flex items-center h-16 relative">
          {/* Logo - Left */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <a href="/" className="flex items-center">
              <img
                src={trainMICELogo}
                alt="TrainMICE Logo"
                className="h-10 w-auto"
              />
            </a>
            {trainerUrl && (
              <button
                onClick={handleBecomeTrainer}
                className="ml-2 px-3 py-1.5 font-display text-sm font-semibold text-gray-500 hover:text-yellow-500 rounded-xl hover:bg-yellow-50/50 transition-all active:scale-95"
              >
                Become Trainer
              </button>
            )}
          </div>

          {/* Navigation Links - Centered */}
          <nav className="hidden md:flex items-center gap-8 flex-1 justify-center h-full">
            {[
              { path: '/', label: 'Courses' },
              { path: '/public-training', label: 'Public Training' },
              { path: '/request-custom-course', label: 'Request Custom Courses' },
              { path: '/contact-us', label: 'Contact Us' },
            ].map(({ path, label }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`relative h-16 flex items-center px-1 font-display text-sm font-semibold transition-all duration-300 group ${isActive(path) ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'
                  }`}
              >
                {label}
                {/* Smooth Underline Indicator */}
                <div
                  className={`absolute bottom-0 left-0 right-0 h-1 bg-yellow-400 rounded-t-full transition-all duration-300 transform origin-center ${isActive(path) ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0 group-hover:scale-x-50 group-hover:opacity-50'
                    }`}
                />
              </button>
            ))}

            <a
              href="https://klgreens.com/elementor-2847/"
              target="_blank"
              rel="noopener noreferrer"
              className="relative h-16 flex items-center px-1 font-display text-sm font-semibold text-gray-500 hover:text-gray-900 transition-all duration-300 group"
            >
              Gallery
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-400 rounded-t-full transition-all duration-300 transform scale-x-0 opacity-0 group-hover:scale-x-50 group-hover:opacity-50 origin-center" />
            </a>
          </nav>

          {/* User Actions - Right */}
          <div className="flex items-center gap-3 flex-shrink-0 ml-auto">
            {user ? (
              <div className="flex items-center gap-3">
                {/* 1. User Profile Pill */}
                <div className="relative">
                  {/* User Profile Pill — click to open dropdown */}
                  <button
                    onClick={() => setDesktopMenuOpen(!desktopMenuOpen)}
                    className="flex items-center gap-2.5 p-1 bg-amber-400 rounded-full shadow-sm hover:shadow-md hover:bg-amber-500 transition-all cursor-pointer pr-3"
                  >
                    {/* Avatar Circle with Single Initial */}
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-white/50 text-amber-500 font-bold text-xs select-none">
                      {(userName || 'U').charAt(0).toUpperCase()}
                    </div>
                    {/* Full Username */}
                    <span className="font-sans font-semibold text-white tracking-wide text-sm select-none">
                      {userName || 'User'}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  {desktopMenuOpen && (
                    <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                      {/* Menu Items */}
                      <button
                        onClick={() => { navigate('/my-profile'); setDesktopMenuOpen(false); }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 font-sans text-sm text-gray-600 transition-colors"
                      >
                        <User className="w-4 h-4" /> My Profile
                      </button>
                      <button
                        onClick={() => { navigate('/my-bookings'); setDesktopMenuOpen(false); }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 font-sans text-sm text-gray-600 transition-colors"
                      >
                        <Calendar className="w-4 h-4" /> My Bookings
                      </button>
                      <hr className="my-1 border-gray-100" />
                      <button
                        onClick={() => { navigate('/help-center'); setDesktopMenuOpen(false); }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 font-sans text-sm text-gray-600 transition-colors"
                      >
                        <HelpCircle className="w-4 h-4" /> Help Center
                      </button>
                      <button
                        onClick={() => {
                          handleLogout();
                          setDesktopMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-red-50 flex items-center gap-3 font-sans text-sm text-red-500 font-medium transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Log Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={onLoginClick}
                  className="font-display px-5 py-2 text-sm font-semibold text-gray-700 bg-white/80 hover:bg-white rounded-xl border border-gray-200 transition-all duration-200"
                >
                  Log In
                </button>
                <button
                  onClick={onSignupClick}
                  className="font-display px-5 py-2 text-sm font-semibold text-gray-900 bg-yellow-400 hover:bg-yellow-500 rounded-xl transition-all duration-200 shadow-sm hover:shadow-yellow-100"
                >
                  Sign Up
                </button>
              </>
            )}

            {/* Mobile Menu Button - ALWAYS VISIBLE ON MOBILE */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:bg-gray-50 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col gap-1 px-4">
              {[
                { path: '/', label: 'Courses' },
                { path: '/public-training', label: 'Public Training' },
                { path: '/request-custom-course', label: 'Request Custom Courses' },
                { path: '/contact-us', label: 'Contact Us' },
              ].map(({ path, label }) => (
                <button
                  key={path}
                  onClick={() => {
                    navigate(path);
                    setMobileMenuOpen(false);
                  }}
                  className={`py-4 text-left font-display text-base font-semibold transition-all border-l-4 pl-4 ${isActive(path)
                      ? 'border-yellow-400 text-gray-900 bg-yellow-50/30'
                      : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                  {label}
                </button>
              ))}

              <a
                href="https://klgreens.com/elementor-2847/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="py-4 text-left font-display text-base font-semibold text-gray-500 hover:text-gray-900 border-l-4 border-transparent pl-4"
              >
                Gallery
              </a>

              {trainerUrl && (
                <button
                  onClick={() => {
                    handleBecomeTrainer();
                    setMobileMenuOpen(false);
                  }}
                  className="mt-4 py-4 px-6 bg-gray-900 text-white font-bold rounded-2xl shadow-xl flex items-center justify-between group"
                >
                  Become Trainer
                  <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <LogOut className="w-4 h-4 text-black rotate-180" />
                  </div>
                </button>
              )}

              {user && (
                <>
                  <hr className="my-1 border-gray-100" />
                  <button
                    onClick={() => { navigate('/my-profile'); setMobileMenuOpen(false); }}
                    className="py-4 text-left font-display text-base font-semibold text-gray-500 hover:text-gray-900 border-l-4 border-transparent hover:border-amber-400 pl-4 flex items-center gap-2 transition-all"
                  >
                    <User className="w-4 h-4" /> My Profile
                  </button>
                  <button
                    onClick={() => { navigate('/my-bookings'); setMobileMenuOpen(false); }}
                    className="py-4 text-left font-display text-base font-semibold text-gray-500 hover:text-gray-900 border-l-4 border-transparent hover:border-amber-400 pl-4 flex items-center gap-2 transition-all"
                  >
                    <Calendar className="w-4 h-4" /> My Bookings
                  </button>
                  <button
                    onClick={() => { navigate('/help-center'); setMobileMenuOpen(false); }}
                    className="py-4 text-left font-display text-base font-semibold text-gray-500 hover:text-gray-900 border-l-4 border-transparent hover:border-amber-400 pl-4 flex items-center gap-2 transition-all"
                  >
                    <HelpCircle className="w-4 h-4" /> Help Center
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="mt-2 py-4 text-left text-sm font-bold text-red-500 pl-4"
                  >
                    Log Out
                  </button>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
