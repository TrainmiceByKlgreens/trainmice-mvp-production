import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { SearchBar } from '../components/SearchBar';
import { FilterPanel } from '../components/FilterPanel';
import { CourseCard } from '../components/CourseCard';
import { Course } from '../lib/api-client';
import { useCourses } from '../hooks/useCourses';
import { COURSE_CATEGORIES } from '../utils/categories';
import { CustomDropdown } from '../components/CustomDropdown';

export function CoursesDirectory() {
  // Real Data Hook
  const { courses, loading, error } = useCourses();

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    courseType: '',
    courseMode: '',
    hrdcClaimable: '',
    category: [] as string[],
    city: '',
    state: '',
    professionalDevelopmentPoints: '',
    certificateType: '',
    trainerLanguage: '',
    trainerProficiency: '',
    courseLanguage: '',
  });

  // Filter states
  const [viewLimit, setViewLimit] = useState('30');
  const [durationFilter, setDurationFilter] = useState('all');
  const [sortBy, setSortBy] = useState('latest');

  // Use standard category list instead of dynamically generating from courses
  const categories = COURSE_CATEGORIES;

  const cities = useMemo(() => {
    const citySet = new Set(courses.map((c) => c.city).filter((c): c is string => !!c));
    return Array.from(citySet).sort();
  }, [courses]);

  const states = useMemo(() => {
    const stateSet = new Set(courses.map((c) => c.state).filter((s): s is string => !!s));
    return Array.from(stateSet).sort();
  }, [courses]);

  const filteredCourses = useMemo(() => {
    let result = courses.filter((course) => {
      const matchesSearch =
        searchQuery === '' ||
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.learning_objectives?.some((obj: string) =>
          obj.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        (Array.isArray(course.category)
          ? course.category.some((cat: string) => cat.toLowerCase().includes(searchQuery.toLowerCase()))
          : course.category?.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCourseType = filters.courseType === '' || (() => {
        const types = Array.isArray(course.course_type) ? course.course_type : (course.course_type ? [course.course_type] : []);
        return types.includes(filters.courseType);
      })();

      const matchesCourseMode = filters.courseMode === '' || (() => {
        let filterMode = filters.courseMode;
        if (filterMode === 'VIRTUAL') filterMode = 'ONLINE';
        if (filterMode === 'BOTH') filterMode = 'HYBRID';
        const modes = Array.isArray(course.course_mode) ? course.course_mode : (course.course_mode ? [course.course_mode] : []);
        return modes.includes(filterMode);
      })();

      const matchesHRDC = filters.hrdcClaimable === '' || String(!!course.hrdc_claimable) === filters.hrdcClaimable;

      const matchesCategory = filters.category.length === 0 || (() => {
        const courseCategories = Array.isArray(course.category) ? course.category : (course.category ? [course.category] : []);
        return courseCategories.some((cat: string) => filters.category.includes(cat));
      })();

      const matchesCity = filters.city === '' || course.city === filters.city;
      const matchesState = filters.state === '' || course.state === filters.state;

      // New Filters
      const matchesPoints = filters.professionalDevelopmentPoints === '' ||
        course.professionalDevelopmentPoints === filters.professionalDevelopmentPoints;

      const matchesCert = filters.certificateType === '' ||
        course.certificateType === filters.certificateType;

      const matchesTrainerLanguage = filters.trainerLanguage === '' || (() => {
        const trainers = course.course_trainers || [];
        return trainers.some((ct: any) => {
          const t = ct.trainer;
          if (!t) return false;
          const rawLang = t.languagesSpoken || t.languages || '';
          let langs: any[] = [];
          if (Array.isArray(rawLang)) langs = rawLang;
          else if (typeof rawLang === 'string') {
            try { langs = JSON.parse(rawLang); } catch { langs = rawLang.split(',').map((s: string) => s.trim()); }
          }
          
          return langs.some((l: any) => {
            const langName = typeof l === 'string' ? l : l.language;
            const proficiency = typeof l === 'string' ? '' : l.proficiency;
            
            const matchesLang = String(langName).toLowerCase().includes(filters.trainerLanguage.toLowerCase());
            const matchesProf = filters.trainerProficiency === '' || String(proficiency).toLowerCase() === filters.trainerProficiency.toLowerCase();
            
            return matchesLang && matchesProf;
          });
        });
      })();

      const matchesCourseLanguage = filters.courseLanguage === '' || 
        String(course.language || course.course_language || '').toLowerCase().includes(filters.courseLanguage.toLowerCase());

      const matchesDuration = (() => {
        if (durationFilter === 'all') return true;
        let durationInDays = 0;
        if (course.duration_unit === 'days') {
          durationInDays = course.duration_hours || 0;
        } else if (course.duration_unit === 'hours') {
          durationInDays = (course.duration_hours || 0) / 8;
        }
        if (durationFilter === '1') return durationInDays <= 1;
        if (durationFilter === '2') return durationInDays > 1 && durationInDays <= 2;
        if (durationFilter === '3') return durationInDays >= 3;
        return true;
      })();

      return (
        matchesSearch &&
        matchesCourseType &&
        matchesCourseMode &&
        matchesHRDC &&
        matchesCategory &&
        matchesCity &&
        matchesState &&
        matchesDuration &&
        matchesPoints &&
        matchesCert &&
        matchesTrainerLanguage &&
        matchesCourseLanguage
      );
    });

    result.sort((a, b) => {
      if (sortBy === 'a-z') return a.title.localeCompare(b.title);
      if (sortBy === 'z-a') return b.title.localeCompare(a.title);
      if (sortBy === 'latest') return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      return 0;
    });

    if (viewLimit !== 'all') {
      result = result.slice(0, parseInt(viewLimit));
    }

    return result;
  }, [courses, searchQuery, filters, viewLimit, durationFilter, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Search Bar - Premium Glassmorphic Design - Full Width */}
      <div className="bg-white/70 backdrop-blur-xl border-b border-gray-100 sticky top-16 z-40 shadow-sm transition-all">
        <div className="w-full px-4 sm:px-6 lg:px-12 py-8">
          <div className="flex flex-col lg:flex-row items-center gap-10">
            <div className="w-full lg:max-w-xl">
              <div className="relative group">
                <SearchBar value={searchQuery} onChange={setSearchQuery} />
                <div className="absolute inset-0 bg-yellow-400/10 rounded-2xl blur-3xl opacity-0 group-focus-within:opacity-100 transition-all pointer-events-none -z-10" />
              </div>
            </div>

            <div className="flex-1 w-full flex flex-wrap items-center justify-center lg:justify-end gap-6">
              {/* Quick Filters - Redesigned to look more high-tech */}
              <div className="flex items-center gap-6 bg-white/50 p-2 rounded-[2.5rem] border border-gray-100 shadow-inner">
                <CustomDropdown
                  value={viewLimit}
                  onChange={setViewLimit}
                  options={[
                    { label: 'View 30', value: '30' },
                    { label: 'View 60', value: '60' },
                    { label: 'View 90', value: '90' },
                    { label: 'View 120', value: '120' },
                    { label: 'View All', value: 'all' },
                  ]}
                  className="min-w-[150px]"
                />
                <div className="w-px h-8 bg-gray-100" />
                <CustomDropdown
                  value={durationFilter}
                  onChange={setDurationFilter}
                  options={[
                    { label: 'All Durations', value: 'all' },
                    { label: '1 Day', value: '1' },
                    { label: '2 Days', value: '2' },
                    { label: '3+ Days', value: '3' },
                  ]}
                  className="min-w-[170px]"
                />
              </div>

              <div className="relative">
                <CustomDropdown
                  value={sortBy}
                  onChange={setSortBy}
                  options={[
                    { label: 'Latest First', value: 'latest' },
                    { label: 'Alphabetical A-Z', value: 'a-z' },
                    { label: 'Alphabetical Z-A', value: 'z-a' },
                  ]}
                  className="min-w-[190px]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-12 bg-white/30">
        <div className="flex flex-col lg:flex-row gap-12 py-8">
          {/* Sidebar - Leftmost alignment ensured by container w-full and px alignment */}
          <aside className="lg:w-80 flex-shrink-0 lg:sticky lg:top-[120px] lg:self-start lg:max-h-[calc(100vh-160px)] overflow-y-auto no-scrollbar">
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              categories={categories}
              cities={cities}
              states={states}
            />
          </aside>

          {/* Main Grid - Expanding to fill space */}
          <main className="flex-1 min-w-0">
            {loading && (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 border-4 border-yellow-400/10 rounded-full" />
                  <div className="absolute inset-0 border-4 border-t-yellow-400 rounded-full animate-spin" />
                </div>
                <p className="mt-6 font-sans text-sm font-medium text-gray-400 tracking-widest animate-pulse">Initializing directory...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-[2.5rem] p-10 text-center">
                <p className="font-display text-red-800 font-semibold mb-2">Sync Error</p>
                <p className="font-sans text-red-600 text-sm font-normal">{error}</p>
              </div>
            )}

            {!loading && !error && (
              <>
                <div className="flex items-center justify-between mb-10 px-4 lg:px-0">
                  <div className="flex flex-col">
                    <h2 className="font-display text-3xl font-bold text-gray-900 tracking-tight">Available Courses</h2>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                      <span className="font-sans text-[11px] font-medium text-gray-400 tracking-wider">
                        {filteredCourses.length} results
                      </span>
                    </div>
                  </div>
                </div>

                {filteredCourses.length === 0 ? (
                  <div className="text-center py-32 bg-white/50 backdrop-blur-sm rounded-[4rem] border border-dashed border-gray-200">
                    <div className="bg-gray-100 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                      <Search className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="font-display text-2xl font-semibold text-gray-800 mb-3">No courses found</h3>
                    <p className="font-sans text-sm text-gray-400 font-normal mb-10">Try adjusting your filters or search query.</p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setFilters({
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
                        });
                        setDurationFilter('all');
                        setSortBy('latest');
                      }}
                      className="font-sans px-10 py-4 bg-gray-900 text-white text-sm font-semibold rounded-2xl hover:bg-yellow-400 transition-all shadow-lg hover:shadow-yellow-100"
                    >
                      Reset All Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8 pb-32">
                    {filteredCourses.map((course: Course) => (
                      <CourseCard key={course.id} course={course} />
                    ))}
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
