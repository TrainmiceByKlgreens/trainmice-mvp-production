import { Select } from '../ui/Select';
import { Toggle } from '../ui/Toggle';

interface Step3Props {
    formData: any;
    onChange: (data: any) => void;
    errors?: Record<string, string>;
}

export function Step3FinalDetails({ formData, onChange, errors = {} }: Step3Props) {
    return (
        <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 ring-1 ring-corporate-100 p-8 rounded-3xl bg-white shadow-modern-sm">
                <div className="bg-corporate-50/50 p-6 rounded-2xl border border-corporate-100">
                    <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-widest">
                        Certificate Type
                    </label>
                    <Select
                        options={[
                            { value: '', label: 'None' },
                            { value: 'CERTIFICATE_OF_ATTENDANCE', label: 'Certificate of Attendance' },
                            { value: 'PROFESSIONAL_CERTIFICATION', label: 'Professional Certification' },
                        ]}
                        value={formData.certificate || ''}
                        onChange={(e) => onChange({ ...formData, certificate: e.target.value || null })}
                        className="bg-white font-bold h-12"
                    />
                    {errors.certificate && (
                        <p className="mt-2 text-[10px] font-bold text-red-500 uppercase tracking-widest">{errors.certificate}</p>
                    )}
                </div>

                <div className="bg-corporate-50/50 p-6 rounded-2xl border border-corporate-100">
                    <div className="flex items-center justify-between p-4 bg-white border-2 border-corporate-50 rounded-2xl group hover:border-corporate-200 transition-all h-full">
                        <div>
                            <p className="text-sm font-bold text-gray-900 uppercase tracking-widest">HRDC Claimable</p>
                            <p className="text-xs text-gray-500 font-medium lowercase">Is this course HRDC claimable?</p>
                        </div>
                        <Toggle
                            checked={formData.hrdc_claimable}
                            onChange={(checked) => onChange({ ...formData, hrdc_claimable: checked })}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
