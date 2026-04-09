import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Save, Send, Plus, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Step1BasicInfo } from '../components/courses/Step1BasicInfo';
import { Step2ContentSchedule } from '../components/courses/Step2ContentSchedule';
import { Step3FinalDetails } from '../components/courses/Step3FinalDetails';
import { CourseListTable } from '../components/courses/CourseListTable';
import { apiClient } from '../lib/api-client';
import {
  createCourse,
  updateCourse,
  fetchTrainerCourses,
  saveCourseSchedule,
  fetchCourseSchedule,
  deleteCourse,
  validateWordLimit,
  CourseFormData,
  ScheduleItemData
} from '../lib/courseService';
import { Course } from '../types/database';
import { useRealtime } from '../hooks/useRealtime';

interface FormData {
  title: string;
  duration_hours: number;
  duration_unit: 'days' | 'hours' | 'half_day';
  course_type: string | null;
  course_mode: string | string[] | null;
  category: string[] | string | null;
  certificate: string | null;
  professional_development_points: string | null;
  professional_development_points_other: string | null;
  assessment: boolean;
  description: string;
  learning_objectives: string[];
  learning_outcomes: string[];
  target_audience: string;
  methodology: string;
  prerequisite: string;
  end_date: string | null;
  image_url: string | null;
  delivery_languages: string[];
  hrdc_claimable: boolean;
}

const initialFormData: FormData = {
  title: '',
  duration_hours: 9,
  duration_unit: 'days',
  course_type: 'IN_HOUSE',
  course_mode: ['PHYSICAL'],
  category: [],
  certificate: null,
  professional_development_points: null,
  professional_development_points_other: null,
  assessment: false,
  description: '',
  learning_objectives: [''],
  learning_outcomes: [''],
  target_audience: '',
  methodology: '',
  prerequisite: '',
  end_date: null,
  image_url: null,
  delivery_languages: ['English'],
  hrdc_claimable: false
};

