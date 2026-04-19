import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Star, MapPin, Briefcase, Languages, BookOpen, ArrowLeft } from 'lucide-react';
import { Trainer } from '../lib/api-client';
import { apiClient } from '../lib/api-client';

export function CompareTrainers() {
  const [searchParams] = useSearchParams();
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const trainerIds = searchParams.get('ids')?.split(',') || [];
    if (trainerIds.length > 0) {
      fetchTrainers(trainerIds);
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  const fetchTrainers = async (ids: string[]) => {
    try {
      setLoading(true);
      const trainersData = await Promise.all(
        ids.map(id => apiClient.getTrainer(id).catch(() => null))
      );
      setTrainers(trainersData.filter((t): t is Trainer => t !== null));
    } catch (error) {
      console.error('Error fetching trainers:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return null;
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-5 h-5 ${
            i <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
          }`}
        />
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading trainers...</p>
        </div>
      </div>
    );
  }

  if (trainers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No trainers selected for comparison.</p>
          <Link
            to="/"
            className="inline-block px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Courses
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Compare Trainers</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div
          className={`grid grid-cols-1 ${
            trainers.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'
          } gap-6`}
        >
          {trainers.map((trainer) => {
            const trainerName = trainer.full_name || trainer.custom_trainer_id || 'Trainer';
            const trainerInitial = trainerName.charAt(0).toUpperCase();
            const trainerLanguages = Array.isArray((trainer as any).languages_spoken)
              ? (trainer as any).languages_spoken
              : Array.isArray(trainer.languages)
                ? trainer.languages
                : [];
            const trainerTopics = Array.isArray(trainer.topics)
              ? trainer.topics
              : Array.isArray((trainer as any).areas_of_expertise)
                ? (trainer as any).areas_of_expertise
                : [];

            return (
              <div
                key={trainer.id}
                className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
              >
                <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-6 text-center">
                  <div className="w-24 h-24 mx-auto rounded-full bg-white flex items-center justify-center text-blue-600 text-3xl font-bold mb-3 overflow-hidden">
                    {trainer.profile_pic ? (
                      <img
                        src={trainer.profile_pic}
                        alt={trainerName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      trainerInitial
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white">{trainerName}</h3>
                  {trainer.job_title && (
                    <p className="text-blue-100 text-sm mt-1">{trainer.job_title}</p>
                  )}
                </div>

                <div className="p-6 space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-600 uppercase mb-2">Rating</h4>
                    {trainer.rating != null ? (
                      <div className="flex items-center gap-2">
                        <div className="flex">{renderStars(trainer.rating)}</div>
                        <span className="text-lg font-semibold text-gray-900">
                          {trainer.rating.toFixed(1)}
                        </span>
                      </div>
                    ) : (
                      <p className="text-gray-500">No rating yet</p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-600 uppercase mb-2 flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      Experience
                    </h4>
                    {trainer.year_of_experience !== null ? (
                      <p className="text-lg font-semibold text-gray-900">
                        {trainer.year_of_experience} years
                      </p>
                    ) : (
                      <p className="text-gray-500">Not specified</p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-600 uppercase mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Location
                    </h4>
                    {trainer.location ? (
                      <p className="text-gray-900">{trainer.location}</p>
                    ) : (
                      <p className="text-gray-500">Not specified</p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-600 uppercase mb-2 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Teaching Style
                    </h4>
                    {trainer.teaching_style ? (
                      <p className="text-gray-900 text-sm">{trainer.teaching_style}</p>
                    ) : (
                      <p className="text-gray-500">Not specified</p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-600 uppercase mb-2 flex items-center gap-2">
                      <Languages className="w-4 h-4" />
                      Languages
                    </h4>
                    {trainerLanguages.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {trainerLanguages.map((lang, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                          >
                            {lang}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">Not specified</p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-600 uppercase mb-2">
                      Courses Covered
                    </h4>
                    {trainer.courses && trainer.courses.length > 0 ? (
                      <p className="text-lg font-semibold text-gray-900">
                        {trainer.courses.length} courses
                      </p>
                    ) : (
                      <p className="text-gray-500">No courses assigned</p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-600 uppercase mb-2">
                      Topics Specialized
                    </h4>
                    {trainerTopics.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {trainerTopics.map((topic, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">Not specified</p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-600 uppercase mb-2">Biography</h4>
                    {trainer.professional_bio ? (
                      <p className="text-sm text-gray-700 line-clamp-4">
                        {trainer.professional_bio}
                      </p>
                    ) : (
                      <p className="text-gray-500">Not specified</p>
                    )}
                  </div>

                  <Link
                    to={`/trainers/${trainer.id}`}
                    className="block w-full px-4 py-2 bg-teal-600 text-white text-center font-medium rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    View Full Profile
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
