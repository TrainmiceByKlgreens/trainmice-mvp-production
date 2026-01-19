import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './pages/LoginPage';
import { AdminSignUpPage } from './pages/AdminSignUpPage';
import { EnhancedDashboardPage } from './pages/EnhancedDashboardPage';
import { MessagesPage } from './pages/MessagesPage';
import { EnhancedTrainersPage } from './pages/EnhancedTrainersPage';
import { EnhancedCoursesPage } from './pages/EnhancedCoursesPage';
import { EventsPage } from './pages/EventsPage';
import { CustomRequestsPage } from './pages/CustomRequestsPage';
import { BookingsPage } from './pages/BookingsPage';
import { FeedbackAnalyticsPage } from './pages/FeedbackAnalyticsPage';
import { AdminLogsPage } from './pages/AdminLogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { Sidebar } from './components/common/Sidebar';
import { NotificationBell } from './components/common/NotificationBell';
import { ToastContainer } from './components/common/Toast';
import { LoadingSpinner } from './components/common/LoadingSpinner';

function App() {
  const { user, loading, signOut } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [route, setRoute] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setRoute(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    if (route === '/admin-signup') {
      return <AdminSignUpPage />;
    }
    return <LoginPage />;
  }

  const handleLogout = async () => {
    await signOut();
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <EnhancedDashboardPage onNavigate={setCurrentPage} />;
      case 'messages':
        return <MessagesPage />;
      case 'trainers':
        return <EnhancedTrainersPage />;
      case 'courses':
        return <EnhancedCoursesPage />;
      case 'events':
        return <EventsPage />;
      case 'custom-requests':
        return <CustomRequestsPage />;
      case 'bookings':
        return <BookingsPage />;
      case 'feedback-analytics':
        return <FeedbackAnalyticsPage />;
      case 'admin-logs':
        return <AdminLogsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <EnhancedDashboardPage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
      />
      <div className="ml-64">
        <header className="bg-white shadow-sm px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-xl font-semibold text-gray-800 capitalize">
            {currentPage.replace('-', ' ')}
          </h2>
          <NotificationBell />
        </header>
        <main className="p-8">
          {renderPage()}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}

export default App;
