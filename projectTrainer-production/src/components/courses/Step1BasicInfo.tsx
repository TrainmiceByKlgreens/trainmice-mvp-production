import { useState, useEffect } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Toggle } from '../ui/Toggle';
import { ArrayBuilder } from './ArrayBuilder';
import { Image as ImageIcon, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { apiClient } from '../../lib/api-client';
import { COURSE_CATEGORIES } from '../../utils/categories';

interface Step1Props {
    formData: any;
    onChange: (data: any) => void;
    errors?: Record<string, string>;
}

export function Step1BasicInfo({ formData, onChange, errors = {} }: Step1Props) {
    const [durationInput, setDurationInput] = useState<string>(String(formData.duration_hours));
    const [categoryImages, setCategoryImages] = useState<any[]>([]);
    const [loadingCategoryImages, setLoadingCategoryImages] = useState(false);
    const [showImageSelection, setShowImageSelection] = useState(false);
    const [showAllCategories, setShowAllCategories] = useState(false);

    useEffect(() => {
        if (formData.duration_unit === 'half_day') {
            setDurationInput('0.5');
        } else {
            setDurationInput(String(formData.duration_hours));
        }
    }, [formData.duration_hours, formData.duration_unit]);

    useEffect(() => {
        if (formData.category) {
            const category = Array.isArray(formData.category) ? formData.category[0] : formData.category;
            if (category) fetchCategoryImages(category);
        } else {
            setCategoryImages([]);
        }
    }, [formData.category]);

    const fetchCategoryImages = async (category: string) => {
        setLoadingCategoryImages(true);
        try {
            const { images } = await apiClient.getCategoryImages(category);
            setCategoryImages(images || []);
        } catch (error) {
            console.error('Error fetching category images:', error);
        } finally {
            setLoadingCategoryImages(false);
        }
    };

    const handleDurationUnitChange = (unit: 'days' | 'hours' | 'half_day') => {
        const currentDuration = parseFloat(durationInput) || 1;
        let rawValue = currentDuration;

        if (unit === 'hours') {
            rawValue = Math.min(Math.max(currentDuration, 1), 5);
        } else if (unit === 'half_day') {
            rawValue = 0.5;
        } else if (unit === 'days') {
            rawValue = currentDuration;
        }

        onChange({ ...formData, duration_unit: unit, duration_hours: rawValue });
    };

    const handleDurationInputChange = (value: string) => {
        setDurationInput(value);
        const numValue = parseFloat(value);

        if (!isNaN(numValue) && numValue > 0) {
            let rawValue = numValue;
            if (formData.duration_unit === 'hours') {
                rawValue = Math.min(Math.max(numValue, 1), 5);
            } else if (formData.duration_unit === 'half_day') {
                rawValue = 0.5;
            }
            onChange({ ...formData, duration_hours: rawValue });
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 ring-1 ring-corporate-100 p-8 rounded-3xl bg-white shadow-modern-sm">
                <div className="md:col-span-2">
                    <Input
                        label="Course Name"
                        value={formData.title}
                        onChange={(e) => onChange({ ...formData, title: e.target.value })}
                        placeholder="e.g. Advanced Leadership Skills"
                        error={errors.title}
                        required
                        className="text-lg font-bold"
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-widest">
                        Course Title Image
                    </label>
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center gap-8">
                            <div className="w-40 h-40 bg-corporate-900 rounded-3xl flex items-center justify-center overflow-hidden border-4 border-white shadow-modern-lg relative group shrink-0">
                                {formData.image_url ? (
                                    <>
                                        <img
                                            src={apiClient.resolveImageUrl(formData.image_url)}
                                            alt="Course Preview"
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <ImageIcon className="w-8 h-8 text-white" />
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <ImageIcon className="w-10 h-10 text-accent-500/50" />
                                        <span className="text-[8px] font-black text-corporate-400 tracking-widest uppercase">Void</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-accent-500 rounded-full" />
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900 uppercase">Image Library</h4>
                                        <p className="text-xs text-gray-500 font-medium">Select an image from our categorized repository.</p>
                                    </div>
                                </div>
                                {formData.category && (
                                    <Button
                                        type="button"
                                        variant="primary"
                                        onClick={() => setShowImageSelection(!showImageSelection)}
                                        className="bg-corporate-900 text-white rounded-xl h-12 shadow-modern group"
                                    >
                                        <ImageIcon className="w-4 h-4 mr-2" />
                                        {showImageSelection ? 'Hide Library' : 'Browse Library'}
                                    </Button>
                                )}
                            </div>
                        </div>

                        {showImageSelection && formData.category && (
                            <div className="mt-4 p-8 bg-corporate-50 rounded-3xl border border-corporate-100 animate-scale-in">
                                <div className="flex items-center justify-between mb-6">
                                    <h4 className="text-[10px] font-black text-corporate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <span className="w-2 h-2 bg-accent-500 rounded-full animate-pulse" />
                                        Assets: {Array.isArray(formData.category) ? formData.category.join('/') : formData.category}
                                    </h4>
                                    {loadingCategoryImages && <LoadingSpinner size="sm" />}
                                </div>

                                {categoryImages.length > 0 ? (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                                        {categoryImages.map((img) => (
                                            <button
                                                key={img.id}
                                                type="button"
                                                onClick={() => {
                                                    onChange({ ...formData, image_url: img.imageUrl });
                                                }}
                                                className={`group relative aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-300 ${formData.image_url === img.imageUrl ? 'border-accent-500 ring-4 ring-accent-500/20 scale-105' : 'border-transparent hover:border-corporate-200 hover:scale-102'
                                                    }`}
                                            >
                                                <img src={img.imageUrl} alt="Category" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                {formData.image_url === img.imageUrl && (
                                                    <div className="absolute inset-0 bg-accent-500/20 flex items-center justify-center">
                                                        <Check className="w-6 h-6 text-white bg-accent-500 rounded-full p-1 shadow-lg" />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                ) : !loadingCategoryImages && (
                                    <div className="text-center py-6 bg-white/50 rounded-2xl border border-dashed border-corporate-200">
                                        <p className="text-[10px] font-bold text-corporate-400 uppercase tracking-widest">Repository Status: NO ASSETS FOUND</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-widest">
                        Category
                    </label>
                    <div className={`grid grid-cols-2 lg:grid-cols-3 gap-3 p-6 border-2 border-corporate-50 rounded-2xl ${showAllCategories ? 'max-h-[32rem]' : 'max-h-64'} overflow-y-auto bg-corporate-50 shadow-inner custom-scrollbar`}>
                        {(showAllCategories ? COURSE_CATEGORIES : COURSE_CATEGORIES.slice(0, 6)).map(cat => {
                            const currentCats = Array.isArray(formData.category)
                                ? formData.category
                                : (typeof formData.category === 'string' ? [formData.category] : []);
                            const isActive = currentCats.includes(cat);

                            return (
                                <label
                                    key={cat}
                                    className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl transition-all duration-300 group border-2 ${isActive ? 'bg-white border-accent-500 shadow-modern-sm' : 'bg-white/50 border-transparent hover:bg-white hover:border-corporate-100'}`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isActive}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                onChange({ ...formData, category: [...currentCats, cat] });
                                            } else {
                                                onChange({ ...formData, category: currentCats.filter((c: string) => c !== cat) });
                                            }
                                        }}
                                        className="hidden"
                                    />
                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isActive ? 'bg-accent-500 border-accent-500' : 'border-corporate-200 group-hover:border-corporate-400'}`}>
                                        {isActive && <Check className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase tracking-tight truncate ${isActive ? 'text-corporate-900' : 'text-corporate-500 group-hover:text-corporate-700'}`} title={cat}>
                                        {cat}
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                    {COURSE_CATEGORIES.length > 6 && (
                        <div className="mt-4 mb-2 flex justify-center">
                            <button
                                type="button"
                                onClick={() => setShowAllCategories(!showAllCategories)}
                                className="text-xs font-bold text-accent-600 hover:text-accent-700 uppercase tracking-widest transition-colors"
                            >
                                {showAllCategories ? 'Show Less' : 'Read More'}
                            </button>
                        </div>
                    )}
                    {errors.category && (
                        <p className="mt-2 text-[10px] font-bold text-red-500 uppercase tracking-widest">{errors.category}</p>
                    )}
                </div>

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-corporate-50/50 p-6 rounded-2xl border border-corporate-100 h-full flex flex-col">
                    <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-widest">
                        Duration
                    </label>
                    <div className="grid grid-cols-1 gap-4">
                        <Select
                            options={[
                                { value: 'days', label: 'Days' },
                                { value: 'half_day', label: 'Half Day' },
                                { value: 'hours', label: 'Hours' }
                            ]}
                            value={formData.duration_unit}
                            onChange={(e) => handleDurationUnitChange(e.target.value as 'days' | 'hours' | 'half_day')}
                            className="bg-white font-bold h-12"
                        />
                        <div className="relative">
                            <Input
                                type="number"
                                min={formData.duration_unit === 'hours' ? 1 : formData.duration_unit === 'half_day' ? 0.5 : 0.1}
                                max={formData.duration_unit === 'hours' ? 5 : formData.duration_unit === 'half_day' ? 0.5 : undefined}
                                step={formData.duration_unit === 'hours' ? 1 : 0.5}
                                value={durationInput}
                                onChange={(e) => handleDurationInputChange(e.target.value)}
                                error={errors.duration_hours}
                                disabled={formData.duration_unit === 'half_day'}
                                className="bg-white h-12 font-black text-lg pl-3"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-corporate-50/50 p-6 rounded-2xl border border-corporate-100 h-full flex flex-col">
                    <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-widest">
                        Course Type
                    </label>
                    <Select
                        options={[
                            { value: 'IN_HOUSE', label: 'In-House' },
                            { value: 'PUBLIC', label: 'Public' },
                            { value: 'BOTH', label: 'In-House & Public' }
                        ]}
                        value={formData.course_type || ''}
                        onChange={(e) => onChange({ ...formData, course_type: e.target.value || null })}
                        className="bg-white font-bold h-12"
                    />
                </div>

                <div className="bg-corporate-50/50 p-6 rounded-2xl border border-corporate-100 h-full flex flex-col">
                    <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-widest">
                        Course Mode
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                        {['PHYSICAL', 'ONLINE', 'HYBRID'].map((mode) => {
                            const currentModes = Array.isArray(formData.course_mode) ? formData.course_mode : (formData.course_mode ? [formData.course_mode] : []);
                            const isActive = currentModes.includes(mode);
                            return (
                                <label
                                    key={mode}
                                    className={`flex items-center justify-between cursor-pointer p-4 rounded-xl transition-all border-2 ${isActive ? 'bg-white border-accent-500' : 'bg-white/40 border-transparent hover:bg-white/80'}`}
                                    onClick={() => {
                                        if (currentModes.includes(mode)) {
                                            onChange({ ...formData, course_mode: currentModes.filter((m: string) => m !== mode) });
                                        } else {
                                            onChange({ ...formData, course_mode: [...currentModes, mode] });
                                        }
                                    }}
                                >
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-accent-600' : 'text-corporate-500'}`}>
                                        {mode === 'ONLINE' ? 'Online' : mode === 'HYBRID' ? 'Hybrid' : 'Physical'}
                                    </span>
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${isActive ? 'bg-accent-500 shadow-md ring-4 ring-accent-500/10' : 'bg-corporate-100 shadow-inner'}`}>
                                        {isActive && <Check className="w-4 h-4 text-white" />}
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-corporate-50/50 p-6 rounded-2xl border border-corporate-100 h-full flex flex-col">
                    <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-widest">
                        Languages
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                        {['English', 'Malay', 'Mandarin'].map((lang) => {
                            const currentLangs = formData.delivery_languages || [];
                            const isActive = currentLangs.includes(lang);
                            return (
                                <label
                                    key={lang}
                                    className={`flex items-center justify-between cursor-pointer p-3.5 rounded-xl transition-all border-2 ${isActive ? 'bg-white border-accent-500' : 'bg-white/40 border-transparent hover:bg-white/80'}`}
                                    onClick={() => {
                                        if (currentLangs.includes(lang)) {
                                            onChange({ ...formData, delivery_languages: currentLangs.filter((l: string) => l !== lang) });
                                        } else {
                                            onChange({ ...formData, delivery_languages: [...currentLangs, lang] });
                                        }
                                    }}
                                >
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-accent-600' : 'text-corporate-500'}`}>
                                        {lang}
                                    </span>
                                    <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${isActive ? 'bg-accent-500 shadow-md' : 'bg-corporate-100'}`}>
                                        {isActive && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                </label>
                            );
                        })}

                        {/* Others Option */}
                        <div className="flex flex-col mt-1">
                            <label
                                className={`flex items-center justify-between cursor-pointer p-3.5 rounded-xl transition-all border-2 ${formData.delivery_languages?.some((l: string) => !['English', 'Malay', 'Mandarin'].includes(l)) ? 'bg-white border-accent-500' : 'bg-white/40 border-transparent hover:bg-white/80'}`}
                                onClick={() => {
                                    const currentLangs = formData.delivery_languages || [];
                                    const hasOther = currentLangs.some((l: string) => !['English', 'Malay', 'Mandarin'].includes(l));
                                    if (hasOther) {
                                        onChange({ ...formData, delivery_languages: currentLangs.filter((l: string) => ['English', 'Malay', 'Mandarin'].includes(l)) });
                                    } else {
                                        onChange({ ...formData, delivery_languages: [...currentLangs, 'Other'] });
                                    }
                                }}
                            >
                                <span className={`text-[10px] font-black uppercase tracking-widest ${formData.delivery_languages?.some((l: string) => !['English', 'Malay', 'Mandarin'].includes(l)) ? 'text-accent-600' : 'text-corporate-500'}`}>
                                    Other
                                </span>
                                <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${formData.delivery_languages?.some((l: string) => !['English', 'Malay', 'Mandarin'].includes(l)) ? 'bg-accent-500 shadow-md' : 'bg-corporate-100'}`}>
                                    {formData.delivery_languages?.some((l: string) => !['English', 'Malay', 'Mandarin'].includes(l)) && <Check className="w-3 h-3 text-white" />}
                                </div>
                            </label>

                            {formData.delivery_languages?.some((l: string) => !['English', 'Malay', 'Mandarin'].includes(l)) && (
                                <Input
                                    value={formData.delivery_languages.find((l: string) => !['English', 'Malay', 'Mandarin'].includes(l)) || ''}
                                    onChange={(e) => {
                                        const currentLangs = formData.delivery_languages || [];
                                        const baseLangs = currentLangs.filter((l: string) => ['English', 'Malay', 'Mandarin'].includes(l));
                                        onChange({ ...formData, delivery_languages: [...baseLangs, e.target.value] });
                                    }}
                                    placeholder="Specify language"
                                    className="bg-white h-10 mt-2 text-[10px] font-black uppercase tracking-widest pl-3"
                                />
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-corporate-50/50 p-6 rounded-2xl border border-corporate-100 h-full flex flex-col">
                    <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-widest">
                        Assessment
                    </label>
                    <div className="flex items-center justify-between p-4 bg-white border-2 border-corporate-50 rounded-2xl group hover:border-corporate-200 transition-all">
                        <div>
                            <p className="text-sm font-bold text-gray-900 uppercase tracking-widest">Assessment</p>
                            <p className="text-xs text-gray-500 font-medium lowercase">Verify instructional retention</p>
                        </div>
                        <Toggle
                            checked={formData.assessment}
                            onChange={(checked) => onChange({ ...formData, assessment: checked })}
                        />
                    </div>
                </div>

                <div className="bg-corporate-50/50 p-6 rounded-2xl border border-corporate-100 h-full flex flex-col">
                    <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-widest">
                        Professional Development Points (PDP)
                    </label>
                    <div className="space-y-3">
                        <Select
                            options={[
                                { value: '', label: 'None' },
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
                            className="bg-white font-bold h-12"
                        />
                        {formData.professional_development_points === 'OTHERS' && (
                            <Input
                                value={formData.professional_development_points_other || ''}
                                onChange={(e) => onChange({ ...formData, professional_development_points_other: e.target.value })}
                                placeholder="SPECIFY CUSTOM SYSTEM"
                                className="bg-white h-12 text-[10px] font-black uppercase tracking-widest pl-3"
                            />
                        )}
                    </div>
                </div>
                </div>

                <div className="md:col-span-2">
                    <ArrayBuilder
                        label="Learning Outcomes"
                        items={formData.learning_outcomes}
                        onChange={(items) => onChange({ ...formData, learning_outcomes: items })}
                        placeholder="1. Build an application...&#13;2. Analyze data sets..."
                        error={errors.learning_outcomes}
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-widest">
                        Target Audience
                    </label>
                    <Input
                        value={formData.target_audience}
                        onChange={(e) => onChange({ ...formData, target_audience: e.target.value })}
                        placeholder="Who is this course for..."
                        error={errors.target_audience}
                    />
                </div>
            </div>
        </div>
    );
}
