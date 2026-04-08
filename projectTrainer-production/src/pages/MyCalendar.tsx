import { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { CalendarFilterTabs } from '../components/calendar/CalendarFilterTabs';
import { CalendarGrid } from '../components/calendar/CalendarGrid';
import { BlockDaysPanel } from '../components/calendar/BlockDaysPanel';
import { TentativeBookingsList } from '../components/calendar/TentativeBookingsList';
import { BulkStatusUpdate } from '../components/calendar/BulkStatusUpdate';
import { DayDetailModal } from '../components/calendar/DayDetailModal';
import { DateEditModal } from '../components/calendar/DateEditModal';
import { useCalendarData } from '../hooks/useCalendarData';
import { CalendarFilter, CalendarDay } from '../types/database';
import { getCalendarGrid, buildCalendarDays, getMonthName } from '../lib/calendarUtils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function MyCalendar() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filter, setFilter] = useState<CalendarFilter>('all');
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [dayToEdit, setDayToEdit] = useState<CalendarDay | null>(null);
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [showBlockDays, setShowBlockDays] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // const startDate = new Date(year, month, 1);
  // const endDate = new Date(year, month + 1, 0);
  const startDate = useMemo(() => new Date(year, month, 1), [year, month]);
  const endDate = useMemo(() => new Date(year, month + 1, 0), [year, month]);


  const { bookings, manualBookings, availabilities, blockedWeekdays, loading, error, refetch } = useCalendarData(
    user?.id || '',
    startDate,
    endDate
  );

  const calendarDates = useMemo(() => getCalendarGrid(year, month), [year, month]);

  const calendarDays = useMemo(
    () => buildCalendarDays(calendarDates, bookings, availabilities, manualBookings, blockedWeekdays, month),
    [calendarDates, bookings, availabilities, manualBookings, blockedWeekdays, month]
  );

  const filteredDays = useMemo(() => {
    if (filter === 'all') return calendarDays;
    return calendarDays.map(day => ({
      ...day,
      isFiltered: day.status !== filter
    }));
  }, [calendarDays, filter]);

  const filterCounts = useMemo(() => {
    const counts: Record<CalendarFilter, number> = {
      all: calendarDays.length,
      booked: 0,
      blocked: 0,
      available: 0,
      not_available: 0,
      tentative: 0
    };

    calendarDays.forEach(day => {
      if (day.status === 'booked') counts.booked++;
      else if (day.status === 'blocked') counts.blocked++;
      else if (day.status === 'available') counts.available++;
      else if (day.status === 'not_available') counts.not_available++;
      else if (day.status === 'tentative') counts.tentative++;
    });

    return counts;
  }, [calendarDays]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <p className="text-gray-600">Please log in to view your calendar.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 space-y-4">
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg max-w-md">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Calendar</h3>
          <p className="text-sm text-red-700 mb-4">{error}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4 border-b border-white/5">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">My Calendar</h1>
          <p className="text-corporate-400 mt-1 text-sm font-medium">Manage your schedule and view upcoming training sessions</p>
        </div>
      </div>

      {/* Filters on top as before */}
      <div className="w-full overflow-x-auto pb-2">
        <CalendarFilterTabs
          activeFilter={filter}
          onChange={setFilter}
          counts={filterCounts}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Main Calendar Area */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="shadow-modern border border-white/5 bg-corporate-900/40 overflow-hidden">
            <CardHeader className="bg-corporate-900/50 border-b border-white/5 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <h2 className="text-xl font-bold text-white uppercase tracking-tight">
                    {getMonthName(month)} {year}
                  </h2>
                  <div className="flex items-center bg-corporate-950 border border-white/5 rounded-xl p-1 shadow-sm">
                    <button
                      onClick={() => navigateMonth('prev')}
                      className="p-1.5 hover:bg-white/5 rounded-lg text-corporate-500 hover:text-accent-gold transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="w-[1px] h-4 bg-white/5 mx-1" />
                    <button
                      onClick={() => navigateMonth('next')}
                      className="p-1.5 hover:bg-white/5 rounded-lg text-corporate-500 hover:text-accent-gold transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                  <button
                    onClick={goToToday}
                    className="px-4 py-1.5 text-[10px] font-black text-accent-gold bg-corporate-950 border border-accent-gold/20 rounded-lg hover:border-accent-gold transition-all active:scale-95 uppercase tracking-widest shadow-sm"
                  >
                    Today
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <CalendarGrid
                days={filteredDays}
                onDayClick={setSelectedDay}
              />
            </CardContent>
          </Card>
          <div className="mt-4">
            <TentativeBookingsList bookings={bookings} onUpdate={refetch} />
          </div>
        </div>

        {/* Action Sidebar on Right */}
        <div className="lg:col-span-1 space-y-4">
          {/* Bulk Update Dropdown */}
          <div className="space-y-2">
            <button
              onClick={() => setShowBulkUpdate(!showBulkUpdate)}
              className={`w-full flex items-center justify-between px-5 py-3 rounded-xl border transition-all duration-300 font-black uppercase tracking-widest text-[10px] ${showBulkUpdate
                ? 'bg-accent-gold border-accent-gold text-black shadow-gold-glow/20'
                : 'bg-corporate-900/50 border-white/5 text-corporate-400 hover:border-accent-gold/50 hover:text-white'
                }`}
            >
              Bulk Status Update
              <ChevronRight className={`w-4 h-4 transition-transform ${showBulkUpdate ? 'rotate-90' : ''}`} />
            </button>
            {showBulkUpdate && (
              <div className="animate-fade-in">
                <BulkStatusUpdate trainerId={user.id} onUpdate={refetch} />
              </div>
            )}
          </div>

          {/* Block Recurring Days Dropdown */}
          <div className="space-y-2">
            <button
              onClick={() => setShowBlockDays(!showBlockDays)}
              className={`w-full flex items-center justify-between px-5 py-3 rounded-xl border transition-all duration-300 font-black uppercase tracking-widest text-[10px] ${showBlockDays
                ? 'bg-accent-gold border-accent-gold text-black shadow-gold-glow/20'
                : 'bg-corporate-900/50 border-white/5 text-corporate-400 hover:border-accent-gold/50 hover:text-white'
                }`}
            >
              Block Recurring Days
              <ChevronRight className={`w-4 h-4 transition-transform ${showBlockDays ? 'rotate-90' : ''}`} />
            </button>
            {showBlockDays && (
              <div className="animate-fade-in">
                <BlockDaysPanel
                  trainerId={user.id}
                  blockedDays={blockedWeekdays}
                  onUpdate={refetch}
                />
              </div>
            )}
          </div>

          {/* Legend below Block Recurring Days */}
          <Card className="shadow-sm border border-white/5 bg-corporate-950 overflow-hidden">
            <CardHeader className="bg-corporate-900 border-b border-white/5 p-4">
              <h3 className="text-[10px] font-black text-accent-gold uppercase tracking-widest">Legend</h3>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {[
                  { label: 'Available', color: 'bg-emerald-100 border border-emerald-300' },
                  { label: 'Not Available', color: 'bg-gray-50 border border-corporate-200' },
                  { label: 'Blocked', color: 'bg-red-100 border border-red-300' },
                  { label: 'Tentative', color: 'bg-yellow-100 border border-yellow-300' },
                  { label: 'Booked', color: 'bg-blue-100 border border-blue-300' }
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-corporate-400">{item.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <DayDetailModal
        day={selectedDay}
        onClose={() => setSelectedDay(null)}
        onEdit={(day) => {
          setDayToEdit(day);
          setSelectedDay(null);
        }}
      />
      <DateEditModal
        day={dayToEdit}
        trainerId={user?.id || ''}
        onClose={() => setDayToEdit(null)}
        onUpdate={() => {
          refetch();
          setDayToEdit(null);
        }}
      />
    </div>
  );
}
