import { TextareaWithLimit } from '../ui/TextareaWithLimit';
import { ArrayBuilder } from './ArrayBuilder';
import { ScheduleBuilder } from './ScheduleBuilder';

interface Step2Props {
    formData: any;
    onChange: (data: any) => void;
    scheduleItems: any[];
    onScheduleChange: (items: any[]) => void;
    errors?: Record<string, string>;
}

export function Step2ContentSchedule({
    formData,
    onChange,
    scheduleItems,
    onScheduleChange,
    errors = {}
}: Step2Props) {
    return (
        <div className="space-y-8 animate-fade-in">
            <div className="bg-white p-8 rounded-3xl ring-1 ring-corporate-100 shadow-modern-sm">
                <TextareaWithLimit
                    label="Course Introduction"
                    value={formData.description}
                    onChange={(e) => onChange({ ...formData, description: e.target.value })}
                    placeholder="Provide a brief introduction to the course..."
                    wordLimit={250}
                    rows={5}
                    error={errors.description}
                    className="text-corporate-900 font-medium"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-corporate-900 p-8 rounded-3xl shadow-modern-lg">
                    <ArrayBuilder
                        label="Learning Objectives"
                        items={formData.learning_objectives}
                        onChange={(items) => onChange({ ...formData, learning_objectives: items })}
                        placeholder="1. Understand key concepts...&#13;2. Apply methodologies..."
                        error={errors.learning_objectives}
                        className="text-white"
                    />
                </div>

                <div className="bg-white p-8 rounded-3xl ring-1 ring-corporate-100 shadow-modern-sm">
                    <TextareaWithLimit
                        label="Methodology"
                        value={formData.methodology}
                        onChange={(e) => onChange({ ...formData, methodology: e.target.value })}
                        placeholder="How will this be taught..."
                        rows={4}
                        showWordCount={false}
                        error={errors.methodology}
                    />
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl ring-1 ring-corporate-100 shadow-sm">
                <TextareaWithLimit
                    label="Prerequisites"
                    value={formData.prerequisite}
                    onChange={(e) => onChange({ ...formData, prerequisite: e.target.value })}
                    placeholder="What must they know beforehand..."
                    rows={4}
                    showWordCount={false}
                />
            </div>

            <div className="bg-white p-8 rounded-3xl ring-1 ring-corporate-100 shadow-modern-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Schedule (Optional)</h3>
                <ScheduleBuilder
                    scheduleItems={scheduleItems}
                    onChange={onScheduleChange}
                    requiredDurationHours={formData.duration_hours}
                    durationUnit={formData.duration_unit}
                />
                {errors.schedule && (
                    <p className="mt-2 text-sm text-red-600">{errors.schedule}</p>
                )}
            </div>
        </div>
    );
}
