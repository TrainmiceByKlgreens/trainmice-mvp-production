import { useState, useMemo } from 'react';
import { SearchBar } from '../components/SearchBar';
import { FilterPanel } from '../components/FilterPanel';
import { CourseCard } from '../components/CourseCard';
import { useCourses } from '../hooks/useCourses';
import { COURSE_CATEGORIES } from '../utils/categories';

export function CoursesDirectory() {
  const { courses, loading, error } = useCourses();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    courseType: '',
    courseMode: '',
    hrdcClaimable: '',
    category: [] as string[],
    city: '',
    state: '',
  });

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
    return courses.filter((course) => {
      const matchesSearch =
        searchQuery === '' ||
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.learning_objectives?.some((obj: string) =>
          obj.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        (Array.isArray(course.category)
          ? course.category.some(cat => cat.toLowerCase().includes(searchQuery.toLowerCase()))
          : course.category?.toLowerCase().includes(searchQuery.toLowerCase()));

      // Handle array-based courseType filtering
      const matchesCourseType = (() => {
        if (filters.courseType === '') return true;

        // Check if courseType is an array or a single value
        const courseTypes = Array.isArray(course.course_type)
          ? course.course_type
          : course.course_type
            ? [course.course_type]
            : [];

        // Check if the filter value exists in the array
        return courseTypes.includes(filters.courseType);
      })();

      // Handle array-based courseMode filtering with legacy value mapping
      const matchesCourseMode = (() => {
        if (filters.courseMode === '') return true;

        // Map legacy filter values
        let filterMode = filters.courseMode;
        if (filterMode === 'VIRTUAL') filterMode = 'ONLINE';
        if (filterMode === 'BOTH') filterMode = 'HYBRID';

        // Check if courseMode is an array or a single value
        const courseModes = Array.isArray(course.course_mode)
          ? course.course_mode
          : course.course_mode
            ? [course.course_mode]
            : [];

        // Check if the filter value exists in the array
        return courseModes.includes(filterMode);
      })();

      const matchesHRDC =
        filters.hrdcClaimable === '' ||
        course.hrdc_claimable === (filters.hrdcClaimable === 'true');

      const matchesCategory =
        filters.category.length === 0 ||
        (() => {
          const courseCategories = Array.isArray(course.category)
            ? course.category
            : course.category
              ? [course.category]
              : [];
          return courseCategories.some(cat => filters.category.includes(cat));
        })();


      const matchesCity = filters.city === '' || course.city === filters.city;

      const matchesState = filters.state === '' || course.state === filters.state;

      return (
        matchesSearch &&
        matchesCourseType &&
        matchesCourseMode &&
        matchesHRDC &&
        matchesCategory &&
        matchesCity &&
        matchesState
      );
    });
  }, [courses, searchQuery, filters]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Bar - Centered */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-center">
          <div className="w-full max-w-2xl">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar - Yellow Theme */}
          <aside className="lg:w-80 flex-shrink-0">
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              categories={categories}
              cities={cities}
              states={states}
            />
          </aside>

          {/* Courses Grid */}
          <main className="flex-1">
            {loading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                <p className="mt-4 text-gray-600">Loading courses...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                Error loading courses: {error}
              </div>
            )}

            {!loading && !error && (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Available Courses
                    <span className="ml-3 text-lg font-normal text-gray-600">
                      [{filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'}]
                    </span>
                  </h2>
                </div>

                {filteredCourses.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
                    <p className="text-gray-600">No courses found matching your criteria.</p>
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
                        });
                      }}
                      className="mt-4 px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium rounded-lg transition-colors"
                    >
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredCourses.map((course) => (
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
