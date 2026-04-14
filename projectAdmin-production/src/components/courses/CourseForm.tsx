import React, { useState, useEffect } from 'react';
import { Input } from '../common/Input';
import { Textarea } from '../common/Textarea';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Course, Trainer } from '../../types';
import { apiClient } from '../../lib/api-client';
import {
  ChevronDown,
  ChevronUp,
  X,
  Upload,
  Image as ImageIcon,
  Users,
  Search,
  UserX,
  Plus
} from 'lucide-react';
import { ScheduleBuilder, ScheduleItemData } from './ScheduleBuilder';
import { COURSE_CATEGORIES } from '../../utils/categories';
// Removed courseImages import
import { Layers } from 'lucide-react';

interface CourseFormProps {
  course?: Course;
  onSubmit: (data: Partial<Course> & { imageUrl?: string | null }, trainerIds: string[], imageFile?: File) => Promise<void>;
  onCancel: () => void;
}

export const CourseForm: React.FC<CourseFormProps> = ({
  course,
  onSubmit,
  onCancel,
}) => {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [filteredTrainers, setFilteredTrainers] = useState<Trainer[]>([]);
  const [trainerSearchTerm, setTrainerSearchTerm] = useState('');
  const [primaryTrainerId, setPrimaryTrainerId] = useState<string | null>(null);
  const [coTrainerIds, setCoTrainerIds] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    details: course ? true : true, // Always expand details when editing to show all trainer-filled fields
    schedule: course ? true : false,
    trainers: true,
    image: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scheduleItems, setScheduleItems] = useState<Array<ScheduleItemData & { id: string; submodules: string[]; module_titles?: string[] }>>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  // Helper to safely access course properties that might not be in the type definition
  const getCourseField = (field: string) => {
    const c = course as any;
    return c?.[field];
  };

  const [learningObjectives, setLearningObjectives] = useState<string>(() => {
    const c = course as any;
    const objectives = c?.learningObjectives || c?.learning_objectives;
    if (Array.isArray(objectives)) return objectives.join('\n');
    return objectives || '';
  });

  const [learningOutcomes, setLearningOutcomes] = useState<string>(() => {
    const c = course as any;
    const outcomes = c?.learningOutcomes || c?.learning_outcomes;
    if (Array.isArray(outcomes)) return outcomes.join('\n');
    return outcomes || '';
  });

  const [formData, setFormData] = useState({
    title: course?.title || '',
    description: course?.description || '',
    target_audience: (() => {
      const val = getCourseField('targetAudience') || getCourseField('target_audience');
      return Array.isArray(val) ? val.join('\n') : (val || '');
    })(),
    methodology: (() => {
      const val = getCourseField('methodology');
      return Array.isArray(val) ? val.join('\n') : (val || '');
    })(),
    prerequisite: (() => {
      const val = getCourseField('prerequisite');
      return Array.isArray(val) ? val.join('\n') : (val || '');
    })(),
    certificate: getCourseField('certificate') || '',
    professional_development_points: getCourseField('professionalDevelopmentPoints') || '',
    professional_development_points_other: getCourseField('professionalDevelopmentPointsOther') || '',
    assessment: getCourseField('assessment') || false,
    duration_hours: (getCourseField('durationHours') || getCourseField('duration_hours'))?.toString() || '',
    duration_unit: (getCourseField('durationUnit') || getCourseField('duration_unit') as 'days' | 'hours' | 'half_day') || 'hours',
    event_date: (() => {
      const c = course as any;
      if (c?.startDate) return c.startDate.split('T')[0];
      if (c?.start_date) return c.start_date.split('T')[0];
      if (c?.fixedDate) return c.fixedDate.split('T')[0];
      if (c?.event_date) return c.event_date;
      return '';
    })(),
    end_date: (() => {
      const c = course as any;
      if (c?.endDate) return c.endDate.split('T')[0];
      if (c?.end_date) return c.end_date.split('T')[0];
      return '';
    })(),
    category: (() => {
      const cat = getCourseField('category');
      if (Array.isArray(cat)) return cat;
      return cat ? [cat] : [];
    })(),
    price: course?.price?.toString() || '',
    venue: course?.venue || '',
    hrdc_claimable: getCourseField('hrdcClaimable') || course?.hrdc_claimable || false,
    course_type: (() => {
      const c = course as any;
      const ct = c?.courseType || c?.course_type;
      if (Array.isArray(ct)) {
        if (ct.includes('IN_HOUSE') && ct.includes('PUBLIC')) return 'BOTH';
        if (ct.includes('PUBLIC')) return 'PUBLIC';
        return 'IN_HOUSE';
      }
      return ct || 'IN_HOUSE';
    })(),
    course_mode: (() => {
      const c = course as any;
      const cm = c?.courseMode || c?.course_mode;
      if (Array.isArray(cm)) return cm;
      return cm ? [cm] : ['PHYSICAL'];
    })(),
    city: getCourseField('city') || '',
    state: getCourseField('state') || '',
    status: (() => {
      const c = course as any;
      const status = c?.status || 'draft';
      // Normalize status to lowercase with underscore format for form handling
      return typeof status === 'string' ? status.toLowerCase().replace('_', ' ') : 'draft';
    })(),
    created_by_admin: getCourseField('createdByAdmin') !== undefined ? getCourseField('createdByAdmin') : (course?.created_by_admin ?? true),
    image_url: course?.image_url || getCourseField('imageUrl') || '',
    delivery_languages: (() => {
      const c = course as any;
      const dl = c?.deliveryLanguages || c?.delivery_languages;
      if (Array.isArray(dl)) return dl;
      return dl ? [dl] : ['English'];
    })(),
  });
  const [loading, setLoading] = useState(false);
  const [showImageLibrary, setShowImageLibrary] = useState(false);
  const [libraryImages, setLibraryImages] = useState<any[]>([]);

  useEffect(() => {
    fetchTrainers();
    if (course?.id) {
      fetchCourseTrainers();
      fetchCourseSchedule();
      updateFormDataFromCourse();
    }
  }, [course?.id]);

  // Update library images when categories change
  useEffect(() => {
    const fetchLibraryImages = async () => {
      const selectedCats = Array.isArray(formData.category) ? formData.category : [];
      if (selectedCats.length === 0) {
        setLibraryImages([]);
        return;
      }

      try {
        const allImages = await Promise.all(
          selectedCats.map(async (cat) => {
            try {
              const { images } = await apiClient.getCategoryImages(cat);
              return images || [];
            } catch (err) {
              console.error(`Error fetching images for category ${cat}:`, err);
              return [];
            }
          })
        );
        // Flatten the array of arrays
        setLibraryImages(allImages.flat());
      } catch (error) {
        console.error('Error in fetchLibraryImages:', error);
      }
    };

    fetchLibraryImages();
  }, [formData.category]);

  // Separate useEffect to update learning strings when course data is loaded
  useEffect(() => {
    if (course) {
      const c = course as any;

      // Update learning objectives string
      const objectives = c?.learningObjectives || c?.learning_objectives;
      if (objectives !== undefined) {
        setLearningObjectives(Array.isArray(objectives) ? objectives.join('\n') : (objectives || ''));
      }

      // Update learning outcomes string
      const outcomes = c?.learningOutcomes || c?.learning_outcomes;
      if (outcomes !== undefined) {
        setLearningOutcomes(Array.isArray(outcomes) ? outcomes.join('\n') : (outcomes || ''));
      }

      // Update formData when course has detailed fields
      if (course.id && (c.learningObjectives !== undefined || c.learningOutcomes !== undefined || c.targetAudience !== undefined)) {
        updateFormDataFromCourse();
        fetchCourseTrainers();
      }
    }
  }, [course?.id, (course as any)?.learningObjectives, (course as any)?.learningOutcomes, (course as any)?.targetAudience]);

  const updateFormDataFromCourse = () => {
    if (!course) return;

    const c = course as any;

    // Debug logging
    console.log('Updating formData from course:', {
      learningObjectives: c.learningObjectives,
      learningOutcomes: c.learningOutcomes,
      targetAudience: c.targetAudience,
      methodology: c.methodology,
      prerequisite: c.prerequisite,
    });

    // Handle learning objectives - can be array, string, or JSON
    let learningObjectivesValue = '';
    if (c.learningObjectives !== undefined && c.learningObjectives !== null) {
      if (Array.isArray(c.learningObjectives)) {
        learningObjectivesValue = c.learningObjectives.join('\n');
      } else if (typeof c.learningObjectives === 'string') {
        learningObjectivesValue = c.learningObjectives;
      } else if (typeof c.learningObjectives === 'object') {
        // Handle JSON object - try to parse
        try {
          const parsed = Array.isArray(c.learningObjectives) ? c.learningObjectives : JSON.parse(JSON.stringify(c.learningObjectives));
          learningObjectivesValue = Array.isArray(parsed) ? parsed.join('\n') : String(parsed);
        } catch {
          learningObjectivesValue = String(c.learningObjectives);
        }
      }
    } else if (c.learning_objectives !== undefined && c.learning_objectives !== null) {
      if (Array.isArray(c.learning_objectives)) {
        learningObjectivesValue = c.learning_objectives.join('\n');
      } else if (typeof c.learning_objectives === 'string') {
        learningObjectivesValue = c.learning_objectives;
      }
    }

    // Handle learning outcomes - can be array, string, or JSON
    let learningOutcomesValue = '';
    if (c.learningOutcomes !== undefined && c.learningOutcomes !== null) {
      if (Array.isArray(c.learningOutcomes)) {
        learningOutcomesValue = c.learningOutcomes.join('\n');
      } else if (typeof c.learningOutcomes === 'string') {
        learningOutcomesValue = c.learningOutcomes;
      } else if (typeof c.learningOutcomes === 'object') {
        try {
          const parsed = Array.isArray(c.learningOutcomes) ? c.learningOutcomes : JSON.parse(JSON.stringify(c.learningOutcomes));
          learningOutcomesValue = Array.isArray(parsed) ? parsed.join('\n') : String(parsed);
        } catch {
          learningOutcomesValue = String(c.learningOutcomes);
        }
      }
    } else if (c.learning_outcomes !== undefined && c.learning_outcomes !== null) {
      if (Array.isArray(c.learning_outcomes)) {
        learningOutcomesValue = c.learning_outcomes.join('\n');
      } else if (typeof c.learning_outcomes === 'string') {
        learningOutcomesValue = c.learning_outcomes;
      }
    }

    // Update state for smart parsed fields
    if (learningObjectivesValue !== '') setLearningObjectives(learningObjectivesValue);
    if (learningOutcomesValue !== '') setLearningOutcomes(learningOutcomesValue);

    // Always update values - use the value from course if it exists, otherwise keep prev
    setFormData(prev => {
      const updated = {
        ...prev,
        title: course.title || prev.title,
        description: course.description || prev.description,
        // For string fields, check if they exist in course, even if empty string
        target_audience: (() => {
          const val = (c.targetAudience !== undefined) ? c.targetAudience : ((c.target_audience !== undefined) ? c.target_audience : null);
          if (val === null) return prev.target_audience;
          return Array.isArray(val) ? val.join('\n') : String(val || '');
        })(),
        methodology: (() => {
          const val = c.methodology;
          if (val === undefined) return prev.methodology;
          return Array.isArray(val) ? val.join('\n') : String(val || '');
        })(),
        prerequisite: (() => {
          const val = c.prerequisite;
          if (val === undefined) return prev.prerequisite;
          return Array.isArray(val) ? val.join('\n') : String(val || '');
        })(),
        category: (() => {
          const cat = c.category;
          if (cat === undefined || cat === null) return prev.category;
          if (Array.isArray(cat)) return cat;
          return [String(cat)];
        })(),
        course_type: (c.courseType || c.course_type) || prev.course_type,
        course_mode: (c.courseMode || c.course_mode) || prev.course_mode,
        duration_hours: (c.durationHours || c.duration_hours) ? String(c.durationHours || c.duration_hours) : prev.duration_hours,
        duration_unit: (c.durationUnit || c.duration_unit as 'days' | 'hours' | 'half_day') || prev.duration_unit,
        city: (c.city !== undefined && c.city !== null) ? String(c.city) : prev.city,
        state: (c.state !== undefined && c.state !== null) ? String(c.state) : prev.state,
        delivery_languages: (() => {
          const dl = c.deliveryLanguages || c.delivery_languages;
          if (dl === undefined || dl === null) return prev.delivery_languages;
          if (Array.isArray(dl)) return dl;
          return [String(dl)];
        })(),
      };

      console.log('Updated formData:', {
        target_audience: updated.target_audience,
        methodology: updated.methodology,
        prerequisite: updated.prerequisite,
      });
      return updated;
    });
  };

  const fetchCourseSchedule = async () => {
    if (!course) return;

    setLoadingSchedule(true);
    try {
      const response = await apiClient.getCourseSchedule(course.id);
      const schedule = response.schedule || [];

      // Transform schedule items to match ScheduleBuilder format
      // New structure: one module per row (moduleTitle is string, not array)
      const scheduleWithSubmodules = schedule.map((item: any) => {
        // moduleTitle is now a string (one module per row)
        const moduleTitle = typeof item.moduleTitle === 'string'
          ? item.moduleTitle
          : (typeof item.module_title === 'string' ? item.module_title : '');

        // Parse submodule_title - can be array or string
        let submodules: string[] = [];
        if (Array.isArray(item.submoduleTitle)) {
          submodules = item.submoduleTitle;
        } else if (typeof item.submoduleTitle === 'string' && item.submoduleTitle) {
          submodules = [item.submoduleTitle];
        } else if (Array.isArray(item.submodule_title)) {
          submodules = item.submodule_title;
        } else if (typeof item.submodule_title === 'string' && item.submodule_title) {
          submodules = [item.submodule_title];
        }

        return {
          id: item.id || `schedule-${Date.now()}-${Math.random()}`,
          day_number: item.dayNumber || item.day_number,
          start_time: item.startTime || item.start_time,
          end_time: item.endTime || item.end_time,
          module_title: moduleTitle,
          module_titles: [moduleTitle], // Array for backward compat
          submodule_title: submodules.length > 0 ? submodules[0] : null,
          submodules: submodules,
          duration_minutes: item.durationMinutes || item.duration_minutes || 120,
        };
      });

      setScheduleItems(scheduleWithSubmodules);
    } catch (error) {
      console.error('Error loading course schedule:', error);
      setScheduleItems([]);
    } finally {
      setLoadingSchedule(false);
    }
  };


  const fetchTrainers = async () => {
    try {
      const response = await apiClient.getTrainers();
      // Map backend format to frontend format
      const mappedTrainers = (response.trainers || []).map((t: any) => ({
        id: t.id,
        user_id: t.userId || null,
        email: t.email || '',
        full_name: t.fullName || '',
        phone: t.phoneNumber || null,
        specialization: Array.isArray(t.areasOfExpertise) && t.areasOfExpertise.length > 0
          ? t.areasOfExpertise[0]
          : null,
        bio: t.professionalBio || null,
        hourly_rate: null,
        hrdc_certified: !!t.hrdcAccreditationId,
        created_at: t.createdAt || new Date().toISOString(),
        updated_at: t.updatedAt || new Date().toISOString(),
      }));
      setTrainers(mappedTrainers);
      setFilteredTrainers(mappedTrainers);
    } catch (error) {
      console.error('Error fetching trainers:', error);
    }
  };

  useEffect(() => {
    if (!trainerSearchTerm.trim()) {
      setFilteredTrainers(trainers);
    } else {
      const searchLower = trainerSearchTerm.toLowerCase();
      const filtered = trainers.filter(trainer =>
        trainer.full_name?.toLowerCase().includes(searchLower) ||
        (trainer as any).organization?.toLowerCase().includes(searchLower) ||
        trainer.email?.toLowerCase().includes(searchLower) ||
        trainer.specialization?.toLowerCase().includes(searchLower)
      );
      setFilteredTrainers(filtered);
    }
  }, [trainerSearchTerm, trainers]);

  const fetchCourseTrainers = async () => {
    if (!course) return;

    try {
      const response = await apiClient.getAdminCourse(course.id);
      const fullCourse = response.course;

      if (!fullCourse) return;

      // Extract primary trainer and co-trainers from courseTrainers
      if (fullCourse.courseTrainers && Array.isArray(fullCourse.courseTrainers)) {
        const primary = fullCourse.courseTrainers.find((ct: any) => ct.role === 'PRIMARY');
        const coTrainers = fullCourse.courseTrainers
          .filter((ct: any) => ct.role === 'CO_TRAINER')
          .map((ct: any) => ct.trainerId || ct.trainer?.id)
          .filter(Boolean);

        setPrimaryTrainerId(primary ? (primary.trainerId || primary.trainer?.id) : null);
        setCoTrainerIds(coTrainers);
      } else if (fullCourse.trainerId) {
        // Fallback for legacy data
        setPrimaryTrainerId(fullCourse.trainerId);
        setCoTrainerIds([]);
      }
    } catch (error) {
      console.error('Error fetching course trainers:', error);
      if (course.trainer_id) {
        setPrimaryTrainerId(course.trainer_id);
      }
    }
  };

  const handleTrainerToggle = (trainerId: string, role: 'PRIMARY' | 'CO_TRAINER') => {
    if (role === 'PRIMARY') {
      setPrimaryTrainerId(trainerId === primaryTrainerId ? null : trainerId);
    } else {
      setCoTrainerIds(prev =>
        prev.includes(trainerId)
          ? prev.filter(id => id !== trainerId)
          : [...prev, trainerId]
      );
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleSection = (section: 'basic' | 'details' | 'schedule' | 'trainers' | 'image') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Smart parsing helper for array fields
      const parseArrayField = (input: string) => {
        if (!input) return [];
        return input
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);
      };

      const learningObjectivesArray = parseArrayField(learningObjectives);
      const learningOutcomesArray = parseArrayField(learningOutcomes);
      const targetAudienceArray = parseArrayField(formData.target_audience);
      const methodologyArray = parseArrayField(formData.methodology);
      const prerequisiteArray = parseArrayField(formData.prerequisite);


      // Prepare schedule to save - new structure: one module per row
      const scheduleToSave: any[] = [];
      scheduleItems.forEach((item) => {
        // module_title is now a string (one module per row)
        const moduleTitle = typeof item.module_title === 'string'
          ? item.module_title.trim()
          : '';

        // Only save if module title is not empty
        if (moduleTitle) {
          scheduleToSave.push({
            dayNumber: item.day_number,
            startTime: item.start_time,
            endTime: item.end_time,
            moduleTitle: moduleTitle, // String, not array
            submoduleTitle: item.submodules && item.submodules.length > 0
              ? item.submodules.filter((s: string) => s && s.trim()) // Array format
              : null,
            durationMinutes: item.duration_minutes,
          });
        }
      });

      // Save course first
      const courseData: any = {
        title: formData.title,
        description: formData.description,
        learningObjectives: learningObjectivesArray.length > 0 ? learningObjectivesArray : null,
        learningOutcomes: learningOutcomesArray.length > 0 ? learningOutcomesArray : null,
        targetAudience: targetAudienceArray.length > 0 ? targetAudienceArray : null,
        methodology: methodologyArray.length > 0 ? methodologyArray : null,
        prerequisite: prerequisiteArray.length > 0 ? prerequisiteArray : null,
        certificate: formData.certificate || null,
        assessment: formData.assessment,
        price: formData.price ? parseFloat(formData.price) : null,
        // ... duration logic remains ...
        durationHours: (() => {
          const raw = parseFloat(String(formData.duration_hours));
          if (!formData.duration_hours || isNaN(raw)) return null;
          if (formData.duration_unit === 'half_day') return 5;
          return Math.round(raw);
        })(),
        durationUnit: formData.duration_unit,
        startDate: null,
        endDate: null, // Removed End Date as per requirement
        fixedDate: null,
        venue: formData.venue || null,
        category: formData.category && formData.category.length > 0 ? formData.category : null,
        hrdcClaimable: formData.hrdc_claimable,
        courseType: formData.course_type === 'BOTH' ? ['IN_HOUSE', 'PUBLIC'] : [formData.course_type],
        courseMode: Array.isArray(formData.course_mode) && formData.course_mode.length > 0 ? formData.course_mode : ['PHYSICAL'],
        professionalDevelopmentPoints: formData.professional_development_points || null,
        professionalDevelopmentPointsOther: formData.professional_development_points === 'OTHERS' ? formData.professional_development_points_other : null,
        status: formData.status.toUpperCase().replace(' ', '_') as any,
        createdByAdmin: formData.created_by_admin,
        primaryTrainerId: primaryTrainerId,
        coTrainerIds: coTrainerIds,
        city: formData.city || null,
        state: formData.state || null,
        deliveryLanguages: formData.delivery_languages,
        imageUrl: formData.image_url,
      };

      await onSubmit(
        courseData as Partial<Course>,
        primaryTrainerId ? [primaryTrainerId, ...coTrainerIds] : coTrainerIds,
        imageFile || undefined
      );

      // Save schedule if course exists and schedule items are provided
      // For edit: course.id exists
      // For create: schedule will be saved after course is created (if needed in future)
      const courseId = course?.id;
      if (courseId && scheduleToSave.length > 0) {
        try {
          await apiClient.updateCourseSchedule(courseId, scheduleToSave);
        } catch (scheduleError) {
          console.error('Error saving schedule:', scheduleError);
          // Don't throw - schedule is optional, course was already saved
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-20">
      <Card title={course ? 'Edit Course' : 'Create New Course'}>
        <div className="space-y-6">

          {/* Basic Information Section */}
          <div className="mb-8">
            <button
              type="button"
              onClick={() => toggleSection('basic')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all border border-gray-100"
            >
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <span className="w-8 h-8 bg-teal-100 text-teal-600 rounded-lg flex items-center justify-center mr-3 text-sm">1</span>
                Basic Information
              </h3>
              {expandedSections.basic ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
            {expandedSections.basic && (
              <div className="mt-6 p-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Course Image Area */}
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Course Image
                    </label>
                    <div className="flex items-start gap-4">
                      <div className="w-40 h-40 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-200 group hover:border-teal-300 transition-colors">
                        {imagePreview || formData.image_url ? (
                          <img
                            src={imagePreview || (formData.image_url.startsWith('http') || formData.image_url.startsWith('data:') ? formData.image_url : `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${formData.image_url}`)}
                            alt="Course Preview"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <ImageIcon className="w-10 h-10 text-gray-300 group-hover:text-teal-400 transition-colors" />
                        )}
                      </div>
                      <div className="flex flex-col gap-2 mt-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                          id="course-image-upload"
                        />
                        <div className="flex flex-col gap-2">
                          <label
                            htmlFor="course-image-upload"
                            className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <Upload className="w-4 h-4 mr-2 text-teal-500" />
                            {formData.image_url || imagePreview ? 'Change Image' : 'Upload Image'}
                          </label>

                          <button
                            type="button"
                            onClick={() => setShowImageLibrary(true)}
                            className="inline-flex items-center px-4 py-2 bg-teal-50 border border-teal-100 rounded-lg shadow-sm text-sm font-medium text-teal-700 hover:bg-teal-100 transition-colors"
                          >
                            <Layers className="w-4 h-4 mr-2" />
                            Select from Library
                          </button>
                        </div>

                        <p className="text-[10px] text-gray-400 mt-1 max-w-[120px]">
                          JPG, PNG or WEBP. Max size 5MB.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status Box (Top Right) */}
                  <div className="md:col-span-1 flex justify-end items-start pt-7">
                    <div className="w-full max-w-[200px]">
                      <Select
                        label="Course Status"
                        value={formData.status.toLowerCase().replace('_', ' ')}
                        onChange={(e) => {
                          const statusValue = e.target.value.toUpperCase().replace(' ', '_');
                          setFormData({ ...formData, status: statusValue as any });
                        }}
                        options={[
                          { value: 'draft', label: 'Draft' },
                          { value: 'pending_approval', label: 'Pending Approval' },
                          { value: 'approved', label: 'Approved' },
                          { value: 'denied', label: 'Denied' },
                        ]}
                      />
                    </div>
                  </div>

                  {/* Course Title (Full Width) */}
                  <div className="md:col-span-2">
                    <Input
                      label="Course Title *"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      placeholder="Enter a compelling course title"
                      className="text-lg font-medium"
                    />
                  </div>

                  {/* Description (Full Width) */}
                  <div className="md:col-span-2">
                    <Textarea
                      label="Description *"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      required
                      placeholder="Describe what makes this course special..."
                    />
                  </div>

                  {/* Category Grid (Left 50%) */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Categories (Select relevant areas)
                      </label>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 p-3 border border-gray-100 rounded-xl bg-gray-50/50">
                        {COURSE_CATEGORIES.map(cat => (
                          <label key={cat} className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-white rounded-lg transition-all group">
                            <input
                              type="checkbox"
                              checked={Array.isArray(formData.category) && formData.category.includes(cat)}
                              onChange={(e) => {
                                const currentCats = Array.isArray(formData.category) ? formData.category : [];
                                if (e.target.checked) {
                                  setFormData({ ...formData, category: [...currentCats, cat] });
                                } else {
                                  setFormData({ ...formData, category: currentCats.filter((c: string) => c !== cat) });
                                }
                              }}
                              className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
                            />
                            <span className="text-xs text-gray-600 group-hover:text-teal-700 truncate" title={cat}>
                              {cat}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Course Duration
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <Select
                          value={formData.duration_unit}
                          onChange={(e) => {
                            const newUnit = e.target.value as 'days' | 'hours' | 'half_day';
                            if (newUnit === 'half_day') {
                              setFormData({ ...formData, duration_unit: newUnit, duration_hours: '5' });
                            } else {
                              setFormData({ ...formData, duration_unit: newUnit });
                            }
                          }}
                          options={[
                            { value: 'hours', label: 'Hours' },
                            { value: 'days', label: 'Days' },
                            { value: 'half_day', label: 'Half Day' },
                          ]}
                        />
                        <Input
                          type="number"
                          value={formData.duration_unit === 'half_day' ? '5' : formData.duration_hours}
                          onChange={(e) => setFormData({ ...formData, duration_hours: e.target.value })}
                          placeholder="Duration"
                          disabled={formData.duration_unit === 'half_day'}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Professional Development Points
                        </label>
                        <Select
                          value={formData.professional_development_points}
                          onChange={(e) => setFormData({
                            ...formData,
                            professional_development_points: e.target.value,
                            professional_development_points_other: e.target.value !== 'OTHERS' ? '' : formData.professional_development_points_other
                          })}
                          options={[
                            { value: '', label: 'Select PDP type' },
                            { value: 'MBOT-CPD', label: 'MBOT-CPD' },
                            { value: 'BEM-CPD', label: 'BEM-CPD' },
                            { value: 'DOSH-CEP', label: 'DOSH-CEP' },
                            { value: 'BOVAEA-CPD', label: 'BOVAEA-CPD' },
                            { value: 'CIDB-CCD', label: 'CIDB-CCD' },
                            { value: 'EC/ST-CDP', label: 'EC/ST-CDP' },
                            { value: 'OTHERS', label: 'Others' },
                          ]}
                        />
                        {formData.professional_development_points === 'OTHERS' && (
                          <Input
                            label="Please specify"
                            value={formData.professional_development_points_other}
                            onChange={(e) => setFormData({ ...formData, professional_development_points_other: e.target.value })}
                            placeholder="Enter professional development points"
                            className="mt-2"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Type, Mode, Certificate, Assessment (Right 50%) */}
                  <div className="space-y-6 bg-white p-4 rounded-xl border border-gray-100">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Course Type
                      </label>
                      <Select
                        value={formData.course_type}
                        onChange={(e) => setFormData({ ...formData, course_type: e.target.value })}
                        options={[
                          { value: 'IN_HOUSE', label: 'In-House only' },
                          { value: 'PUBLIC', label: 'Public only' },
                          { value: 'BOTH', label: 'In-House and Public' },
                        ]}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 font-semibold">
                        Course Mode
                      </label>
                      <div className="flex flex-wrap gap-6 mt-1">
                        {['PHYSICAL', 'ONLINE', 'HYBRID'].map((mode) => (
                          <label key={mode} className="flex items-center gap-2 cursor-pointer group">
                            <div className="relative flex items-center">
                              <input
                                type="checkbox"
                                checked={Array.isArray(formData.course_mode) && formData.course_mode.includes(mode)}
                                onChange={(e) => {
                                  const currentModes = Array.isArray(formData.course_mode) ? formData.course_mode : [];
                                  if (e.target.checked) {
                                    setFormData({ ...formData, course_mode: [...currentModes, mode] });
                                  } else {
                                    setFormData({ ...formData, course_mode: currentModes.filter((m: string) => m !== mode) });
                                  }
                                }}
                                className="w-5 h-5 text-teal-600 rounded-md border-gray-300 focus:ring-teal-500 transition-all"
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-600 group-hover:text-teal-700 transition-colors">
                              {mode === 'ONLINE' ? 'Online' : mode === 'HYBRID' ? 'Hybrid' : mode}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 font-semibold">
                        Delivery Language *
                      </label>
                      <div className="flex flex-col gap-2 mt-1">
                        {['English', 'Malay', 'Mandarin'].map((lang) => {
                          const currentLangs = formData.delivery_languages || [];
                          return (
                            <label key={lang} className="flex items-center gap-2 cursor-pointer group">
                              <div className="relative flex items-center">
                                <input
                                  type="checkbox"
                                  checked={currentLangs.includes(lang)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFormData({ ...formData, delivery_languages: [...currentLangs, lang] });
                                    } else {
                                      setFormData({ ...formData, delivery_languages: currentLangs.filter(l => l !== lang) });
                                    }
                                  }}
                                  className="w-5 h-5 text-teal-600 rounded-md border-gray-300 focus:ring-teal-500 transition-all"
                                />
                              </div>
                              <span className="text-sm font-medium text-gray-600 group-hover:text-teal-700 transition-colors">
                                {lang}
                              </span>
                            </label>
                          );
                        })}

                        {/* Others Option */}
                        <div className="flex flex-col gap-2">
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <div className="relative flex items-center">
                              <input
                                type="checkbox"
                                checked={formData.delivery_languages?.some(l => !['English', 'Malay', 'Mandarin'].includes(l))}
                                onChange={(e) => {
                                  const currentLangs = formData.delivery_languages || [];
                                  if (e.target.checked) {
                                    if (!currentLangs.some(l => !['English', 'Malay', 'Mandarin'].includes(l))) {
                                      setFormData({ ...formData, delivery_languages: [...currentLangs, 'Other'] });
                                    }
                                  } else {
                                    setFormData({ ...formData, delivery_languages: currentLangs.filter(l => ['English', 'Malay', 'Mandarin'].includes(l)) });
                                  }
                                }}
                                className="w-5 h-5 text-teal-600 rounded-md border-gray-300 focus:ring-teal-500 transition-all"
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-600 group-hover:text-teal-700 transition-colors">
                              Others
                            </span>
                          </label>

                          {formData.delivery_languages?.some(l => !['English', 'Malay', 'Mandarin'].includes(l)) && (
                            <Input
                              value={formData.delivery_languages.find(l => !['English', 'Malay', 'Mandarin'].includes(l)) || ''}
                              onChange={(e) => {
                                const currentLangs = formData.delivery_languages || [];
                                const baseLangs = currentLangs.filter(l => ['English', 'Malay', 'Mandarin'].includes(l));
                                setFormData({ ...formData, delivery_languages: [...baseLangs, e.target.value] });
                              }}
                              placeholder="Specify other language"
                              className="mt-1"
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Certificate Issued
                      </label>
                      <Select
                        value={formData.certificate}
                        onChange={(e) => setFormData({ ...formData, certificate: e.target.value })}
                        options={[
                          { value: '', label: 'None' },
                          { value: 'CERTIFICATE_OF_ATTENDANCE', label: 'Certificate of Attendance' },
                          { value: 'PROFESSIONAL_CERTIFICATION', label: 'Professional Certification' },
                        ]}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="block text-sm font-semibold text-gray-800">Assessment Required</span>
                        <p className="text-xs text-gray-500">Toggle if students need to pass a test</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, assessment: !formData.assessment })}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ring-2 ring-offset-2 ${formData.assessment ? 'bg-teal-600 ring-teal-500' : 'bg-gray-200 ring-gray-100'}`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.assessment ? 'translate-x-5' : 'translate-x-0'}`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="block text-sm font-semibold text-gray-800">HRDC Claimable</span>
                        <p className="text-xs text-gray-500">Can companies claim this via HRDC?</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, hrdc_claimable: !formData.hrdc_claimable })}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ring-2 ring-offset-2 ${formData.hrdc_claimable ? 'bg-teal-600 ring-teal-500' : 'bg-gray-200 ring-gray-100'}`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.hrdc_claimable ? 'translate-x-5' : 'translate-x-0'}`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Remaining Fields (Full Width or Grid as appropriate) */}
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                    <Input
                      label="Price (MYR)"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
                    />
                    <Input
                      label="Venue"
                      value={formData.venue}
                      onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                      placeholder="Location"
                    />
                    <Input
                      label="City"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="City"
                    />
                    <Input
                      label="State"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="State"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="mb-8">
            <button
              type="button"
              onClick={() => toggleSection('details')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <h3 className="text-lg font-semibold text-gray-900">Course Details</h3>
              {expandedSections.details ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
            {expandedSections.details && (
              <div className="mt-4 space-y-4">
                {/* Learning Objectives & Outcomes (Smart Parser) */}
                <div className="md:col-span-2">
                  <Textarea
                    label="Learning Objectives"
                    value={learningObjectives}
                    onChange={(e) => setLearningObjectives(e.target.value)}
                    rows={6}
                    placeholder="Enter learning objectives (one per line, bullets allowed)"
                    className="font-mono text-sm"
                  />
                  <p className="text-[10px] text-gray-500 mt-1 italic">
                    Tip: Use bullet points (•, -, *) or numbering (1., 2.). The system will automatically parse them.
                  </p>
                </div>

                <div className="md:col-span-2">
                  <Textarea
                    label="Learning Outcomes"
                    value={learningOutcomes}
                    onChange={(e) => setLearningOutcomes(e.target.value)}
                    rows={6}
                    placeholder="Enter learning outcomes (one per line, bullets allowed)"
                    className="font-mono text-sm"
                  />
                </div>

                {/* Other Array Fields */}
                <div className="md:col-span-1">
                  <Textarea
                    label="Target Audience"
                    value={formData.target_audience}
                    onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                    rows={4}
                    placeholder="Who is this course for? (one per line, bullets allowed)"
                    className="font-mono text-sm"
                  />
                  <p className="text-[10px] text-gray-500 mt-1 italic">
                    Tip: Use bullets (•, -, *) or numbering (1., 2.). The system will parse them into a list.
                  </p>
                </div>
                <div className="md:col-span-1">
                  <Textarea
                    label="Methodology"
                    value={formData.methodology}
                    onChange={(e) => setFormData({ ...formData, methodology: e.target.value })}
                    rows={4}
                    placeholder="How will this be taught? (one per line, bullets allowed)"
                    className="font-mono text-sm"
                  />
                  <p className="text-[10px] text-gray-500 mt-1 italic">
                    Tip: Bullets and numbering are automatically parsed.
                  </p>
                </div>
                <div className="md:col-span-2">
                  <Textarea
                    label="Prerequisites"
                    value={formData.prerequisite}
                    onChange={(e) => setFormData({ ...formData, prerequisite: e.target.value })}
                    rows={3}
                    placeholder="What should students know beforehand? (one per line, bullets allowed)"
                    className="font-mono text-sm"
                  />
                  <p className="text-[10px] text-gray-500 mt-1 italic">
                    Tip: Use bullets or numbers for list items.
                  </p>
                </div>

                {/* Trainer Assignment (Overhauled) */}
                <div className="md:col-span-2 border-t border-gray-100 pt-8 mt-4">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-lg font-bold text-gray-900 flex items-center">
                      <Users className="w-6 h-6 mr-2.5 text-teal-600" />
                      Trainer Assignment
                    </h4>
                    <span className="text-[10px] bg-teal-50 text-teal-700 px-3 py-1 rounded-full font-bold uppercase tracking-wider border border-teal-100">
                      Team Configuration
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Discovery Pane (Search & List) */}
                    <div className="lg:col-span-7 space-y-4">
                      <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                        <input
                          type="text"
                          placeholder="Search trainers by name or ID..."
                          value={trainerSearchTerm}
                          onChange={(e) => setTrainerSearchTerm(e.target.value)}
                          className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 focus:bg-white transition-all text-sm font-medium shadow-inner"
                        />
                      </div>

                      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                        <div className="p-3 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center px-4">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Available Experts</span>
                          <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded">{filteredTrainers.length} results</span>
                        </div>
                        <div className="max-h-[440px] overflow-y-auto p-2 space-y-1 custom-scrollbar">
                          {filteredTrainers.map((trainer) => {
                            const isPrimary = primaryTrainerId === trainer.id;
                            const isCoTrainer = coTrainerIds.includes(trainer.id);

                            return (
                              <div
                                key={trainer.id}
                                className={`flex items-center justify-between p-3 rounded-xl transition-all border ${isPrimary ? 'bg-teal-50 border-teal-200' :
                                  isCoTrainer ? 'bg-blue-50 border-blue-200' : 'bg-white border-transparent hover:border-gray-200 hover:shadow-sm'
                                  }`}
                              >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${isPrimary ? 'bg-teal-600 text-white' : isCoTrainer ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {trainer.full_name?.charAt(0) || 'T'}
                                  </div>
                                  <div className="truncate pr-4">
                                    <div className="text-sm font-bold text-gray-900 truncate" title={trainer.full_name}>
                                      {trainer.full_name}
                                    </div>
                                    <div className="text-[10px] text-gray-500 font-medium flex items-center gap-2">
                                      <span className="bg-gray-100 px-1.5 py-0.5 rounded">ID: {trainer.id.substring(0, 8)}</span>
                                      <span className="truncate">{(trainer as any).organization || trainer.specialization || 'Professional Trainer'}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex gap-2 flex-shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleTrainerToggle(trainer.id, 'PRIMARY')}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${isPrimary
                                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                                      : 'bg-white text-gray-600 border-gray-200 hover:border-teal-500 hover:text-teal-600'
                                      }`}
                                  >
                                    Set-Primary
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleTrainerToggle(trainer.id, 'CO_TRAINER')}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${isCoTrainer
                                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-500 hover:text-blue-600'
                                      }`}
                                    disabled={isPrimary}
                                  >
                                    Co-T
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                          {filteredTrainers.length === 0 && (
                            <div className="py-12 text-center">
                              <Search className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                              <p className="text-sm text-gray-400 font-medium italic">No trainers match your search.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Pane (Summary Area) */}
                    <div className="lg:col-span-5">
                      <div className="sticky top-4 space-y-6">
                        {/* Selected Primary */}
                        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                          <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Primary Representative</h5>
                          {primaryTrainerId ? (() => {
                            const pt = trainers.find(t => t.id === primaryTrainerId);
                            return (
                              <div className="flex items-center gap-4 bg-teal-50/30 p-4 rounded-xl border border-teal-100 relative group/card">
                                <div className="w-12 h-12 bg-teal-600 text-white rounded-xl shadow-md flex items-center justify-center text-lg font-bold">
                                  {pt?.full_name?.charAt(0) || pt?.email?.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-teal-900 truncate">{pt?.full_name || pt?.email}</p>
                                  <p className="text-[11px] text-teal-600 font-medium italic">Receives all booking requests</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setPrimaryTrainerId(null)}
                                  className="absolute -top-2 -right-2 bg-white border border-teal-200 text-teal-600 rounded-full p-1 shadow-sm opacity-0 group-hover/card:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-500 hover:border-red-200"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          })() : (
                            <div className="border-2 border-dashed border-gray-100 rounded-xl p-6 text-center">
                              <UserX className="w-6 h-6 text-gray-200 mx-auto mb-2" />
                              <p className="text-xs text-gray-400 font-medium italic">No primary trainer assigned</p>
                            </div>
                          )}
                        </div>

                        {/* Selected Co-Trainers */}
                        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm min-h-[200px]">
                          <div className="flex items-center justify-between mb-4">
                            <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Collaborators</h5>
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{coTrainerIds.length} Added</span>
                          </div>
                          <div className="space-y-2">
                            {coTrainerIds.map(id => {
                              const cot = trainers.find(t => t.id === id);
                              return (
                                <div key={id} className="flex items-center justify-between bg-gray-50 p-2.5 rounded-lg border border-gray-100 group/item">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-7 h-7 bg-blue-600 text-white rounded-md flex items-center justify-center text-[10px] font-bold">
                                      {cot?.full_name?.charAt(0) || 'T'}
                                    </div>
                                    <span className="text-xs font-bold text-gray-700 truncate">{cot?.full_name || 'Unknown'}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setCoTrainerIds(prev => prev.filter(tid => tid !== id))}
                                    className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              );
                            })}
                            {coTrainerIds.length === 0 && (
                              <div className="border-2 border-dashed border-gray-100 rounded-xl p-8 text-center bg-gray-50/30">
                                <p className="text-xs text-gray-300 font-medium italic">None selected</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                          <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
                            <span className="font-bold text-gray-700 uppercase mr-1">Note:</span>
                            The primary trainer is the public-facing representative for this course. Co-trainers have edit access but do not receive notification emails for new bookings.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Course Schedule Section */}
          <div className="mb-8">
            <button
              type="button"
              onClick={() => toggleSection('schedule')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all border border-gray-100"
            >
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <span className="w-8 h-8 bg-teal-100 text-teal-600 rounded-lg flex items-center justify-center mr-3 text-sm">3</span>
                Course Schedule (Optional)
              </h3>
              {expandedSections.schedule ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
            {expandedSections.schedule && (
              <div className="mt-6">
                {loadingSchedule ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <LoadingSpinner size="md" />
                    <p className="mt-2 text-sm text-gray-500">Loading schedule details...</p>
                  </div>
                ) : (
                  <ScheduleBuilder
                    scheduleItems={scheduleItems}
                    onChange={setScheduleItems}
                    requiredDurationHours={formData.duration_hours ? parseFloat(formData.duration_hours) : 1}
                    durationUnit={formData.duration_unit as 'days' | 'hours' | 'half_day'}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="flex justify-end items-center gap-4 fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg z-50 px-8">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="px-8"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          className="px-8 min-w-[120px]"
        >
          {loading ? (
            <div className="flex items-center">
              <LoadingSpinner size="sm" />
              <span className="ml-2">Saving...</span>
            </div>
          ) : (
            course ? 'Update Course' : 'Create Course'
          )}
        </Button>
      </div>

      {/* Image Library Modal */}
      {showImageLibrary && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Professional Image Library</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {formData.category?.length > 0
                    ? `Showing professional images for selected categories: ${formData.category.join(', ')}`
                    : "Showing all professional images. Select categories to filter."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowImageLibrary(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {libraryImages.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {libraryImages.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setFormData({ ...formData, image_url: img.imageUrl });
                        setImagePreview(null);
                        setImageFile(null);
                        setShowImageLibrary(false);
                      }}
                      className="group cursor-pointer relative bg-gray-100 rounded-2xl overflow-hidden aspect-video border-2 border-transparent hover:border-teal-500 transition-all shadow-sm hover:shadow-md"
                    >
                      <img
                        src={img.imageUrl}
                        alt={img.category}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                        <span className="text-white text-[10px] font-bold uppercase tracking-wider">{img.category}</span>
                      </div>
                      {formData.image_url === img.imageUrl && (
                        <div className="absolute top-2 right-2 bg-teal-600 text-white p-1 rounded-full shadow-lg">
                          <Plus className="w-3 h-3 rotate-45" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                    <Layers className="w-8 h-8 text-gray-200" />
                  </div>
                  <h4 className="text-gray-900 font-bold">No images found for these categories</h4>
                  <p className="text-gray-500 text-sm mt-1 max-w-xs">Try selecting different categories or uploading your own image.</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
              <p className="text-xs text-gray-500 font-medium">
                Tip: These images are curated to match professional industry standards.
              </p>
              <button
                type="button"
                onClick={() => setShowImageLibrary(false)}
                className="px-6 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
              >
                Close Library
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};
