import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface TrainerAvailability {
  trainer_id: string;
  trainer_name: string;
  dates: {
    [date: string]: 'available' | 'booked' | 'pending' | 'blocked';
  };
}

export const TrainerAvailabilityCalendar: React.FC = () => {
  const [trainers, setTrainers] = useState<TrainerAvailability[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAvailability();
  }, [currentMonth]);

  const fetchAvailability = async () => {
    try {
      setLoading(true);

      const { data: trainersData } = await supabase
        .from('trainers')
        .select('id, full_name')
        .order('full_name');

      if (!trainersData) return;

      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const startDate = startOfMonth.toISOString().split('T')[0];
      const endDate = endOfMonth.toISOString().split('T')[0];

      const { data: bookingsData } = await supabase
        .from('trainer_bookings')
        .select('trainer_id, booking_date, status')
        .gte('booking_date', startDate)
        .lte('booking_date', endDate);

      const { data: blockedDates } = await supabase
        .from('blocked_dates')
        .select('trainer_id, date')
        .gte('date', startDate)
        .lte('date', endDate);

      const availability: TrainerAvailability[] = trainersData.map(trainer => {
        const dates: { [date: string]: 'available' | 'booked' | 'pending' | 'blocked' } = {};

        const trainerBookings = bookingsData?.filter(b => b.trainer_id === trainer.id) || [];
        const trainerBlocked = blockedDates?.filter(b => b.trainer_id === trainer.id) || [];

        for (let d = new Date(startOfMonth); d <= endOfMonth; d.setDate(d.getDate() + 1)) {
          const dateStr = new Date(d).toISOString().split('T')[0];

          const isBlocked = trainerBlocked.some(b => b.date === dateStr);
          const booking = trainerBookings.find(b => b.booking_date === dateStr);

          if (isBlocked) {
            dates[dateStr] = 'blocked';
          } else if (booking) {
            if (booking.status === 'confirmed') {
              dates[dateStr] = 'booked';
            } else if (booking.status === 'pending') {
              dates[dateStr] = 'pending';
            }
          } else {
            dates[dateStr] = 'available';
          }
        }

        return {
          trainer_id: trainer.id,
          trainer_name: trainer.full_name,
          dates,
        };
      });

      setTrainers(availability);
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: Date[] = [];
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    return days;
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const getStatusColor = (status: 'available' | 'booked' | 'pending' | 'blocked') => {
    switch (status) {
      case 'available':
        return 'bg-green-100 border-green-300 hover:bg-green-200';
      case 'booked':
        return 'bg-red-100 border-red-300';
      case 'pending':
        return 'bg-yellow-100 border-yellow-300';
      case 'blocked':
        return 'bg-gray-200 border-gray-400';
      default:
        return 'bg-white';
    }
  };

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const days = getDaysInMonth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <CalendarIcon className="text-teal-600" size={24} />
          <h2 className="text-2xl font-bold text-gray-800">Trainer Availability</h2>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="font-semibold text-lg text-gray-700 min-w-[200px] text-center">
            {monthName}
          </span>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
          <span>Booked</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
          <span>Pending</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-200 border border-gray-400 rounded"></div>
          <span>Blocked</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b-2 border-gray-200 sticky left-0 bg-gray-50 min-w-[200px]">
                Trainer
              </th>
              {days.map((day) => (
                <th
                  key={day.toISOString()}
                  className="px-2 py-3 text-center font-semibold text-gray-700 border-b-2 border-gray-200 min-w-[40px]"
                >
                  <div className="text-xs text-gray-500">
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="font-bold">{day.getDate()}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trainers.map((trainer) => (
              <tr key={trainer.trainer_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800 border-b border-gray-200 sticky left-0 bg-white">
                  {trainer.trainer_name}
                </td>
                {days.map((day) => {
                  const dateStr = day.toISOString().split('T')[0];
                  const status = trainer.dates[dateStr] || 'available';
                  return (
                    <td key={dateStr} className="px-1 py-2 border-b border-gray-200">
                      <div
                        className={`w-8 h-8 rounded border ${getStatusColor(status)} mx-auto cursor-pointer transition-colors`}
                        title={`${trainer.trainer_name} - ${dateStr} - ${status}`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {trainers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No trainers found. Add trainers to view their availability.
        </div>
      )}
    </div>
  );
};
