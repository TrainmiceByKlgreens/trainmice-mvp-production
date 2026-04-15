import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Star,
  MapPin,
  BookOpen,
  FileText,
  CheckCircle2,
  Calendar,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  Languages,
  X,
  Users
} from 'lucide-react';
import { useCourse } from '../hooks/useCourses';
import { useTrainerByCourseId } from '../hooks/useTrainers';
import { AdvancedBookingModal } from '../components/AdvancedBookingModal';
import { InHouseCalendarBookingModal } from '../components/InHouseCalendarBookingModal';
import { EventRegistrationModal } from '../components/EventRegistrationModal';
import { LoginModal } from '../components/LoginModal';
import { SignupModal } from '../components/SignupModal';
import { BrochureModal } from '../components/BrochureModal';
import { useAvailability } from '../hooks/useAvailability';
import { auth } from '../lib/auth';
import { formatDuration } from '../utils/calendarHelpers';
import { apiClient } from '../lib/api-client';
import { generateCourseBrochure } from '../utils/brochureGenerator';

export function CourseDetail() {
  const { slug } = useParams<{ slug: string }>();
  // Extract ID from slug (it's the last part after the '---' separator)
  const id = slug?.split('---').pop();

  const { course, loading: courseLoading, error: courseError } = useCourse(id);

  // The primary trainer is now preferred from the course_trainers array
  const primaryTrainer = course?.course_trainers?.find((ct: any) => ct.role === 'PRIMARY')?.trainer;

  const { trainer: fetchedTrainer } = useTrainerByCourseId(course?.trainer_id);
  // Use primaryTrainer if available, otherwise fallback to the one fetched by trainer_id
  const activeTrainer = primaryTrainer || fetchedTrainer;

  const [isBookNowModalOpen, setIsBookNowModalOpen] = useState(false);
  const [isPublicRequestModalOpen, setIsPublicRequestModalOpen] = useState(false);
  const [isInHouseModalOpen, setIsInHouseModalOpen] = useState(false);
  const { availability } = useAvailability(activeTrainer?.id);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isBrochureModalOpen, setIsBrochureModalOpen] = useState(false);
  const [publicEvents, setPublicEvents] = useState<any[]>([]);
  const [isDownloadingBrochure, setIsDownloadingBrochure] = useState(false);
  const [isTrainersDrawerOpen, setIsTrainersDrawerOpen] = useState(false);

  const extractArray = (value: any): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.map(String).map((item) => item.trim()).filter(Boolean);
        }
      } catch {
        // Fall back to line parsing below.
      }

      return value.split('\n').map((item) => item.trim()).filter(Boolean);
    }
    return [];
  };

  const extractCommaSeparatedArray = (value: any): string[] => {
    const extracted = extractArray(value);
    if (extracted.length > 1) return extracted;
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return extracted;
  };

  const formatTrainerQualification = (qualification: any): string => {
    const parts: string[] = [];
    const title = qualification.title || qualification.qualification_name || qualification.name;
    const institution = qualification.institution || qualification.institute_name || qualification.organization;
    const year =
      qualification.yearObtained ||
      qualification.year_obtained ||
      qualification.year_awarded ||
      qualification.year;

    if (title) parts.push(title);
    if (institution) parts.push(institution);
    if (year) parts.push(String(year));

    return parts.join(' - ');
  };

  const isProfessionalQualification = (qualification: any): boolean => {
    const rawType = String(
      qualification.qualificationType ||
      qualification.qualification_type ||
      qualification.type ||
      ''
    ).toLowerCase();
    const title = String(
      qualification.title || qualification.qualification_name || qualification.name || ''
    ).toLowerCase();

    return rawType === 'professional' || title.includes('cert') || title.includes('license');
  };

  const buildTrainerBrochureProfile = (trainer: any) => {
    if (!trainer) {
      return {
        trainerName: null,
        trainerCustomId: null,
        trainerProfessionalBio: null,
        trainerEducation: [] as string[],
        trainerWorkHistory: [] as string[],
        trainerQualifications: [] as string[],
        trainerLanguages: [] as string[],
      };
    }

    const trainerName =
      trainer.full_name ||
      trainer.fullName ||
      trainer.custom_trainer_id ||
      trainer.customTrainerId ||
      null;

    const trainerCustomId = trainer.custom_trainer_id || trainer.customTrainerId || null;
    const trainerProfessionalBio =
      trainer.professionalBio ||
      trainer.bio ||
      trainer.profileSummary ||
      trainer.professional_bio ||
      null;

    const qualifications = (Array.isArray(trainer.qualifications) && trainer.qualifications.length > 0)
      ? trainer.qualifications
      : (Array.isArray(trainer.qualification) ? trainer.qualification : []);

    const trainerEducation = qualifications
      .filter((q: any) => !isProfessionalQualification(q))
      .map(formatTrainerQualification)
      .filter((item: string) => item && item.trim());

    const trainerQualifications = qualifications
      .filter((q: any) => isProfessionalQualification(q))
      .map(formatTrainerQualification)
      .filter((item: string) => item && item.trim());

    const workHistoryItems = (Array.isArray(trainer.workHistoryEntries) && trainer.workHistoryEntries.length > 0)
      ? trainer.workHistoryEntries
      : (Array.isArray(trainer.workHistory) ? trainer.workHistory : []);

    const trainerWorkHistory = workHistoryItems
      .map((w: any) => {
        const parts: string[] = [];
        const position = w.position || w.job_title || w.role;
        const company = w.company || w.company_name || w.organization;

        if (position) parts.push(position);
        if (company) parts.push(company);

        const startRaw = w.startDate || w.start_date || w.year_from;
        if (startRaw) {
          const start = String(startRaw).substring(0, 4);
          const endValue = w.endDate || w.end_date || w.year_to;
          const end = endValue ? String(endValue).substring(0, 4) : 'Present';
          parts.push(`${start} - ${end}`);
        }

        return parts.join(' | ');
      })
      .filter((item: string) => item && item.trim());

    const rawTrainerLanguages =
      trainer.trainerLanguages ||
      trainer.languagesSpoken ||
      trainer.languages_spoken ||
      trainer.languages ||
      null;

    let trainerLanguages: string[] = [];
    if (Array.isArray(rawTrainerLanguages)) {
      trainerLanguages = rawTrainerLanguages
        .map((language: any) => (typeof language === 'string' ? language : language.language || language.name || String(language)))
        .filter((language: string): language is string => Boolean(language && language.trim()));
    } else if (typeof rawTrainerLanguages === 'string') {
      trainerLanguages = extractCommaSeparatedArray(rawTrainerLanguages);
    }

    return {
      trainerName,
      trainerCustomId,
      trainerProfessionalBio,
      trainerEducation,
      trainerWorkHistory,
      trainerQualifications,
      trainerLanguages,
    };
  };

  const normalizedSchedule = Array.isArray((course as any)?.courseSchedule)
    ? (course as any).courseSchedule
    : Array.isArray((course as any)?.course_schedule)
      ? (course as any).course_schedule
      : [];

  const brochureSchedule = normalizedSchedule.map((item: any) => ({
    dayNumber: item.dayNumber ?? item.day_number ?? 1,
    startTime: item.startTime ?? item.start_time ?? '',
    endTime: item.endTime ?? item.end_time ?? '',
    moduleTitle: item.moduleTitle ?? item.module_title ?? '',
    submoduleTitle: Array.isArray(item.submoduleTitle ?? item.submodule_title)
      ? (item.submoduleTitle ?? item.submodule_title)
      : typeof (item.submoduleTitle ?? item.submodule_title) === 'string'
        ? [item.submoduleTitle ?? item.submodule_title]
        : [],
  }));
  const brochureLearningOutcomes = extractArray(course?.learning_outcomes);

  const prerequisiteItems = extractArray(course?.prerequisite);

  useEffect(() => {
    auth.getSession().then(({ user }) => {
      setIsAuthenticated(!!user);
    });

    const unsubscribe = auth.onAuthStateChange((user) => {
      setIsAuthenticated(!!user);
    });

    // Listen for modal open events
    const handleOpenLogin = () => setIsLoginModalOpen(true);
    const handleOpenSignup = () => setIsSignupModalOpen(true);

    window.addEventListener('openLogin', handleOpenLogin);
    window.addEventListener('openSignup', handleOpenSignup);

    return () => {
      unsubscribe();
      window.removeEventListener('openLogin', handleOpenLogin);
      window.removeEventListener('openSignup', handleOpenSignup);
    };
  }, []);

  // Fetch events for this course to check for Public events
  useEffect(() => {
    const fetchEvents = async () => {
      if (!course?.id) {
        setPublicEvents([]);
        return;
      }

      try {
        const eventsResponse = await apiClient.getEvents({ courseId: course.id });
        const events = eventsResponse?.events || [];

        console.log('[CourseDetail] Fetched events:', events);

        // Filter for Public events that are in the future
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const futurePublicEvents = events.filter((e: any) => {
          const eventDate = new Date(e.eventDate || e.event_date);
          eventDate.setHours(0, 0, 0, 0);

          // Check if event is Public - handle JSON array from database
          let courseTypes: string[] = [];
          if (Array.isArray(e.courseType)) {
            courseTypes = e.courseType;
          } else if (e.courseType) {
            try {
              const parsed = typeof e.courseType === 'string'
                ? JSON.parse(e.courseType)
                : e.courseType;
              courseTypes = Array.isArray(parsed) ? parsed : [];
            } catch {
              courseTypes = [];
            }
          }

          // Also check course_type field for compatibility
          if (Array.isArray(e.course_type)) {
            courseTypes = [...courseTypes, ...e.course_type];
          } else if (e.course_type) {
            try {
              const parsed = typeof e.course_type === 'string'
                ? JSON.parse(e.course_type)
                : e.course_type;
              if (Array.isArray(parsed)) {
                courseTypes = [...courseTypes, ...parsed];
              }
            } catch {
              // Ignore parse errors
            }
          }

          const allTypes = courseTypes.map((t: string) => String(t).toUpperCase());
          const isPublic = allTypes.includes('PUBLIC');

          return eventDate >= today && isPublic;
        }).sort((a: any, b: any) => {
          const dateA = new Date(a.eventDate || a.event_date).getTime();
          const dateB = new Date(b.eventDate || b.event_date).getTime();
          return dateA - dateB;
        });

        console.log('[CourseDetail] Future public events:', futurePublicEvents);
        setPublicEvents(futurePublicEvents);
      } catch (error) {
        console.error('[CourseDetail] Error fetching events:', error);
        setPublicEvents([]);
      }
    };

    fetchEvents();
  }, [course?.id]);

  const renderStars = (rating: number | null) => {
    if (!rating) return null;
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-5 h-5 ${i <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
            }`}
        />
      );
    }
    return stars;
  };

  const formatCourseType = (types: any) => {
    if (!types) return null;
    const typeArray = Array.isArray(types) ? types : [types];

    const hasInHouse = typeArray.some(t => String(t).toUpperCase() === 'IN_HOUSE');
    const hasPublic = typeArray.some(t => String(t).toUpperCase() === 'PUBLIC');

    if (hasInHouse && hasPublic) {
      return 'In-House & Public';
    }

    return typeArray.map(t => {
      const s = String(t).toUpperCase();
      if (s === 'IN_HOUSE') return 'In-House';
      if (s === 'PUBLIC') return 'Public';
      return t;
    }).join(' & ');
  };

  const formatDisplayValue = (val: string | null | undefined) => {
    if (!val) return 'N/A';
    return val
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const handlePublicBooking = () => {
    if (!isAuthenticated) {
      window.dispatchEvent(new CustomEvent('openLogin'));
      return;
    }

    if (publicEvents.length > 0) {
      setIsBookNowModalOpen(true);
    } else {
      setIsPublicRequestModalOpen(true);
    }
  };

  const handleInHouseBooking = () => {
    if (!isAuthenticated) {
      window.dispatchEvent(new CustomEvent('openLogin'));
      return;
    }
    setIsInHouseModalOpen(true);
  };

  const handleDownloadBrochure = async () => {
    if (isDownloadingBrochure) return;
    setIsDownloadingBrochure(true);
    try {
      // Extract course type as a single string
      const courseTypeRaw = (course as any).course_type;
      const courseType = Array.isArray(courseTypeRaw) && courseTypeRaw.length > 0
        ? String(courseTypeRaw[0])
        : courseTypeRaw ? String(courseTypeRaw) : 'IN_HOUSE';

      // Always resolve the full primary trainer profile for brochure content.
      const primaryCourseTrainer = course?.course_trainers?.find((ct: any) => ct.role === 'PRIMARY');
      const brochureTrainerId =
        primaryCourseTrainer?.trainer?.id ||
        primaryCourseTrainer?.trainerId ||
        activeTrainer?.id ||
        course?.trainer_id ||
        null;

      let brochureTrainer = activeTrainer;
      if (brochureTrainerId) {
        try {
          brochureTrainer = await apiClient.getTrainer(brochureTrainerId);
        } catch (trainerError) {
          console.warn('[CourseDetail] Could not load full trainer profile for brochure:', trainerError);
        }
      }

      const {
        trainerName,
        trainerCustomId,
        trainerProfessionalBio,
        trainerEducation,
        trainerWorkHistory,
        trainerQualifications,
        trainerLanguages,
      } = buildTrainerBrochureProfile(brochureTrainer);

      // Delivery Languages
      let currentDeliveryLanguages: string[] = [];
      const courseDeliveryLanguages = (course as any).delivery_languages || (course as any).deliveryLanguages;
      if (Array.isArray(courseDeliveryLanguages)) {
        currentDeliveryLanguages = courseDeliveryLanguages;
      } else if (typeof courseDeliveryLanguages === 'string') {
        currentDeliveryLanguages = [courseDeliveryLanguages];
      }

      await generateCourseBrochure({
        title: course.title,
        courseType,
        startDate: (course as any).start_date || null,
        endDate: (course as any).end_date || null,
        venue: (course as any).venue || null,
        description: course.description || null,
        learningObjectives: extractArray(course.learning_objectives),
        learningOutcomes: extractArray(course.learning_outcomes),
        targetAudience: (() => {
          const val = (course as any).target_audience || (course as any).targetAudience;
          if (Array.isArray(val)) return val.join('\n');
          return val || null;
        })(),
        methodology: (() => {
          const val = (course as any).methodology;
          if (Array.isArray(val)) return val.join('\n');
          return val || null;
        })(),
        prerequisites: prerequisiteItems,
        deliveryLanguages: currentDeliveryLanguages,
        hrdcClaimable: course.hrdc_claimable,
        schedule: brochureSchedule,
        trainerName,
        trainerCustomId,
        trainerProfessionalBio,
        trainerEducation,
        trainerWorkHistory,
        trainerQualifications,
        trainerLanguages,
      });
    } catch (err) {
      console.error('[CourseDetail] Error generating brochure:', err);
    } finally {
      setIsDownloadingBrochure(false);
    }
  };

  if (courseLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (courseError || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-red-50 rounded-lg shadow-sm border border-red-200 p-8 mb-4">
            <p className="text-red-600 font-medium mb-2">Unable to load course</p>
            <p className="text-red-500 text-sm mb-4">{courseError || 'Course not found'}</p>
            {id && (
              <p className="text-gray-600 text-xs">
                Course ID: <code className="bg-gray-100 px-2 py-1 rounded font-mono">{id}</code>
              </p>
            )}
          </div>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors"
          >
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <div className="max-w-[1400px] mx-auto flex flex-col lg:h-[calc(100vh-1px)] lg:overflow-hidden">
        <div className="flex flex-col lg:flex-row flex-1 lg:overflow-hidden h-full">
          {/* Left Side (mobile: full-width stacked, desktop: ~68%) - Scrollable Content */}
          <div className="w-full lg:w-[68%] lg:h-full lg:overflow-y-auto bg-white border-r border-gray-100 scrollbar-hide pb-24 lg:pb-0">
            {/* Reduced Height Image Header */}
            <div className="h-52 sm:h-64 lg:h-72 bg-gray-200 relative">
              {/* Overlay Back Button */}
              <div className="absolute top-4 left-4 sm:top-6 sm:left-10 z-10">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 text-white/90 hover:text-white font-bold bg-black/20 hover:bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 transition-all shadow-lg group"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  Back to Directory
                </Link>
              </div>
              {(course as any).image_url ? (
                <img
                  src={(course as any).image_url}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-teal-500 to-emerald-600 flex items-center justify-center">
                  <span className="text-white text-6xl font-bold opacity-30">{course.title.charAt(0)}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-10 sm:right-10">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-3 shadow-sm">{course.title}</h1>
                <div className="flex flex-wrap items-center gap-3">
                  {course.course_type && (
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-sm font-medium rounded-full border border-white/30">
                      {formatCourseType(course.course_type)}
                    </span>
                  )}
                  {course.hrdc_claimable && (
                    <span className="px-3 py-1 bg-green-500 text-white text-sm font-medium rounded-full shadow-lg">
                      HRDC Claimable
                    </span>
                  )}
                  {course.course_rating != null && (
                    <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">
                      <div className="flex text-xs">{renderStars(course.course_rating)}</div>
                      <span className="text-white font-bold text-sm">{course.course_rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-8 lg:p-10 space-y-10 text-left">
              {/* Introduction */}
              {course.description && (
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                  <ExpandableContent title="Course Introduction">
                    <p className="text-gray-700 leading-relaxed text-lg">{course.description}</p>
                  </ExpandableContent>
                </div>
              )}

              {/* Learning Objectives */}
              {course.learning_objectives && course.learning_objectives.length > 0 && (
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                  <ExpandableContent title="Learning Objectives" maxHeight={300}>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {course.learning_objectives.map((objective: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                          <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 text-lg">{objective}</span>
                        </li>
                      ))}
                    </ul>
                  </ExpandableContent>
                </div>
              )}

              {/* Learning Outcomes */}
              {course.learning_outcomes && course.learning_outcomes.length > 0 && (
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                  <ExpandableContent title="Learning Outcomes" maxHeight={300}>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {course.learning_outcomes.map((outcome: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-3 bg-teal-50/30 p-4 rounded-xl border border-teal-100/50">
                          <CheckCircle2 className="w-6 h-6 text-teal-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 text-lg">{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </ExpandableContent>
                </div>
              )}

              {/* Target Audience */}
              {course.target_audience && (
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                  <ExpandableContent title="Target Audience">
                    <p className="text-gray-700 text-lg bg-gray-50/50 p-6 rounded-xl border border-gray-100 font-medium">{course.target_audience}</p>
                  </ExpandableContent>
                </div>
              )}

              {/* Methodology */}
              {course.methodology && (
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                  <ExpandableContent title="Methodology">
                    <p className="text-gray-700 text-lg leading-relaxed bg-gray-50/50 p-6 rounded-xl border border-gray-100">{course.methodology}</p>
                  </ExpandableContent>
                </div>
              )}

              {/* Prerequisites */}
              {course.prerequisite && (
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                  <ExpandableContent title="Prerequisites">
                    {prerequisiteItems.length > 1 ? (
                      <ul className="space-y-3 p-6 bg-gray-50/50 rounded-xl border border-gray-100">
                        {prerequisiteItems.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-gray-700 text-lg">
                            <CheckCircle2 className="w-5 h-5 text-teal-600 mt-1 flex-shrink-0" />
                            <span className="whitespace-pre-line">{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-700 text-lg p-6 bg-gray-50/50 rounded-xl border border-gray-100 whitespace-pre-line">
                        {prerequisiteItems[0] || String(course.prerequisite)}
                      </p>
                    )}
                  </ExpandableContent>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar (mobile: hidden, desktop: ~32%) - Sticky */}
          <div className="hidden lg:flex lg:w-[32%] p-6 flex-col scrollbar-hide lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
            <div className="space-y-6">
              {/* Quick Facts Card */}
              <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl border border-yellow-600/20 p-6 shadow-xl">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-yellow-400 rounded-full" />
                  Quick Facts
                </h3>

                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-50 rounded-lg">
                      <BookOpen className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-800 uppercase tracking-wider">Duration</p>
                      <p className="text-gray-900 font-bold text-sm">
                        {course.duration_hours ? formatDuration(course.duration_hours, course.duration_unit) : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-50 rounded-lg">
                      <MapPin className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-800 uppercase tracking-wider">Assessment</p>
                      <p className="text-gray-900 font-bold text-sm">
                        {course.assessment ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-50 rounded-lg">
                      <Languages className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-800 uppercase tracking-wider">Delivery Language</p>
                      <p className="text-gray-900 font-bold text-sm">
                        {(() => {
                          const dl = (course as any).delivery_languages || (course as any).deliveryLanguages;
                          if (Array.isArray(dl)) return dl.join(', ');
                          return dl || 'English';
                        })()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-50 rounded-lg">
                      <FileText className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-800 uppercase tracking-wider">Certificate</p>
                      <p className="text-gray-900 font-bold text-sm">
                        {course.certificate ? formatDisplayValue(course.certificate) : 'Participation'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 space-y-3">
                    {course.brochure_url && (
                      <button
                        onClick={() => setIsBrochureModalOpen(true)}
                        className="w-full py-3 px-4 bg-white text-gray-900 border border-gray-200 font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm flex items-center justify-center gap-2 text-sm"
                      >
                        <FileText className="w-4 h-4" />
                        Preview Uploaded Brochure
                      </button>
                    )}

                    <button
                      onClick={handleDownloadBrochure}
                      disabled={isDownloadingBrochure}
                      className="w-full py-3 px-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 text-sm"
                    >
                      <FileText className="w-4 h-4 border-white" />
                      {isDownloadingBrochure
                        ? 'Generating...'
                        : course.brochure_url
                          ? 'Download Generated Brochure'
                          : 'Download Brochure'}
                    </button>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={handlePublicBooking}
                        className="w-full py-3 px-4 bg-gray-100 text-gray-900 border border-gray-200 font-bold rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 text-sm"
                      >
                        <Calendar className="w-3 h-3" />
                        Public Training
                      </button>

                      <button
                        onClick={handleInHouseBooking}
                        className="w-full py-3 px-4 bg-gray-100 text-gray-900 border border-gray-200 font-bold rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 text-sm"
                      >
                        <CheckCircle2 className="w-3 h-3 text-teal-600" />
                        In-House Inquiry
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trainers Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-yellow-400 rounded-full" />
                  Course Trainers
                </h3>

                <div className="flex flex-col gap-3">
                  {course.course_trainers && course.course_trainers.length > 0 ? (
                    course.course_trainers.map((ct: any, idx: number) => (
                      <div key={idx} className="bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-xl border border-yellow-600/10 p-4 hover:shadow-lg transition-all">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-bold overflow-hidden border border-yellow-200">
                            T
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-gray-900 truncate">
                              {ct.trainer?.custom_trainer_id || 'N/A'}
                            </h4>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${ct.role === 'PRIMARY' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600'
                              }`}>
                              {ct.role === 'PRIMARY' ? 'Primary Trainer' : 'Co-Trainer'}
                            </span>
                          </div>
                        </div>
                        <Link
                          to={`/trainers/${ct.trainerId}`}
                          className="w-full py-2 bg-white text-gray-900 text-xs font-bold rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center border border-gray-100 shadow-sm"
                        >
                          View Profile
                        </Link>
                      </div>
                    ))
                  ) : (
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                      <p className="text-xs text-gray-500 italic">No trainer information listed yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Swipe Trigger for Trainers */}
      <div className="lg:hidden fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={() => setIsTrainersDrawerOpen(true)}
          className="bg-white border-2 border-teal-500 px-6 py-2.5 rounded-full shadow-2xl flex items-center gap-2 text-teal-600 font-bold text-sm hover:scale-105 transition-transform"
        >
          <Users className="w-4 h-4" />
          Who are the Trainers?
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>

      {/* Mobile Trainer Drawer */}
      {isTrainersDrawerOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsTrainersDrawerOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[40px] max-h-[85vh] overflow-y-auto p-8 shadow-2xl transition-all duration-300 transform translate-y-0">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Course Trainers</h2>
              <button
                onClick={() => setIsTrainersDrawerOpen(false)}
                className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="space-y-6 pb-12">
              {course.course_trainers && course.course_trainers.length > 0 ? (
                course.course_trainers.map((ct: any, idx: number) => (
                  <div key={idx} className="bg-yellow-400 rounded-3xl p-5 flex items-center gap-5 border border-yellow-500 shadow-md">
                    <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-yellow-700 text-2xl font-bold overflow-hidden shadow-inner border-2 border-white">
                      T
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-bold text-gray-900 truncate">
                        {ct.trainer?.custom_trainer_id || 'N/A'}
                      </h4>
                      <div className={`mt-1 inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${ct.role === 'PRIMARY' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600'
                        }`}>
                        {ct.role === 'PRIMARY' ? 'Primary' : 'Co-Trainer'}
                      </div>
                      <Link
                        to={`/trainers/${ct.trainerId}`}
                        className="mt-3 block text-sm font-bold text-gray-900 hover:underline"
                      >
                        View Profile →
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 italic">No trainer information listed yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile-only Sticky Bottom Booking Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t border-gray-100 shadow-2xl">
        <div className="flex gap-2 p-3 sm:p-4">
          <button
            onClick={handlePublicBooking}
            className="flex-1 py-3 px-2 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all shadow-lg flex flex-col items-center gap-0.5 text-xs"
          >
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Public
            </div>
            <span className="text-[10px] font-medium opacity-70">
              {publicEvents.length > 0 ? `${publicEvents.length} Sessions` : 'Request'}
            </span>
          </button>
          <button
            onClick={handleInHouseBooking}
            className="flex-1 py-3 px-2 bg-yellow-400 text-gray-900 font-bold rounded-xl hover:bg-yellow-500 transition-all border-b-4 border-yellow-600 flex items-center justify-center gap-1 text-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            In-House
          </button>
          <button
            onClick={handleDownloadBrochure}
            disabled={isDownloadingBrochure}
            className="flex-1 py-3 px-2 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-all shadow-lg flex items-center justify-center gap-1 text-xs disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <FileText className="w-3.5 h-3.5" />
            {isDownloadingBrochure ? 'Loading...' : 'Brochure'}
          </button>
        </div>
      </div>

      {/* Booking Modals */}
      <EventRegistrationModal
        isOpen={isBookNowModalOpen}
        onClose={() => setIsBookNowModalOpen(false)}
        onRequestCustomDate={() => setIsPublicRequestModalOpen(true)}
        course={course}
      />

      <AdvancedBookingModal
        isOpen={isPublicRequestModalOpen}
        onClose={() => setIsPublicRequestModalOpen(false)}
        course={course}
        trainer={activeTrainer}
        availability={availability}
      />

      <InHouseCalendarBookingModal
        isOpen={isInHouseModalOpen}
        onClose={() => setIsInHouseModalOpen(false)}
        course={course}
        trainer={activeTrainer || null}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSwitchToSignup={() => {
          setIsLoginModalOpen(false);
          setIsSignupModalOpen(true);
        }}
        onLoginSuccess={() => {
          setIsLoginModalOpen(false);
          setIsAuthenticated(true);
        }}
      />

      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
        onSwitchToLogin={() => {
          setIsSignupModalOpen(false);
          setIsLoginModalOpen(true);
        }}
        onSignupSuccess={() => {
          setIsSignupModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />

      {course.brochure_url && (
        <BrochureModal
          isOpen={isBrochureModalOpen}
          onClose={() => setIsBrochureModalOpen(false)}
          brochureUrl={course.brochure_url}
          courseTitle={course.title}
          learningOutcomes={brochureLearningOutcomes}
        />
      )}
    </div>
  );
}

// Child component for expandable course content
function ExpandableContent({ title, children, maxHeight = 320 }: { title: string; children: React.ReactNode; maxHeight?: number }) {
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
      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-yellow-400 inline-block">
        {title}
      </h3>

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
          className="mt-4 flex items-center gap-2 text-teal-600 font-bold hover:text-teal-700 transition-colors"
        >
          {isExpanded ? (
            <>
              Show Less <ChevronUp className="w-4 h-4" />
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
