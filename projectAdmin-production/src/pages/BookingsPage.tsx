import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Textarea } from '../components/common/Textarea';
import { Select } from '../components/common/Select';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { apiClient } from '../lib/api-client';
import { formatDate } from '../utils/helpers';
import { CheckCircle, XCircle, Calendar, AlertTriangle, RefreshCw, Mail, Clock } from 'lucide-react';
import { showToast } from '../components/common/Toast';

interface BookingRequest {
  id: string;
  courseId: string | null;
  trainerId: string | null;
  clientId: string | null;
  requestType: 'PUBLIC' | 'INHOUSE' | null;
  clientName: string | null;
  clientEmail: string | null;
  requestedDate: string | null;
  endDate: string | null;
  requestedTime: string | null;
  status: string;
  location: string | null;
  city: string | null;
  state: string | null;
  createdAt: string;
  course?: {
    id: string;
    title: string;
    courseType: string;
  };
  trainer?: {
    id: string;
    fullName: string;
    email: string;
  };
  client?: {
    id: string;
    userName: string;
    companyEmail: string;
  };
}

interface EventRegistration {
  id: string;
  eventId: string;
  clientId: string | null;
  clientName: string | null;
  clientEmail: string | null;
  packNumber?: number;
  numberOfParticipants?: number;
  status: string;
  createdAt: string;
  event?: {
    id: string;
    title: string;
    eventDate: string;
    course?: {
      id: string;
      title: string;
      courseCode: string;
    };
    trainer?: {
      id: string;
      fullName: string;
      email: string;
    };
  };
  client?: {
    id: string;
    userName: string;
    companyEmail: string;
    contactNumber: string;
  };
  clientsReference?: {
    id: string;
    companyName: string;
    address: string;
    state: string | null;
    city: string | null;
    picName: string;
    email: string;
    contactNumber: string;
  };
}

type TabType = 'inhouse' | 'public' | 'booknow';

