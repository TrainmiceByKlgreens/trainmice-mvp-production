import React, { useState, useMemo } from 'react';
import { useCalendarData } from '../../hooks/useCalendarData';
import { CalendarGrid } from '../calendar/CalendarGrid';
import { CalendarFilterTabs } from '../calendar/CalendarFilterTabs';
import { BlockDaysPanel } from '../calendar/BlockDaysPanel';
import { BulkStatusUpdate } from '../calendar/BulkStatusUpdate';
import { DayDetailModal } from '../calendar/DayDetailModal';
import { DateEditModal } from '../calendar/DateEditModal';
import { TentativeBookingsList } from '../calendar/TentativeBookingsList';
import { CalendarDay, CalendarFilter } from '../../types/calendar';
import { buildCalendarDays, getCalendarGrid, getMonthName } from '../../lib/calendarUtils';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Button } from '../common/Button';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';

interface TrainerCalendarViewProps {
  trainerId: string;
  trainerName: string;
  onClose: () => void;
}

export const TrainerCalendarView: React.FC<TrainerCalendarViewProps> = ({ trainerId }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filter, setFilter] = useState<CalendarFilter>('all');
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [editingDay, setEditingDay] = useState<CalendarDay | null>(null);

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  // Extend range to cover the grid
  const startDate = new Date(startOfMonth);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  const endDate = new Date(endOfMonth);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

  const {
    bookings,
    manualBookings,
    availabilities,
    blockedWeekdays,
    loading,
    refetch
  } = useCalendarData(trainerId, startDate, endDate);

  const calendarDays = useMemo(() => {
    const grid = getCalendarGrid(currentDate.getFullYear(), currentDate.getMonth());
    return buildCalendarDays(
      grid,
      bookings,
      availabilities,
      manualBookings,
      blockedWeekdays,
      currentDate.getMonth()
    );
  }, [currentDate, bookings, availabilities, manualBookings, blockedWeekdays]);

  const filteredDays = useMemo(() => {
    if (filter === 'all') return calendarDays;
    return calendarDays.map(day => {
      if (day.status === filter) return day;
      // Fading out non-matching days using lower opacity
      return { ...day, isCurrentMonth: false }; 
    });
  }, [calendarDays, filter]);

  const counts = useMemo(() => {
    const counts: Record<CalendarFilter, number> = {
      all: calendarDays.filter(d => d.isCurrentMonth).length,
      booked: calendarDays.filter(d => d.isCurrentMonth && d.status === 'booked').length,
      tentative: calendarDays.filter(d => d.isCurrentMonth && d.status === 'tentative').length,
      available: calendarDays.filter(d => d.isCurrentMonth && d.status === 'available').length,
      blocked: calendarDays.filter(d => d.isCurrentMonth && d.status === 'blocked').length,
      not_available: calendarDays.filter(d => d.isCurrentMonth && d.status === 'not_available').length
    };
    return counts;
  }, [calendarDays]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  if (!trainerId) return null;

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200">
            <button onClick={handlePrevMonth} className="p-1.5 hover:bg-white rounded transition-all shadow-sm">
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <div className="px-5 text-sm font-bold text-gray-700 min-w-[120px] text-center">
              {getMonthName(currentDate.getMonth())} {currentDate.getFullYear()}
            </div>
            <button onClick={handleNextMonth} className="p-1.5 hover:bg-white rounded transition-all shadow-sm">
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          <Button onClick={handleToday} variant="secondary" size="sm">Today</Button>
        </div>

        <CalendarFilterTabs activeFilter={filter} onChange={setFilter} counts={counts} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content (3/4) */}
        <div className="lg:col-span-3 space-y-6">
          {loading ? (
            <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200 border-dashed">
              <LoadingSpinner size="md" />
            </div>
          ) : (
            <>
              <CalendarGrid days={filteredDays} onDayClick={(day) => setSelectedDay(day)} />
              <TentativeBookingsList bookings={bookings} onBookingClick={(booking) => {
                const day = calendarDays.find(d => d.dateString === (booking.requested_date || '').split('T')[0]);
                if (day) setSelectedDay(day);
              }} />
            </>
          )}
        </div>

        {/* Right Sidebar (1/4) */}
        <div className="space-y-6">
          <BulkStatusUpdate trainerId={trainerId} onUpdate={refetch} />
          <BlockDaysPanel trainerId={trainerId} blockedDays={blockedWeekdays} onUpdate={refetch} />
          
          {/* Legend Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4 shadow-sm">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Info className="w-3.5 h-3.5" /> Legend
            </h4>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
              {[
                { color: 'bg-green-500', label: 'Available' },
                { color: 'bg-blue-600', label: 'Booked' },
                { color: 'bg-yellow-500', label: 'Tentative' },
                { color: 'bg-red-500', label: 'Blocked' },
                { color: 'bg-gray-400', label: 'Not Available' }
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${item.color}`}></div>
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <DayDetailModal
        day={selectedDay}
        onClose={() => setSelectedDay(null)}
        onEdit={(day) => {
          setSelectedDay(null);
          setEditingDay(day);
        }}
      />

      <DateEditModal
        day={editingDay}
        trainerId={trainerId}
        onClose={() => setEditingDay(null)}
        onUpdate={refetch}
      />
    </div>
  );
};
