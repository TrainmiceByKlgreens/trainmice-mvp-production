import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar,
    MapPin,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    BookOpen,
    Briefcase,
    Info,
    Clock,
} from 'lucide-react';
import { auth } from '../lib/auth';
import { apiClient } from '../lib/api-client';
import { format } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PublicRegistration {
    id: string;
    eventId: string;
    courseId: string | null;
    courseTitle: string;
    courseCode: string | null;
    startDate: string | null;
    endDate: string | null;
    eventDate: string;
    venue: string | null;
    city: string | null;
    state: string | null;
    category: any;
    registrationStatus: string;
    eventStatus: string;
    courseType: any;
    registeredAt: string;
}

interface InHouseBooking {
    id: string;
    courseId: string | null;
    courseTitle: string;
    courseCode: string | null;
    requestedDate: string | null;
    status: string;
    linkedEventStatus: string | null;
    linkedEventDate: string | null;
    // Cancellation reasoning from BookingReasoning table
    cancellationReason: string | null;
    cancelledAtStatus: string | null;
    location: string | null;
    city: string | null;
    state: string | null;
    createdAt: string;
}

interface CustomCourseRequest {
    id: string;
    courseName: string;
    contactPerson: string;
    email: string;
    clientPhone: string | null;
    preferredDates: string | null;
    budget: string | number | null;
    status: string; // PENDING, TBC, REJECTED, IN_PROGRESS, COURSE_OUTLINE_PENDING, COURSE_OUTLINE_READY
    createdAt: string;
    adminNotes: string | null;
    proposedTrainingDate: string | null;
    trainingMode: string | null;
}

// ─── Stage Definitions ────────────────────────────────────────────────────────

const PUBLIC_STEPS = [
    { key: 'REGISTERED', label: 'Registered', desc: 'Your registration has been received.' },
    { key: 'CONFIRMED_UPCOMING', label: 'Confirmed', desc: 'Your spot is confirmed.' },
    { key: 'ATTENDED', label: 'Attended', desc: 'Training completed.' },
];

// 5 stages as requested by user
const INHOUSE_STEPS = [
    { key: 'PENDING', label: 'Request Sent', desc: 'We have received your training request.' },
    { key: 'TENTATIVE', label: 'Tentative', desc: 'A tentative date has been proposed.' },
    { key: 'APPROVED', label: 'Quotation Sent', desc: 'Our team has sent you a quotation.' },
    { key: 'CONFIRMED', label: 'Training Confirmed', desc: 'Training date and details are confirmed.' },
    { key: 'COMPLETED', label: 'Completed', desc: 'Training has been delivered successfully.' },
];

const CUSTOM_STEPS = [
    { key: 'PENDING', label: 'Request Sent', desc: 'Initial submission received.' },
    { key: 'REVIEWING', label: 'Under Review', desc: 'Admin is checking feasibility.' },
    { key: 'OUTLINING', label: 'Drafting Outline', desc: 'Trainer is preparing the curriculum.' },
    { key: 'READY', label: 'Outline Ready', desc: 'The proposed outline is available.' },
];

// ─── Status Logic ─────────────────────────────────────────────────────────────

function getPublicStep(reg: PublicRegistration): {
    index: number; canceled: boolean; cancelLabel: string;
} {
    const rs = (reg.registrationStatus || '').toUpperCase();
    const es = (reg.eventStatus || 'ACTIVE').toUpperCase();
    if (rs === 'CANCELLED' || rs === 'CANCELED') return { index: -1, canceled: true, cancelLabel: 'Registration Cancelled' };
    if (es === 'CANCELLED' || es === 'CANCELED') return { index: -1, canceled: true, cancelLabel: 'Event Cancelled' };
    if (es === 'COMPLETED') return { index: 2, canceled: false, cancelLabel: '' };
    if (rs === 'APPROVED' || rs === 'CONFIRMED') {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const ref = reg.startDate || reg.eventDate;
        try {
            const d = new Date(ref); d.setHours(0, 0, 0, 0);
            if (d < today) return { index: 2, canceled: false, cancelLabel: '' };
        } catch { /* */ }
        return { index: 1, canceled: false, cancelLabel: '' };
    }
    return { index: 0, canceled: false, cancelLabel: '' };
}

/**
 * Status-to-step mapping for in-house bookings.
 * Does NOT auto-advance on date; only linkedEventStatus=COMPLETED advances to step 4.
 */
