import { useState, useEffect } from 'react';
import { X, Calendar, CheckCircle, MapPin, BookOpen } from 'lucide-react';
import { Course } from '../lib/api-client';
import { auth } from '../lib/auth';
import { apiClient } from '../lib/api-client';

type EventRegistrationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onRequestCustomDate?: () => void;
  course: Course | null;
};

export function EventRegistrationModal({
  isOpen,
  onClose,
  onRequestCustomDate,
  course,
}: EventRegistrationModalProps) {
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [eventId, setEventId] = useState<string | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(false);
  const [availableEvents, setAvailableEvents] = useState<Array<{
    id: string;
    eventDate: string; // ISO string format (YYYY-MM-DD)
    eventDateObj: Date; // Original Date object for display
    startDate?: string | null;
    endDate?: string | null;
    startDateObj?: Date | null;
    endDateObj?: Date | null;
    title: string;
    venue?: string | null;
    courseMode?: any;
    city?: string | null;
    state?: string | null;
    maxPacks?: number | null;
    totalParticipants?: number;
  }>>([]);
  const [selectedEventDate, setSelectedEventDate] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<typeof availableEvents[0] | null>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setAvailableEvents([]);
      setSelectedEvent(null);
      setSelectedEventDate('');
      setEventId(null);
      setSubmitMessage(null);
      setLoadingEvent(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && course) {
      const fetchData = async () => {
        try {
          // Reset state when fetching new data
          setAvailableEvents([]);
          setSelectedEvent(null);
          setSelectedEventDate('');
          setEventId(null);
          setSubmitMessage(null);

          // Find all events for this course
          setLoadingEvent(true);
          const eventsResponse = await apiClient.getEvents({ courseId: course.id });
          const events = eventsResponse.events || [];

          // Filter only future events and sort by date
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const futureEvents = events
            .filter((e: any) => {
              const rawDate = e.eventDate || e.event_date;
              const eventDate = new Date(rawDate);
              if (isNaN(eventDate.getTime())) return false;
              eventDate.setHours(0, 0, 0, 0);

              // Check if event is Public - handle JSON array from database
              let courseTypes: string[] = [];
              if (Array.isArray(e.courseType)) {
                courseTypes = e.courseType;
              } else if (e.courseType) {
                try {
                  const parsed = typeof e.courseType === 'string'
                    ? JSON.parse(e.courseType)
                    : e.courseType;
                  courseTypes = Array.isArray(parsed) ? parsed : [];
                } catch {
                  courseTypes = [];
                }
              }

              // Also check course_type field for compatibility
              if (Array.isArray(e.course_type)) {
                courseTypes = [...courseTypes, ...e.course_type];
              } else if (e.course_type) {
                try {
                  const parsed = typeof e.course_type === 'string'
                    ? JSON.parse(e.course_type)
                    : e.course_type;
                  if (Array.isArray(parsed)) {
                    courseTypes = [...courseTypes, ...parsed];
                  }
                } catch {
                  // Ignore parse errors
                }
              }

              const allTypes = courseTypes.map((t: string) => String(t).toUpperCase());
              const isPublic = allTypes.includes('PUBLIC');

              return eventDate >= today && isPublic;
            })
            .map((e: any) => {
              const eventDateObj = new Date(e.eventDate || e.event_date);
              const eventDateStr = eventDateObj.toISOString().split('T')[0];

              const startDateObj = e.startDate || e.start_date ? new Date(e.startDate || e.start_date) : null;
              const endDateObj = e.endDate || e.end_date ? new Date(e.endDate || e.end_date) : null;

              return {
                id: e.id,
                eventDate: eventDateStr,
                eventDateObj: eventDateObj,
                startDate: startDateObj ? startDateObj.toISOString().split('T')[0] : null,
                endDate: endDateObj ? endDateObj.toISOString().split('T')[0] : null,
                startDateObj,
                endDateObj,
                title: e.title || course.title,
                venue: e.venue || null,
                courseMode: e.courseMode || e.course_mode || null,
                city: e.city || null,
                state: e.state || null,
                maxPacks: e.maxPacks ?? e.max_packs ?? null,
                totalParticipants: e.totalParticipants ?? e.total_participants ?? 0,
              };
            })
            .sort((a: any, b: any) => a.eventDateObj.getTime() - b.eventDateObj.getTime());

          setAvailableEvents(futureEvents);

          if (futureEvents.length === 1) {
            setEventId(futureEvents[0].id);
            setSelectedEventDate(futureEvents[0].eventDate);
            setSelectedEvent(futureEvents[0]);
          }

          // Fetch user data
          const { user } = await auth.getSession();
          if (user) {
            setFormData({
              clientName: user.fullName || user.email?.split('@')[0] || '',
              clientEmail: user.email || '',
            });
          }
        } catch (error) {
          console.error('[EventRegistrationModal] Error fetching data:', error);
          setSubmitMessage({ type: 'error', text: 'Failed to load event information' });
        } finally {
          setIsLoadingUser(false);
          setLoadingEvent(false);
        }
      };
      fetchData();
    }
  }, [isOpen, course]);

  if (!isOpen || !course) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const { user } = await auth.getSession();
      if (!user) {
        setSubmitMessage({ type: 'error', text: 'You must be logged in to register.' });
        setIsSubmitting(false);
        return;
      }

      await apiClient.registerForEvent(eventId, course.id, {
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
      });

      setSubmitMessage({
        type: 'success',
        text: 'Successfully registered! You will receive a confirmation email shortly.',
      });

      setTimeout(() => {
        onClose();
        setFormData({ clientName: '', clientEmail: '' });
        setSubmitMessage(null);
      }, 3000);
    } catch (error) {
      setSubmitMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to register',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fixedDate = course.fixed_date ? new Date(course.fixed_date) : null;
  const startDateCourse = course.start_date ? new Date(course.start_date) : null;
  const endDateCourse = course.end_date ? new Date(course.end_date) : null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-8 border-b border-gray-100 pb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Program Registration</h2>
            <p className="text-gray-500 font-medium">{course.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex flex-1 overflow-hidden">
            {/* Left Side: Date Selection */}
            <div className="w-1/2 border-r border-gray-100 flex flex-col p-8 overflow-hidden bg-gray-50/30">
              <div className="mb-6">
                <h3 className="text-[10px] font-bold text-teal-600 uppercase tracking-widest mb-1">Step 1</h3>
                <h2 className="text-xl font-bold text-gray-900">Choose your session</h2>
              </div>

              {loadingEvent ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mb-4"></div>
                  <p className="text-sm">Finding dates...</p>
                </div>
              ) : availableEvents.length > 0 ? (
                <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-6">
                  {Object.entries(
                    availableEvents.reduce((acc: Record<string, typeof availableEvents>, event) => {
                      const monthKey = event.eventDateObj.toLocaleDateString('en-MY', { month: 'long', year: 'numeric' });
                      if (!acc[monthKey]) acc[monthKey] = [];
                      acc[monthKey].push(event);
                      return acc;
                    }, {})
                  ).map(([month, events]) => (
                    <div key={month} className="space-y-3">
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">{month}</h4>
                      <div className="space-y-2">
                        {events.map((event) => {
                          const isSelected = selectedEventDate === event.eventDate;
                          const slotsLeft = event.maxPacks ? event.maxPacks - (event.totalParticipants || 0) : null;
                          const isFull = slotsLeft !== null && slotsLeft <= 0;

                          return (
                            <button
                              key={event.id}
                              type="button"
                              onClick={() => {
                                if (isFull) return;
                                setSelectedEventDate(event.eventDate);
                                setEventId(event.id);
                                setSelectedEvent(event);
                              }}
                              disabled={isFull}
                              className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center justify-between group ${isSelected
                                ? 'border-teal-500 bg-white shadow-xl shadow-teal-500/10 ring-4 ring-teal-500/5'
                                : isFull
                                  ? 'border-gray-50 bg-gray-50/50 opacity-40 cursor-not-allowed'
                                  : 'border-gray-100 bg-white/50 hover:border-teal-200 hover:bg-white'
                                }`}
                            >
                              <div className="flex-1">
                                <p className={`font-bold text-lg transition-colors ${isSelected ? 'text-teal-900' : 'text-gray-900'}`}>
                                  {event.startDateObj && event.endDateObj && event.startDate !== event.endDate ? (
                                    <span className="flex items-center gap-1">
                                      {event.startDateObj.toLocaleDateString('en-MY', { day: 'numeric' })}
                                      <span className="text-gray-400 font-normal">-</span>
                                      {event.endDateObj.toLocaleDateString('en-MY', { day: 'numeric' })}
                                      <span className="ml-2 text-sm text-gray-400 font-medium font-mono lowercase">
                                        ({event.startDateObj.toLocaleDateString('en-MY', { weekday: 'short' })})
                                      </span>
                                    </span>
                                  ) : (
                                    event.eventDateObj.toLocaleDateString('en-MY', {
                                      day: 'numeric',
                                      weekday: 'short'
                                    })
                                  )}
                                </p>
                                <p className={`text-xs font-medium ${isSelected ? 'text-teal-600' : 'text-gray-500'}`}>
                                  {event.startDateObj && event.endDateObj && event.startDateObj.getMonth() !== event.endDateObj.getMonth() ? (
                                    <>
                                      {event.startDateObj.toLocaleDateString('en-MY', { month: 'short' })}
                                      <span className="mx-1">/</span>
                                      {event.endDateObj.toLocaleDateString('en-MY', { month: 'short', year: 'numeric' })}
                                    </>
                                  ) : (
                                    (event.startDateObj || event.eventDateObj).toLocaleDateString('en-MY', { month: 'short', year: 'numeric' })
                                  )}
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0 ml-4">
                                {slotsLeft !== null ? (
                                  <div className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider ${isFull ? 'bg-red-50 text-red-500 border border-red-100' : slotsLeft < 5 ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-teal-50 text-teal-600 border border-teal-100'}`}>
                                    {isFull ? 'Full' : `${slotsLeft} Slots Left`}
                                  </div>
                                ) : (
                                  <div className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-bold uppercase tracking-wider">
                                    Open
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : fixedDate || startDateCourse ? (
                <div className="flex-1 flex flex-col justify-center">
                  <div className="p-8 bg-white rounded-3xl border-2 border-teal-50 shadow-sm text-center">
                    <Calendar className="w-12 h-12 text-teal-500 mx-auto mb-4 opacity-20" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-2">Fixed Schedule</p>
                    <p className="text-2xl font-bold text-gray-900 mb-1">
                      {startDateCourse && endDateCourse && course.start_date !== course.end_date ? (
                        <span className="flex items-center justify-center gap-2">
                          {startDateCourse.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
                          <span className="text-gray-300 font-normal">-</span>
                          {endDateCourse.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      ) : (
                        (fixedDate || startDateCourse)?.toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })
                      )}
                    </p>
                    <p className="text-teal-600 font-medium">
                      {(fixedDate || startDateCourse)?.toLocaleDateString('en-MY', { weekday: 'long' })}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                  <p>No dates available</p>
                </div>
              )}

              {/* Add Request Custom Date Option */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-3 font-medium">Can't find a suitable date?</p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onRequestCustomDate) onRequestCustomDate();
                  }}
                  className="w-full py-4 px-6 border-2 border-dashed border-teal-200 text-teal-600 rounded-2xl font-bold text-sm hover:border-teal-500 hover:bg-teal-50/50 transition-all flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Request Custom Public Date
                </button>
              </div>
            </div>

            {/* Right Side: Details & Registration */}
            <div className="w-1/2 p-8 overflow-y-auto scrollbar-hide flex flex-col">
              <div className="mb-6">
                <h3 className="text-[10px] font-bold text-teal-600 uppercase tracking-widest mb-1">Step 2</h3>
                <h2 className="text-xl font-bold text-gray-900">Complete Application</h2>
              </div>

              <div className="space-y-6 flex-1">
                {/* Session Summary Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-2 mb-3 text-teal-600">
                      <MapPin className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Venue</span>
                    </div>
                    {selectedEvent ? (
                      <div>
                        <p className="text-gray-900 font-bold text-sm leading-tight mb-1">
                          {selectedEvent.venue || 'To be confirmed'}
                        </p>
                        {selectedEvent.city && (
                          <span className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">
                            {selectedEvent.city}, {selectedEvent.state}
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-xs italic">Select a date</p>
                    )}
                  </div>

                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-2 mb-3 text-purple-600">
                      <BookOpen className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Mode</span>
                    </div>
                    {selectedEvent ? (
                      <div className="text-gray-900 font-bold text-sm">
                        {selectedEvent.courseMode ? (() => {
                          let modes: string[] = [];
                          try {
                            if (Array.isArray(selectedEvent.courseMode)) modes = selectedEvent.courseMode;
                            else if (typeof selectedEvent.courseMode === 'string') {
                              const parsed = JSON.parse(selectedEvent.courseMode);
                              modes = Array.isArray(parsed) ? parsed : [parsed];
                            } else if (selectedEvent.courseMode) modes = [selectedEvent.courseMode];
                          } catch { modes = [String(selectedEvent.courseMode)]; }
                          const modeLabels: { [key: string]: string } = { 'PHYSICAL': 'Physical', 'ONLINE': 'Online', 'HYBRID': 'Hybrid' };
                          return modes.map(m => modeLabels[String(m).toUpperCase()] || m).join(', ') || 'To be confirmed';
                        })() : 'To be confirmed'}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-xs italic">Select a date</p>
                    )}
                  </div>
                </div>

                <div className="h-px bg-gray-100" />

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your name"
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      required
                      className="w-full px-5 py-3 bg-white border-2 border-gray-100 rounded-xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all text-sm font-medium"
                      disabled={isSubmitting || isLoadingUser}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="you@email.com"
                      value={formData.clientEmail}
                      onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                      required
                      className="w-full px-5 py-3 bg-white border-2 border-gray-100 rounded-xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all text-sm font-medium"
                      disabled={isSubmitting || isLoadingUser}
                    />
                  </div>
                </div>

                {submitMessage && (
                  <div className={`p-4 rounded-2xl border ${submitMessage.type === 'success'
                    ? 'bg-green-50 text-green-700 border-green-100'
                    : 'bg-red-50 text-red-700 border-red-100'
                    }`}>
                    <div className="flex items-center gap-3">
                      {submitMessage.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
                      <p className="text-xs font-bold">{submitMessage.text}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="p-8 border-t border-gray-100 bg-white flex justify-end gap-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (availableEvents.length > 0 && !selectedEventDate)}
              className="px-12 py-3 bg-gray-900 text-white text-sm font-bold rounded-2xl hover:bg-gray-800 disabled:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed transition-all shadow-xl shadow-gray-200"
            >
              {isSubmitting ? 'Registering...' : 'Register for Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
