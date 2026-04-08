import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Star,
  MapPin,
  Briefcase,
  Languages,
  BookOpen,
  ArrowLeft,
  GraduationCap,
  Building2,
  Award,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { useTrainer } from '../hooks/useTrainers';
import { useCourses } from '../hooks/useCourses';

export function TrainerProfile() {
  const { id } = useParams<{ id: string }>();
  const { trainer, loading: trainerLoading, error: trainerError } = useTrainer(id);
  const { courses } = useCourses();

  const renderStars = (rating: number | null) => {
    if (!rating) return null;
    const stars = [];
    const roundedRating = Math.round(rating);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-6 h-6 ${i <= roundedRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
        />
      );
    }
    return stars;
  };

  if (trainerLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading trainer profile...</p>
        </div>
      </div>
    );
  }

  if (trainerError || !trainer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">
            Error loading trainer: {trainerError || 'Trainer not found'}
          </p>
          <Link
            to="/"
            className="mt-4 inline-block px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  const trainerCourses = courses.filter((course) =>
    course && course.trainer_id === trainer.id
  );
  const trainerLanguageLabels = Array.isArray((trainer as any).trainerLanguages) && (trainer as any).trainerLanguages.length > 0
    ? (trainer as any).trainerLanguages
        .map((language: any) => language?.language
          ? `${language.language}${language.proficiency ? ` (${language.proficiency})` : ''}`
          : null)
        .filter(Boolean)
    : Array.isArray((trainer as any).languages_spoken)
      ? (trainer as any).languages_spoken
      : Array.isArray((trainer as any).languages)
        ? (trainer as any).languages
        : [];
  const trainerTopics = Array.isArray((trainer as any).topics) && (trainer as any).topics.length > 0
    ? (trainer as any).topics
    : Array.isArray((trainer as any).areas_of_expertise)
      ? (trainer as any).areas_of_expertise
      : [];
  const trainerInitial = trainer.custom_trainer_id?.charAt(0)?.toUpperCase() || 'T';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Overlay Style */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-teal-600 font-bold transition-all group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Directory
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-10">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 border-b border-gray-50 pb-8">
                <div className="w-36 h-36 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 p-1 flex-shrink-0 shadow-lg">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-yellow-600 text-5xl font-bold overflow-hidden">
                    {trainerInitial}
                  </div>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <span className="text-[10px] font-bold text-teal-600 uppercase tracking-[0.2em] mb-2 block">Certified Trainer</span>
                  <h1 className="text-4xl font-bold text-gray-900 mb-3">
                    Trainer {trainer.custom_trainer_id || trainer.id?.substring(0, 8) || 'Profile'}
                  </h1>
                  {trainer.rating != null && (
                    <div className="flex items-center justify-center sm:justify-start gap-3">
                      <div className="flex">{renderStars(trainer.rating)}</div>
                      <span className="text-xl font-bold text-gray-700">
                        {trainer.rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Professional Biography */}
              <div>
                <ExpandableContent title="Professional Biography">
                  <p className="text-gray-700 text-lg leading-relaxed">
                    {trainer.professional_bio || <span className="text-gray-400 italic">No details available.</span>}
                  </p>
                </ExpandableContent>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4 p-5 bg-gray-50 border border-gray-100 rounded-2xl">
                  <Languages className="w-6 h-6 text-teal-600 mt-1" />
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Languages</p>
                    <ExpandableContent title="" maxHeight={100} showTitle={false}>
                      <p className="text-base font-bold text-gray-800">
                        {trainerLanguageLabels.length > 0
                          ? trainerLanguageLabels.join(', ')
                          : 'No details'}
                      </p>
                    </ExpandableContent>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 bg-gray-50 border border-gray-100 rounded-2xl">
                  <BookOpen className="w-6 h-6 text-teal-600 mt-1" />
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Teaching Style</p>
                    <ExpandableContent title="" maxHeight={100} showTitle={false}>
                      <p className="text-base font-bold text-gray-800">
                        {trainer.teaching_style || 'No details'}
                      </p>
                    </ExpandableContent>
                  </div>
                </div>
              </div>

              {/* Areas of Expertise */}
              <div>
                <ExpandableContent title="Areas of Expertise" icon={<div className="w-1.5 h-6 bg-yellow-400 rounded-full" />}>
                  <div className="flex flex-wrap gap-3">
                    {trainerTopics.length > 0 ? (
                      trainerTopics.map((topic, idx) => (
                        <span
                          key={idx}
                          className="px-4 py-2 bg-teal-50 text-teal-700 text-sm font-bold rounded-xl border border-teal-100"
                        >
                          {topic}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 italic">No specializations listed.</span>
                    )}
                  </div>
                </ExpandableContent>
              </div>

              {/* Qualifications & Education */}
              <div>
                <ExpandableContent title="Qualifications & Education" icon={<GraduationCap className="w-6 h-6 text-teal-600" />}>
                  <div className="space-y-4">
                    {trainer.qualifications && trainer.qualifications.length > 0 ? (
                      trainer.qualifications.map((qual: any, idx: number) => (
                        <div key={qual.id || idx} className="flex items-start gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                          <Award className="w-6 h-6 text-yellow-600 mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-lg font-bold text-gray-900">
                              {qual.title || qual.qualification_name || 'Qualification'}
                            </p>
                            {(qual.institution || qual.institute_name) && (
                              <p className="text-gray-600 font-medium">
                                {qual.institution || qual.institute_name}
                              </p>
                            )}
                            {(qual.yearObtained || qual.year_awarded) && (
                              <div className="mt-2 text-xs font-bold text-teal-600 bg-teal-50 inline-block px-2 py-1 rounded-md uppercase tracking-wider">
                                Class of {qual.yearObtained || qual.year_awarded}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-5 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center">
                        <p className="text-gray-400 italic">No educational background details.</p>
                      </div>
                    )}
                  </div>
                </ExpandableContent>
              </div>

              {/* Work History */}
              <div>
                <ExpandableContent title="Work Experience" icon={<Briefcase className="w-6 h-6 text-teal-600" />}>
                  <div className="space-y-4">
                    {trainer.workHistory && trainer.workHistory.length > 0 ? (
                      trainer.workHistory.map((work: any, idx: number) => {
                        const yearFrom = work.startDate
                          ? new Date(work.startDate).getFullYear()
                          : (work.year_from || null);
                        const yearTo = work.endDate
                          ? new Date(work.endDate).getFullYear()
                          : (work.year_to || null);
                        const yearRange = yearFrom && yearTo
                          ? `${yearFrom} - ${yearTo}`
                          : yearFrom
                            ? `Since ${yearFrom}`
                            : yearTo
                              ? `Until ${yearTo}`
                              : '';

                        return (
                          <div key={work.id || idx} className="flex items-start gap-4 p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-yellow-200 transition-colors">
                            <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 flex-shrink-0 border border-gray-100">
                              <Building2 className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                                <div>
                                  <p className="text-lg font-bold text-gray-900">
                                    {work.position || 'Professional Role'}
                                  </p>
                                  <p className="text-teal-600 font-bold text-sm">
                                    {work.company || work.company_name || 'Organization'}
                                  </p>
                                </div>
                                {yearRange && (
                                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                                    {yearRange}
                                  </span>
                                )}
                              </div>
                              {work.description && (
                                <p className="text-gray-600 mt-3 text-sm leading-relaxed">
                                  {work.description}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-5 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center">
                        <p className="text-gray-400 italic">No employment history details.</p>
                      </div>
                    )}
                  </div>
                </ExpandableContent>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Past Clients */}
                <div className="md:col-span-2">
                  <ExpandableContent title="Key Clients" icon={<Award className="w-5 h-5 text-teal-600" />}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {trainer.pastClients && trainer.pastClients.length > 0 ? (
                        trainer.pastClients.map((client: any, idx: number) => (
                          <div key={client.id || idx} className="p-4 bg-teal-50 border border-teal-100 rounded-xl">
                            <p className="font-bold text-teal-800 text-sm">
                              {client.clientName || client.client_name || 'Organization'}
                            </p>
                            {client.projectDescription && (
                              <p className="text-xs text-teal-600 mt-1 opacity-80">
                                {client.projectDescription}
                              </p>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-400 italic text-sm">No client history details.</p>
                      )}
                    </div>
                  </ExpandableContent>
                </div>
              </div>

            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-3xl p-8 sticky top-6 border border-yellow-600/20 shadow-xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-2">
                <div className="w-2 h-8 bg-gray-900 rounded-full" />
                Trainer Stats
              </h2>
              <div className="space-y-8">
                {trainer.rating != null && (
                  <div>
                    <p className="text-xs font-bold text-gray-800 uppercase tracking-widest mb-2 opacity-60">Success Rating</p>
                    <div className="flex items-center gap-3">
                      <span className="text-4xl font-bold text-gray-900 leading-none">
                        {trainer.rating.toFixed(1)}
                      </span>
                      <div className="flex flex-col">
                        <div className="flex">{renderStars(trainer.rating)}</div>
                        <span className="text-[10px] font-bold text-gray-700 uppercase">Average Student Score</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-[10px] font-bold text-gray-800 uppercase tracking-widest mb-1 opacity-60">Base Location</p>
                    <p className="text-lg font-bold text-gray-900 truncate">{trainer.state || 'Global'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-800 uppercase tracking-widest mb-1 opacity-60">Number of Courses</p>
                    <p className="text-lg font-bold text-gray-900">{trainerCourses.length}</p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-4">
            <div className="w-12 h-1 bg-yellow-400 rounded-full" />
            Trainer Curriculum
            <span className="text-lg font-bold text-teal-600 bg-teal-50 px-4 py-1 rounded-full border border-teal-100">
              {trainerCourses.length} {trainerCourses.length === 1 ? 'Course' : 'Courses'}
            </span>
          </h2>
          {trainerCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trainerCourses.map((course) => (
                <Link
                  key={course.id}
                  to={`/courses/${course.id}`}
                  className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all p-6 border border-gray-100 hover:border-yellow-400 group"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-yellow-400 text-gray-900 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                      {course.category || 'Professional'}
                    </span>
                    {course.course_type && (
                      <span className="px-3 py-1 bg-teal-50 text-teal-600 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                        {course.course_type}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-teal-600 transition-colors">{course.title}</h3>
                  {course.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mb-4">{course.description}</p>
                  )}
                  <div className="pt-4 border-t border-gray-50 flex items-center justify-between text-teal-600 font-bold text-xs uppercase tracking-widest">
                    View Syllabus
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No courses assigned to this trainer yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Child component for expandable content
function ExpandableContent({
  title,
  children,
  maxHeight = 320,
  icon,
  showTitle = true
}: {
  title: string;
  children: React.ReactNode;
  maxHeight?: number;
  icon?: React.ReactNode;
  showTitle?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldShowExpand, setShouldShowExpand] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      setShouldShowExpand(contentRef.current.scrollHeight > maxHeight);
    }
  }, [children, maxHeight]);

  return (
    <div className="relative">
      {showTitle && (
        <h2 className={`text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 ${!icon ? 'pb-2 border-b-2 border-yellow-400 inline-block' : ''}`}>
          {icon}
          {title}
        </h2>
      )}

      <div
        ref={contentRef}
        className={`relative overflow-hidden transition-all duration-500 ease-in-out`}
        style={{ maxHeight: isExpanded ? `${contentRef.current?.scrollHeight}px` : `${maxHeight}px` }}
      >
        {children}

        {!isExpanded && shouldShowExpand && (
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
        )}
      </div>

      {shouldShowExpand && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 flex items-center gap-2 text-teal-600 font-bold hover:text-teal-700 transition-colors bg-teal-50 px-4 py-2 rounded-xl border border-teal-100"
        >
          {isExpanded ? (
            <>
              Read Less <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              Read More <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
