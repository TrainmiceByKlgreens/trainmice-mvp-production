import { CalendarFilter } from '../../types/database';

interface CalendarFilterTabsProps {
  activeFilter: CalendarFilter;
  onChange: (filter: CalendarFilter) => void;
  counts: Record<CalendarFilter, number>;
}

const FILTER_LABELS: Record<CalendarFilter, string> = {
  all: 'All',
  booked: 'Booked',
  blocked: 'Blocked',
  available: 'Available',
  not_available: 'Not Available',
  tentative: 'Tentative'
};

export function CalendarFilterTabs({ activeFilter, onChange, counts }: CalendarFilterTabsProps) {
  const filters: CalendarFilter[] = ['all', 'booked', 'blocked', 'available', 'not_available', 'tentative'];

  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide">
      {filters.map((filter) => {
        const isActive = activeFilter === filter;
        const count = counts[filter];

        return (
          <button
            key={filter}
            onClick={() => onChange(filter)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 border-2 ${isActive
                ? 'bg-black border-black text-accent-gold shadow-lg scale-105'
                : 'bg-white border-corporate-100 text-corporate-400 hover:border-black hover:text-black hover:bg-gray-50'
              }`}
          >
            <span>{FILTER_LABELS[filter]}</span>
            {count > 0 && (
              <span
                className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[9px] font-black transition-colors ${isActive ? 'bg-accent-gold text-black' : 'bg-gray-100 text-corporate-500'
                  }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