export const BookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [eventRegistrations, setEventRegistrations] = useState<EventRegistration[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<BookingRequest[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('inhouse');
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingRequest | null>(null);
  const [conflictingBookings, setConflictingBookings] = useState<BookingRequest[]>([]);
  const [emailTitle, setEmailTitle] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<EventRegistration | null>(null);
  const [numberOfParticipants, setNumberOfParticipants] = useState('');
  const [showConfirmBookingModal, setShowConfirmBookingModal] = useState(false);
  const [totalSlots, setTotalSlots] = useState('');
  const [registeredParticipants, setRegisteredParticipants] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [selectedAvailabilityId, setSelectedAvailabilityId] = useState<string>('');
  const [availableDates, setAvailableDates] = useState<Array<{ date: string; availabilityId: string }>>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [bookings, searchTerm, statusFilter, activeTab]);

  const fetchBookings = async () => {
    try {
      const [bookingsResponse, registrationsResponse] = await Promise.all([
        apiClient.getBookings(),
        apiClient.getEventRegistrations(),
      ]);
      setBookings(bookingsResponse.bookings || []);
      setEventRegistrations(registrationsResponse.registrations || []);
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      showToast(error.message || 'Error fetching bookings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (activeTab === 'booknow') {
      // Book Now tab - show event registrations
      let filtered = [...eventRegistrations];

      // Filter by status
      if (statusFilter !== 'all') {
        filtered = filtered.filter(r => r.status.toLowerCase() === statusFilter.toLowerCase());
      }

      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(reg =>
          reg.event?.title?.toLowerCase().includes(searchLower) ||
          reg.event?.course?.title?.toLowerCase().includes(searchLower) ||
          reg.event?.trainer?.fullName?.toLowerCase().includes(searchLower) ||
          reg.client?.userName?.toLowerCase().includes(searchLower) ||
          reg.clientName?.toLowerCase().includes(searchLower) ||
          reg.clientEmail?.toLowerCase().includes(searchLower)
        );
      }

      // Sort by Trainer first, then by Event
      filtered.sort((a, b) => {
        // First sort by trainer name
        const trainerA = a.event?.trainer?.fullName || '';
        const trainerB = b.event?.trainer?.fullName || '';
        const trainerCompare = trainerA.localeCompare(trainerB);
        
        if (trainerCompare !== 0) {
          return trainerCompare;
        }
        
        // If same trainer, sort by event title
        const eventA = a.event?.title || a.event?.course?.title || '';
        const eventB = b.event?.title || b.event?.course?.title || '';
        return eventA.localeCompare(eventB);
      });

      setFilteredRegistrations(filtered);
    } else {
      // In-house and Public tabs - show booking requests
      let filtered = [...bookings];

      // Filter by tab (request type)
      if (activeTab === 'inhouse') {
        filtered = filtered.filter(b => b.requestType === 'INHOUSE');
      } else if (activeTab === 'public') {
        filtered = filtered.filter(b => b.requestType === 'PUBLIC');
      }

      // Filter by status
      if (statusFilter !== 'all') {
        filtered = filtered.filter(b => b.status.toLowerCase() === statusFilter.toLowerCase());
      }

      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(booking =>
          booking.course?.title?.toLowerCase().includes(searchLower) ||
          booking.trainer?.fullName?.toLowerCase().includes(searchLower) ||
          booking.client?.userName?.toLowerCase().includes(searchLower) ||
          booking.clientName?.toLowerCase().includes(searchLower) ||
          booking.clientEmail?.toLowerCase().includes(searchLower)
        );
      }

      // For In-House requests: Sort by Trainer first, then by date of request (createdAt)
      if (activeTab === 'inhouse') {
        filtered.sort((a, b) => {
          // First sort by trainer name
          const trainerA = a.trainer?.fullName || '';
          const trainerB = b.trainer?.fullName || '';
          const trainerCompare = trainerA.localeCompare(trainerB);
          
          if (trainerCompare !== 0) {
            return trainerCompare;
          }
          
          // If same trainer, sort by date of request (createdAt) - oldest first
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateA - dateB;
        });
      }

      setFilteredBookings(filtered);
    }
  };

  const handleConfirmBooking = async (bookingId: string) => {
    try {
      // Check for conflicting bookings first
      const conflictResponse = await apiClient.getConflictingBookings(bookingId);
      const conflicts = conflictResponse.conflictingBookings || [];

      if (conflicts.length > 0) {
        // Show conflict modal
        setConflictingBookings(conflicts);
        setSelectedBooking(bookings.find(b => b.id === bookingId) || null);
        setShowConflictModal(true);
        return;
      }

      // No conflicts, show confirmation modal
      const booking = bookings.find(b => b.id === bookingId);
      setSelectedBooking(booking || null);
      setTotalSlots('');
      setRegisteredParticipants('');
      setSelectedAvailabilityId('');
      setAvailableDates([]);
      setEventDate('');
      
      // Fetch trainer availability if trainer is assigned
      if (booking?.trainerId) {
        await fetchTrainerAvailability(booking.trainerId);
      }
      
      setShowConfirmBookingModal(true);
    } catch (error: any) {
      showToast(error.message || 'Error checking conflicts', 'error');
    }
  };

  const fetchTrainerAvailability = async (trainerId: string) => {
    try {
      setLoadingAvailability(true);
      const today = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 12);
      
      const availabilityResponse = await apiClient.getTrainerAvailability(trainerId, {
        startDate: today.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      });
      
      const availabilityArray = availabilityResponse?.availability || [];
      
      // Filter only AVAILABLE and TENTATIVE dates (admin can use tentative dates)
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
      showToast('Error loading trainer availability', 'error');
      setAvailableDates([]);
    } finally {
      setLoadingAvailability(false);
    }
  };

  const handleConfirmBookingWithPacks = async () => {
    if (!selectedBooking) return;

    if (!totalSlots || parseInt(totalSlots) < 1) {
      showToast('Please enter a valid total number of slots', 'error');
      return;
    }

    if (!registeredParticipants || parseInt(registeredParticipants) < 1) {
      showToast('Please enter a valid number of registered participants', 'error');
      return;
    }

    if (parseInt(registeredParticipants) > parseInt(totalSlots)) {
      showToast('Registered participants cannot exceed total slots', 'error');
      return;
    }

    // Availability ID is now required for all bookings
    if (!selectedAvailabilityId) {
      showToast('Please select a date from trainer availability calendar', 'error');
      return;
    }

    try {
      const response = await apiClient.confirmBooking(
        selectedBooking.id, 
        parseInt(totalSlots),
        selectedAvailabilityId, // Required: Trainer availability ID
        parseInt(registeredParticipants),
        selectedBooking.requestType === 'PUBLIC' ? eventDate : undefined // Optional: For validation
      );
      showToast(response.message || 'Booking confirmed successfully and event created', 'success');
      setShowConfirmBookingModal(false);
      setSelectedBooking(null);
      setTotalSlots('');
      setRegisteredParticipants('');
      setSelectedAvailabilityId('');
      setAvailableDates([]);
      setEventDate('');
      fetchBookings();
    } catch (error: any) {
      showToast(error.message || 'Error confirming booking', 'error');
    }
  };

  const handleConfirmWithConflicts = async () => {
    if (!selectedBooking) return;

    // Show pack number modal even when there are conflicts
    setShowConflictModal(false);
    setShowConfirmBookingModal(true);
  };

  const handleSendEmail = async () => {
    if (!emailTitle.trim() || !emailMessage.trim()) {
      showToast('Please provide both title and message', 'error');
      return;
    }

    if (conflictingBookings.length === 0) {
      showToast('No clients to send email to', 'error');
      return;
    }

    setSendingEmail(true);
    try {
      const clientIds = conflictingBookings
        .map(b => b.clientId || b.client?.id)
        .filter((id): id is string => id !== null && id !== undefined);

      if (clientIds.length === 0) {
        showToast('No valid client IDs found', 'error');
        return;
      }

      await apiClient.sendEmailToClients({
        clientIds,
        title: emailTitle,
        message: emailMessage,
      });

      showToast(`Email sent to ${clientIds.length} client(s)`, 'success');
      setShowEmailModal(false);
      setEmailTitle('');
      setEmailMessage('');
    } catch (error: any) {
      showToast(error.message || 'Error sending email', 'error');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await apiClient.cancelBooking(bookingId);
      showToast('Booking cancelled successfully', 'success');
      fetchBookings();
    } catch (error: any) {
      showToast(error.message || 'Error cancelling booking', 'error');
    }
  };

  const getStatusBadgeVariant = (status: string): 'default' | 'success' | 'info' | 'warning' | 'danger' => {
    switch (status.toUpperCase()) {
      case 'CONFIRMED':
      case 'APPROVED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'CANCELLED':
      case 'DENIED':
        return 'danger';
      case 'TENTATIVE':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatRequestDate = (booking: BookingRequest) => {
    if (booking.requestedDate) {
      return formatDate(booking.requestedDate);
    }
    return 'Not specified';
  };

  const formatRequestMonth = (booking: BookingRequest) => {
    if (booking.requestedDate) {
      const date = new Date(booking.requestedDate);
      return date.toLocaleDateString('en-MY', { month: 'long', year: 'numeric' });
    }
    return 'Not specified';
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Bookings Management</h1>
        <Button variant="secondary" onClick={fetchBookings}>
          <RefreshCw size={18} className="mr-2" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Card>
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-4" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('inhouse')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'inhouse'
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              In-house Requests ({bookings.filter(b => b.requestType === 'INHOUSE').length})
            </button>
            <button
              onClick={() => setActiveTab('public')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'public'
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Public Requests ({bookings.filter(b => b.requestType === 'PUBLIC').length})
            </button>
            <button
              onClick={() => setActiveTab('booknow')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'booknow'
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Book Now ({eventRegistrations.filter(r => r.status === 'REGISTERED').length})
            </button>
          </nav>
        </div>
      </Card>

      {/* Filters */}
      <Card>
        <div className="p-4 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search bookings..."
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />
        </div>
      </Card>

      {/* Bookings/Registrations Display */}
      {activeTab === 'booknow' ? (
        // Book Now Tab - Grouped by Trainer, then by Event
        filteredRegistrations.length === 0 ? (
          <Card>
            <div className="px-4 py-8 text-center text-gray-500">
              No event registrations found
            </div>
          </Card>
        ) : (() => {
          // Group by trainer, then by event
          const groupedByTrainer = filteredRegistrations.reduce((acc, reg) => {
            const trainerName = reg.event?.trainer?.fullName || 'Unknown Trainer';
            const trainerId = reg.event?.trainer?.id || 'unknown';
            const eventTitle = reg.event?.title || reg.event?.course?.title || 'Unknown Event';
            const eventId = reg.event?.id || 'unknown';
            
            if (!acc[trainerId]) {
              acc[trainerId] = {
                trainerName,
                trainerId,
                trainerEmail: reg.event?.trainer?.email || '',
                events: {},
              };
            }
            
            if (!acc[trainerId].events[eventId]) {
              acc[trainerId].events[eventId] = {
                eventTitle,
                eventId,
                eventDate: reg.event?.eventDate || '',
                courseCode: reg.event?.course?.courseCode || '',
                registrations: [],
              };
            }
            
            acc[trainerId].events[eventId].registrations.push(reg);
            return acc;
          }, {} as Record<string, any>);

          return (
            <div className="space-y-4">
              {Object.values(groupedByTrainer).map((trainerGroup: any) => (
                <Card key={trainerGroup.trainerId}>
                  <div className="p-6">
                    <div className="mb-4 pb-4 border-b border-gray-200">
                      <h3 className="text-xl font-semibold text-gray-800">{trainerGroup.trainerName}</h3>
                      {trainerGroup.trainerEmail && (
                        <p className="text-sm text-gray-600 mt-1">{trainerGroup.trainerEmail}</p>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      {Object.values(trainerGroup.events).map((eventGroup: any) => (
                        <div key={eventGroup.eventId} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="mb-3 pb-2 border-b border-gray-300">
                            <h4 className="font-semibold text-gray-800">{eventGroup.eventTitle}</h4>
                            {eventGroup.courseCode && (
                              <p className="text-sm text-gray-600 mt-1">Code: {eventGroup.courseCode}</p>
                            )}
                            {eventGroup.eventDate && (
                              <p className="text-sm text-gray-600 mt-1">
                                <Calendar size={14} className="inline mr-1" />
                                {formatDate(eventGroup.eventDate)}
                              </p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            {eventGroup.registrations.map((registration: EventRegistration) => (
                              <div key={registration.id} className="bg-white rounded p-3 flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">
                                    {registration.client?.userName || registration.clientName || registration.clientsReference?.picName || 'N/A'}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {registration.client?.companyEmail || registration.clientEmail || registration.clientsReference?.email || ''}
                                  </div>
                                  {registration.clientsReference && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {registration.clientsReference.companyName}
                                    </div>
                                  )}
                                  <div className="flex items-center space-x-2 mt-1">
                                    <Badge variant="info" className="text-xs">
                                      {registration.numberOfParticipants || 1} participant{((registration.numberOfParticipants || 1) > 1) ? 's' : ''}
                                    </Badge>
                                    <Badge variant={getStatusBadgeVariant(registration.status)} className="text-xs">
                                      {registration.status}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {registration.status === 'REGISTERED' && (
                                    <>
                                      <Button
                                        variant="success"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedRegistration(registration);
                                          setNumberOfParticipants('');
                                          setShowApproveModal(true);
                                        }}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                        title="Approve Registration"
                                      >
                                        <CheckCircle size={14} />
                                      </Button>
                                      <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={async () => {
                                          if (!confirm('Are you sure you want to cancel this registration?')) return;
                                          try {
                                            await apiClient.cancelEventRegistration(registration.id);
                                            showToast('Registration cancelled successfully', 'success');
                                            fetchBookings();
                                          } catch (error: any) {
                                            showToast(error.message || 'Error cancelling registration', 'error');
                                          }
                                        }}
                                        className="bg-red-600 hover:bg-red-700 text-white"
                                        title="Cancel Registration"
                                      >
                                        <XCircle size={14} />
                                      </Button>
                                    </>
                                  )}
                                  {registration.status === 'APPROVED' && (
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={async () => {
                                        if (!confirm('Are you sure you want to cancel this registration?')) return;
                                        try {
                                          await apiClient.cancelEventRegistration(registration.id);
                                          showToast('Registration cancelled successfully', 'success');
                                          fetchBookings();
                                        } catch (error: any) {
                                          showToast(error.message || 'Error cancelling registration', 'error');
                                        }
                                      }}
                                      className="bg-red-600 hover:bg-red-700 text-white"
                                      title="Cancel Registration"
                                    >
                                      <XCircle size={14} />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          );
        })()
      ) : activeTab === 'inhouse' ? (
        // In-House Tab - Grouped by Trainer, then by Date
        filteredBookings.length === 0 ? (
          <Card>
            <div className="px-4 py-8 text-center text-gray-500">
              No bookings found
            </div>
          </Card>
        ) : (() => {
          // Group by trainer, then by date
          const groupedByTrainer = filteredBookings.reduce((acc, booking) => {
            const trainerName = booking.trainer?.fullName || 'Unknown Trainer';
            const trainerId = booking.trainer?.id || 'unknown';
            const requestDate = booking.requestedDate ? formatRequestDate(booking) : 'No Date';
            const dateKey = booking.requestedDate || 'no-date';
            
            if (!acc[trainerId]) {
              acc[trainerId] = {
                trainerName,
                trainerId,
                trainerEmail: booking.trainer?.email || '',
                dates: {},
              };
            }
            
            if (!acc[trainerId].dates[dateKey]) {
              acc[trainerId].dates[dateKey] = {
                date: requestDate,
                dateKey,
                bookings: [],
              };
            }
            
            acc[trainerId].dates[dateKey].bookings.push(booking);
            return acc;
          }, {} as Record<string, any>);

          // Sort dates within each trainer
          Object.values(groupedByTrainer).forEach((trainerGroup: any) => {
            const sortedDates = Object.entries(trainerGroup.dates).sort(([keyA], [keyB]) => {
              if (keyA === 'no-date') return 1;
              if (keyB === 'no-date') return -1;
              return new Date(keyA).getTime() - new Date(keyB).getTime();
            });
            trainerGroup.dates = Object.fromEntries(sortedDates);
          });

          return (
            <div className="space-y-4">
              {Object.values(groupedByTrainer).map((trainerGroup: any) => (
                <Card key={trainerGroup.trainerId}>
                  <div className="p-6">
                    <div className="mb-4 pb-4 border-b border-gray-200">
                      <h3 className="text-xl font-semibold text-gray-800">{trainerGroup.trainerName}</h3>
                      {trainerGroup.trainerEmail && (
                        <p className="text-sm text-gray-600 mt-1">{trainerGroup.trainerEmail}</p>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      {Object.values(trainerGroup.dates).map((dateGroup: any) => (
                        <div key={dateGroup.dateKey} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="mb-3 pb-2 border-b border-gray-300">
                            <h4 className="font-semibold text-gray-800 flex items-center">
                              <Calendar size={16} className="mr-2 text-teal-600" />
                              {dateGroup.date}
                            </h4>
                          </div>
                          
                          <div className="space-y-2">
                            {dateGroup.bookings.map((booking: BookingRequest) => (
                              <div key={booking.id} className="bg-white rounded p-3 flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">
                                    {booking.client?.userName || booking.clientName || 'N/A'}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {booking.client?.companyEmail || booking.clientEmail || ''}
                                  </div>
                                  <div className="mt-1">
                                    <div className="text-sm text-gray-700">
                                      <span className="font-medium">Course:</span> {booking.course?.title || 'N/A'}
                                    </div>
                                    {booking.course?.courseType && (
                                      <div className="text-xs text-gray-500">{booking.course.courseType}</div>
                                    )}
                                  </div>
                                  <div className="mt-2">
                                    <Badge variant={getStatusBadgeVariant(booking.status)} className="text-xs">
                                      {booking.status}
                                    </Badge>
                                    {booking.createdAt && (
                                      <span className="text-xs text-gray-500 ml-2">
                                        Requested: {formatDate(booking.createdAt)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {booking.status === 'APPROVED' && (
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={() => handleConfirmBooking(booking.id)}
                                    >
                                      <CheckCircle size={14} className="mr-1" />
                                      Confirm
                                    </Button>
                                  )}
                                  {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && booking.status !== 'CONFIRMED' && (
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => handleCancelBooking(booking.id)}
                                      className="bg-red-600 hover:bg-red-700 text-white"
                                    >
                                      <XCircle size={14} />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          );
        })()
      ) : (
        // Public Tab - Keep table format
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Request From</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trainer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No bookings found
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {booking.client?.userName || booking.clientName || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {booking.client?.companyEmail || booking.clientEmail || ''}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{booking.course?.title || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{booking.course?.courseType || ''}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">{booking.trainer?.fullName || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{booking.trainer?.email || ''}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {formatRequestMonth(booking)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getStatusBadgeVariant(booking.status)}>
                          {booking.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          {booking.status === 'APPROVED' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleConfirmBooking(booking.id)}
                            >
                              <CheckCircle size={14} className="mr-1" />
                              Confirm
                            </Button>
                          )}
                          {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && booking.status !== 'CONFIRMED' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleCancelBooking(booking.id)}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              <XCircle size={14} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Conflict Detection Modal */}
      <Modal
        isOpen={showConflictModal}
        onClose={() => {
          setShowConflictModal(false);
          setSelectedBooking(null);
          setConflictingBookings([]);
        }}
        title="Conflicting Bookings Detected"
      >
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="text-yellow-600" size={20} />
              <h3 className="font-semibold text-yellow-800">Warning: Conflicting Bookings</h3>
            </div>
            <p className="text-sm text-yellow-700">
              There are {conflictingBookings.length} other booking(s) on the same date that were approved by the trainer but not yet confirmed. 
              These bookings were made before the booking you're trying to confirm.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Conflicting Bookings:</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {conflictingBookings.map((booking) => (
                <Card key={booking.id}>
                  <div className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">
                          {booking.course?.title || 'Unknown Course'}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Client: {booking.client?.userName || booking.clientName || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-600">
                          Email: {booking.client?.companyEmail || booking.clientEmail || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Requested: {formatRequestDate(booking)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Created: {formatDate(booking.createdAt)}
                        </p>
                      </div>
                      <Badge variant="warning">{booking.status}</Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="secondary"
              onClick={() => {
                setShowConflictModal(false);
                setSelectedBooking(null);
                setConflictingBookings([]);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setShowEmailModal(true);
              }}
            >
              <Mail size={18} className="mr-2" />
              Send Email to Clients
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmWithConflicts}
            >
              <CheckCircle size={18} className="mr-2" />
              Confirm Anyway
            </Button>
          </div>
        </div>
      </Modal>

      {/* Email Modal */}
      <Modal
        isOpen={showEmailModal}
        onClose={() => {
          setShowEmailModal(false);
          setEmailTitle('');
          setEmailMessage('');
        }}
        title="Send Email to Affected Clients"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Send an email to {conflictingBookings.length} client(s) who have conflicting bookings.
          </p>

          <Input
            label="Email Title *"
            value={emailTitle}
            onChange={(e) => setEmailTitle(e.target.value)}
            placeholder="e.g., Booking Date Conflict Notification"
            required
          />

          <Textarea
            label="Message *"
            value={emailMessage}
            onChange={(e) => setEmailMessage(e.target.value)}
            rows={6}
            placeholder="Enter the message to send to all affected clients..."
            required
          />

          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 font-medium mb-2">Recipients:</p>
            <div className="space-y-1">
              {conflictingBookings.map((booking) => (
                <p key={booking.id} className="text-xs text-gray-600">
                  • {booking.client?.userName || booking.clientName || 'Unknown'} ({booking.client?.companyEmail || booking.clientEmail || 'No email'})
                </p>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowEmailModal(false);
                setEmailTitle('');
                setEmailMessage('');
              }}
              disabled={sendingEmail}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSendEmail}
              disabled={sendingEmail || !emailTitle.trim() || !emailMessage.trim()}
            >
              {sendingEmail ? (
                <>
                  <Clock size={18} className="mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail size={18} className="mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Booking Modal (for In-House and Public) */}
      <Modal
        isOpen={showConfirmBookingModal}
        onClose={() => {
          setShowConfirmBookingModal(false);
          setSelectedBooking(null);
          setTotalSlots('');
          setRegisteredParticipants('');
          setSelectedAvailabilityId('');
          setAvailableDates([]);
          setEventDate('');
        }}
        title="Confirm Booking & Create Event"
        size="md"
      >
        {selectedBooking && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">
                {selectedBooking.course?.title || 'Course'}
              </h3>
              <p className="text-sm text-gray-600">
                Client: {selectedBooking.client?.userName || selectedBooking.clientName || 'N/A'}
              </p>
              <p className="text-sm text-gray-600">
                Trainer: {selectedBooking.trainer?.fullName || 'N/A'}
              </p>
              <p className="text-sm text-gray-600">
                Requested Date: {selectedBooking.requestedDate ? formatRequestDate(selectedBooking) : 'N/A'}
              </p>
              <p className="text-sm text-gray-600">
                Type: {selectedBooking.requestType === 'INHOUSE' ? 'In-House' : 'Public'}
              </p>
            </div>

            {/* Trainer Availability Date Selection - Required for all bookings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Event Date from Trainer Availability *
              </label>
              {loadingAvailability ? (
                <div className="flex items-center justify-center py-4">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2 text-sm text-gray-600">Loading trainer availability...</span>
                </div>
              ) : availableDates.length === 0 ? (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    No available dates found for this trainer. Please set availability first.
                  </p>
                </div>
              ) : (
                <>
                  <Select
                    value={selectedAvailabilityId}
                    onChange={(e) => {
                      setSelectedAvailabilityId(e.target.value);
                      // For PUBLIC bookings, also set eventDate for validation
                      if (selectedBooking.requestType === 'PUBLIC') {
                        const selected = availableDates.find(d => d.availabilityId === e.target.value);
                        if (selected) {
                          setEventDate(selected.date);
                        }
                      }
                    }}
                    options={[
                      { value: '', label: 'Choose a date...' },
                      ...availableDates.map((date) => ({
                        value: date.availabilityId,
                        label: new Date(date.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        }),
                      })),
                    ]}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Select a date from the trainer's availability calendar. This will mark the date as booked.
                  </p>
                </>
              )}
            </div>

            {/* Optional event date display for PUBLIC bookings (read-only, shows selected availability date) */}
            {selectedBooking.requestType === 'PUBLIC' && selectedAvailabilityId && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Selected Event Date:</strong>{' '}
                  {availableDates.find(d => d.availabilityId === selectedAvailabilityId)?.date 
                    ? new Date(availableDates.find(d => d.availabilityId === selectedAvailabilityId)!.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'N/A'}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Number of People Who Can Attend *
              </label>
              <Input
                type="number"
                min="1"
                value={totalSlots}
                onChange={(e) => setTotalSlots(e.target.value)}
                placeholder="Enter total capacity"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {selectedBooking.requestType === 'INHOUSE' 
                  ? 'Enter the maximum number of people who can attend this in-house event.'
                  : 'Enter the total number of available slots for this public event.'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of People Registered Now Through This Request *
              </label>
              <Input
                type="number"
                min="1"
                value={registeredParticipants}
                onChange={(e) => setRegisteredParticipants(e.target.value)}
                placeholder="Enter number of registered participants"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {selectedBooking.requestType === 'INHOUSE' 
                  ? 'Enter the number of participants from this booking who will attend the event.'
                  : 'Enter the number of participants from this booking request who are confirmed to attend. This will create registrations and consume slots.'}
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowConfirmBookingModal(false);
                  setSelectedBooking(null);
                  setTotalSlots('');
                  setRegisteredParticipants('');
                  setEventDate('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmBookingWithPacks}
                disabled={
                  !totalSlots || 
                  parseInt(totalSlots) < 1 || 
                  !registeredParticipants ||
                  parseInt(registeredParticipants) < 1 ||
                  parseInt(registeredParticipants) > parseInt(totalSlots) ||
                  !selectedAvailabilityId ||
                  loadingAvailability
                }
              >
                <CheckCircle size={18} className="mr-2" />
                Confirm & Create Event
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Approve Registration Modal */}
      <Modal
        isOpen={showApproveModal}
        onClose={() => {
          setShowApproveModal(false);
          setSelectedRegistration(null);
          setNumberOfParticipants('');
        }}
        title="Approve Event Registration"
        size="md"
      >
        {selectedRegistration && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">
                {selectedRegistration.event?.title || selectedRegistration.event?.course?.title || 'Event'}
              </h3>
              <p className="text-sm text-gray-600">
                Client: {selectedRegistration.client?.userName || selectedRegistration.clientName || 'N/A'}
              </p>
              <p className="text-sm text-gray-600">
                Email: {selectedRegistration.client?.companyEmail || selectedRegistration.clientEmail || 'N/A'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Participants from This Company *
              </label>
              <Input
                type="number"
                min="1"
                value={numberOfParticipants}
                onChange={(e) => setNumberOfParticipants(e.target.value)}
                placeholder="Enter number of participants"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter how many participants from this company will be taking part in the event. The system will automatically assign pack numbers.
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowApproveModal(false);
                  setSelectedRegistration(null);
                  setNumberOfParticipants('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="success"
                onClick={async () => {
                  if (!numberOfParticipants || parseInt(numberOfParticipants) < 1) {
                    showToast('Please enter a valid number of participants', 'error');
                    return;
                  }
                  try {
                    await apiClient.approveEventRegistration(selectedRegistration.id, parseInt(numberOfParticipants));
                    showToast('Registration approved successfully', 'success');
                    setShowApproveModal(false);
                    setSelectedRegistration(null);
                    setNumberOfParticipants('');
                    fetchBookings();
                  } catch (error: any) {
                    showToast(error.message || 'Error approving registration', 'error');
                  }
                }}
              >
                Approve
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
