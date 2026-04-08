import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SlideDrawer } from './ui/SlideDrawer';
import { MessagesView } from './messages/MessagesView';
import { NotificationsView } from './notifications/NotificationsView';

export function MainLayout() {
  const [activeDrawer, setActiveDrawer] = useState<'messages' | 'notifications' | null>(null);

  useEffect(() => {
    const handleOpenMessages = () => setActiveDrawer('messages');
    const handleOpenNotifications = () => setActiveDrawer('notifications');

    window.addEventListener('drawer:messages', handleOpenMessages);
    window.addEventListener('drawer:notifications', handleOpenNotifications);

    return () => {
      window.removeEventListener('drawer:messages', handleOpenMessages);
      window.removeEventListener('drawer:notifications', handleOpenNotifications);
    };
  }, []);

  return (
    <div className="min-h-screen bg-corporate-50/50">
      <Sidebar />
      <Header />
      <main className="lg:ml-64 pt-16 min-h-screen">
        <div className="px-6 py-10 lg:px-12 max-w-[1600px] mx-auto animate-fade-in font-sans">
          <Outlet />
        </div>
      </main>

      {/* Communication Sidebars */}
      <SlideDrawer
        isOpen={activeDrawer === 'messages'}
        onClose={() => setActiveDrawer(null)}
        title="Message Admin"
      >
        <MessagesView />
      </SlideDrawer>

      <SlideDrawer
        isOpen={activeDrawer === 'notifications'}
        onClose={() => setActiveDrawer(null)}
        title="Notifications"
      >
        <NotificationsView />
      </SlideDrawer>
    </div>
  );
}