function getInhouseStep(booking: InHouseBooking): {
    index: number; canceled: boolean; cancelLabel: string;
} {
    const s = (booking.status || '').toUpperCase();
    const es = (booking.linkedEventStatus || '').toUpperCase();
    if (s === 'DENIED') return { index: -1, canceled: true, cancelLabel: 'Request Declined' };
    if (s === 'CANCELLED' || s === 'CANCELED') return { index: -1, canceled: true, cancelLabel: 'Request Cancelled' };
    if (es === 'CANCELLED' || es === 'CANCELED') return { index: -1, canceled: true, cancelLabel: 'Training Cancelled' };
    if (s === 'PENDING') return { index: 0, canceled: false, cancelLabel: '' };
    if (s === 'TENTATIVE') return { index: 1, canceled: false, cancelLabel: '' };
    if (s === 'APPROVED' || s === 'QUOTED') return { index: 2, canceled: false, cancelLabel: '' };
    if (s === 'CONFIRMED') {
        if (es === 'COMPLETED') return { index: 4, canceled: false, cancelLabel: '' };
        return { index: 3, canceled: false, cancelLabel: '' };
    }
    if (s === 'COMPLETED') return { index: 4, canceled: false, cancelLabel: '' };
    return { index: 0, canceled: false, cancelLabel: '' };
}

function getCustomStep(request: CustomCourseRequest): {
    index: number; canceled: boolean; cancelLabel: string;
} {
    const s = (request.status || '').toUpperCase();
    if (s === 'REJECTED') return { index: -1, canceled: true, cancelLabel: 'Request Rejected' };
    if (s === 'PENDING') return { index: 0, canceled: false, cancelLabel: '' };
    if (s === 'TBC' || s === 'IN_PROGRESS') return { index: 1, canceled: false, cancelLabel: '' };
    if (s === 'COURSE_OUTLINE_PENDING') return { index: 2, canceled: false, cancelLabel: '' };
    if (s === 'COURSE_OUTLINE_READY') return { index: 3, canceled: false, cancelLabel: '' };
    return { index: 0, canceled: false, cancelLabel: '' };
}

// Maps DB status to user-friendly stage label for the "cancelled at" message
const STAGE_NAME: Record<string, string> = {
    PENDING: 'Request Sent',
    TENTATIVE: 'Tentative Date',
    APPROVED: 'Quotation Sent',
    CONFIRMED: 'Training Confirmed',
    COMPLETED: 'Completed',
};

// ─── Vertical Stepper ─────────────────────────────────────────────────────────

