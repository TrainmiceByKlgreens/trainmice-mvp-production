import { useState, useEffect } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { fetchTrainerCourses, fetchCourseDates } from '../../lib/analyticsService';

interface AnalyticsFiltersProps {
  trainerId: string;
  appliedCourseId: string | null;
  appliedDate: string | null;
  onFilterChange: (courseId: string | null, courseDate: string | null) => void;
}

export function AnalyticsFilters({ trainerId, appliedCourseId, appliedDate, onFilterChange }: AnalyticsFiltersProps) {
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>(appliedCourseId || '');
  const [selectedDate, setSelectedDate] = useState<string>(appliedDate || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCourses();
  }, [trainerId]);

  useEffect(() => {
    setSelectedCourse(appliedCourseId || '');
    setSelectedDate(appliedDate || '');
  }, [appliedCourseId, appliedDate]);

  useEffect(() => {
    if (selectedCourse) {
      loadDates(selectedCourse);
    } else {
      setDates([]);
      setSelectedDate('');
    }
  }, [selectedCourse]);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const coursesData = await fetchTrainerCourses(trainerId);
      setCourses(coursesData);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDates = async (courseId: string) => {
    setLoading(true);
    try {
      const datesData = await fetchCourseDates(trainerId, courseId);
      setDates(datesData);
    } catch (error) {
      console.error('Error loading dates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    onFilterChange(
      selectedCourse || null,
      selectedDate || null
    );
  };

  const handleClearFilters = () => {
    setSelectedCourse('');
    setSelectedDate('');
    setDates([]);
    onFilterChange(null, null);
  };

  const hasActiveFilters = appliedCourseId || appliedDate;

  return (
    <div className="bg-white rounded-3xl shadow-modern-lg border border-corporate-100 p-6 animate-scale-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-corporate-50 rounded-xl text-corporate-500">
          <Filter className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-corporate-900 uppercase tracking-wider">Filters</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
        <div className="md:col-span-5">
          <label className="block text-xs font-bold text-corporate-600 uppercase tracking-widest mb-2 px-1">
            Course
          </label>
          <div className="relative group">
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              disabled={loading}
              className="w-full pl-4 pr-10 py-3 bg-corporate-50 border border-corporate-100 rounded-2xl focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 text-sm font-bold text-corporate-700 appearance-none transition-all duration-300 disabled:opacity-50"
            >
              <option value="">All Courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-corporate-400">
              <Filter className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="md:col-span-4">
          <label className="block text-xs font-bold text-corporate-600 uppercase tracking-widest mb-2 px-1">
            Date Range
          </label>
          <div className="relative group">
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              disabled={!selectedCourse || loading}
              className="w-full pl-4 pr-10 py-3 bg-corporate-50 border border-corporate-100 rounded-2xl focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 text-sm font-bold text-corporate-700 appearance-none transition-all duration-300 disabled:bg-corporate-50/50 disabled:text-corporate-300"
            >
              <option value="">All Dates</option>
              {dates.map((date) => (
                <option key={date} value={date}>
                  {new Date(date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-corporate-400">
              <X className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="md:col-span-3 flex items-center gap-3">
          <Button
            onClick={handleApplyFilters}
            variant="primary"
            disabled={loading}
            className="flex-1 py-3 px-6 rounded-2xl font-bold text-sm bg-white active:scale-95 transition-transform"
          >
            Apply Filters
          </Button>
          {hasActiveFilters && (
            <Button
              onClick={handleClearFilters}
              variant="outline"
              className="p-3 rounded-2xl border-corporate-200 text-corporate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all duration-300"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-corporate-100/50">
          {appliedCourseId && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent-50 text-accent-700 border border-accent-100 rounded-xl text-[10px] font-black uppercase tracking-wider animate-scale-in">
              Program: {courses.find(c => c.id === appliedCourseId)?.title}
              <button
                onClick={() => {
                  setSelectedCourse('');
                  setSelectedDate('');
                  onFilterChange(null, null);
                }}
                className="hover:text-red-500 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {appliedDate && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-mustard-50 text-mustard-700 border border-mustard-100 rounded-xl text-[10px] font-black uppercase tracking-wider animate-scale-in">
              Cycle: {new Date(appliedDate).toLocaleDateString()}
              <button
                onClick={() => {
                  setSelectedDate('');
                  onFilterChange(appliedCourseId, null);
                }}
                className="hover:text-red-500 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
