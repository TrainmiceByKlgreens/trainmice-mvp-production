import React, { useEffect, useState, useRef } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { apiClient } from '../lib/api-client';
import { useRealtime } from '../hooks/useRealtime';
import { formatDate } from '../utils/helpers';
import { Calendar, MapPin, Users, Filter, X } from 'lucide-react';
import { showToast } from '../components/common/Toast';
import { FeedbackQRModal } from '../components/events/FeedbackQRModal';
import { AddParticipantsModal } from '../components/events/AddParticipantsModal';
import { EventDetailsView } from '../components/events/EventDetailsView';
import { Event } from '../types';



export const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'COMPLETED' | 'CANCELLED'>('ACTIVE');
  const [requestTypeTab, setRequestTypeTab] = useState<'PUBLIC' | 'IN_HOUSE'>('PUBLIC');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    trainerId: '',
    courseId: '',
  });
  const [selectedEventForQR, setSelectedEventForQR] = useState<Event | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedEventForParticipants, setSelectedEventForParticipants] = useState<Event | null>(null);
  const [showAddParticipantsModal, setShowAddParticipantsModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});



  // Registration Management State
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const [numberOfParticipants, setNumberOfParticipants] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);

  // Ref so the real-time callback always reads the CURRENT advancedFilters
  const advancedFiltersRef = useRef(advancedFilters);
  useEffect(() => {
    advancedFiltersRef.current = advancedFilters;
  }, [advancedFilters]);

  useEffect(() => {
    fetchEvents();
  }, []);

  // Real-time synchronization
  useRealtime((payload: any) => {
    const relevantTables = ['events', 'event_registrations', 'bookings', 'booking_requests'];
    if (relevantTables.includes(payload.table)) {
      console.log('📅 Real-time update for events (Unified):', payload.table);
      fetchEvents(true);
    }
  });

  useEffect(() => {
    applyFilters();
  }, [events, searchTerm, activeTab, requestTypeTab, selectedMonth]);

  const fetchEvents = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const currentFilters = advancedFiltersRef.current;
      const params: any = {};
      if (currentFilters.trainerId) params.trainerId = currentFilters.trainerId;
      if (currentFilters.courseId) params.courseId = currentFilters.courseId;

      const [eventsResponse] = await Promise.all([
        apiClient.getEvents(params)
      ]);

      let fetchedEvents = eventsResponse.events || [];

      // Auto-complete past ACTIVE events
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const pastActiveEvents = fetchedEvents.filter((event: Event) => {
        if (event.status !== 'ACTIVE') return false;
        const eventEndDate = event.endDate ? new Date(event.endDate) : new Date(event.eventDate);
        eventEndDate.setHours(0, 0, 0, 0);
        return eventEndDate < today;
      });

      if (pastActiveEvents.length > 0) {
        try {
          await apiClient.autoCompletePastEvents();
          fetchedEvents = fetchedEvents.map((event: Event) => {
            if (pastActiveEvents.find((e: Event) => e.id === event.id)) {
              return { ...event, status: 'COMPLETED' as const };
            }
            return event;
          });
          if (!silent) showToast(`Auto-completed ${pastActiveEvents.length} past event(s)`, 'success');
        } catch (error: any) {
          console.error('Error auto-completing past events:', error);
        }
      }

      setEvents(fetchedEvents);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      if (!silent) showToast(error.message || 'Error fetching data', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleStatusChange = async (eventId: string, newStatus: string) => {
    setUpdatingStatus((prev) => ({ ...prev, [eventId]: true }));
    try {
      const response = await apiClient.updateEventStatus(eventId, newStatus);
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === eventId
            ? { ...event, status: newStatus as 'ACTIVE' | 'COMPLETED' | 'CANCELLED' }
            : event
        )
      );
      showToast(response.message || 'Event status updated successfully', 'success');
    } catch (error: any) {
      console.error('Error updating event status:', error);
      showToast(error.message || 'Failed to update event status', 'error');
    } finally {
      setUpdatingStatus((prev) => ({ ...prev, [eventId]: false }));
    }
  };

  const handleDeleteEvent = async (event: Event) => {
    if (event.status !== 'CANCELLED') {
      showToast('Please cancel the event before deleting it.', 'error');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete the event "${event.title || event.course?.title}"? This action cannot be undone.`)) {
      return;
    }
    try {
       await apiClient.deleteEvent(event.id);
       setEvents((prev) => prev.filter((e) => e.id !== event.id));
       showToast('Event deleted successfully', 'success');
    } catch (error: any) {
       console.error('Error deleting event:', error);
       showToast(error.message || 'Failed to delete event', 'error');
    }
  };

  const handleApproveRegistration = async () => {
    if (!selectedRegistration || !numberOfParticipants) return;
    setActionLoading(true);
    try {
      await apiClient.approveEventRegistration(selectedRegistration.id, parseInt(numberOfParticipants));
      showToast('Registration approved successfully', 'success');
      setShowApproveModal(false);
      setSelectedRegistration(null);
      setNumberOfParticipants('');
      fetchEvents(true);
    } catch (error: any) {
      showToast(error.message || 'Error approving registration', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRegistration = async (registrationId: string) => {
    if (!window.confirm('Are you sure you want to cancel this registration?')) return;
    setActionLoading(true);
    try {
      await apiClient.cancelEventRegistration(registrationId);
      showToast('Registration cancelled successfully', 'success');
      fetchEvents(true);
    } catch (error: any) {
      showToast(error.message || 'Error cancelling registration', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAsRead = async (registrationId: string) => {
    try {
      await apiClient.markEventRegistrationAsRead(registrationId);
      if (selectedEvent && selectedEvent.registrations) {
        const updatedRegistrations = selectedEvent.registrations.map(reg =>
          reg.id === registrationId ? { ...reg, isRead: true } : reg
        );
        setSelectedEvent({ ...selectedEvent, registrations: updatedRegistrations });
      }
      setEvents(prev => prev.map(evt => {
        if (!evt.registrations) return evt;
        return {
          ...evt,
          registrations: evt.registrations.map(reg =>
            reg.id === registrationId ? { ...reg, isRead: true } : reg
          )
        };
      }));
    } catch (err) {
      console.error('Error marking registration as read:', err);
    }
  };



  const applyFilters = () => {
    let filtered = [...events];
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.course?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.trainer?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    filtered = filtered.filter(event => event.status === activeTab);
    // Filter by Request Type (In-House vs Public)
    filtered = filtered.filter(event => {
      const isPublic = event.course?.courseType?.includes('PUBLIC') || event.courseType?.includes('PUBLIC');
      const isHouse = event.course?.courseType?.includes('IN_HOUSE') || event.courseType?.includes('IN_HOUSE');
      if (requestTypeTab === 'PUBLIC') return isPublic;
      return isHouse;
    });
    if (selectedMonth !== 'all') {
      filtered = filtered.filter(event => {
        if (!event.eventDate) return false;
        const eventMonth = new Date(event.eventDate).getMonth();
        return eventMonth === parseInt(selectedMonth);
      });
    }
    setFilteredEvents(filtered);
  };

  const handleAdvancedSearch = () => {
    fetchEvents();
    setShowAdvancedFilters(false);
  };

  const clearAdvancedFilters = () => {
    setAdvancedFilters({ trainerId: '', courseId: '' });
    fetchEvents();
  };

  const getStatusVariant = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return 'success';
      case 'COMPLETED': return 'info';
      case 'CANCELLED': return 'danger';
      default: return 'default';
    }
  };

  const months = [
    { value: 'all', label: 'All Months' },
    { value: '0', label: 'January' },
    { value: '1', label: 'February' },
    { value: '2', label: 'March' },
    { value: '3', label: 'April' },
    { value: '4', label: 'May' },
    { value: '5', label: 'June' },
    { value: '6', label: 'July' },
    { value: '7', label: 'August' },
    { value: '8', label: 'September' },
    { value: '9', label: 'October' },
    { value: '10', label: 'November' },
    { value: '11', label: 'December' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {selectedEvent ? (
        <EventDetailsView
          event={selectedEvent}
          onBack={() => setSelectedEvent(null)}
          onStatusChange={async (id, status) => {
            await handleStatusChange(id, status);
            setSelectedEvent(prev => prev ? { ...prev, status: status as any } : null);
          }}
          onDelete={async (e) => {
            await handleDeleteEvent(e);
            setSelectedEvent(null);
          }}
          onShowQR={(e) => {
            setSelectedEventForQR(e);
            setShowQRModal(true);
          }}
          onAddParticipants={(e) => {
            setSelectedEventForParticipants(e);
            setShowAddParticipantsModal(true);
          }}
          onApproveRegistration={(reg) => {
            setSelectedRegistration(reg);
            setNumberOfParticipants(String(reg.numberOfParticipants || 1));
            setShowApproveModal(true);
          }}
          onCancelRegistration={handleCancelRegistration}
          onMarkRegistrationAsRead={handleMarkAsRead}
          isUpdating={Object.values(updatingStatus).some(Boolean) || actionLoading}
        />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Events</h1>
              <p className="text-gray-600 mt-1">
                {filteredEvents.length} event(s) found
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="secondary" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}>
                <Filter size={18} className="mr-2" />
                Advanced Filters
              </Button>
            </div>
          </div>

          {showAdvancedFilters && (
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Advanced Filters</h2>
                  <button onClick={() => setShowAdvancedFilters(false)}>
                    <X size={20} className="text-gray-500" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Trainer ID"
                    value={advancedFilters.trainerId}
                    onChange={(e) => setAdvancedFilters({ ...advancedFilters, trainerId: e.target.value })}
                    placeholder="Filter by trainer ID"
                  />
                  <Input
                    label="Course ID"
                    value={advancedFilters.courseId}
                    onChange={(e) => setAdvancedFilters({ ...advancedFilters, courseId: e.target.value })}
                    placeholder="Filter by course ID"
                  />
                </div>
                <div className="flex justify-end space-x-3 mt-4">
                  <Button variant="secondary" onClick={clearAdvancedFilters}>Clear</Button>
                  <Button variant="primary" onClick={handleAdvancedSearch}>Apply Filters</Button>
                </div>
              </div>
            </Card>
          )}

          <div className="flex border-b border-gray-200">
            {[
              { id: 'PUBLIC', label: 'Public Programs' },
              { id: 'IN_HOUSE', label: 'In-House Programs' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setRequestTypeTab(tab.id as any)}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors relative ${requestTypeTab === tab.id
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl w-fit">
              {[
                { id: 'ACTIVE', label: 'Active' },
                { id: 'COMPLETED', label: 'Completed' },
                { id: 'CANCELLED', label: 'Cancelled' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-4 text-xs font-semibold rounded-lg transition-all ${activeTab === tab.id
                    ? 'bg-white text-teal-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  {tab.label}
                  <span className="ml-2 bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-[10px]">
                    {events.filter(e => {
                      const isPublic = e.course?.courseType?.includes('PUBLIC') || e.courseType?.includes('PUBLIC');
                      const isHouse = e.course?.courseType?.includes('IN_HOUSE') || e.courseType?.includes('IN_HOUSE');
                      const typeMatches = requestTypeTab === 'PUBLIC' ? isPublic : isHouse;
                      return e.status === tab.id && typeMatches;
                    }).length}
                  </span>
                </button>
              ))}
            </div>

            <Card>
              <div className="p-4 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search events by title, course, or trainer..."
                  />
                </div>
                  <Select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    options={months}
                    className="w-[180px]"
                  />
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredEvents.length === 0 ? (
              <div className="col-span-full bg-white rounded-2xl border-2 border-dashed border-gray-100 py-20 text-center">
                <Users size={48} className="mx-auto mb-4 text-gray-200" />
                <p className="text-gray-400 font-medium">No {activeTab.toLowerCase()} {requestTypeTab.toLowerCase().replace('_', ' ')} found</p>
              </div>
            ) : (
              filteredEvents.map((event) => (
                <Card
                  key={event.id}
                  className={`hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer border-transparent hover:border-teal-100 group ${event.registrations?.some(r => !r.isRead) ? 'border-l-4 border-l-red-500' : ''}`}
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-gray-800 leading-tight group-hover:text-teal-700 transition-colors">
                            {event.title || event.course?.title}
                          </h3>
                          {event.registrations?.some(r => !r.isRead) && (
                            <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" title="Unread registrations" />
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={getStatusVariant(event.status)}>{event.status}</Badge>
                          {event.course?.courseCode && (
                            <Badge variant="info" className="opacity-80 font-mono tracking-tighter">{event.course.courseCode}</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar size={16} className="mr-3 text-teal-500" />
                        <span>
                          {event.startDate && event.endDate
                            ? `${formatDate(event.startDate)} - ${formatDate(event.endDate)}`
                            : event.eventDate ? formatDate(event.eventDate) : 'Date TBD'}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <MapPin size={16} className="mr-3 text-teal-500" />
                        <span className="truncate">{event.venue || event.city || 'Online/TBD'}</span>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between">
                      <div className="flex items-center text-teal-700 font-bold">
                        <Users size={16} className="mr-2" />
                        <span>{event.totalParticipants || 0}</span>
                        <span className="text-xs text-gray-400 font-normal ml-1">Regs.</span>
                      </div>
                      <span className="text-xs font-semibold text-teal-600 group-hover:underline">View Details →</span>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </>
      )}

      {selectedEventForQR && (
        <FeedbackQRModal
          isOpen={showQRModal}
          onClose={() => { setShowQRModal(false); setSelectedEventForQR(null); }}
          eventId={selectedEventForQR.id}
          eventTitle={selectedEventForQR.title || selectedEventForQR.course?.title || 'Event'}
        />
      )}

      {selectedEventForParticipants && (
        <AddParticipantsModal
          isOpen={showAddParticipantsModal}
          onClose={() => { setShowAddParticipantsModal(false); setSelectedEventForParticipants(null); }}
          eventId={selectedEventForParticipants.id}
          eventTitle={selectedEventForParticipants.title || selectedEventForParticipants.course?.title || 'Event'}
          onSuccess={() => fetchEvents()}
        />
      )}

      {showApproveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-md shadow-2xl border-none overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">Approve Participant</h3>
                <button onClick={() => setShowApproveModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
              </div>
              <div className="p-4 bg-teal-50 rounded-xl border border-teal-100 space-y-1">
                <p className="text-xs font-bold text-teal-600 uppercase tracking-wider">Client Info</p>
                <p className="font-bold text-gray-800">{selectedRegistration?.client?.userName || selectedRegistration?.clientName || selectedRegistration?.clientsReference?.picName}</p>
                <p className="text-sm text-gray-600">{selectedRegistration?.clientsReference?.companyName || 'Individual'}</p>
              </div>
              <div className="space-y-4">
                <Input label="Number of Participants *" type="number" min="1" value={numberOfParticipants} onChange={(e) => setNumberOfParticipants(e.target.value)} placeholder="Enter participant count" />
                <div className="flex gap-3 pt-4 border-t">
                  <Button variant="secondary" className="flex-1" onClick={() => setShowApproveModal(false)}>Cancel</Button>
                  <Button variant="primary" className="flex-[2] bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-100" onClick={handleApproveRegistration} disabled={!numberOfParticipants || parseInt(numberOfParticipants) < 1 || actionLoading}>
                    {actionLoading ? 'Approving...' : 'Confirm Approval'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}


    </div>
  );
};
