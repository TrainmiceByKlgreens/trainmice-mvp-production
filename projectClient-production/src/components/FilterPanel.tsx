import { useState } from 'react';
import { ChevronDown, ChevronRight, Filter, X, Search } from 'lucide-react';
import { CustomDropdown } from './CustomDropdown';

type FilterPanelProps = {
  filters: {
    courseType: string;
    courseMode: string;
    hrdcClaimable: string;
    category: string[];
    city: string;
    state: string;
    professionalDevelopmentPoints: string;
    certificateType: string;
    trainerLanguage: string;
    trainerProficiency: string;
    courseLanguage: string;
  };
  onChange: (filters: any) => void;
  categories: string[];
  cities: string[];
  states: string[];
};

export function FilterPanel({ filters, onChange, categories, cities, states }: FilterPanelProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [collapsedSections, setCollapsedSections] = useState({
    category: false,
    location: true,
    additional: false,
    language: false,
  });

  const activeFilterCount = Object.entries(filters).filter(([key, v]) => {
    if (key === 'category') return (v as string[]).length > 0;
    return v !== '';
  }).length;

  const toggleSection = (section: keyof typeof collapsedSections) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const filteredCategories = [...categories]
    .filter(cat => cat.toLowerCase().includes(categorySearch.toLowerCase()))
    .sort((a, b) => a.localeCompare(b));

  const filterContent = (
    <div className="space-y-6">
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Category Section - Searchable */}
      <div className="bg-white/50 backdrop-blur-sm rounded-[2rem] p-6 border border-white/20 shadow-sm">
        <button
          onClick={() => toggleSection('category')}
          className="flex items-center justify-between w-full mb-5 group"
        >
          <h4 className="font-display text-xs font-semibold text-gray-800 uppercase tracking-widest">Category</h4>
          {collapsedSections.category ? <ChevronRight className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>

        {!collapsedSections.category && (
          <div className="space-y-5">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search categories..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="w-full pl-11 pr-5 py-3.5 bg-gray-50 border-none rounded-2xl font-sans text-sm focus:ring-2 focus:ring-yellow-400/20 transition-all placeholder:text-gray-400 font-normal"
              />
            </div>
            <div className="max-h-80 overflow-y-auto no-scrollbar space-y-2 pr-1">
              {filteredCategories.map((cat) => (
                <label key={cat} className="flex items-center gap-4 p-2.5 rounded-xl hover:bg-yellow-50/50 cursor-pointer transition-colors group">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={filters.category.includes(cat)}
                      onChange={(e) => {
                        const newCategories = e.target.checked
                          ? [...filters.category, cat]
                          : filters.category.filter((c) => c !== cat);
                        onChange({ ...filters, category: newCategories });
                       }}
                      className="peer appearance-none w-6 h-6 rounded-lg border-2 border-gray-200 checked:border-yellow-400 checked:bg-yellow-400 transition-all cursor-pointer"
                    />
                    <X className="absolute w-4 h-4 text-black opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none rotate-45" />
                  </div>
                  <span className="font-sans text-sm text-gray-600 group-hover:text-gray-900 transition-colors font-medium">{cat}</span>
                </label>
              ))}
              {filteredCategories.length === 0 && (
                <p className="text-center py-10 font-sans text-[11px] text-gray-400 font-normal">No categories found</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Course Config - Type, Mode, HRDC - BIGGER BUUTONS */}
      <div className="bg-white/50 backdrop-blur-sm rounded-[2rem] p-6 border border-white/20 shadow-sm space-y-7">
        <div>
          <label className="block font-sans text-[11px] font-medium text-gray-400 uppercase tracking-widest mb-4 px-1">Course Type</label>
          <div className="grid grid-cols-2 gap-3">
            {['IN_HOUSE', 'PUBLIC'].map((type) => (
              <button
                key={type}
                onClick={() => onChange({ ...filters, courseType: filters.courseType === type ? '' : type })}
                className={`py-5 px-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all ${filters.courseType === type
                  ? 'bg-yellow-400 text-black shadow-xl shadow-yellow-200/50 scale-105'
                  : 'bg-gray-100/80 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                  }`}
              >
                {type.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block font-sans text-[11px] font-medium text-gray-400 uppercase tracking-widest mb-4 px-1">Course Mode</label>
          <div className="grid grid-cols-3 gap-3">
            {['PHYSICAL', 'ONLINE', 'HYBRID'].map((mode) => (
              <button
                key={mode}
                onClick={() => onChange({ ...filters, courseMode: filters.courseMode === mode ? '' : mode })}
                className={`py-5 px-1 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${filters.courseMode === mode
                  ? 'bg-yellow-400 text-black shadow-xl shadow-yellow-200/50 scale-105'
                  : 'bg-gray-100/80 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                  }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block font-sans text-[11px] font-medium text-gray-400 uppercase tracking-widest mb-4 px-1 text-center">HRDC Claimable</label>
          <div className="flex bg-gray-100/80 p-2.5 rounded-[1.5rem] border border-gray-200/50">
            {['', 'true', 'false'].map((val) => (
              <button
                key={val}
                onClick={() => onChange({ ...filters, hrdcClaimable: val })}
                className={`flex-1 py-4 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${filters.hrdcClaimable === val
                  ? 'bg-yellow-400 text-black shadow-lg scale-105'
                  : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                {val === '' ? 'ALL' : val === 'true' ? 'YES' : 'NO'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Professional Filters - Custom Dropdown */}
      <div className="relative z-30 bg-white/50 backdrop-blur-sm rounded-[2rem] p-6 border border-white/20 shadow-sm space-y-6">
        <button
          onClick={() => toggleSection('additional')}
          className="flex items-center justify-between w-full group"
        >
          <h4 className="font-display text-xs font-semibold text-gray-800 uppercase tracking-widest">Professional</h4>
          {collapsedSections.additional ? <ChevronRight className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>

        {!collapsedSections.additional && (
          <div className="space-y-6 pt-1">
            <CustomDropdown
              label="Dev. Points"
              value={filters.professionalDevelopmentPoints}
              onChange={(val) => onChange({ ...filters, professionalDevelopmentPoints: val })}
              options={[
                { label: 'Any Points', value: '' },
                { label: 'CPD Points', value: 'CPD' },
                { label: 'CPE Points', value: 'CPE' },
                { label: 'Others', value: 'OTHERS' },
              ]}
            />

            <CustomDropdown
              label="Certificate"
              value={filters.certificateType}
              onChange={(val) => onChange({ ...filters, certificateType: val })}
              options={[
                { label: 'Any Type', value: '' },
                { label: 'Attendance', value: 'Attendance' },
                { label: 'Completion', value: 'Completion' },
                { label: 'Professional', value: 'Professional' },
              ]}
            />
          </div>
        )}
      </div>

      {/* Location Section - Custom Dropdown */}
      <div className="relative z-20 bg-white/50 backdrop-blur-sm rounded-[2rem] p-6 border border-white/20 shadow-sm">
        <button
          onClick={() => toggleSection('location')}
          className="flex items-center justify-between w-full group"
        >
          <h4 className="font-display text-xs font-semibold text-gray-800 uppercase tracking-widest">Location</h4>
          {collapsedSections.location ? <ChevronRight className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>

        {!collapsedSections.location && (
          <div className="mt-6 space-y-6">
            <CustomDropdown
              label="State"
              value={filters.state}
              onChange={(val) => onChange({ ...filters, state: val })}
              options={[{ label: 'All States', value: '' }, ...states.map(s => ({ label: s, value: s }))]}
            />
            <CustomDropdown
              label="City"
              value={filters.city}
              onChange={(val) => onChange({ ...filters, city: val })}
              options={[{ label: 'All Cities', value: '' }, ...cities.map(c => ({ label: c, value: c }))]}
            />
          </div>
        )}
      </div>

      {/* Language Section - NEW */}
      <div className="relative z-10 bg-white/50 backdrop-blur-sm rounded-[2rem] p-6 border border-white/20 shadow-sm space-y-6">
        <button
          onClick={() => toggleSection('language')}
          className="flex items-center justify-between w-full group"
        >
          <h4 className="font-display text-xs font-semibold text-gray-800 uppercase tracking-widest">Language</h4>
          {collapsedSections.language ? <ChevronRight className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>

        {!collapsedSections.language && (
          <div className="space-y-6 pt-1">
            <CustomDropdown
              label="Trainer Language"
              value={filters.trainerLanguage}
              onChange={(val) => onChange({ ...filters, trainerLanguage: val })}
              options={[
                { label: 'Any Language', value: '' },
                { label: 'English', value: 'English' },
                { label: 'Malay', value: 'Malay' },
                { label: 'Chinese', value: 'Chinese' },
                { label: 'Tamil', value: 'Tamil' },
                { label: 'Arabic', value: 'Arabic' },
                { label: 'Japanese', value: 'Japanese' },
              ]}
            />

            <CustomDropdown
              label="Trainer Proficiency"
              value={filters.trainerProficiency}
              onChange={(val) => onChange({ ...filters, trainerProficiency: val })}
              options={[
                { label: 'Any Proficiency', value: '' },
                { label: 'Native', value: 'Native' },
                { label: 'Professional', value: 'Professional' },
                { label: 'Intermediate', value: 'Intermediate' },
                { label: 'Beginner', value: 'Beginner' },
              ]}
            />

            <CustomDropdown
              label="Course delivery"
              value={filters.courseLanguage}
              onChange={(val) => onChange({ ...filters, courseLanguage: val })}
              options={[
                { label: 'Any Language', value: '' },
                { label: 'English', value: 'English' },
                { label: 'Malay', value: 'Malay' },
                { label: 'Chinese', value: 'Chinese' },
              ]}
            />
          </div>
        )}
      </div>

      {/* Reset Button */}
      <button
        onClick={() =>
          onChange({
            courseType: '',
            courseMode: '',
            hrdcClaimable: '',
            category: [],
            city: '',
            state: '',
            professionalDevelopmentPoints: '',
            certificateType: '',
            trainerLanguage: '',
            trainerProficiency: '',
            courseLanguage: '',
          })
        }
        className="w-full py-6 font-sans text-xs font-medium text-gray-400 hover:text-red-400 uppercase tracking-widest transition-colors"
      >
        Reset All Parameters
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-full">
        <div className="flex items-center gap-4 mb-8 px-2">
          <div className="w-12 h-12 rounded-[1.5rem] bg-yellow-400 flex items-center justify-center shadow-xl shadow-yellow-100 border-2 border-yellow-300">
            <Filter className="w-6 h-6 text-black" />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold text-gray-900 leading-none mb-1.5 uppercase tracking-tighter">Filters</h3>
            <p className="font-sans text-[11px] font-medium text-gray-400 uppercase tracking-widest">
              {activeFilterCount > 0 ? `${activeFilterCount} active` : 'Refine results'}
            </p>
          </div>
        </div>
        {filterContent}
      </div>

      {/* Mobile Filter */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="flex items-center gap-3 px-8 py-4 bg-yellow-400 rounded-2xl shadow-xl shadow-yellow-100 border-2 border-yellow-300 group"
        >
          <Filter className="w-5 h-5 text-black group-hover:rotate-12 transition-transform" />
          <span className="font-bold text-black uppercase tracking-widest text-sm">Filters</span>
          {activeFilterCount > 0 && (
            <span className="ml-1 px-3 py-1 bg-black text-white text-[10px] font-bold rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-gray-900/80 backdrop-blur-xl"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 w-full max-w-sm bg-gray-50 shadow-2xl overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between p-8 border-b border-gray-100 bg-white sticky top-0 z-10 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-yellow-400 flex items-center justify-center shadow-lg">
                  <Filter className="w-6 h-6 text-black" />
                </div>
                <h3 className="font-display text-xl font-bold text-gray-900 uppercase tracking-tighter">Filters</h3>
              </div>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-3 hover:bg-gray-100 rounded-2xl transition-all hover:rotate-90"
              >
                <X className="w-6 h-6 text-gray-900" />
              </button>
            </div>
            <div className="p-8">
              {filterContent}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
