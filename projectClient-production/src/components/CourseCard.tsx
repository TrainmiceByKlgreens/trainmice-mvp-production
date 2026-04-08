import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, Star, ChevronRight } from 'lucide-react';
import { Course } from '../lib/api-client';
import { getCategoryColor } from '../utils/categoryColors';

type CourseCardProps = {
  course: Course;
  onClick?: () => void;
};

export function CourseCard({ course, onClick }: CourseCardProps) {
  const navigate = useNavigate();
  const courseCategories = Array.isArray(course.category)
    ? (course.category as string[])
    : course.category
      ? [course.category as string]
      : [];

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      const slug = `${course.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}---${course.id}`;
      navigate(`/courses/${slug}`);
    }
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return null;
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'
            }`}
        />
      );
    }
    return stars;
  };

  const durationDays = course.duration_unit === 'days'
    ? course.duration_hours
    : course.duration_unit === 'half_day'
      ? Math.ceil((course.duration_hours || 0) * 0.5)
      : Math.ceil((course.duration_hours || 0) / 8);

  return (
    <div
      onClick={handleClick}
      className="group relative bg-white rounded-[2.5rem] p-6 transition-all duration-500 hover:-translate-y-2 cursor-pointer flex flex-col h-full shadow-[0_10px_40px_-15px_rgba(0,0,0,0.08)] hover:shadow-[0_25px_60px_-20px_rgba(0,0,0,0.12)] border-2 border-transparent hover:border-yellow-400 overflow-hidden"
    >
      {/* Visual Accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-gray-50/50 opacity-50 pointer-events-none" />

      {/* Image Container */}
      <div className="relative h-64 rounded-[2rem] overflow-hidden mb-6 bg-gray-100 shadow-inner">
        {(course as any).image_url ? (
          <img
            src={(course as any).image_url}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Inter — small meta label */}
            <span className="text-gray-300 font-sans font-medium tracking-widest text-[10px] uppercase">No Preview</span>
          </div>
        )}

        {/* Floating Category Badge */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          {courseCategories.map((cat, idx) => (
            /* Inter — small badge/tag */
            <span key={idx} className={`font-sans px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider backdrop-blur-xl bg-white/90 border border-white/40 shadow-sm ${getCategoryColor(cat).text}`}>
              {cat}
            </span>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="relative z-10 flex flex-col flex-1">
        {/* Info Row: Duration & HRDC */}
        <div className="flex items-center flex-wrap gap-3 mb-3">
          <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
            <Clock className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
            {/* Inter — meta info */}
            <span className="font-sans text-[11px] font-medium text-gray-600">
              {durationDays} {durationDays === 1 ? 'day' : 'days'}
            </span>
          </div>

          {course.hrdc_claimable && (
            <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
              <CheckCircle2 className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
              {/* Inter — meta info */}
              <span className="font-sans text-[11px] font-medium text-gray-600">HRDC Claimable</span>
            </div>
          )}
        </div>

        {/* Rating Row */}
        <div className="mb-4 flex items-center gap-2">
          <div className="flex gap-0.5">{renderStars(course.course_rating)}</div>
          {course.course_rating != null && (
            /* Inter — numeric rating */
            <span className="font-sans text-[11px] font-medium text-gray-400">{course.course_rating.toFixed(1)}</span>
          )}
        </div>

        {/* Plus Jakarta Sans — course title is a heading */}
        <h3 className="font-display text-[1.15rem] font-semibold text-gray-900 leading-snug mb-6 line-clamp-2 transition-colors duration-300 group-hover:text-yellow-600">
          {course.title}
        </h3>

        {/* Footer Arrow */}
        <div className="mt-auto flex items-center justify-end">
          <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center transition-all duration-300 group-hover:bg-yellow-400 group-hover:shadow-lg group-hover:shadow-yellow-200">
            <ChevronRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </div>
  );
}
