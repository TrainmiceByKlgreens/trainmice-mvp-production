import { useState, useEffect } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Toggle } from '../ui/Toggle';
import { TextareaWithLimit } from '../ui/TextareaWithLimit';
import { DynamicListInput } from './DynamicListInput';
import { Check } from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { useAuth } from '../../contexts/AuthContext';
import { COURSE_CATEGORIES } from '../../utils/categories';

interface CourseBasicInfoProps {
  formData: {
    title: string;
    duration_hours: number;
    duration_unit: 'days' | 'hours' | 'half_day';
    course_type: string | null;
    course_mode: string[] | string | null;
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
  };
  onChange: (data: any) => void;
  errors?: Record<string, string>;
}

export function CourseBasicInfoForm({ formData, onChange, errors = {} }: CourseBasicInfoProps) {
  const [durationInput, setDurationInput] = useState<string>('1');

  useEffect(() => {
    // Display the raw input value (not converted)
    // duration_hours now contains the raw value for all units
    if (formData.duration_unit === 'half_day') {
      setDurationInput('0.5');
    } else {
      setDurationInput(String(formData.duration_hours));
    }
  }, [formData.duration_hours, formData.duration_unit]);


  const handleDurationUnitChange = (unit: 'days' | 'hours' | 'half_day') => {
    const currentDuration = parseFloat(durationInput) || 1;
    // Store the raw input value based on unit - no conversion
    let rawValue = currentDuration;

    if (unit === 'hours') {
      rawValue = Math.min(Math.max(currentDuration, 1), 5);
    } else if (unit === 'half_day') {
      // Half day is fixed at 0.5 (we'll convert to 4.5 hours only when storing)
      rawValue = 0.5;
    } else if (unit === 'days') {
      // For days, store the raw day count (e.g., 2 for 2 days)
      rawValue = currentDuration;
    }

    // Store raw value - no conversion to hours
    onChange({ ...formData, duration_unit: unit, duration_hours: rawValue });
  };

  const handleDurationInputChange = (value: string) => {
    setDurationInput(value);
    const numValue = parseFloat(value);

    if (!isNaN(numValue) && numValue > 0) {
      // Store raw value based on unit - no conversion
      let rawValue = numValue;
      if (formData.duration_unit === 'hours') {
        rawValue = Math.min(Math.max(numValue, 1), 5);
      } else if (formData.duration_unit === 'half_day') {
        rawValue = 0.5; // Half day is always 0.5 (will be converted to 4.5 hours when storing)
      }
      // For days, use numValue as-is (raw day count)
      onChange({ ...formData, duration_hours: rawValue });
    }
  };

  // Check if we need to show end date field
  // Show end date if duration > 9 hours OR if duration is in days and > 1 day
  const needsEndDate = () => {
    if (formData.duration_unit === 'days') {
      // For days, check if duration_hours (which is already converted) > 9
      return formData.duration_hours > 9;
    } else {
      // For hours, check if > 9 hours
      return formData.duration_hours > 9;
    }
  };


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <Input
            label="Course Name"
            value={formData.title}
            onChange={(e) => onChange({ ...formData, title: e.target.value })}
            placeholder="Enter course name"
            error={errors.title}
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <div className="grid grid-cols-2 gap-2 p-3 border rounded-md max-h-48 overflow-y-auto bg-white">
            {COURSE_CATEGORIES.map(cat => {
              const currentCats = Array.isArray(formData.category)
                ? formData.category
                : (typeof formData.category === 'string' ? [formData.category] : []);

              return (
                <label key={cat} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-gray-50 rounded transition-colors group">
                  <input
                    type="checkbox"
                    checked={currentCats.includes(cat)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onChange({ ...formData, category: [...currentCats, cat] });
                      } else {
                        onChange({ ...formData, category: currentCats.filter((c: string) => c !== cat) });
                      }
                    }}
                    className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-teal-700 truncate" title={cat}>
                    {cat}
                  </span>
                </label>
              );
            })}
          </div>
          {errors.category && (
            <p className="mt-1 text-sm text-red-600">{errors.category}</p>
          )}
          {Array.isArray(formData.category) && formData.category.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {formData.category.map(cat => (
                <span key={cat} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-800">
                  {cat}
                  <button
                    type="button"
                    onClick={() => {
                      const currentCats = Array.isArray(formData.category) ? formData.category : [];
                      onChange({ ...formData, category: currentCats.filter((c: string) => c !== cat) });
                    }}
                    className="ml-1 text-teal-600 hover:text-teal-900"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Course Duration
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Select
              options={[
                { value: 'days', label: 'Days' },
                { value: 'half_day', label: 'Half Day' },
                { value: 'hours', label: 'Hours' }
              ]}
              value={formData.duration_unit}
              onChange={(e) => handleDurationUnitChange(e.target.value as 'days' | 'hours' | 'half_day')}
            />
            <Input
              type="number"
              min={formData.duration_unit === 'hours' ? 1 : formData.duration_unit === 'half_day' ? 0.5 : 0.1}
              max={formData.duration_unit === 'hours' ? 5 : formData.duration_unit === 'half_day' ? 0.5 : undefined}
              step={formData.duration_unit === 'hours' ? 1 : 0.5}
              value={durationInput}
              onChange={(e) => handleDurationInputChange(e.target.value)}
              error={errors.duration_hours}
              disabled={formData.duration_unit === 'half_day'}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Total: {formData.duration_hours} hours
            {formData.duration_unit === 'hours' && ' (1-5 hours only)'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Course Type *
          </label>
          <Select
            options={[
              { value: '', label: 'Select course type' },
              { value: 'IN_HOUSE', label: 'In-House only' },
              { value: 'PUBLIC', label: 'Public only' },
              { value: 'BOTH', label: 'In-House and Public' }
            ]}
            value={formData.course_type || ''}
            onChange={(e) => onChange({ ...formData, course_type: e.target.value || null })}
          />
          {errors.course_type && (
            <p className="mt-1 text-sm text-red-600">{errors.course_type}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Course Mode * (Select all that apply)
          </label>
          <div className="space-y-2">
            {['PHYSICAL', 'ONLINE', 'HYBRID'].map((mode) => {
              const courseModeArray = Array.isArray(formData.course_mode) ? formData.course_mode : (formData.course_mode ? [formData.course_mode] : []);
              return (
                <label key={mode} className="flex items-center gap-2 cursor-pointer">
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${courseModeArray.includes(mode)
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-gray-300'
                      }`}
                    onClick={() => {
                      const currentModes = Array.isArray(formData.course_mode) ? formData.course_mode : (formData.course_mode ? [formData.course_mode] : []);
                      if (courseModeArray.includes(mode)) {
                        onChange({ ...formData, course_mode: currentModes.filter((m: string) => m !== mode) });
                      } else {
                        onChange({ ...formData, course_mode: [...currentModes, mode] });
                      }
                    }}
                  >
                    {courseModeArray.includes(mode) && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-gray-700">
                    {mode === 'ONLINE' ? 'Online' : mode === 'HYBRID' ? 'Hybrid' : mode}
                  </span>
                </label>
              );
            })}
          </div>
          {errors.course_mode && (
            <p className="mt-1 text-sm text-red-600">{errors.course_mode}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Certificate
          </label>
          <Select
            options={[
              { value: '', label: 'Select certificate type' },
              { value: 'CERTIFICATE_OF_ATTENDANCE', label: 'Certificate of Attendance' },
              { value: 'PROFESSIONAL_CERTIFICATION', label: 'Professional Certification' },
            ]}
            value={formData.certificate || ''}
            onChange={(e) => onChange({ ...formData, certificate: e.target.value || null })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Professional Development Points
          </label>
          <Select
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
            value={formData.professional_development_points || ''}
            onChange={(e) => onChange({
              ...formData,
              professional_development_points: e.target.value || null,
              professional_development_points_other: e.target.value !== 'OTHERS' ? null : formData.professional_development_points_other
            })}
          />
          {formData.professional_development_points === 'OTHERS' && (
            <Input
              label="Please specify"
              value={formData.professional_development_points_other || ''}
              onChange={(e) => onChange({ ...formData, professional_development_points_other: e.target.value })}
              placeholder="Enter professional development points"
              className="mt-2"
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assessment
          </label>
          <Toggle
            checked={formData.assessment}
            onChange={(checked) => onChange({ ...formData, assessment: checked })}
            label={formData.assessment ? 'Yes' : 'No'}
          />
        </div>


        {needsEndDate() && (
          <div>
            <Input
              label="End Date (Optional)"
              type="date"
              value={formData.end_date || ''}
              onChange={(e) => onChange({ ...formData, end_date: e.target.value || null })}
              placeholder="Select end date"
              min={formData.event_date || undefined}
            />
            <p className="text-xs text-gray-500 mt-1">
              Set the end date for multi-day courses
            </p>
          </div>
        )}
      </div>

      <div>
        <TextareaWithLimit
          label="Introduction"
          value={formData.description}
          onChange={(e) => onChange({ ...formData, description: e.target.value })}
          placeholder="Provide a brief introduction to the course"
          wordLimit={250}
          rows={4}
          error={errors.description}
        />
      </div>

      <DynamicListInput
        label="Learning Objectives"
        items={formData.learning_objectives}
        onChange={(items) => onChange({ ...formData, learning_objectives: items })}
        maxItems={7}
        wordLimit={50}
        placeholder="Enter learning objective"
        error={errors.learning_objectives}
      />

      <DynamicListInput
        label="Learning Outcomes"
        items={formData.learning_outcomes}
        onChange={(items) => onChange({ ...formData, learning_outcomes: items })}
        maxItems={7}
        wordLimit={20}
        placeholder="Enter learning outcome"
        error={errors.learning_outcomes}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TextareaWithLimit
          label="Target Audience"
          value={formData.target_audience}
          onChange={(e) => onChange({ ...formData, target_audience: e.target.value })}
          placeholder="Who is this course for?"
          rows={4}
          showWordCount={false}
        />

        <TextareaWithLimit
          label="Methodology"
          value={formData.methodology}
          onChange={(e) => onChange({ ...formData, methodology: e.target.value })}
          placeholder="How will the course be delivered?"
          rows={4}
          showWordCount={false}
        />

        <TextareaWithLimit
          label="Prerequisite"
          value={formData.prerequisite}
          onChange={(e) => onChange({ ...formData, prerequisite: e.target.value })}
          placeholder="Any requirements before taking this course?"
          rows={4}
          showWordCount={false}
        />
      </div>
    </div>
  );
}
