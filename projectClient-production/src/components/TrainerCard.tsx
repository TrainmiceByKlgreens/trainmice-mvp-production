import { Link } from 'react-router-dom';
import { Star, MapPin, Briefcase, Languages } from 'lucide-react';
import { Trainer } from '../lib/api-client';

type TrainerCardProps = {
  trainer: Trainer;
  onCompareChange?: (trainerId: string, checked: boolean) => void;
  showCompare?: boolean;
  isSelected?: boolean;
  showAvailabilityButton?: boolean;
  onViewAvailability?: (trainer: Trainer) => void;
};

export function TrainerCard({
  trainer,
  onCompareChange,
  showCompare = false,
  isSelected = false,
  showAvailabilityButton = false,
  onViewAvailability,
}: TrainerCardProps) {
  const renderStars = (rating: number | null) => {
    if (!rating) return null;
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-4 h-4 ${
            i <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
          }`}
        />
      );
    }
    return stars;
  };

  const trainerName = trainer.full_name || trainer.custom_trainer_id || 'Trainer';
  const trainerInitial = trainerName.charAt(0).toUpperCase();
  const trainerLanguages = Array.isArray(trainer.languages_spoken)
    ? trainer.languages_spoken
    : Array.isArray(trainer.languages)
      ? trainer.languages
      : [];
  const trainerTopics = Array.isArray(trainer.topics)
    ? trainer.topics
    : Array.isArray(trainer.areas_of_expertise)
      ? trainer.areas_of_expertise
      : [];

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6 border border-gray-200 relative">
      {showCompare && onCompareChange && (
        <div className="absolute top-4 right-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onCompareChange(trainer.id, e.target.checked)}
            className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      <div className="flex items-start gap-4 mb-4">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
          {trainerInitial}
        </div>
        <div className="flex-1">
          <Link to={`/trainers/${trainer.id}`}>
            <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
              {trainerName}
            </h3>
          </Link>
          {trainer.job_title && (
            <p className="text-sm text-gray-600 mt-1">{trainer.job_title}</p>
          )}
          {trainer.rating != null && (
            <div className="flex items-center gap-1 mt-2">
              <div className="flex">{renderStars(trainer.rating)}</div>
              <span className="text-sm text-gray-600 ml-1">{trainer.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>

      {trainer.professional_bio && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-3">{trainer.professional_bio}</p>
      )}

      <div className="space-y-2 mb-4">
        {trainer.year_of_experience !== null && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Briefcase className="w-4 h-4 text-gray-500" />
            <span>{trainer.year_of_experience} years of experience</span>
          </div>
        )}

        {trainer.teaching_style && (
          <div className="flex items-start gap-2 text-sm text-gray-700">
            <span className="font-medium">Teaching Style:</span>
            <span className="flex-1">{trainer.teaching_style}</span>
          </div>
        )}

        {trainerLanguages.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Languages className="w-4 h-4 text-gray-500" />
            <span>{trainerLanguages.join(', ')}</span>
          </div>
        )}

        {trainer.location && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span>{trainer.location}</span>
          </div>
        )}
      </div>

      {trainerTopics.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {trainerTopics.slice(0, 4).map((topic, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Link
          to={`/trainers/${trainer.id}`}
          className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors text-center"
        >
          View Profile
        </Link>
        {showAvailabilityButton && onViewAvailability && (
          <button
            onClick={() => onViewAvailability(trainer)}
            className="flex-1 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
          >
            View Availability
          </button>
        )}
      </div>
    </div>
  );
}
