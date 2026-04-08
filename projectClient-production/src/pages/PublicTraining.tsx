import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    Download,
    Search,
    Filter,
    BookOpen,
    ChevronRight,
    Info,
    Layers
} from 'lucide-react';
import { apiClient } from '../lib/api-client';
import { getCategoryColor } from '../utils/categoryColors';
import { format } from 'date-fns';

// --- Types ---
interface Event {
    id: string;
    courseId: string;
    title: string;
    description: string;
    startDate: string | null;
    endDate: string | null;
    eventDate: string;
    durationHours: number;
    durationUnit: string;
    courseType: string[];
    courseMode: string[];
    category: string;
    venue: string;
    hrdcClaimable: boolean;
    professionalDevelopmentPoints: string | null;
    professionalDevelopmentPointsOther: string | null;
    course: {
        id: string;
        title: string;
        courseCode: string;
    };
}

interface CourseRow {
    courseId: string;
    title: string;
    courseCode: string;
    category: string;
    duration: string;
    hrdcClaimable: boolean;
    courseMode: string[];
    professionalPoint: string | null;
    months: Record<string, Event[]>;
}

const H1_MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June'];
const H2_MONTH_NAMES = ['July', 'August', 'September', 'October', 'November', 'December'];

export function PublicTraining() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [activeHalf, setActiveHalf] = useState<'P1' | 'P2'>('P1');

    // Dynamic period calculation
    const { period1, period2, titleYear } = useMemo(() => {
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth(); // 0-indexed

        if (m < 6) { // Jan - Jun
            return {
                period1: { year: y, months: H1_MONTH_NAMES, label: 'Jan - Jun' },
                period2: { year: y, months: H2_MONTH_NAMES, label: 'Jul - Dec' },
                titleYear: String(y)
            };
        } else { // Jul - Dec
            return {
                period1: { year: y, months: H2_MONTH_NAMES, label: 'Jul - Dec' },
                period2: { year: y + 1, months: H1_MONTH_NAMES, label: 'Jan - Jun' },
                titleYear: `${y}/${y + 1}`
            };
        }
    }, []);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                setLoading(true);
                const response = await apiClient.getEvents({ status: 'ACTIVE' });
                const allEvents = response?.events || [];

                // Filter for PUBLIC events
                const publicEvents = allEvents.filter((e: any) => {
                    let types: string[] = [];
                    if (Array.isArray(e.courseType)) types = e.courseType;
                    else if (e.courseType) {
                        try {
                            const parsed = typeof e.courseType === 'string' ? JSON.parse(e.courseType) : e.courseType;
                            types = Array.isArray(parsed) ? parsed : [];
                        } catch { types = []; }
                    }
                    return types.map(t => String(t).toUpperCase()).includes('PUBLIC');
                });

                setEvents(publicEvents);
                setError(null);
            } catch (err) {
                console.error('Error fetching public training events:', err);
                setError('Failed to load training calendar. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    const slugify = (text: string) => {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '')
            .replace(/--+/g, '-');
    };

    const categories = useMemo(() => {
        const cats = new Set<string>();
        cats.add('All');
        events.forEach(e => {
            if (e.category) {
                // Ensure category is a string before splitting
                const catStr = String(e.category);
                const splitCats = catStr.split(/[,;]/).map(c => c.trim()).filter(Boolean);
                splitCats.forEach(c => cats.add(c));
            }
        });
        return Array.from(cats).sort();
    }, [events]);

    const courseRows = useMemo(() => {
        const grouped: Record<string, CourseRow> = {};

        events.forEach(event => {
            const courseId = event.courseId;
            if (!grouped[courseId]) {
                grouped[courseId] = {
                    courseId,
                    title: event.title,
                    courseCode: event.course?.courseCode || 'N/A',
                    category: String(event.category || 'Others'),
                    duration: `${event.durationHours} ${event.durationUnit || 'Hours'}`,
                    hrdcClaimable: event.hrdcClaimable,
                    courseMode: [],
                    professionalPoint: event.professionalDevelopmentPoints === 'OTHERS'
                        ? (event.professionalDevelopmentPointsOther || 'OTHERS')
                        : (event.professionalDevelopmentPoints || 'NO'),
                    months: {}
                };
            }

            // Aggregate course modes
            if (event.courseMode) {
                let modes: string[] = [];
                if (Array.isArray(event.courseMode)) modes = event.courseMode;
                else {
                    try {
                        const parsed = typeof event.courseMode === 'string' ? JSON.parse(event.courseMode) : event.courseMode;
                        modes = Array.isArray(parsed) ? parsed : [];
                    } catch { modes = []; }
                }
                modes.forEach(m => {
                    if (m && !grouped[courseId].courseMode.includes(String(m))) {
                        grouped[courseId].courseMode.push(String(m));
                    }
                });
            }

            const date = new Date(event.eventDate);
            const monthName = format(date, 'MMMM');
            const year = date.getFullYear();
            const key = `${monthName}-${year}`;

            if (!grouped[courseId].months[key]) {
                grouped[courseId].months[key] = [];
            }
            grouped[courseId].months[key].push(event);
        });

        return Object.values(grouped).filter(row => {
            const matchesSearch = row.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                row.courseCode.toLowerCase().includes(searchTerm.toLowerCase());

            // Refined Category Filtering: Safely check if row.category contains the selectedCategory
            const categoryStr = String(row.category || '');
            const matchesCategory = selectedCategory === 'All' ||
                categoryStr.toLowerCase().includes(selectedCategory.toLowerCase());

            return matchesSearch && matchesCategory;
        });
    }, [events, searchTerm, selectedCategory]);

    const currentPeriod = activeHalf === 'P1' ? period1 : period2;
    const activeMonths = currentPeriod.months;
    const activeYear = currentPeriod.year;

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                    <p className="mt-4 text-gray-600 font-medium">Loading professional calendar...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-[1600px] mx-auto">
                    {/* Header Section */}
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
                        <div className="max-w-2xl">
                            <div className="flex items-center gap-4 mb-4">
                                <Layers className="w-12 h-12 text-teal-600 flex-shrink-0" />
                                <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
                                    Public Training <span className="text-green-600">Calendar {titleYear}</span>
                                </h1>
                            </div>
                            <p className="text-lg text-gray-600">
                                Corporate-standard scheduling for professional growth. Interactive, unified, and high-performance.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                onClick={() => window.print()}
                                className="group flex items-center px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-2xl hover:bg-gray-50 transition-all shadow-sm font-bold text-sm"
                            >
                                <Download className="w-4 h-4 mr-2 group-hover:translate-y-0.5 transition-transform" />
                                Export Schedule
                            </button>
                            <Link
                                to="/courses"
                                className="flex items-center px-6 py-3 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 transition-all shadow-lg font-bold text-sm"
                            >
                                <BookOpen className="w-4 h-4 mr-2" />
                                Course Directory
                            </Link>
                        </div>
                    </div>

                    {/* High-Tech Filter Bar */}
                    <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] shadow-2xl shadow-gray-200/50 p-4 mb-8 border border-white/50 sticky top-16 z-40">
                        <div className="flex flex-col lg:flex-row items-center gap-4">
                            {/* Search */}
                            <div className="relative flex-1 group w-full">
                                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                                    <Search className="w-5 h-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search courses or codes..."
                                    className="w-full pl-14 pr-4 py-4 bg-gray-50/50 border-2 border-transparent focus:border-teal-500/20 focus:bg-white rounded-2xl focus:ring-0 placeholder-gray-400 text-gray-900 font-semibold transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            {/* Category Filter */}
                            <div className="relative group min-w-[240px] w-full lg:w-auto">
                                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                                    <Filter className="w-5 h-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                                </div>
                                <select
                                    className="w-full pl-14 pr-12 py-4 bg-gray-50/50 border-2 border-transparent focus:border-teal-500/20 focus:bg-white rounded-2xl appearance-none text-gray-900 font-semibold cursor-pointer transition-all"
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            {/* H1/H2 Switcher - Corporate Style */}
                            <div className="flex bg-gray-100 p-1.5 rounded-2xl w-full lg:w-auto min-w-[320px]">
                                <button
                                    onClick={() => setActiveHalf('P1')}
                                    className={`flex-1 py-3 px-6 rounded-xl font-bold text-xs tracking-widest uppercase transition-all ${activeHalf === 'P1'
                                        ? 'bg-white text-teal-600 shadow-md'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {period1.label} {period1.year !== period2.year ? `(${period1.year})` : ''}
                                </button>
                                <button
                                    onClick={() => setActiveHalf('P2')}
                                    className={`flex-1 py-3 px-6 rounded-xl font-bold text-xs tracking-widest uppercase transition-all ${activeHalf === 'P2'
                                        ? 'bg-white text-teal-600 shadow-md'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {period2.label} ({period2.year})
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Corporate Table Section */}
                    {error ? (
                        <div className="bg-red-50 text-red-600 p-8 rounded-3xl border border-red-100 text-center">
                            <p className="font-bold text-lg mb-2">Error</p>
                            <p>{error}</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-gray-200/50 overflow-hidden relative">
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse min-w-[1200px]">
                                    <thead>
                                        <tr className="bg-gray-900 text-white">
                                            <th className="py-8 px-8 font-bold text-[13px] tracking-widest uppercase border-b border-gray-800 w-[400px] sticky left-0 bg-gray-900 z-20">
                                                Course Name
                                            </th>
                                            <th className="py-8 px-4 font-bold text-[13px] tracking-widest uppercase border-b border-gray-800 text-center w-[140px]">
                                                Properties
                                            </th>
                                            <th className="py-8 px-4 font-bold text-[13px] tracking-widest uppercase border-b border-gray-800 text-center w-[140px]">
                                                Professional Point
                                            </th>
                                            {activeMonths.map(month => (
                                                <th key={month} className="py-8 px-4 font-bold text-[13px] tracking-widest uppercase border-b border-gray-800 text-center bg-gray-800/50 min-w-[160px]">
                                                    {month}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {courseRows.length > 0 ? (
                                            courseRows.map((row) => {
                                                const detailUrl = `/courses/${slugify(row.title)}---${row.courseId}`;

                                                return (
                                                    <tr key={row.courseId} className="group hover:bg-teal-50/30 transition-colors">
                                                        {/* Course Info Column */}
                                                        {/* Course Info Column - Increased hover z-index to fix underlay */}
                                                        <td className="py-8 px-8 sticky left-0 bg-white group-hover:bg-teal-50/30 transition-colors z-10 hover:z-30 border-r border-gray-50 shadow-[4px_0_12px_rgba(0,0,0,0.02)]">
                                                            <Link to={detailUrl} className="block group/link">
                                                                <div className="flex flex-wrap gap-1.5 mb-2">
                                                                    {String(row.category || 'Others').split(/[,;]/).map(c => c.trim()).filter(Boolean).map((cat, i) => {
                                                                        const catColors = getCategoryColor(cat);
                                                                        return (
                                                                            <span key={i} className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${catColors.bg} ${catColors.text} ${catColors.border}`}>
                                                                                {cat}
                                                                            </span>
                                                                        );
                                                                    })}
                                                                </div>
                                                                <div className="relative group/title">
                                                                    <h3 className="text-base font-bold text-gray-900 group-hover/link:text-teal-600 transition-colors line-clamp-2">
                                                                        {row.title}
                                                                    </h3>
                                                                    <div className="absolute bottom-full left-0 mb-2 opacity-0 group-hover/title:opacity-100 transition-all pointer-events-none scale-95 group-hover/title:scale-100 z-50">
                                                                        <div className="bg-gray-900 text-white text-xs px-4 py-2 rounded-xl shadow-2xl border border-white/20 max-w-[300px] leading-relaxed">
                                                                            {row.title}
                                                                        </div>
                                                                        <div className="w-2 h-2 bg-gray-900 rotate-45 ml-4 -mt-1 border-r border-b border-white/20" />
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-3 mt-1.5">
                                                                    <span className="text-[10px] font-bold text-gray-400 font-mono tracking-tighter">
                                                                        #{row.courseCode}
                                                                    </span>
                                                                    {row.hrdcClaimable && (
                                                                        <span className="flex items-center text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded tracking-tight">
                                                                            HRDC CLAIMABLE
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </Link>
                                                        </td>

                                                        <td className="py-8 px-4 whitespace-nowrap">
                                                            <div className="flex flex-col items-center gap-2.5">
                                                                <span className="text-[12px] font-bold text-gray-500 uppercase tracking-tighter bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 min-w-[120px] text-center">
                                                                    {row.duration}
                                                                </span>
                                                                {row.courseMode.length > 0 && (
                                                                    <span className="text-[12px] font-bold text-teal-700 uppercase tracking-tighter bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-100 min-w-[120px] text-center">
                                                                        {row.courseMode.join(' & ')}
                                                                    </span>
                                                                )}
                                                                <Link
                                                                    to={detailUrl}
                                                                    className="text-teal-600 font-bold text-[11px] uppercase tracking-widest hover:underline flex items-center mt-1.5"
                                                                >
                                                                    Explore <ChevronRight className="w-4 h-4" />
                                                                </Link>
                                                            </div>
                                                        </td>

                                                        <td className="py-8 px-4 whitespace-nowrap border-l border-gray-50/50 text-center">
                                                            <div className="flex flex-col items-center justify-center h-full">
                                                                {row.professionalPoint && row.professionalPoint !== "NO" ? (
                                                                    <span className="text-[12px] font-bold text-teal-700 uppercase tracking-tighter bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-100 min-w-[120px] text-center shadow-sm">
                                                                        {row.professionalPoint}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-gray-300 font-bold text-sm tracking-widest">NO</span>
                                                                )}
                                                            </div>
                                                        </td>

                                                        {activeMonths.map(month => {
                                                            const key = `${month}-${activeYear}`;
                                                            const monthEvents = row.months[key] || [];
                                                            return (
                                                                <td key={month} className="py-8 px-4 border-l border-gray-50/50">
                                                                    <div className="flex flex-wrap justify-center gap-1.5">
                                                                        {monthEvents.length > 0 ? (
                                                                            monthEvents.map((ev, idx) => (
                                                                                <Link
                                                                                    key={`${row.courseId}-${month}-${idx}`}
                                                                                    to={detailUrl}
                                                                                    className="group/date relative"
                                                                                >
                                                                                    <div className="px-4 py-2 bg-white border-2 border-teal-100/50 rounded-xl text-[13px] font-bold text-gray-900 hover:border-teal-500 hover:bg-teal-500 hover:text-white hover:shadow-lg hover:shadow-teal-500/20 transition-all cursor-pointer whitespace-nowrap min-w-[55px] text-center shadow-sm">
                                                                                        {(() => {
                                                                                            const start = format(new Date(ev.startDate || ev.eventDate), 'dd');
                                                                                            const end = ev.endDate ? format(new Date(ev.endDate), 'dd') : null;
                                                                                            return end && end !== start ? `${start}-${end}` : start;
                                                                                        })()}
                                                                                    </div>

                                                                                    {/* High-Tech Tooltip on Hover */}
                                                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover/date:opacity-100 transition-all pointer-events-none scale-90 group-hover/date:scale-100 z-50">
                                                                                        <div className="bg-gray-900 text-white text-[10px] px-3 py-2 rounded-xl whitespace-nowrap shadow-2xl flex flex-col gap-1 border border-white/20">
                                                                                            <span className="font-bold flex items-center gap-1.5">
                                                                                                <Info className="w-3 h-3 text-teal-400" />
                                                                                                {(() => {
                                                                                                    const start = format(new Date(ev.startDate || ev.eventDate), 'dd MMM yyyy');
                                                                                                    const end = ev.endDate ? format(new Date(ev.endDate), 'dd MMM yyyy') : null;
                                                                                                    return end && end !== start ? `${format(new Date(ev.startDate || ev.eventDate), 'dd MMM')} - ${end}` : start;
                                                                                                })()}
                                                                                            </span>
                                                                                            {ev.venue && <span className="opacity-70">Venue: {ev.venue}</span>}
                                                                                        </div>
                                                                                        <div className="w-2 h-2 bg-gray-900 rotate-45 mx-auto -mt-1 border-r border-b border-white/20" />
                                                                                    </div>
                                                                                </Link>
                                                                            ))
                                                                        ) : (
                                                                            <span className="text-gray-200 font-bold text-xs tracking-tighter">-</span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={3 + activeMonths.length} className="py-24 text-center">
                                                    <div className="flex flex-col items-center gap-4">
                                                        <div className="p-6 bg-gray-50 rounded-full">
                                                            <Search className="w-10 h-10 text-gray-300" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-bold text-gray-900">No sessions match your search</h3>
                                                            <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1">
                                                                Try adjusting your filters or refining your search keywords to find the right training.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Footer Notes */}
                    <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-6 px-4">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-teal-500" />
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Active Sessions</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-amber-500" />
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">HRDC Claimable Available</span>
                            </div>
                        </div>

                        <p className="text-xs font-medium text-gray-400 max-w-md text-center md:text-right">
                            * All schedules are subject to change. Please contact our support team for the latest updates on session availability and booking requirements.
                        </p>
                    </div>
                </div>

                <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
            </div>
        </>
    );
}
