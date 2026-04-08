import React, { useState, useEffect } from 'react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Course } from '../../types';
import { apiClient } from '../../lib/api-client';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface EventCreationFormProps {
  course: Course;
  onSubmit: (data: {
    availabilityIds: string[];
    courseType: 'IN_HOUSE' | 'PUBLIC';
    courseMode: 'PHYSICAL' | 'ONLINE' | 'HYBRID';
    price: string | null;
    venue: string | null;
    city: string | null;
    state: string | null;
    maxPacks?: number;
    registeredParticipants?: number;
    professionalDevelopmentPoints?: string | null;
    professionalDevelopmentPointsOther?: string | null;
  }) => Promise<void>;
  onCancel: () => void;
  isBookingSource?: boolean;
  initialData?: {
    location?: string;
    city?: string;
    state?: string;
    numberOfParticipants?: number;
    requestType?: string;
    requestedDate?: string | Date | null;
    endDate?: string | Date | null;
    selectedDates?: string[] | null;
  };
}

export const EventCreationForm: React.FC<EventCreationFormProps> = ({
  course,
  onSubmit,
  onCancel,
  isBookingSource = false,
  initialData,
}) => {
  const [selectedAvailabilityIds, setSelectedAvailabilityIds] = useState<string[]>([]);
  const [availableDates, setAvailableDates] = useState<Array<{ date: string; availabilityId: string }>>([]);
  const [loadingDates, setLoadingDates] = useState(false);

  // Calculate number of days needed based on course duration
  const calculateDaysNeeded = (): number => {
    const duration = course.duration_hours || (course as any).durationHours;
    if (!duration || duration <= 0) return 1;

    const unit = ((course as any).duration_unit || (course as any).durationUnit || 'hours').toLowerCase();

    if (unit === 'days') {
      return Math.ceil(duration);
    } else if (unit === 'half_day') {
      return Math.ceil(duration * 0.5);
    } else {
      // Default: hours - assume 8 hours per day
      return Math.ceil(duration / 8);
    }
  };

  const daysNeeded = calculateDaysNeeded();
  const [courseType, setCourseType] = useState<'IN_HOUSE' | 'PUBLIC'>(
    initialData?.requestType === 'INHOUSE' ? 'IN_HOUSE' : 'PUBLIC'
  );
  const [courseMode, setCourseMode] = useState<'PHYSICAL' | 'ONLINE' | 'HYBRID'>('PHYSICAL');
  const [price, setPrice] = useState(course.price?.toString() || '');
  const [venue, setVenue] = useState(initialData?.location || course.venue || '');
  const [city, setCity] = useState(initialData?.city || (course as any).city || '');
  const [state, setState] = useState(initialData?.state || (course as any).state || '');
  const [maxPacks, setMaxPacks] = useState('');
  const [registeredParticipants, setRegisteredParticipants] = useState(
    initialData?.numberOfParticipants?.toString() || ''
  );
  const [professionalDevelopmentPoints, setProfessionalDevelopmentPoints] = useState(
    (course as any).professionalDevelopmentPoints || ''
  );
  const [professionalDevelopmentPointsOther, setProfessionalDevelopmentPointsOther] = useState(
    (course as any).professionalDevelopmentPointsOther || ''
  );
  const [isInOffice, setIsInOffice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [useAlternateDates, setUseAlternateDates] = useState(false);
  const [hasPrefilled, setHasPrefilled] = useState(false);

  // In-Office effect: when checked, prefill from initialData (client's requested location)
  // When unchecked, fall back to course defaults
  useEffect(() => {
    if (isInOffice && initialData && courseType === 'IN_HOUSE') {
      setVenue(initialData.location || '');
      setCity(initialData.city || '');
      setState(initialData.state || '');
    } else if (!isInOffice && courseType === 'IN_HOUSE') {
      // If we're coming from a booking, initial state already has booking data
      // If user unchecks "In-Office", maybe they want to manually type or go back to course defaults
      // For now, let's keep what's there but allow manual editing
    }
  }, [isInOffice, initialData, courseType]);

  // Get trainer ID from course
  const trainerId = (course as any).trainer_id || (course as any).trainerId;

  // Get available course types and modes from the course
  const courseCourseTypes = Array.isArray((course as any).courseType)
    ? (course as any).courseType
    : ((course as any).courseType ? [(course as any).courseType] : []);
  const courseTypeAlt = Array.isArray((course as any).course_type)
    ? (course as any).course_type
    : ((course as any).course_type ? [(course as any).course_type] : []);
  const allCourseTypes = [...courseCourseTypes, ...courseTypeAlt].map(t => String(t).toUpperCase());
  const hasInHouse = allCourseTypes.includes('IN_HOUSE');
  const hasPublic = allCourseTypes.includes('PUBLIC');

  const courseCourseModes = Array.isArray((course as any).courseMode)
    ? (course as any).courseMode
    : ((course as any).courseMode ? [(course as any).courseMode] : []);
  const courseModeAlt = Array.isArray((course as any).course_mode)
    ? (course as any).course_mode
    : ((course as any).course_mode ? [(course as any).course_mode] : []);
  const allCourseModes = [...courseCourseModes, ...courseModeAlt].map(m => String(m).toUpperCase());
  const hasPhysical = allCourseModes.includes('PHYSICAL');
  const hasOnline = allCourseModes.includes('ONLINE');
  const hasHybrid = allCourseModes.includes('HYBRID');

  // Fetch trainer availability when component mounts
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!trainerId) {
        setAvailableDates([]);
        return;
      }

      try {
        setLoadingDates(true);
        const today = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 12);

        const availabilityResponse = await apiClient.getTrainerAvailability(trainerId, {
          startDate: today.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        });

        const availabilityArray = availabilityResponse?.availability || [];

        // Filter AVAILABLE and TENTATIVE dates (admin can use tentative dates)
        const available = availabilityArray.filter(
          (avail: any) => {
            const status = avail.status?.toUpperCase();
            return status === 'AVAILABLE' || status === 'TENTATIVE';
          }
        );

        // Map to date strings and availability IDs
        const dates = available.map((avail: any) => {
          let dateStr = '';
          if (avail.date) {
            if (typeof avail.date === 'string') {
              dateStr = avail.date.split('T')[0];
            } else {
              dateStr = new Date(avail.date).toISOString().split('T')[0];
            }
          }
          return {
            date: dateStr,
            availabilityId: avail.id,
          };
        }).filter(d => d.date).sort((a, b) => a.date.localeCompare(b.date));

        setAvailableDates(dates);
      } catch (error) {
        console.error('Error fetching trainer availability:', error);
        setAvailableDates([]);
      } finally {
        setLoadingDates(false);
      }
    };

    fetchAvailability();
  }, [trainerId]);

  // Pre-fill availability based on requestedDate and endDate (or specific selectedDates)
  useEffect(() => {
    if (availableDates.length > 0 && !hasPrefilled) {
      if (initialData?.selectedDates && Array.isArray(initialData.selectedDates)) {
        // Use specific selected dates (highest priority)
        const matchingIds = availableDates
          .filter(d => initialData.selectedDates?.includes(d.date))
          .map(d => d.availabilityId);
        
        if (matchingIds.length > 0) {
          setSelectedAvailabilityIds(matchingIds);
          setHasPrefilled(true);
        }
      } else if (initialData?.requestedDate) {
        // Fallback to range logic
        const reqDateStr = typeof initialData.requestedDate === 'string'
          ? initialData.requestedDate.split('T')[0]
          : new Date(initialData.requestedDate as any).toISOString().split('T')[0];

        const endDStr = initialData.endDate
          ? (typeof initialData.endDate === 'string'
            ? initialData.endDate.split('T')[0]
            : new Date(initialData.endDate as any).toISOString().split('T')[0])
          : null;

        // Find all IDs between reqDate and endD (inclusive)
        const matchingIds: string[] = [];

        if (endDStr) {
          availableDates.forEach(d => {
            if (d.date >= reqDateStr && d.date <= endDStr) {
              matchingIds.push(d.availabilityId);
            }
          });
        } else {
          const singleDate = availableDates.find(d => d.date === reqDateStr);
          if (singleDate) {
            matchingIds.push(singleDate.availabilityId);
          }
        }

        if (matchingIds.length > 0) {
          setSelectedAvailabilityIds(matchingIds);
          setHasPrefilled(true);
        }
      }
    }
  }, [availableDates, initialData, hasPrefilled]);

  // Initialize state based on available options
  useEffect(() => {
    if (hasPublic) {
      setCourseType('PUBLIC');
    } else if (hasInHouse) {
      setCourseType('IN_HOUSE');
    }

    if (hasPhysical) {
      setCourseMode('PHYSICAL');
    } else if (hasOnline) {
      setCourseMode('ONLINE');
    } else if (hasHybrid) {
      setCourseMode('HYBRID');
    }
  }, [hasInHouse, hasPublic, hasPhysical, hasOnline, hasHybrid]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (selectedAvailabilityIds.length !== daysNeeded) {
      const duration = course.duration_hours || (course as any).durationHours;
      const unit = (course as any).duration_unit || (course as any).durationUnit || 'hours';
      newErrors.availabilityIds = `Please select exactly ${daysNeeded} date(s) from trainer availability (based on course duration: ${duration} ${unit})`;
    }

    if (!courseType) {
      newErrors.courseType = 'Course type is required';
    }

    if (!courseMode) {
      newErrors.courseMode = 'Course mode is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDateToggle = (availabilityId: string) => {
    setSelectedAvailabilityIds(prev => {
      if (prev.includes(availabilityId)) {
        // Remove if already selected
        return prev.filter(id => id !== availabilityId);
      } else {
        // Add if not selected, but limit to daysNeeded
        if (prev.length >= daysNeeded) {
          return prev; // Don't add if we already have enough
        }
        return [...prev, availabilityId];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        availabilityIds: selectedAvailabilityIds,
        courseType,
        courseMode,
        price: price ? price : null,
        venue: venue || null,
        city: city || null,
        state: state || null,
        maxPacks: maxPacks ? parseInt(maxPacks) : undefined,
        registeredParticipants: registeredParticipants ? parseInt(registeredParticipants) : undefined,
        professionalDevelopmentPoints: professionalDevelopmentPoints || null,
        professionalDevelopmentPointsOther: professionalDevelopmentPointsOther || null,
      });
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setLoading(false);
    }
  };

  const selectedDates = availableDates.filter(d => selectedAvailabilityIds.includes(d.availabilityId));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">Course Information</h3>
        <p className="text-sm text-blue-800">
          <strong>Course:</strong> {course.title}
        </p>
        {course.description && (
          <p className="text-sm text-blue-800 mt-1">
            <strong>Description:</strong> {course.description.substring(0, 100)}
            {course.description.length > 100 ? '...' : ''}
          </p>
        )}
        <p className="text-sm text-blue-800 mt-1">
          <strong>Duration:</strong> {course.duration_hours || (course as any).durationHours} {((course as any).duration_unit || (course as any).durationUnit || 'hours')} ({daysNeeded} day{daysNeeded > 1 ? 's' : ''} needed)
        </p>
      </div>

      {!trainerId ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            This course doesn't have a trainer assigned. Please assign a trainer to the course first.
          </p>
        </div>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Event Dates * ({daysNeeded} date{daysNeeded > 1 ? 's' : ''} required based on course duration)
            </label>
            {loadingDates && (
              <div className="mt-2 flex items-center gap-2">
                <LoadingSpinner size="sm" />
                <p className="text-xs text-gray-500">Loading trainer availability...</p>
              </div>
            )}
            {!loadingDates && availableDates.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                No available dates found for this trainer. Please check trainer availability or select a different trainer.
              </p>
            )}
            {!loadingDates && availableDates.length > 0 && (
              <div className="mt-2 space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {availableDates.map((dateOption) => {
                  const isSelected = selectedAvailabilityIds.includes(dateOption.availabilityId);
                  const isDisabled = (!isSelected && selectedAvailabilityIds.length >= daysNeeded) || (hasPrefilled && !useAlternateDates);
                  return (
                    <label
                      key={dateOption.availabilityId}
                      className={`flex items-center space-x-2 p-2 rounded ${isSelected
                        ? 'bg-teal-50 border-2 border-teal-500'
                        : isDisabled
                          ? 'bg-gray-50 opacity-50 cursor-not-allowed'
                          : 'hover:bg-gray-50 border-2 border-transparent'
                        } ${hasPrefilled && !useAlternateDates ? '' : 'cursor-pointer'}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleDateToggle(dateOption.availabilityId)}
                        disabled={isDisabled}
                        className="w-4 h-4 text-teal-600 focus:ring-teal-500 rounded"
                      />
                      <span className="text-sm text-gray-700">
                        {new Date(dateOption.date).toLocaleDateString('en-MY', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          timeZone: 'Asia/Kuala_Lumpur',
                        })}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            {hasPrefilled && (
              <div className="mt-3 flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div>
                  <p className="text-xs font-bold text-amber-800">
                    Dates pre-filled from client request
                  </p>
                  {!useAlternateDates && (
                    <p className="text-[10px] text-amber-600">
                      Selection is locked to requested dates.
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant={useAlternateDates ? "outline" : "secondary"}
                  size="sm"
                  onClick={() => setUseAlternateDates(!useAlternateDates)}
                  className="text-xs h-8"
                >
                  {useAlternateDates ? "Lock to Requested" : "Change Dates"}
                </Button>
              </div>
            )}
            {errors.availabilityIds && (
              <p className="text-xs text-red-600 mt-1">{errors.availabilityIds}</p>
            )}
            {selectedDates.length > 0 && (
              <div className="mt-3 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-medium text-teal-900">Selected Dates ({selectedDates.length}/{daysNeeded}):</p>
                  {selectedDates.length > 0 && (
                    <p className="text-xs font-bold text-teal-700">
                      Range: {new Date(Math.min(...selectedDates.map(d => new Date(d.date).getTime()))).toLocaleDateString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })} - {new Date(Math.max(...selectedDates.map(d => new Date(d.date).getTime()))).toLocaleDateString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}
                    </p>
                  )}
                </div>
                <ul className="text-xs text-teal-800 space-y-1">
                  {selectedDates
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map((dateOption) => (
                      <li key={dateOption.availabilityId}>
                        • {new Date(dateOption.date).toLocaleDateString('en-MY', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          timeZone: 'Asia/Kuala_Lumpur',
                        })}
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Type * <span className="text-gray-500 text-xs">(Select ONE)</span>
            </label>
            <div className="space-y-2">
              {hasInHouse && (
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-50 rounded">
                    <input
                      type="radio"
                      name="courseType"
                      value="IN_HOUSE"
                      checked={courseType === 'IN_HOUSE'}
                      onChange={(e) => setCourseType(e.target.value as 'IN_HOUSE')}
                      className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-sm text-gray-700">In-House</span>
                  </label>

                  {courseType === 'IN_HOUSE' && initialData && (
                    <label className="flex items-center space-x-2 cursor-pointer p-2 ml-6 bg-amber-50 border border-amber-100 rounded">
                      <input
                        type="checkbox"
                        checked={isInOffice}
                        onChange={(e) => setIsInOffice(e.target.checked)}
                        className="w-4 h-4 text-amber-600 focus:ring-amber-500 rounded"
                      />
                      <span className="text-sm font-medium text-amber-800">In-Office Training (Prefill client location)</span>
                    </label>
                  )}
                </div>
              )}
              {hasPublic && (
                <label className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-50 rounded">
                  <input
                    type="radio"
                    name="courseType"
                    value="PUBLIC"
                    checked={courseType === 'PUBLIC'}
                    onChange={(e) => setCourseType(e.target.value as 'PUBLIC')}
                    className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm text-gray-700">Public</span>
                </label>
              )}
            </div>
            {errors.courseType && (
              <p className="text-xs text-red-600 mt-1">{errors.courseType}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Mode * <span className="text-gray-500 text-xs">(Select ONE)</span>
            </label>
            <div className="space-y-2">
              {hasPhysical && (
                <label className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-50 rounded">
                  <input
                    type="radio"
                    name="courseMode"
                    value="PHYSICAL"
                    checked={courseMode === 'PHYSICAL'}
                    onChange={(e) => setCourseMode(e.target.value as 'PHYSICAL')}
                    className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm text-gray-700">Physical</span>
                </label>
              )}
              {hasOnline && (
                <label className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-50 rounded">
                  <input
                    type="radio"
                    name="courseMode"
                    value="ONLINE"
                    checked={courseMode === 'ONLINE'}
                    onChange={(e) => setCourseMode(e.target.value as 'ONLINE')}
                    className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm text-gray-700">Online</span>
                </label>
              )}
              {hasHybrid && (
                <label className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-50 rounded">
                  <input
                    type="radio"
                    name="courseMode"
                    value="HYBRID"
                    checked={courseMode === 'HYBRID'}
                    onChange={(e) => setCourseMode(e.target.value as 'HYBRID')}
                    className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm text-gray-700">Hybrid</span>
                </label>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-full border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-4">Event Details & Location</h4>
            </div>

            <Input
              label="Total Number of People Who Can Attend"
              type="number"
              min="1"
              value={maxPacks}
              onChange={(e) => setMaxPacks(e.target.value)}
              placeholder="Total capacity (optional)"
              helperText="Leave blank for unlimited capacity"
            />

            {isBookingSource && (
              <Input
                label="Registered Participants (From Request)"
                type="number"
                min="1"
                value={registeredParticipants}
                onChange={(e) => setRegisteredParticipants(e.target.value)}
                placeholder="Number of participants"
                required
              />
            )}

            <Input
              label="Price"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Event price (optional)"
            />
            <Input
              label="Venue"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="Event venue (optional)"
            />
            <Input
              label="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City (optional)"
            />
            <Input
              label="State"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="State (optional)"
            />

            <div className="col-span-full border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-4">Professional Development Points</h4>
            </div>

            <Input
              label="Points"
              value={professionalDevelopmentPoints}
              onChange={(e) => setProfessionalDevelopmentPoints(e.target.value)}
              placeholder="e.log. 10 Points"
            />
            <Input
              label="Additional Points Info"
              value={professionalDevelopmentPointsOther}
              onChange={(e) => setProfessionalDevelopmentPointsOther(e.target.value)}
              placeholder="e.g. 5 Hours"
            />
          </div>
        </>
      )}

      <div className="flex space-x-4 pt-4 border-t">
        <Button
          type="submit"
          variant="primary"
          disabled={loading || !trainerId || selectedAvailabilityIds.length !== daysNeeded}
          className="flex-1"
        >
          {loading ? 'Creating Event...' : isBookingSource ? 'Confirm & Create Event' : 'Create Event'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};
