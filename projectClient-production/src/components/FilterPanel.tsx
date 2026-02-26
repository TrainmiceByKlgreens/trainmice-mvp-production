import { useState } from 'react';
import { ChevronDown, ChevronUp, Filter, X } from 'lucide-react';

type FilterPanelProps = {
  filters: {
    courseType: string;
    courseMode: string;
    hrdcClaimable: string;
    category: string[];
    city: string;
    state: string;
  };
  onChange: (filters: any) => void;
  categories: string[];
  cities: string[];
  states: string[];
};

export function FilterPanel({ filters, onChange, categories, cities, states }: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const activeFilterCount = Object.entries(filters).filter(([key, v]) => {
    if (key === 'category') return (v as string[]).length > 0;
    return v !== '';
  }).length;

  const filterContent = (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Course Type</label>
        <select
          value={filters.courseType}
          onChange={(e) => onChange({ ...filters, courseType: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Types</option>
          <option value="IN_HOUSE">In-House</option>
          <option value="PUBLIC">Public</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Course Mode</label>
        <select
          value={filters.courseMode}
          onChange={(e) => onChange({ ...filters, courseMode: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Modes</option>
          <option value="PHYSICAL">Physical</option>
          <option value="ONLINE">Online</option>
          <option value="HYBRID">Hybrid</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">HRDC Claimable</label>
        <select
          value={filters.hrdcClaimable}
          onChange={(e) => onChange({ ...filters, hrdcClaimable: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
        <div className="space-y-2 max-h-48 overflow-y-auto p-2 border border-gray-300 rounded-md bg-white">
          {categories.map((cat) => (
            <label key={cat} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors">
              <input
                type="checkbox"
                checked={filters.category.includes(cat)}
                onChange={(e) => {
                  const newCategories = e.target.checked
                    ? [...filters.category, cat]
                    : filters.category.filter((c) => c !== cat);
                  onChange({ ...filters, category: newCategories });
                }}
                className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm text-gray-700">{cat}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Preferred State</label>
        <select
          value={filters.state}
          onChange={(e) => onChange({ ...filters, state: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All States</option>
          {states.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
        <select
          value={filters.city}
          onChange={(e) => onChange({ ...filters, city: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Cities</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={() =>
          onChange({
            courseType: '',
            courseMode: '',
            hrdcClaimable: '',
            category: [],
            city: '',
            state: '',
          })
        }
        className="w-full px-4 py-2 text-sm font-medium text-gray-900 bg-white rounded-md hover:bg-gray-50 border border-gray-300 transition-colors"
      >
        Clear All Filters
      </button>
    </div>
  );

  return (
    <>
      <div className="hidden lg:block bg-yellow-400 rounded-lg shadow-lg border border-yellow-300 p-6" style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(250, 204, 21, 0.3)' }}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full mb-4"
        >
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-700" /> : <ChevronDown className="w-5 h-5 text-gray-700" />}
        </button>

        {isExpanded && filterContent}
      </div>

      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-400 border border-yellow-300 rounded-lg shadow-sm hover:bg-yellow-500 transition-colors"
        >
          <Filter className="w-5 h-5 text-gray-700" />
          <span className="font-medium text-gray-900">Filters</span>
          {activeFilterCount > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-teal-600 text-white text-xs font-semibold rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 80px)' }}>
              {filterContent}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