export function MyCourses() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [scheduleItems, setScheduleItems] = useState<Array<ScheduleItemData & { id: string; submodules: string[]; module_titles?: string[] }>>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formStep, setFormStep] = useState(1);
  const [submissionNotice, setSubmissionNotice] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadCourses();
    }
  }, [user]);

  useRealtime((payload) => {
    if (payload.table === 'courses') {
      console.log('📚 Trainer Courses: Real-time update, refreshing list...');
      loadCourses();
    }
  });

  const loadCourses = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const data = await fetchTrainerCourses(user.id);
      setCourses(data);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const markCourseAsRead = async (course: Course) => {
    if (course.isRead && !course.adminCourseNotes?.some(n => !n.isRead)) return;

    try {
      // Optimistic update
      setCourses(prev => prev.map(c => c.id === course.id ? { 
        ...c, 
        isRead: true,
        adminCourseNotes: c.adminCourseNotes?.map(n => ({ ...n, isRead: true }))
      } : c));
      
      await apiClient.getCourse(course.id);
    } catch (err) {
      console.error('Error marking course as read:', err);
    }
  };

  const handleEdit = async (course: Course) => {
    setEditingCourse(course);
    markCourseAsRead(course);

    // Convert course_type and course_mode arrays to strings for form compatibility
    // If it's an array, take the first value or join with comma, otherwise use as-is
    const courseTypeValue = Array.isArray(course.course_type)
      ? (course.course_type.length > 0 ? course.course_type[0] : null)
      : (course.course_type || null);
    const courseModeValue = Array.isArray(course.course_mode)
      ? course.course_mode
      : (course.course_mode ? [course.course_mode] : []);

    setFormData({
      title: course.title,
      duration_hours: course.duration_hours,
      duration_unit: course.duration_unit,
      course_type: courseTypeValue,
      course_mode: courseModeValue,
      category: (() => {
        if (Array.isArray(course.category)) return course.category;
        return course.category ? [course.category] : [];
      })(),
      certificate: course.certificate,
      assessment: course.assessment,
      description: course.description || '',
      learning_objectives: course.learning_objectives && course.learning_objectives.length > 0 ? course.learning_objectives : [''],
      learning_outcomes: course.learning_outcomes && course.learning_outcomes.length > 0 ? course.learning_outcomes : [''],
      target_audience: course.target_audience || '',
      methodology: course.methodology || '',
      prerequisite: typeof course.prerequisite === 'string' 
        ? course.prerequisite 
        : (Array.isArray(course.prerequisite) ? (course.prerequisite as any[]).join('\n') : (course.prerequisite || '')),
      professional_development_points: course.professional_development_points || null,
      professional_development_points_other: course.professional_development_points_other || null,
      end_date: null, // end_date is not stored in Course, it's calculated from duration
      image_url: course.image_url || null,
      delivery_languages: Array.isArray(course.delivery_languages) ? course.delivery_languages : (course.delivery_languages ? [course.delivery_languages] : ['English']),
      hrdc_claimable: course.hrdc_claimable || false
    });

    try {
      const schedule = await fetchCourseSchedule(course.id);
      // Handle both old format (string) and new format (array)
      const scheduleWithSubmodules = schedule.reduce((acc: any[], item) => {
        // Parse module_title - can be string or array
        let moduleTitles: string[] = [];
        if (Array.isArray(item.module_title)) {
          moduleTitles = item.module_title;
        } else if (typeof item.module_title === 'string' && item.module_title) {
          moduleTitles = [item.module_title];
        }

        // Parse submodule_title - can be string, array, or null
        let submoduleTitles: string[] = [];
        if (Array.isArray(item.submodule_title)) {
          submoduleTitles = item.submodule_title;
        } else if (typeof item.submodule_title === 'string' && item.submodule_title) {
          submoduleTitles = [item.submodule_title];
        }

        // Find existing item with same day and time
        const existingItem = acc.find(
          i => i.day_number === item.day_number &&
            i.start_time === item.start_time
        );

        if (existingItem) {
          // Merge modules and submodules
          moduleTitles.forEach(moduleTitle => {
            if (moduleTitle && !existingItem.module_titles.includes(moduleTitle)) {
              existingItem.module_titles.push(moduleTitle);
            }
          });
          submoduleTitles.forEach(submoduleTitle => {
            if (submoduleTitle && !existingItem.submodules.includes(submoduleTitle)) {
              existingItem.submodules.push(submoduleTitle);
            }
          });
        } else {
          acc.push({
            id: item.id,
            day_number: item.day_number,
            start_time: item.start_time,
            end_time: item.end_time,
            module_title: moduleTitles[0] || '', // Keep for backward compatibility
            module_titles: moduleTitles, // New array format
            submodule_title: null,
            duration_minutes: item.duration_minutes,
            submodules: submoduleTitles
          });
        }

        return acc;
      }, []);

      setScheduleItems(scheduleWithSubmodules);
    } catch (error) {
      console.error('Error loading schedule:', error);
      setScheduleItems([]);
    }

    setFormStep(1);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (courseId: string) => {
    try {
      await deleteCourse(courseId);
      await loadCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Failed to delete course');
    }
  };

  const validateStep = (step: number, isPublishing: boolean = false): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1 || isPublishing) {
      if (!formData.title.trim()) {
        newErrors.title = 'Course name is required';
      }
      if (!formData.category || (Array.isArray(formData.category) && formData.category.length === 0)) {
        newErrors.category = 'Category is required';
      }
      if (!formData.course_type || formData.course_type.trim() === '') {
        newErrors.course_type = 'Please select a course type';
      }

      const validOutcomes = formData.learning_outcomes.filter(out => out.trim());
      if (validOutcomes.some(out => !validateWordLimit(out, 20))) {
        newErrors.learning_outcomes = 'Each outcome must be 20 words or less';
      }
    }

    if (step === 2 || isPublishing) {
      if (!validateWordLimit(formData.description, 250)) {
        newErrors.description = 'Introduction must be 250 words or less';
      }

      const validObjectives = formData.learning_objectives.filter(obj => obj.trim());
      if (validObjectives.some(obj => !validateWordLimit(obj, 50))) {
        newErrors.learning_objectives = 'Each objective must be 50 words or less';
      }

      if (isPublishing) {
        if (!formData.description.trim()) {
          newErrors.description = 'Introduction is required for publishing';
        }
        if (validObjectives.length === 0) {
          newErrors.learning_objectives = 'At least one learning objective is required for publishing';
        }
        if (!formData.target_audience.trim()) {
          newErrors.target_audience = 'Target audience is required for publishing';
        }
        if (!formData.methodology.trim()) {
          newErrors.methodology = 'Methodology is required for publishing';
        }
      }
    }

    if (step === 3 || isPublishing) {
      if (isPublishing) {
        if (!formData.certificate || formData.certificate.trim() === '') {
          newErrors.certificate = 'Certificate type is required for publishing';
        }
        if (formData.duration_hours <= 0) {
          newErrors.duration_hours = 'Duration must be greater than 0';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = (isPublishing: boolean): boolean => {
    return validateStep(formStep, isPublishing);
  };

  const handleSave = async (status: 'draft' | 'published') => {
    if (!user?.id) return;

    if (!validateForm(status === 'published')) {
      alert('Please fix the validation errors before saving');
      return;
    }

    setSaving(true);
    let courseId: string | null = null;
    let courseCreatedOrUpdated = false;

    try {
      // When editing, preserve the original status if user is just updating without changing status
      // But if they explicitly choose to publish or save as draft, use that choice
      const finalStatus = editingCourse && editingCourse.status === 'published' && status === 'published'
        ? 'published' // Keep published if already published and user clicks publish
        : status; // Otherwise use the selected status

      const courseData: CourseFormData = {
        title: formData.title,
        description: formData.description,
        duration_hours: formData.duration_hours,
        duration_unit: formData.duration_unit,
        course_type: formData.course_type,
        course_mode: Array.isArray(formData.course_mode) ? formData.course_mode : (formData.course_mode ? [formData.course_mode] : []),
        category: Array.isArray(formData.category) ? formData.category : (formData.category ? [formData.category] : []),
        certificate: formData.certificate,
        professional_development_points: formData.professional_development_points,
        professional_development_points_other: formData.professional_development_points_other,
        assessment: formData.assessment,
        learning_objectives: formData.learning_objectives.filter(obj => obj.trim()),
        learning_outcomes: formData.learning_outcomes.filter(out => out.trim()),
        target_audience: formData.target_audience,
        methodology: formData.methodology,
        prerequisite: formData.prerequisite,
        end_date: formData.end_date || null,
        image_url: formData.image_url,
        status: finalStatus,
        delivery_languages: formData.delivery_languages,
        hrdc_claimable: formData.hrdc_claimable,
      };

      // Step 1: Create or update course
      try {
        if (editingCourse) {
          console.log('Updating course:', editingCourse.id);
          const updated = await updateCourse(editingCourse.id, courseData);
          courseId = updated.id;
          courseCreatedOrUpdated = true;
          console.log('Course updated successfully');
        } else {
          console.log('Creating new course');
          const created = await createCourse(user.id, courseData);
          courseId = created.id;
          courseCreatedOrUpdated = true;
          console.log('Course created successfully with ID:', courseId);
        }
      } catch (courseError) {
        console.error('Failed to save course:', courseError);
        throw new Error(`Course save failed: ${courseError instanceof Error ? courseError.message : 'Unknown error'}`);
      }

      // Step 2: Save schedule if provided
      // Only save items that have a module_title (filter out empty/untitled modules)
      if (scheduleItems.length > 0 && courseId) {
        try {
          console.log('Saving schedule with', scheduleItems.length, 'items');
          const scheduleToSave: ScheduleItemData[] = [];

          scheduleItems.forEach(item => {
            // Get module titles - use new array format if available, otherwise use single module_title
            const moduleTitles = (item as any).module_titles && Array.isArray((item as any).module_titles)
              ? (item as any).module_titles.filter((m: string) => m && m.trim())
              : (item.module_title && typeof item.module_title === 'string' && item.module_title.trim() ? [item.module_title] : []);

            // Only save if there's at least one module title
            if (moduleTitles.length > 0) {
              // Save one row per day/session with arrays
              scheduleToSave.push({
                day_number: item.day_number,
                start_time: item.start_time,
                end_time: item.end_time,
                module_title: moduleTitles, // Array format
                submodule_title: item.submodules && item.submodules.length > 0
                  ? item.submodules.filter((s: string) => s && s.trim()) // Array format
                  : null,
                duration_minutes: item.duration_minutes
              });
            }
          });

          if (scheduleToSave.length > 0) {
            await saveCourseSchedule(courseId, scheduleToSave);
            console.log('Schedule saved successfully');
          } else {
            console.log('No valid schedule items to save (all modules are empty)');
          }
        } catch (scheduleError) {
          console.error('Failed to save schedule:', scheduleError);
          throw new Error(`Schedule save failed: ${scheduleError instanceof Error ? scheduleError.message : 'Unknown error'}. Course was saved but schedule was not.`);
        }
      }

      if (status === 'published') {
        setSubmissionNotice('Submission successful. Your changes are pending admin review and approval.');
      } else {
        alert('Course saved as draft!');
      }

      setFormData(initialFormData);
      setScheduleItems([]);
      setEditingCourse(null);
      setShowForm(false);
      await loadCourses();

    } catch (error) {
      console.error('Error in handleSave:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save course. Please try again.';

      // Provide context about what succeeded/failed
      if (courseCreatedOrUpdated && error instanceof Error && error.message.includes('schedule')) {
        alert(`Course saved, but there was an issue with the schedule:\n${errorMessage}\n\nYou can edit the course to add the schedule later.`);
        // Still reload to show the saved course
        setFormData(initialFormData);
        setScheduleItems([]);
        setEditingCourse(null);
        setShowForm(false);
        await loadCourses();
      } else {
        alert(`Error: ${errorMessage}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleNewCourse = () => {
    setEditingCourse(null);
    setFormData(initialFormData);
    setScheduleItems([]);
    setErrors({});
    setFormStep(1);
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="animate-slide-in-right">
          <h1 className="text-3xl font-black text-black tracking-tight uppercase underline decoration-accent-gold decoration-4 underline-offset-8">My Courses</h1>
          <p className="text-corporate-500 mt-4 text-sm font-medium">Manage your training courses and schedules.</p>
        </div>
        {!showForm && (
          <Button
            variant="primary"
            onClick={handleNewCourse}
            className="flex items-center gap-2 shadow-gold-glow/20"
          >
            <Plus className="w-4 h-4" />
            Add New Course
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="bg-corporate-900/40 backdrop-blur-xl border-white/5 shadow-2xl animate-scale-in">
          <CardHeader className="border-b border-white/5 p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white uppercase tracking-tight">
                {editingCourse ? 'Edit Course' : 'Create New Course'}
              </h2>
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingCourse(null);
                  setFormData(initialFormData);
                  setScheduleItems([]);
                  setErrors({});
                  setFormStep(1);
                }}
              >
                {showForm ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
                {showForm ? 'Cancel' : 'Show Form'}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            <div className="space-y-8">
              {/* Stepper Header */}
              <div className="flex items-center justify-center mb-8">
                <div className="flex items-center w-full max-w-md">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex-1 flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${formStep === step
                        ? 'bg-accent-gold text-black ring-4 ring-accent-gold/20'
                        : formStep > step
                          ? 'bg-emerald-500 text-white'
                          : 'bg-corporate-800 text-corporate-500'
                        }`}>
                        {formStep > step ? <Check className="w-4 h-4" /> : step}
                      </div>
                      {step < 3 && (
                        <div className={`flex-1 h-1 mx-2 rounded-full transition-all duration-300 ${formStep > step ? 'bg-emerald-500' : 'bg-corporate-800'
                          }`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="min-h-[400px]">
                {formStep === 1 && (
                  <Step1BasicInfo
                    formData={formData}
                    onChange={setFormData}
                    errors={errors}
                  />
                )}

                {formStep === 2 && (
                  <Step2ContentSchedule
                    formData={formData}
                    onChange={setFormData}
                    scheduleItems={scheduleItems}
                    onScheduleChange={setScheduleItems}
                    errors={errors}
                  />
                )}

                {formStep === 3 && (
                  <Step3FinalDetails
                    formData={formData}
                    onChange={setFormData}
                    errors={errors}
                  />
                )}
              </div>

              <div className="flex items-center justify-between pt-8 border-t border-white/5">
                <div className="flex gap-3">
                  {formStep > 1 && (
                    <Button
                      variant="outline"
                      onClick={() => setFormStep(prev => prev - 1)}
                    >
                      Back
                    </Button>
                  )}
                  {formStep < 3 ? (
                    <Button
                      variant="primary"
                      onClick={() => {
                        if (validateStep(formStep)) {
                          setFormStep(prev => prev + 1);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                    >
                      Next Step
                    </Button>
                  ) : null}
                </div>

                <div className="flex items-center gap-3">
                  {(() => {
                    const primaryActionLabel = editingCourse ? 'Update Course' : 'Publish Course';
                    const primaryActionTitle = formStep < 3
                      ? `Complete all steps to ${editingCourse ? 'update' : 'publish'}`
                      : '';

                    return (
                      <>
                  <Button
                    variant="outline"
                    onClick={() => handleSave('draft')}
                    disabled={saving}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save as Draft
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => handleSave('published')}
                    disabled={saving || formStep < 3}
                    isLoading={saving}
                    className={`flex items-center gap-2 ${formStep < 3 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={primaryActionTitle}
                  >
                    {!saving && (editingCourse ? <Save className="w-4 h-4" /> : <Send className="w-4 h-4" />)}
                    {primaryActionLabel}
                  </Button>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <CourseListTable
        courses={courses}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRefresh={loadCourses}
        onViewDetails={markCourseAsRead}
        currentUserId={user?.id}
      />

      {submissionNotice && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white border border-corporate-100 shadow-2xl p-8 space-y-6 animate-scale-in">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-600">Submission Status</p>
              <h3 className="text-2xl font-bold text-corporate-900 tracking-tight">Course Submitted</h3>
            </div>
            <p className="text-sm text-corporate-600 leading-relaxed font-medium">
              {submissionNotice}
            </p>
            <Button
              variant="primary"
              onClick={() => setSubmissionNotice(null)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
