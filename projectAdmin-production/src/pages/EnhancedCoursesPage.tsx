import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Textarea } from '../components/common/Textarea';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { CourseForm } from '../components/courses/CourseForm';
import { EventCreationForm } from '../components/courses/EventCreationForm';
import { apiClient } from '../lib/api-client';
import { Course } from '../types';
import { formatDate, formatCurrency } from '../utils/helpers';
import { Plus, Edit, Trash2, Calendar, MapPin, CheckCircle, XCircle, File, Clock, Star, X, Download, Send, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { showToast } from '../components/common/Toast';
import { generateCourseBrochure } from '../utils/brochureGenerator';
import { COURSE_CATEGORIES } from '../utils/categories';

interface CourseMaterial {
  id: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

interface CourseReview {
  id: string;
  rating: number;
  comment: string | null;
  clientName: string;
  createdAt: string;
}

interface ScheduleItem {
  dayNumber: number;
  startTime: string;
  endTime: string;
  moduleTitle: string;
  submoduleTitle: string | null;
  durationMinutes: number;
}

export const EnhancedCoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'list' | 'create' | 'edit' | 'create-event'>('list');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showMaterialsModal, setShowMaterialsModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [eventCreationCourse, setEventCreationCourse] = useState<Course | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [reviews, setReviews] = useState<CourseReview[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [rejectionReason, setRejectionReason] = useState('');

  // Brochure preview & edit (does NOT write back to DB)
  const [showBrochureModal, setShowBrochureModal] = useState(false);
  const [brochureData, setBrochureData] = useState<any | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isPendingApprovalExpanded, setIsPendingApprovalExpanded] = useState(false);
  // Use standard category list
  const categories = COURSE_CATEGORIES;

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [courses, searchTerm, selectedCategory, selectedStatus]);

  const fetchData = async () => {
    try {
      const coursesResponse = await apiClient.getAdminCourses();

      const coursesData = coursesResponse.courses || [];

      const mappedCourses: Course[] = coursesData.map((c: any) => ({
        id: c.id,
        title: c.title || '',
        description: c.description || null,
        trainer_id: c.trainerId || null,
        created_by_admin: c.createdByAdmin || false,
        venue: c.venue || null,
        price: c.price ? parseFloat(c.price) : null,
        duration_hours: c.durationHours ? parseFloat(c.durationHours) : null,
        duration_unit: c.durationUnit || 'hours',
        start_date: c.startDate || null,
        end_date: c.endDate || null,
        hrdc_claimable: c.hrdcClaimable || false,
        brochure_url: c.brochureUrl || null,
        status: (c.status || 'DRAFT') as 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'DENIED',
        created_at: c.createdAt || new Date().toISOString(),
        updated_at: c.updatedAt || new Date().toISOString(),
        category: c.category || null,
        event_date: c.startDate || null,
        // Include courseType and courseMode as arrays (handle both array and string formats)
        courseType: Array.isArray(c.courseType) ? c.courseType : (c.courseType ? [c.courseType] : []),
        courseMode: Array.isArray(c.courseMode) ? c.courseMode : (c.courseMode ? [c.courseMode] : []),
        course_type: Array.isArray(c.courseType) ? c.courseType : (c.courseType ? [c.courseType] : []), // For compatibility
        course_mode: Array.isArray(c.courseMode) ? c.courseMode : (c.courseMode ? [c.courseMode] : []), // For compatibility
        certificate: c.certificate || null,
        professionalDevelopmentPoints: c.professionalDevelopmentPoints || null,
        professionalDevelopmentPointsOther: c.professionalDevelopmentPointsOther || null,
      }));

      setCourses(mappedCourses);
      // Categories are now from standard list, no need to set from courses
    } catch (error: any) {
      console.error('Error fetching data:', error);
      showToast(error.message || 'Error fetching courses', 'error');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...courses];

    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (Array.isArray(course.category) && (course.category as string[]).some((cat: string) => cat.toLowerCase().includes(searchTerm.toLowerCase()))) ||
        (typeof course.category === 'string' && (course.category as string).toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(course => {
        const categories = course.category;
        if (Array.isArray(categories)) {
          return (categories as string[]).includes(selectedCategory);
        }
        return (course as any).category === selectedCategory;
      });
    }

    if (selectedStatus !== 'all') {
      if (selectedStatus === 'WITHOUT_TRAINER') {
        filtered = filtered.filter(course => !course.trainer_id);
      } else {
        filtered = filtered.filter(course => course.status === selectedStatus);
      }
    }

    setFilteredCourses(filtered);
  };

  const handleApproveCourse = async (courseId: string) => {
    try {
      await apiClient.approveCourse(courseId);
      showToast('Course approved successfully', 'success');
      setShowApprovalModal(false);
      fetchData();
    } catch (error: any) {
      showToast(error.message || 'Error approving course', 'error');
    }
  };

  const handleRejectCourse = async (courseId: string) => {
    if (!rejectionReason.trim()) {
      showToast('Please provide a rejection reason', 'error');
      return;
    }

    try {
      await apiClient.rejectCourse(courseId, rejectionReason);
      showToast('Course rejected successfully', 'success');
      setShowApprovalModal(false);
      setRejectionReason('');
      fetchData();
    } catch (error: any) {
      showToast(error.message || 'Error rejecting course', 'error');
    }
  };

  const handleViewMaterials = async (course: Course) => {
    setSelectedCourse(course);
    setShowMaterialsModal(true);
    try {
      const response = await apiClient.getAdminCourse(course.id);
      const courseData = response.course;
      const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3000/api');
      const baseUrl = API_BASE_URL ? API_BASE_URL.replace('/api', '') : ''; // Remove /api to get base server URL

      const materialsData = (courseData?.courseMaterials || []).map((m: any) => ({
        id: m.id,
        fileName: m.fileName,
        fileUrl: m.fileUrl?.startsWith('http') ? m.fileUrl : `${baseUrl}${m.fileUrl}`,
        uploadedAt: m.uploadedAt,
      }));

      setMaterials(materialsData);
    } catch (error: any) {
      console.error('Error fetching materials:', error);
      showToast(error.message || 'Error fetching materials', 'error');
      setMaterials([]);
    }
  };

  const handleViewReviews = async (course: Course) => {
    setSelectedCourse(course);
    setShowReviewsModal(true);
    try {
      const response = await apiClient.getCourseReviews(course.id);
      setReviews(response.reviews || []);
    } catch (error: any) {
      showToast(error.message || 'Error fetching reviews', 'error');
    }
  };

  const handleViewSchedule = async (course: Course) => {
    setSelectedCourse(course);
    setShowScheduleModal(true);
    try {
      const response = await apiClient.getCourseSchedule(course.id);
      setSchedule(response.schedule || []);
    } catch (error: any) {
      showToast(error.message || 'Error fetching schedule', 'error');
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!selectedCourse) return;
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      await apiClient.deleteCourseReview(selectedCourse.id, reviewId);
      showToast('Review deleted successfully', 'success');
      handleViewReviews(selectedCourse);
    } catch (error: any) {
      showToast(error.message || 'Error deleting review', 'error');
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;

    try {
      await apiClient.deleteAdminCourse(courseId);
      showToast('Course deleted successfully', 'success');
      fetchData();
    } catch (error: any) {
      showToast(error.message || 'Error deleting course', 'error');
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'success';
      case 'pending_approval': return 'warning';
      case 'draft': return 'default';
      case 'denied': return 'danger';
      default: return 'default';
    }
  };

  // Filter trainer-created courses that are pending approval
  const trainerCreatedCourses = filteredCourses.filter(c =>
    !c.created_by_admin &&
    c.status === 'PENDING_APPROVAL'
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Render full-page forms when not in list mode
  if (mode === 'create-event' && eventCreationCourse) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="secondary" onClick={() => {
              setMode('list');
              setEventCreationCourse(null);
            }}>
              <ArrowLeft size={18} className="mr-2" />
              Back to Courses
            </Button>
            <h1 className="text-3xl font-bold text-gray-800">Create Event from Course</h1>
          </div>
        </div>
        <Card>
          <div className="p-6">
            <EventCreationForm
              course={eventCreationCourse}
              onSubmit={async (data) => {
                try {
                  const response = await apiClient.createEventFromCourse(eventCreationCourse.id, data);
                  showToast(response.message || 'Event created successfully', 'success');
                  setMode('list');
                  setEventCreationCourse(null);
                  fetchData();
                } catch (error: any) {
                  showToast(error.message || 'Error creating event', 'error');
                  throw error;
                }
              }}
              onCancel={() => {
                setMode('list');
                setEventCreationCourse(null);
              }}
            />
          </div>
        </Card>
      </div>
    );
  }

  if (mode === 'create' || mode === 'edit') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="secondary" onClick={() => setMode('list')}>
              <ArrowLeft size={18} className="mr-2" />
              Back to Courses
            </Button>
            <h1 className="text-3xl font-bold text-gray-800">
              {mode === 'create' ? 'Create Course' : 'Edit Course'}
            </h1>
          </div>
        </div>
        <Card>
          <div className="p-6">
            <CourseForm
              course={mode === 'edit' ? editingCourse || undefined : undefined}
              onSubmit={async (data, trainerIds) => {
                try {
                  // The CourseForm already passes data in the correct format (camelCase)
                  // So we can use it directly, just ensure trainerIds and trainerAvailabilityId are included
                  const courseData: any = {
                    ...data,
                    trainerAvailabilityId: (data as any).trainerAvailabilityId || null,
                  };

                  if (mode === 'create') {
                    const response = await apiClient.createAdminCourse(courseData);
                    if (trainerIds.length > 0) {
                      for (const trainerId of trainerIds) {
                        await apiClient.assignTrainerToCourse(response.course.id, trainerId);
                      }
                    }
                    showToast('Course added successfully', 'success');
                    setMode('list');
                    fetchData();
                  } else if (mode === 'edit' && editingCourse) {
                    const updateData: any = {
                      ...courseData,
                      trainerIds: trainerIds.length > 0 ? trainerIds : undefined,
                    };
                    console.log('Sending update data:', JSON.stringify(updateData, null, 2));
                    console.log('Course ID:', editingCourse.id);
                    const response = await apiClient.updateAdminCourse(editingCourse.id, updateData);
                    console.log('Update response:', response);
                    showToast('Course updated successfully', 'success');
                    setMode('list');
                    setEditingCourse(null);
                    fetchData();
                  }
                } catch (error: any) {
                  showToast(error.message || `Error ${mode === 'create' ? 'creating' : 'updating'} course`, 'error');
                }
              }}
              onCancel={() => {
                setMode('list');
                setEditingCourse(null);
              }}
            />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Courses Management</h1>
        <Button variant="primary" onClick={() => setMode('create')}>
          <Plus size={18} className="mr-2" />
          Add Course
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search courses..."
            />
          </div>
          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            options={[
              { value: 'all', label: 'All Categories' },
              ...categories.map(c => ({ value: c, label: c })),
            ]}
          />
          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'DRAFT', label: 'Draft' },
              { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
              { value: 'APPROVED', label: 'Approved' },
              { value: 'DENIED', label: 'Denied' },
              { value: 'WITHOUT_TRAINER', label: 'Without Trainer' },
            ]}
          />
        </div>
      </Card>

      {/* Trainer Created Courses (Pending Approval) */}
      {trainerCreatedCourses.length > 0 && (
        <div>
          <button
            onClick={() => setIsPendingApprovalExpanded(!isPendingApprovalExpanded)}
            className="flex items-center justify-between w-full text-left mb-4 hover:bg-gray-50 p-3 rounded-lg transition-colors"
          >
            <h2 className="text-xl font-semibold text-gray-800">
              Pending Approval ({trainerCreatedCourses.length})
            </h2>
            {isPendingApprovalExpanded ? (
              <ChevronUp size={24} className="text-gray-600" />
            ) : (
              <ChevronDown size={24} className="text-gray-600" />
            )}
          </button>
          {isPendingApprovalExpanded && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trainerCreatedCourses.map((course) => (
                <Card key={course.id} className="border-l-4 border-yellow-500">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">{course.title}</h3>
                        <Badge variant="warning">Pending Approval</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                      {(course as any).event_date && (
                        <div className="flex items-center">
                          <Calendar size={14} className="mr-1" />
                          {formatDate((course as any).event_date)}
                        </div>
                      )}
                      {course.venue && (
                        <div className="flex items-center">
                          <MapPin size={14} className="mr-1" />
                          {course.venue}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={async () => {
                          try {
                            // Fetch full course data with all fields
                            const courseData = await apiClient.getAdminCourse(course.id);
                            setSelectedCourse(courseData.course as any);
                            setShowApprovalModal(true);
                          } catch (error: any) {
                            showToast(error.message || 'Error loading course details', 'error');
                          }
                        }}
                        className="flex-1"
                      >
                        Review
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Admin Created Courses */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          All Courses ({filteredCourses.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{course.title}</h3>
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant={
                        course.status === 'APPROVED' ? 'success' :
                          course.status === 'DRAFT' ? 'default' :
                            course.status === 'PENDING_APPROVAL' ? 'warning' :
                              course.status === 'DENIED' ? 'danger' : 'default'
                      }>
                        {course.status}
                      </Badge>
                      {course.category && (
                        Array.isArray(course.category) ? (
                          (course.category as string[]).map((cat: string, idx: number) => (
                            <Badge key={idx} variant="info">{cat}</Badge>
                          ))
                        ) : (
                          <Badge variant="info">{course.category as string}</Badge>
                        )
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.description}</p>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  {(course as any).event_date && (
                    <div className="flex items-center">
                      <Calendar size={14} className="mr-1" />
                      {formatDate((course as any).event_date)}
                    </div>
                  )}
                  {course.venue && (
                    <div className="flex items-center">
                      <MapPin size={14} className="mr-1" />
                      {course.venue}
                    </div>
                  )}
                  {course.price && (
                    <div className="font-semibold">{formatCurrency(course.price)}</div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={async () => {
                      try {
                        const courseData = await apiClient.getAdminCourse(course.id);
                        const fullCourse = courseData.course;

                        // Helper function to extract and parse JSON/text fields into string arrays
                        const extractJsonField = (obj: any, camelKey: string, snakeKey: string): string[] => {
                          let value = obj?.[camelKey] ?? obj?.[snakeKey];

                          if (!value && course) {
                            const courseAny = course as any;
                            value = courseAny[camelKey] ?? courseAny[snakeKey];
                          }

                          if (typeof value === 'string') {
                            try {
                              value = JSON.parse(value);
                            } catch {
                              value = value.split('\n').filter((s: string) => s.trim());
                            }
                          }

                          if (Array.isArray(value)) {
                            return value
                              .map((item) => (typeof item === 'string' ? item : String(item)))
                              .filter((item) => item && item.trim());
                          }
                          if (value) {
                            return [String(value)];
                          }
                          return [];
                        };

                        // Extract courseType as string (take first if array)
                        const getCourseType = (): string => {
                          if (Array.isArray(fullCourse.courseType) && fullCourse.courseType.length > 0) {
                            return fullCourse.courseType[0];
                          }
                          if (fullCourse.courseType) {
                            return fullCourse.courseType;
                          }
                          if (Array.isArray((course as any).course_type) && (course as any).course_type.length > 0) {
                            return (course as any).course_type[0];
                          }
                          if ((course as any).course_type) {
                            return (course as any).course_type;
                          }
                          return 'IN_HOUSE';
                        };

                        // Try to fetch primary trainer details (for trainer profile section)
                        let trainerCustomId: string | null = null;
                        let trainerProfessionalBio: string | null = null;
                        let trainerEducation: string[] = [];
                        let trainerWorkHistory: string[] = [];
                        let trainerQualifications: string[] = [];
                        let trainerLanguages: string[] = [];

                        // Determine primary trainer id from course
                        const primaryTrainerId: string | null =
                          fullCourse.trainerId ||
                          (fullCourse.trainer && fullCourse.trainer.id) ||
                          (fullCourse.courseTrainers && fullCourse.courseTrainers.length > 0
                            ? fullCourse.courseTrainers[0].trainerId
                            : null);

                        if (primaryTrainerId) {
                          try {
                            const trainerRes = await apiClient.getTrainer(primaryTrainerId);
                            const trainer = trainerRes.trainer;
                            trainerCustomId = trainer.customTrainerId || trainer.custom_trainer_id || null;
                            trainerProfessionalBio =
                              trainer.professionalBio ||
                              trainer.bio ||
                              trainer.profileSummary ||
                              null;

                            // Education from qualifications
                            if (Array.isArray(trainer.qualifications)) {
                              trainerEducation = trainer.qualifications.map((q: any) => {
                                const parts: string[] = [];
                                if (q.title) parts.push(q.title);
                                if (q.institution) parts.push(q.institution);
                                if (q.yearObtained || q.year_obtained) {
                                  parts.push(String(q.yearObtained || q.year_obtained));
                                }
                                return parts.join(' - ');
                              }).filter((s: string) => s && s.trim());

                              trainerQualifications = trainerEducation;
                            }

                            // Work history
                            if (Array.isArray(trainer.workHistoryEntries)) {
                              trainerWorkHistory = trainer.workHistoryEntries.map((w: any) => {
                                const parts: string[] = [];
                                if (w.position) parts.push(w.position);
                                if (w.company) parts.push(w.company);
                                if (w.startDate || w.start_date) {
                                  const start = (w.startDate || w.start_date) as string;
                                  const end = (w.endDate || w.end_date) as string | null;
                                  parts.push(end ? `${start} - ${end}` : `${start} - Present`);
                                }
                                return parts.join(' | ');
                              }).filter((s: string) => s && s.trim());
                            }

                            // Languages (support a few possible field names / formats)
                            const rawLang =
                              trainer.languagesSpoken ||
                              trainer.languageSpoken ||
                              trainer.languages ||
                              trainer.spokenLanguages ||
                              null;
                            if (Array.isArray(rawLang)) {
                              trainerLanguages = rawLang
                                .map((l: any) => (typeof l === 'string' ? l : String(l)))
                                .filter((l: string) => l && l.trim());
                            } else if (typeof rawLang === 'string') {
                              try {
                                const parsed = JSON.parse(rawLang);
                                if (Array.isArray(parsed)) {
                                  trainerLanguages = parsed
                                    .map((l: any) => (typeof l === 'string' ? l : String(l)))
                                    .filter((l: string) => l && l.trim());
                                } else {
                                  trainerLanguages = rawLang
                                    .split(',')
                                    .map((l: string) => l.trim())
                                    .filter(Boolean);
                                }
                              } catch {
                                trainerLanguages = rawLang
                                  .split(',')
                                  .map((l: string) => l.trim())
                                  .filter(Boolean);
                              }
                            }
                          } catch (trainerError) {
                            console.warn('Could not load trainer details for brochure:', trainerError);
                          }
                        }

                        // Prepare editable brochure data (course + trainer profile)
                        const draftData: any = {
                          title: fullCourse.title || course.title,
                          courseType: getCourseType(),
                          startDate: fullCourse.startDate || course.start_date,
                          endDate: fullCourse.endDate || course.end_date,
                          venue: fullCourse.venue || course.venue,
                          description: fullCourse.description || course.description,
                          learningObjectives: extractJsonField(
                            fullCourse,
                            'learningObjectives',
                            'learning_objectives'
                          ),
                          learningOutcomes: extractJsonField(
                            fullCourse,
                            'learningOutcomes',
                            'learning_outcomes'
                          ),
                          targetAudience:
                            fullCourse.targetAudience || (course as any).target_audience || null,
                          methodology: fullCourse.methodology || null,
                          hrdcClaimable: fullCourse.hrdcClaimable || course.hrdc_claimable,
                          schedule: fullCourse.courseSchedule || [],
                          // Trainer profile (can be edited in modal, not saved to DB)
                          trainerCustomId,
                          trainerProfessionalBio,
                          trainerEducation,
                          trainerWorkHistory,
                          trainerQualifications,
                          trainerLanguages,
                        };

                        setBrochureData(draftData);
                        setShowBrochureModal(true);
                      } catch (error: any) {
                        console.error('Error preparing brochure preview:', error);
                        showToast(error.message || 'Error preparing brochure preview', 'error');
                      }
                    }}
                    title="Preview & Download Brochure"
                  >
                    <Download size={14} />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleViewSchedule(course)}
                    title="View Schedule"
                  >
                    <Clock size={14} />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleViewMaterials(course)}
                    title="View Materials"
                  >
                    <File size={14} />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleViewReviews(course)}
                    title="View Reviews"
                  >
                    <Star size={14} />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setEventCreationCourse(course);
                      setMode('create-event');
                    }}
                    title="Create Event"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Calendar size={14} />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={async () => {
                      try {
                        // Fetch full course data with all fields
                        const courseData = await apiClient.getAdminCourse(course.id);
                        setEditingCourse(courseData.course as any);
                        setMode('edit');
                      } catch (error: any) {
                        showToast(error.message || 'Error loading course data', 'error');
                      }
                    }}
                    title="Edit Course"
                  >
                    <Edit size={14} />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDeleteCourse(course.id)}
                    className="bg-red-600 hover:bg-red-700 text-white"
                    title="Delete Course"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>


      {/* Approval Modal */}
      <Modal
        isOpen={showApprovalModal}
        onClose={() => {
          setShowApprovalModal(false);
          setSelectedCourse(null);
          setRejectionReason('');
        }}
        title={`Review Course - ${selectedCourse?.title || ''}`}
      >
        {selectedCourse && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <h3 className="font-semibold text-gray-800 mb-4">Course Details</h3>

              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Title</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedCourse.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <p className="mt-1">
                    <Badge variant={getStatusVariant((selectedCourse as any).status || selectedCourse.status)}>
                      {((selectedCourse as any).status || selectedCourse.status || '').replace('_', ' ')}
                    </Badge>
                  </p>
                </div>
                {(selectedCourse as any).category && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Category</label>
                    <p className="mt-1 text-sm text-gray-900">{(selectedCourse as any).category}</p>
                  </div>
                )}
                {selectedCourse.price !== null && selectedCourse.price !== undefined && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Price</label>
                    <p className="mt-1 text-sm text-gray-900">{formatCurrency(selectedCourse.price)}</p>
                  </div>
                )}
                {selectedCourse.duration_hours !== null && selectedCourse.duration_hours !== undefined && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Duration</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedCourse.duration_hours} {(selectedCourse as any).durationUnit || 'hours'}
                    </p>
                  </div>
                )}
                {(selectedCourse as any).courseType && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Course Type</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {Array.isArray((selectedCourse as any).courseType)
                        ? (selectedCourse as any).courseType.join(', ')
                        : (selectedCourse as any).courseType}
                    </p>
                  </div>
                )}
                {(selectedCourse as any).courseMode && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Course Mode</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {Array.isArray((selectedCourse as any).courseMode)
                        ? (selectedCourse as any).courseMode.join(', ')
                        : (selectedCourse as any).courseMode}
                    </p>
                  </div>
                )}
                {selectedCourse.venue && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Venue</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedCourse.venue}</p>
                  </div>
                )}
                {(selectedCourse as any).city && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">City</label>
                    <p className="mt-1 text-sm text-gray-900">{(selectedCourse as any).city}</p>
                  </div>
                )}
                {(selectedCourse as any).state && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">State</label>
                    <p className="mt-1 text-sm text-gray-900">{(selectedCourse as any).state}</p>
                  </div>
                )}
                {selectedCourse.start_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Start Date</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedCourse.start_date)}</p>
                  </div>
                )}
                {selectedCourse.end_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">End Date</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedCourse.end_date)}</p>
                  </div>
                )}
                {(selectedCourse as any).event_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Event Date</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate((selectedCourse as any).event_date)}</p>
                  </div>
                )}
                {selectedCourse.hrdc_claimable !== undefined && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">HRDC Claimable</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedCourse.hrdc_claimable ? 'Yes' : 'No'}</p>
                  </div>
                )}
                {(selectedCourse as any).certificate && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Certificate</label>
                    <p className="mt-1 text-sm text-gray-900">{(selectedCourse as any).certificate}</p>
                  </div>
                )}
                {(selectedCourse as any).professionalDevelopmentPoints && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Professional Development Points</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {(selectedCourse as any).professionalDevelopmentPoints}
                      {(selectedCourse as any).professionalDevelopmentPointsOther && (
                        <span className="block text-xs text-gray-600 mt-1">
                          {(selectedCourse as any).professionalDevelopmentPointsOther}
                        </span>
                      )}
                    </p>
                  </div>
                )}
                {(selectedCourse as any).assessment !== undefined && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Assessment</label>
                    <p className="mt-1 text-sm text-gray-900">{(selectedCourse as any).assessment ? 'Yes' : 'No'}</p>
                  </div>
                )}
              </div>

              {/* Description */}
              {selectedCourse.description && (
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{selectedCourse.description}</p>
                </div>
              )}

              {/* Learning Objectives */}
              {(selectedCourse as any).learningObjectives && (
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700">Learning Objectives</label>
                  <ul className="mt-1 list-disc list-inside text-sm text-gray-900 space-y-1">
                    {Array.isArray((selectedCourse as any).learningObjectives)
                      ? (selectedCourse as any).learningObjectives.map((obj: string, idx: number) => (
                        <li key={idx}>{obj}</li>
                      ))
                      : <li>{(selectedCourse as any).learningObjectives}</li>}
                  </ul>
                </div>
              )}

              {/* Learning Outcomes */}
              {(selectedCourse as any).learningOutcomes && (
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700">Learning Outcomes</label>
                  <ul className="mt-1 list-disc list-inside text-sm text-gray-900 space-y-1">
                    {Array.isArray((selectedCourse as any).learningOutcomes)
                      ? (selectedCourse as any).learningOutcomes.map((outcome: string, idx: number) => (
                        <li key={idx}>{outcome}</li>
                      ))
                      : <li>{(selectedCourse as any).learningOutcomes}</li>}
                  </ul>
                </div>
              )}

              {/* Target Audience */}
              {(selectedCourse as any).targetAudience && (
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700">Target Audience</label>
                  <p className="mt-1 text-sm text-gray-900">{(selectedCourse as any).targetAudience}</p>
                </div>
              )}

              {/* Methodology */}
              {(selectedCourse as any).methodology && (
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700">Methodology</label>
                  <p className="mt-1 text-sm text-gray-900">{(selectedCourse as any).methodology}</p>
                </div>
              )}

              {/* Prerequisite */}
              {(selectedCourse as any).prerequisite && (
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700">Prerequisite</label>
                  <p className="mt-1 text-sm text-gray-900">{(selectedCourse as any).prerequisite}</p>
                </div>
              )}

              {/* Brochure URL */}
              {selectedCourse.brochure_url && (
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700">Brochure</label>
                  <p className="mt-1 text-sm">
                    <a
                      href={selectedCourse.brochure_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-600 hover:text-teal-700 underline"
                    >
                      View Brochure
                    </a>
                  </p>
                </div>
              )}
            </div>
            <Textarea
              label="Rejection Reason (if rejecting)"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              placeholder="Optional reason for rejection"
            />
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowApprovalModal(false);
                  setSelectedCourse(null);
                  setRejectionReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleRejectCourse(selectedCourse.id)}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={!rejectionReason.trim()}
              >
                <XCircle size={18} className="mr-2" />
                Reject
              </Button>
              <Button
                variant="primary"
                onClick={() => handleApproveCourse(selectedCourse.id)}
              >
                <CheckCircle size={18} className="mr-2" />
                Approve
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Materials Modal */}
      <Modal
        isOpen={showMaterialsModal}
        onClose={() => {
          setShowMaterialsModal(false);
          setSelectedCourse(null);
        }}
        title={`Course Materials - ${selectedCourse?.title || ''}`}
      >
        <div className="space-y-4">
          {materials.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No materials uploaded yet</p>
          ) : (
            materials.map((material) => (
              <Card key={material.id}>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <File size={20} className="text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-800">{material.fileName}</p>
                      <p className="text-sm text-gray-500">
                        Uploaded: {formatDate(material.uploadedAt)}
                      </p>
                    </div>
                  </div>
                  <a
                    href={material.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-600 hover:text-teal-700"
                  >
                    Download
                  </a>
                </div>
              </Card>
            ))
          )}
        </div>
      </Modal>

      {/* Reviews Modal */}
      <Modal
        isOpen={showReviewsModal}
        onClose={() => {
          setShowReviewsModal(false);
          setSelectedCourse(null);
          setReviews([]);
        }}
        title={`Course Reviews - ${selectedCourse?.title || ''}`}
      >
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {reviews.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No reviews yet</p>
          ) : (
            reviews.map((review) => (
              <Card key={review.id}>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            className={i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-gray-800">{review.clientName}</span>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDeleteReview(review.id)}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <X size={14} />
                    </Button>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-600 mb-2">{review.comment}</p>
                  )}
                  <p className="text-xs text-gray-500">{formatDate(review.createdAt)}</p>
                </div>
              </Card>
            ))
          )}
        </div>
      </Modal>

      {/* Schedule Modal */}
      <Modal
        isOpen={showScheduleModal}
        onClose={() => {
          setShowScheduleModal(false);
          setSelectedCourse(null);
          setSchedule([]);
        }}
        title={`Course Schedule - ${selectedCourse?.title || ''}`}
      >
        <div className="space-y-4">
          {schedule.length === 0 ? (
            <div className="space-y-4">
              <p className="text-gray-500 text-center py-4">No schedule available</p>
              {selectedCourse && (
                <div className="border-t pt-4 space-y-3">
                  <p className="text-sm text-gray-700 font-medium">Actions:</p>
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={async () => {
                        if (!selectedCourse) return;
                        try {
                          // Get course details to find trainers
                          const courseData = await apiClient.getAdminCourse(selectedCourse.id);
                          const fullCourse = courseData.course;

                          // Get trainers (assigned trainers or course creator)
                          const trainerIds: string[] = [];
                          if (fullCourse.courseTrainers && fullCourse.courseTrainers.length > 0) {
                            fullCourse.courseTrainers.forEach((ct: any) => {
                              if (ct.trainerId) trainerIds.push(ct.trainerId);
                            });
                          } else if (fullCourse.trainerId) {
                            trainerIds.push(fullCourse.trainerId);
                          } else if (fullCourse.createdBy) {
                            // If created by trainer, notify them
                            trainerIds.push(fullCourse.createdBy);
                          }

                          if (trainerIds.length === 0) {
                            showToast('No trainers found to notify', 'warning');
                            return;
                          }

                          // Send notification to each trainer
                          for (const trainerId of trainerIds) {
                            await apiClient.sendNotification({
                              title: 'Course Schedule Required',
                              message: `Please input the course schedule for "${selectedCourse.title}". The schedule is currently empty.`,
                              type: 'INFO',
                              userId: trainerId,
                              relatedEntityType: 'course',
                              relatedEntityId: selectedCourse.id,
                            });
                          }

                          showToast(`Notification sent to ${trainerIds.length} trainer(s)`, 'success');
                        } catch (error: any) {
                          showToast(error.message || 'Error sending notification', 'error');
                        }
                      }}
                    >
                      <Send size={14} className="mr-2" />
                      Send Notification to Trainer
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        // TODO: Open schedule editor
                        showToast('Schedule editor coming soon', 'info');
                      }}
                    >
                      <Calendar size={14} className="mr-2" />
                      Add Schedule Manually
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            Object.entries(
              schedule.reduce((acc, item) => {
                if (!acc[item.dayNumber]) acc[item.dayNumber] = [];
                acc[item.dayNumber].push(item);
                return acc;
              }, {} as Record<number, ScheduleItem[]>)
            ).map(([day, items]) => (
              <Card key={day}>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Day {day}</h3>
                  <div className="space-y-2">
                    {items.map((item, idx) => (
                      <div key={idx} className="border-l-4 border-teal-500 pl-3 py-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-800">{item.moduleTitle}</p>
                            {item.submoduleTitle && (
                              <p className="text-sm text-gray-600">{item.submoduleTitle}</p>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            {item.startTime} - {item.endTime}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </Modal>

      {/* Brochure Preview & Edit Modal (does NOT persist to database) */}
      <Modal
        isOpen={showBrochureModal}
        onClose={() => {
          setShowBrochureModal(false);
          setBrochureData(null);
        }}
        title="Preview & Edit Brochure Content"
        size="xl"
      >
        {brochureData && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Course details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Course Details</h3>
                <Input
                  label="Course Title"
                  value={brochureData.title || ''}
                  onChange={(e) =>
                    setBrochureData((prev: any) => ({ ...prev, title: e.target.value }))
                  }
                />
                <Input
                  label="Course Type"
                  value={brochureData.courseType || ''}
                  onChange={(e) =>
                    setBrochureData((prev: any) => ({ ...prev, courseType: e.target.value }))
                  }
                />
                <Input
                  label="Venue"
                  value={brochureData.venue || ''}
                  onChange={(e) =>
                    setBrochureData((prev: any) => ({ ...prev, venue: e.target.value }))
                  }
                />
                <Textarea
                  label="Introduction / Description"
                  rows={4}
                  value={brochureData.description || ''}
                  onChange={(e) =>
                    setBrochureData((prev: any) => ({ ...prev, description: e.target.value }))
                  }
                />
                <Textarea
                  label="Learning Objectives (one per line)"
                  rows={4}
                  value={(brochureData.learningObjectives || []).join('\n')}
                  onChange={(e) => {
                    const lines = e.target.value
                      .split('\n')
                      .map((s) => s.trim())
                      .filter(Boolean);
                    setBrochureData((prev: any) => ({
                      ...prev,
                      learningObjectives: lines,
                    }));
                  }}
                />
                <Textarea
                  label="Learning Outcomes (one per line)"
                  rows={4}
                  value={(brochureData.learningOutcomes || []).join('\n')}
                  onChange={(e) => {
                    const lines = e.target.value
                      .split('\n')
                      .map((s) => s.trim())
                      .filter(Boolean);
                    setBrochureData((prev: any) => ({
                      ...prev,
                      learningOutcomes: lines,
                    }));
                  }}
                />
                <Textarea
                  label="Target Audience"
                  rows={3}
                  value={brochureData.targetAudience || ''}
                  onChange={(e) =>
                    setBrochureData((prev: any) => ({
                      ...prev,
                      targetAudience: e.target.value,
                    }))
                  }
                />
                <Textarea
                  label="Methodology"
                  rows={3}
                  value={brochureData.methodology || ''}
                  onChange={(e) =>
                    setBrochureData((prev: any) => ({
                      ...prev,
                      methodology: e.target.value,
                    }))
                  }
                />
              </div>

              {/* Trainer profile details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Trainer Profile (Brochure Only)</h3>
                <Input
                  label="Trainer ID"
                  value={brochureData.trainerCustomId || ''}
                  onChange={(e) =>
                    setBrochureData((prev: any) => ({
                      ...prev,
                      trainerCustomId: e.target.value,
                    }))
                  }
                />
                <Textarea
                  label="Professional Bio"
                  rows={4}
                  value={brochureData.trainerProfessionalBio || ''}
                  onChange={(e) =>
                    setBrochureData((prev: any) => ({
                      ...prev,
                      trainerProfessionalBio: e.target.value,
                    }))
                  }
                />
                <Textarea
                  label="Education (one per line)"
                  rows={3}
                  value={(brochureData.trainerEducation || []).join('\n')}
                  onChange={(e) => {
                    const lines = e.target.value
                      .split('\n')
                      .map((s) => s.trim())
                      .filter(Boolean);
                    setBrochureData((prev: any) => ({
                      ...prev,
                      trainerEducation: lines,
                    }));
                  }}
                />
                <Textarea
                  label="Work History (one role per line)"
                  rows={3}
                  value={(brochureData.trainerWorkHistory || []).join('\n')}
                  onChange={(e) => {
                    const lines = e.target.value
                      .split('\n')
                      .map((s) => s.trim())
                      .filter(Boolean);
                    setBrochureData((prev: any) => ({
                      ...prev,
                      trainerWorkHistory: lines,
                    }));
                  }}
                />
                <Textarea
                  label="Qualifications & Certifications (one per line)"
                  rows={3}
                  value={(brochureData.trainerQualifications || []).join('\n')}
                  onChange={(e) => {
                    const lines = e.target.value
                      .split('\n')
                      .map((s) => s.trim())
                      .filter(Boolean);
                    setBrochureData((prev: any) => ({
                      ...prev,
                      trainerQualifications: lines,
                    }));
                  }}
                />
                <Input
                  label="Languages Spoken (comma separated)"
                  value={(brochureData.trainerLanguages || []).join(', ')}
                  onChange={(e) => {
                    const langs = e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean);
                    setBrochureData((prev: any) => ({
                      ...prev,
                      trainerLanguages: langs,
                    }));
                  }}
                />
                <p className="text-xs text-gray-500">
                  Changes here are only for this brochure download and will not update the course or trainer records.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowBrochureModal(false);
                  setBrochureData(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={async () => {
                  if (!brochureData) return;
                  try {
                    await generateCourseBrochure(brochureData);
                    showToast('Brochure downloaded successfully', 'success');
                    setShowBrochureModal(false);
                    setBrochureData(null);
                  } catch (error: any) {
                    console.error('Error generating brochure:', error);
                    showToast(error.message || 'Error generating brochure', 'error');
                  }
                }}
              >
                <Download size={16} className="mr-2" />
                Download Brochure
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
