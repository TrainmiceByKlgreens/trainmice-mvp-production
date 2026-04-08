import React from 'react';
import { CalendarFilter } from '../../types/calendar';

interface CalendarFilterTabsProps {
  activeFilter: CalendarFilter;
  onChange: (filter: CalendarFilter) => void;
  counts: Record<CalendarFilter, number>;
}

export const CalendarFilterTabs: React.FC<CalendarFilterTabsProps> = ({ activeFilter, onChange, counts }) => {
  const filters: { label: string; value: CalendarFilter; color: string }[] = [
    { label: 'All', value: 'all', color: 'bg-teal-600 border-teal-600 text-white' },
    { label: 'Booked', value: 'booked', color: 'bg-blue-600 border-blue-600 text-white' },
    { label: 'Tentative', value: 'tentative', color: 'bg-yellow-500 border-yellow-500 text-white' },
    { label: 'Available', value: 'available', color: 'bg-green-500 border-green-500 text-white' },
    { label: 'Blocked', value: 'blocked', color: 'bg-red-500 border-red-500 text-white' },
    { label: 'Not Available', value: 'not_available', color: 'bg-gray-400 border-gray-400 text-white' }
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 py-4">
      {filters.map(filter => {
        const isActive = activeFilter === filter.value;
        const count = counts[filter.value] || 0;

        return (
          <button
            key={filter.value}
            onClick={() => onChange(filter.value)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-semibold transition-all ${
              isActive
                ? `${filter.color}`
                : 'bg-white border-gray-200 text-gray-500 hover:border-teal-500 hover:text-teal-600'
            }`}
          >
            {filter.label}
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