function VerticalStepper({
    steps,
    currentIndex,
    canceled,
    cancelLabel,
    cancelledAtStatus,
    cancellationReason,
}: {
    steps: { key: string; label: string; desc: string }[];
    currentIndex: number;
    canceled: boolean;
    cancelLabel: string;
    cancelledAtStatus?: string | null;
    cancellationReason?: string | null;
}) {
    if (canceled) {
        const atStage = cancelledAtStatus ? (STAGE_NAME[cancelledAtStatus] || cancelledAtStatus) : null;
        return (
            <div className="mt-5 border-l-2 border-red-200 pl-4 ml-3 space-y-3">
                {atStage && (
                    <p className="text-xs font-semibold text-red-500 uppercase tracking-wider">
                        {cancelLabel} — at stage: {atStage}
                    </p>
                )}
                {!atStage && (
                    <p className="text-xs font-semibold text-red-500 uppercase tracking-wider">{cancelLabel}</p>
                )}
                {cancellationReason && (
                    <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                        <p className="text-[11px] font-bold text-red-400 uppercase tracking-wider mb-1">Reason</p>
                        <p className="text-sm text-red-700 leading-relaxed">{cancellationReason}</p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="mt-5 space-y-0">
            {steps.map((step, idx) => {
                const isDone = idx < currentIndex;
                const isActive = idx === currentIndex;
                const isLast = idx === steps.length - 1;

                return (
                    <div key={step.key} className="flex gap-3">
                        {/* Left: icon + connector line */}
                        <div className="flex flex-col items-center">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 flex-shrink-0 transition-all ${isDone ? 'bg-green-500 border-green-500' :
                                isActive ? 'bg-amber-400 border-amber-400 shadow-md ring-4 ring-amber-50' :
                                    'bg-white border-gray-200'
                                }`}>
                                {isDone ? (
                                    <CheckCircle2 className="w-4 h-4 text-white" />
                                ) : isActive ? (
                                    <div className="w-2.5 h-2.5 rounded-full bg-white" />
                                ) : (
                                    <div className="w-2 h-2 rounded-full bg-gray-200" />
                                )}
                            </div>
                            {!isLast && (
                                <div className={`w-0.5 flex-1 min-h-[28px] my-0.5 ${isDone ? 'bg-green-300' : 'bg-gray-100'}`} />
                            )}
                        </div>

                        {/* Right: label + desc */}
                        <div className={`pb-5 pt-0.5 min-w-0 ${isLast ? 'pb-0' : ''}`}>
                            <p className={`text-xs font-bold uppercase tracking-wider ${isDone ? 'text-green-600' : isActive ? 'text-amber-600' : 'text-gray-300'
                                }`}>
                                {step.label}
                            </p>
                            {isActive && (
                                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{step.desc}</p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Cards ────────────────────────────────────────────────────────────────────

function PublicBookingCard({ booking }: { booking: PublicRegistration }) {
    const [expanded, setExpanded] = useState(false);
    const { index, canceled, cancelLabel } = getPublicStep(booking);

    const dateRange = (() => {
        try {
            const start = format(new Date(booking.startDate || booking.eventDate), 'dd MMM yyyy');
            const end = booking.endDate ? format(new Date(booking.endDate), 'dd MMM yyyy') : null;
            return end && end !== start ? `${start} – ${end}` : start;
        } catch { return booking.eventDate || 'TBD'; }
    })();

    const categoryLabel = (() => {
        try {
            if (!booking.category) return null;
            const arr = Array.isArray(booking.category) ? booking.category : JSON.parse(String(booking.category));
            return Array.isArray(arr) ? arr[0] : String(arr);
        } catch { return String(booking.category); }
    })();

    const registeredOn = (() => {
        try { return format(new Date(booking.registeredAt), 'dd MMM yyyy'); }
        catch { return ''; }
    })();

    return (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden">
            <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-widest bg-teal-50 text-teal-700 border border-teal-100 px-2 py-0.5 rounded-md">
                                Public Event
                            </span>
                            {categoryLabel && (
                                <span className="text-[10px] font-bold uppercase tracking-widest bg-gray-50 text-gray-600 border border-gray-100 px-2 py-0.5 rounded-md">
                                    {categoryLabel}
                                </span>
                            )}
                            {booking.courseCode && (
                                <span className="text-[10px] font-mono text-gray-400">#{booking.courseCode}</span>
                            )}
                        </div>
                        <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2">{booking.courseTitle}</h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {dateRange}</span>
                            {(booking.venue || booking.city) && (
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {[booking.venue, booking.city, booking.state].filter(Boolean).join(', ')}
                                </span>
                            )}
                        </div>
                    </div>
                    <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600 mt-1 flex-shrink-0">
                        {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                </div>

                <VerticalStepper
                    steps={PUBLIC_STEPS}
                    currentIndex={index}
                    canceled={canceled}
                    cancelLabel={cancelLabel}
                />
            </div>

            {expanded && (
                <div className="border-t border-gray-50 px-5 py-4 bg-gray-50/50">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-gray-600">
                        <div>
                            <p className="text-[10px] font-bold uppercase text-gray-400 mb-0.5">Booking Ref</p>
                            <p className="font-mono font-semibold text-gray-700 truncate">{booking.id}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase text-gray-400 mb-0.5">Registered On</p>
                            <p className="font-semibold">{registeredOn}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase text-gray-400 mb-0.5">Status</p>
                            <p className="font-semibold capitalize">{booking.registrationStatus.toLowerCase()}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function InHouseBookingCard({ booking }: { booking: InHouseBooking }) {
    const [expanded, setExpanded] = useState(false);
    const { index, canceled, cancelLabel } = getInhouseStep(booking);

    const requestedDate = (() => {
        if (!booking.requestedDate) return 'Date TBD';
        try { return format(new Date(booking.requestedDate), 'dd MMM yyyy'); }
        catch { return booking.requestedDate; }
    })();

    const submittedOn = (() => {
        try { return format(new Date(booking.createdAt), 'dd MMM yyyy'); }
        catch { return ''; }
    })();

    const location = [booking.location, booking.city, booking.state].filter(Boolean).join(', ') || null;

    return (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden">
            <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-widest bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded-md">
                                In-House Training
                            </span>
                            {booking.courseCode && (
                                <span className="text-[10px] font-mono text-gray-400">#{booking.courseCode}</span>
                            )}
                        </div>
                        <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2">{booking.courseTitle}</h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Preferred: {requestedDate}</span>
                            {location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {location}</span>}
                        </div>
                    </div>
                    <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600 mt-1 flex-shrink-0">
                        {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                </div>

                <VerticalStepper
                    steps={INHOUSE_STEPS}
                    currentIndex={index}
                    canceled={canceled}
                    cancelLabel={cancelLabel}
                    cancelledAtStatus={booking.cancelledAtStatus}
                    cancellationReason={booking.cancellationReason}
                />
            </div>

            {expanded && (
                <div className="border-t border-gray-50 px-5 py-4 bg-gray-50/50">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-gray-600">
                        <div>
                            <p className="text-[10px] font-bold uppercase text-gray-400 mb-0.5">Request Ref</p>
                            <p className="font-mono font-semibold text-gray-700 truncate">{booking.id}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase text-gray-400 mb-0.5">Submitted On</p>
                            <p className="font-semibold">{submittedOn}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase text-gray-400 mb-0.5">Current Stage</p>
                            <p className="font-semibold capitalize">{booking.status.toLowerCase().replace(/_/g, ' ')}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function CustomRequestCard({ request }: { request: CustomCourseRequest }) {
    const [expanded, setExpanded] = useState(false);
    const { index, canceled, cancelLabel } = getCustomStep(request);

    const proposedDate = (() => {
        if (!request.proposedTrainingDate) return 'Date TBC';
        try { return format(new Date(request.proposedTrainingDate), 'dd MMM yyyy'); }
        catch { return request.proposedTrainingDate; }
    })();

    const submittedOn = (() => {
        try { return format(new Date(request.createdAt), 'dd MMM yyyy'); }
        catch { return ''; }
    })();

    return (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden">
            <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-md">
                                Custom Course Request
                            </span>
                            {request.trainingMode && (
                                <span className="text-[10px] font-bold uppercase tracking-widest bg-gray-50 text-gray-600 border border-gray-100 px-2 py-0.5 rounded-md">
                                    {request.trainingMode}
                                </span>
                            )}
                        </div>
                        <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2">{request.courseName}</h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Proposed: {proposedDate}</span>
                            {request.preferredDates && <span className="flex items-center gap-1 font-medium"><Clock className="w-3.5 h-3.5" /> Preferred: {request.preferredDates}</span>}
                        </div>
                    </div>
                    <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600 mt-1 flex-shrink-0">
                        {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                </div>

                <VerticalStepper
                    steps={CUSTOM_STEPS}
                    currentIndex={index}
                    canceled={canceled}
                    cancelLabel={cancelLabel}
                />
            </div>

            {expanded && (
                <div className="border-t border-gray-50 px-5 py-4 bg-gray-50/50">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-gray-600">
                        <div>
                            <p className="text-[10px] font-bold uppercase text-gray-400 mb-0.5">Request Ref</p>
                            <p className="font-mono font-semibold text-gray-700 truncate">{request.id}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase text-gray-400 mb-0.5">Submitted On</p>
                            <p className="font-semibold">{submittedOn}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase text-gray-400 mb-0.5">Contact Person</p>
                            <p className="font-semibold">{request.contactPerson}</p>
                        </div>
                    </div>
                    {request.adminNotes && (
                        <div className="mt-4 p-3 bg-white border border-gray-100 rounded-xl">
                            <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Admin Notes</p>
                            <p className="text-xs text-gray-600 leading-relaxed">{request.adminNotes}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({
    icon: Icon,
    title,
    description,
    cta,
}: { icon: any; title: string; description: string; cta?: { label: string; onClick: () => void } }) {
    return (
        <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                <Icon className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">{description}</p>
            {cta && (
                <button
                    onClick={cta.onClick}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-amber-400 hover:bg-amber-500 text-white font-bold rounded-xl transition-all text-sm shadow-sm"
                >
                    {cta.label}
                </button>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function MyBookings() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'public' | 'inhouse' | 'custom'>('public');
    const [publicBookings, setPublicBookings] = useState<PublicRegistration[]>([]);
    const [inhouseBookings, setInhouseBookings] = useState<InHouseBooking[]>([]);
    const [customRequests, setCustomRequests] = useState<CustomCourseRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

    useEffect(() => {
        auth.getSession().then(({ user }) => {
            if (!user) { setIsLoggedIn(false); setLoading(false); }
            else { setIsLoggedIn(true); loadAll(); }
        });
    }, []);

    const loadAll = async () => {
        setLoading(true); setError(null);
        try {
            const [pubRes, inhouseRes, customRes] = await Promise.allSettled([
                apiClient.getMyRegistrations(),
                apiClient.getMyBookingRequests(),
                apiClient.getCustomRequests(),
            ]);
            if (pubRes.status === 'fulfilled') setPublicBookings(pubRes.value || []);
            if (inhouseRes.status === 'fulfilled') setInhouseBookings(inhouseRes.value || []);
            if (customRes.status === 'fulfilled') setCustomRequests((customRes.value as any) || []);
        } catch {
            setError('Unable to load your bookings. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    if (isLoggedIn === false) {
        return (
            <div className="min-h-screen bg-gray-50/50 flex items-center justify-center px-4">
                <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center border border-gray-100">
                    <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-5">
                        <AlertCircle className="w-8 h-8 text-amber-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Login Required</h2>
                    <p className="text-gray-500 text-sm mb-6">Please log in to view your booking history.</p>
                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent('openLogin'))}
                        className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-white font-bold rounded-xl transition-all"
                    >
                        Log In
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mb-4" />
                    <p className="text-gray-500 font-medium">Loading your bookings…</p>
                </div>
            </div>
        );
    }

    const tabs = [
        { key: 'public' as const, label: 'Public Event Registrations', icon: BookOpen, count: publicBookings.length },
        { key: 'inhouse' as const, label: 'In-House Requests', icon: Briefcase, count: inhouseBookings.length },
        { key: 'custom' as const, label: 'Custom Course Requests', icon: BookOpen, count: customRequests.length },
    ];

    return (
        <div className="min-h-screen bg-gray-50/50 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="mb-8 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center shadow-sm">
                        <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">My Bookings</h1>
                        <p className="text-sm text-gray-400 font-medium">Track your training registrations and in-house requests</p>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-5 mb-6 px-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Completed step
                    </span>
                    <span className="flex items-center gap-1.5 font-semibold">
                        <div className="w-3.5 h-3.5 rounded-full bg-amber-400 ring-2 ring-amber-100" /> Current step
                    </span>
                    <span className="flex items-center gap-1.5 font-semibold">
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-200 bg-white" /> Upcoming
                    </span>
                    <span className="flex items-center gap-1.5 font-semibold">
                        <XCircle className="w-3.5 h-3.5 text-red-500" /> Cancelled / Declined
                    </span>
                </div>

                {/* Tabs */}
                <div className="flex flex-col sm:flex-row gap-2 mb-6">
                    {tabs.map(({ key, label, icon: Icon, count }) => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-sm transition-all border ${activeTab === key
                                ? 'bg-gray-900 text-white border-gray-900 shadow-md'
                                : 'bg-white text-gray-500 border-gray-200 hover:text-gray-800 hover:bg-gray-50'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                            <span className={`ml-auto text-[11px] font-bold px-2 py-0.5 rounded-lg ${activeTab === key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                                }`}>
                                {count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 rounded-2xl px-5 py-4 text-sm font-medium">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
                    </div>
                )}

                {/* Public Events tab */}
                {activeTab === 'public' && (
                    publicBookings.length === 0
                        ? <EmptyState
                            icon={BookOpen}
                            title="No Public Event Registrations Yet"
                            description="When you register for a public training event, your booking and progress will appear here."
                            cta={{ label: 'Browse Public Training', onClick: () => navigate('/public-training') }}
                        />
                        : <div className="flex flex-col gap-4">
                            {publicBookings.map((b) => <PublicBookingCard key={b.id} booking={b} />)}
                        </div>
                )}

                {/* Custom tab */}
                {activeTab === 'custom' && (
                    customRequests.length === 0
                        ? <EmptyState
                            icon={BookOpen}
                            title="No Custom Course Requests Yet"
                            description="When you request a bespoke training topic tailored to your needs, your request progress will appear here."
                            cta={{ label: 'Request a Custom Course', onClick: () => navigate('/contact-us') }}
                        />
                        : <div className="flex flex-col gap-4">
                            {customRequests.map((r) => <CustomRequestCard key={r.id} request={r} />)}
                        </div>
                )}
                {activeTab === 'inhouse' && (
                    inhouseBookings.length === 0
                        ? <EmptyState
                            icon={Briefcase}
                            title="No In-House Requests Yet"
                            description="Your private training requests and their approval progress will appear here."
                            cta={{ label: 'Contact Us to Request', onClick: () => navigate('/contact-us') }}
                        />
                        : <div className="flex flex-col gap-4">
                            {inhouseBookings.map((b) => <InHouseBookingCard key={b.id} booking={b} />)}
                        </div>
                )}

                {/* Footer note */}
                <div className="mt-8 flex items-start gap-2 text-xs text-gray-400">
                    <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <p>
                        Status updates are managed by our admin team. For urgent inquiries,{' '}
                        <button onClick={() => navigate('/contact-us')} className="text-amber-500 font-semibold hover:underline">
                            contact us
                        </button>.
                    </p>
                </div>
            </div>
        </div>
    );
}
