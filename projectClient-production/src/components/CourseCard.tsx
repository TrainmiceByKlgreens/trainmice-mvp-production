import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, Star } from 'lucide-react';
import { Course } from '../lib/api-client';
import { getCategoryColor } from '../utils/categoryColors';

type CourseCardProps = {
  course: Course;
};

export function CourseCard({ course }: CourseCardProps) {
  const navigate = useNavigate();
  const firstCategory = Array.isArray(course.category)
    ? course.category[0]
    : (course.category as string | undefined);
  const categoryColors = getCategoryColor(firstCategory || null);

  const renderStars = (rating: number | null) => {
    if (!rating) return null;
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-4 h-4 ${i <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
        />
      );
    }
    return stars;
  };

  // Parse duration to get days
  const durationDays = course.duration_unit === 'days'
    ? course.duration_hours
    : course.duration_unit === 'half_day'
      ? Math.ceil((course.duration_hours || 0) * 0.5)
      : Math.ceil((course.duration_hours || 0) / 8);

  return (
    <div
      onClick={() => navigate(`/courses/${course.id}`)}
      className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border-2 border-yellow-400 hover:border-teal-500 cursor-pointer group"
    >
      {/* Pastel colored image placeholder based on category */}
      <div className={`w-full h-48 ${categoryColors.bg} ${categoryColors.border} border-b-2`}>
      </div>

      <div className="p-5">
        {/* Course Title */}
        <h3 className="text-lg font-bold text-gray-900 mb-4 line-clamp-2 group-hover:text-teal-600 transition-colors">
          {course.title}
        </h3>

        {/* Details: Duration, HRDC, Rating - Horizontal Layout */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          {/* Duration */}
          <div className="flex items-center gap-2 text-gray-700">
            <Clock className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium">{durationDays} {durationDays === 1 ? 'day' : 'days'}</span>
          </div>

          {/* HRDC Accreditation */}
          {course.hrdc_claimable && (
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium">HRDC Accredited</span>
            </div>
          )}

          {/* Rating */}
          {course.course_rating != null && (
            <div className="flex items-center gap-2">
              <div className="flex">{renderStars(course.course_rating)}</div>
              <span className="text-sm font-medium text-gray-700">
                {course.course_rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* View Details Link */}
        <div className="pt-3 border-t border-gray-100">
          <span className="text-teal-600 text-sm font-medium group-hover:text-teal-700 transition-colors">
            View Details &gt;
          </span>
        </div>
      </div>
    </div>
  );
}
