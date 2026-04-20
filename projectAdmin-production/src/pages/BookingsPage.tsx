import React, { useEffect, useState, useRef } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Textarea } from '../components/common/Textarea';
import { Select } from '../components/common/Select';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { apiClient } from '../lib/api-client';
import { useRealtime } from '../hooks/useRealtime';
import { formatDate } from '../utils/helpers';
import { CheckCircle, XCircle, Calendar, AlertTriangle, RefreshCw, Mail, Clock, MapPin, User, Paperclip } from 'lucide-react';
import { showToast } from '../components/common/Toast';
import { EventCreationForm } from '../components/courses/EventCreationForm';
import { Course } from '../types';

interface BookingRequest {
  id: string;
  courseId: string | null;
  trainerId: string | null;
  clientId: string | null;
  requestType: 'PUBLIC' | 'INHOUSE' | null;
  clientName: string | null;
  clientEmail: string | null;
  companyName?: string | null;
  requestedDate: string | null;
  endDate: string | null;
  requestedTime: string | null;
  status: string;
  isRead?: boolean;
  location: string | null;
  city: string | null;
  state: string | null;
  courseMode?: string | null;
  isHidden?: boolean;
  createdAt: string;
  course?: {
    id: string;
    title: string;
    courseType: string;
    courseCode?: string | null;
    durationHours?: number | null;
    durationUnit?: string | null;
    category?: any;
  };
  trainer?: {
    id: string;
    fullName: string;
    email: string;
  };
  selectedDates?: string[];
  client?: {
    id: string;
    userName: string;
    companyEmail: string;
    companyName?: string | null;
  };
}

type TabType = 'public' | 'inhouse';

export const BookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('public');
  
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingRequest | null>(null);
  const [conflictingBookings, setConflictingBookings] = useState<BookingRequest[]>([]);
  const [emailTitle, setEmailTitle] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  
  // Cancel modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  
  const [showConfirmBookingModal, setShowConfirmBookingModal] = useState(false);
  const [courseData, setCourseData] = useState<Course | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [trainers, setTrainers] = useState<any[]>([]);

  // Booking detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailBooking, setDetailBooking] = useState<BookingRequest | null>(null);
  const [detailActionLoading, setDetailActionLoading] = useState(false);

  // Editing state for modal
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    courseMode: '',
    trainerId: '',
    requestedDate: '',
    endDate: '',
    location: '',
    city: '',
    state: '',
    status: '',
  });
  const [showHidden, setShowHidden] = useState(false);
  const [deletingBooking, setDeletingBooking] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replySubject, setReplySubject] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [replyAttachment, setReplyAttachment] = useState<File | null>(null);
  const [sendingReply, setSendingReply] = useState(false);
  const [markReplyAsQuoted, setMarkReplyAsQuoted] = useState(false);

  useEffect(() => {
    fetchBookings();
    fetchTrainers();
  }, [showHidden]);

  const fetchTrainers = async () => {
    try {
      const response = await apiClient.getTrainers();
      setTrainers(response.trainers || []);
    } catch (error) {
      console.error('Error fetching trainers:', error);
    }
  };

  const handleUpdateDetails = async () => {
    if (!detailBooking) return;
    setDetailActionLoading(true);
    try {
      await apiClient.updateBookingDetails(detailBooking.id, editedData);
      showToast('Booking details updated successfully', 'success');
      setIsEditing(false);
      fetchBookings();
      // Update local detail state too
      setDetailBooking({
        ...detailBooking,
        ...editedData,
        trainer: trainers.find(t => t.id === editedData.trainerId) || detailBooking.trainer
      });
    } catch (error: any) {
      showToast(error.message || 'Error updating details', 'error');
    } finally {
      setDetailActionLoading(false);
    }
  };

  // Ref to track if we've completed the first fetch — prevents spinner on background refreshes
  const hasFetched = useRef(false);

  // Real-time synchronization
  useRealtime((payload: any) => {
    const relevantTables = ['bookings', 'booking_requests'];
    if (relevantTables.includes(payload.table)) {
      console.log('📅 Real-time update for bookings:', payload.table);
      fetchBookings(true);
    }
  });

  useEffect(() => {
    applyFilters();
  }, [bookings, searchTerm, statusFilter, activeTab]);

  const fetchBookings = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      hasFetched.current = true;
      const bookingsResponse = await apiClient.get(`admin/bookings?includeHidden=${showHidden ? 'true' : 'false'}`) as { bookings: BookingRequest[] };
      setBookings(bookingsResponse.bookings || []);
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      if (!silent) showToast(error.message || 'Error fetching bookings', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...bookings];

    // Filter by tab (request type)
    if (activeTab === 'public') {
      filtered = filtered.filter(b => b.requestType === 'PUBLIC');
    } else if (activeTab === 'inhouse') {
      filtered = filtered.filter(b => b.requestType === 'INHOUSE');
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

    // Filter by isHidden
    if (!showHidden) {
      filtered = filtered.filter(b => !b.isHidden);
    }

    // Sort by date (descending)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setFilteredBookings(filtered);
  };

  const handleConfirmBooking = async (bookingId: string) => {
    try {
      // Check for conflicting bookings first
      const conflictResponse = await apiClient.getConflictingBookings(bookingId);
      const conflicts = conflictResponse.conflictingBookings || [];

      if (conflicts.length > 0) {
        setConflictingBookings(conflicts);
        setSelectedBooking(bookings.find(b => b.id === bookingId) || null);
        setShowConflictModal(true);
        return;
      }

      // No conflicts, show confirmation modal
      const booking = bookings.find(b => b.id === bookingId);
      setSelectedBooking(booking || null);
      setCourseData(null);

      if (booking?.courseId) {
        try {
          const courseResponse = await apiClient.getAdminCourse(booking.courseId);
          setCourseData(courseResponse.course);
        } catch (error) {
          console.error('Error fetching course data:', error);
          showToast('Error loading course information', 'error');
        }
      }

      setShowConfirmBookingModal(true);
    } catch (error: any) {
      showToast(error.message || 'Error checking conflicts', 'error');
    }
  };

  const handleConfirmBookingSubmit = async (data: any) => {
    if (!selectedBooking) return;

    try {
      const response = await apiClient.confirmBooking(
        selectedBooking.id,
        data.maxPacks,
        data.availabilityIds,
        data.registeredParticipants,
        undefined, 
        data.price,
        data.venue,
        data.city,
        data.state
      );
      showToast(response.message || 'Booking confirmed successfully and event created', 'success');
      setShowConfirmBookingModal(false);
      setSelectedBooking(null);
      setCourseData(null);
      fetchBookings();
    } catch (error: any) {
      showToast(error.message || 'Error confirming booking', 'error');
      throw error;
    }
  };

  const handleConfirmWithConflicts = async () => {
    if (!selectedBooking) return;
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

  const handleCancelBooking = (bookingId: string) => {
    setBookingToCancel(bookingId);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const handleCancelSubmit = async () => {
    if (!bookingToCancel || !cancelReason.trim()) {
      showToast('Please provide a cancellation reason', 'error');
      return;
    }
    setCancelSubmitting(true);
    try {
      await apiClient.cancelBooking(bookingToCancel, cancelReason.trim());
      showToast('Booking cancelled successfully', 'success');
      setShowCancelModal(false);
      setBookingToCancel(null);
      setCancelReason('');
      fetchBookings();
    } catch (error: any) {
      showToast(error.message || 'Error cancelling booking', 'error');
    } finally {
      setCancelSubmitting(false);
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
      case 'QUOTED':
        return 'info';
      default:
        return 'default';
    }
  };

  const openDetailModal = async (booking: BookingRequest) => {
    setDetailBooking(booking);
    setEditedData({
      courseMode: booking.courseMode || '',
      trainerId: booking.trainerId || '',
      requestedDate: booking.requestedDate ? booking.requestedDate.slice(0, 10) : '',
      endDate: booking.endDate ? booking.endDate.slice(0, 10) : '',
      location: booking.location || '',
      city: booking.city || '',
      state: booking.state || '',
      status: booking.status || '',
    });
    setIsEditing(false);
    setShowDetailModal(true);

    if (!booking.isRead) {
      try {
        const response = await apiClient.getAdminBooking(booking.id);
        if (response.booking) {
          setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, isRead: true } : b));
        }
      } catch (error) {
        console.error('Error marking booking as read:', error);
      }
    }
  };

  const handleDetailAction = async (action: 'APPROVED' | 'DENIED' | 'TENTATIVE' | 'QUOTED' | 'CONFIRMED' | 'CANCELLED') => {
    if (!detailBooking) return;
    if (action === 'CANCELLED') {
      setShowDetailModal(false);
      handleCancelBooking(detailBooking.id);
      return;
    }
    if (action === 'CONFIRMED') {
      setShowDetailModal(false);
      handleConfirmBooking(detailBooking.id);
      return;
    }
    setDetailActionLoading(true);
    try {
      await apiClient.updateBookingStatus(detailBooking.id, action);
      const label: Record<string, string> = {
        APPROVED: 'Booking approved on behalf of trainer',
        DENIED: 'Booking denied on behalf of trainer',
        TENTATIVE: 'Booking set to Tentative',
        QUOTED: 'Quotation sent successfully',
      };
      showToast(label[action] || 'Status updated', 'success');
      setShowDetailModal(false);
      setDetailBooking(null);
      fetchBookings();
    } catch (e: any) {
      showToast(e.message || 'Error updating status', 'error');
    } finally {
      setDetailActionLoading(false);
    }
  };

  const openReplyModal = (booking: BookingRequest) => {
    const courseTitle = booking.course?.title || 'your training request';
    setReplySubject(`Regarding your TrainMICE booking for ${courseTitle}`);
    setReplyMessage('');
    setReplyAttachment(null);
    setMarkReplyAsQuoted(booking.status.toUpperCase() === 'APPROVED');
    setShowReplyModal(true);
  };

  const handleSendBookingReply = async () => {
    if (!detailBooking) return;
    if (!replySubject.trim() || !replyMessage.trim()) {
      showToast('Please provide both subject and message', 'error');
      return;
    }

    setSendingReply(true);
    try {
      await apiClient.replyToBookingClient(detailBooking.id, {
        subject: replySubject.trim(),
        message: replyMessage.trim(),
        attachment: replyAttachment,
      });

      if (markReplyAsQuoted && detailBooking.status.toUpperCase() === 'APPROVED') {
        await apiClient.updateBookingStatus(detailBooking.id, 'QUOTED');
      }

      showToast('Reply sent to client successfully', 'success');
      setShowReplyModal(false);
      setReplySubject('');
      setReplyMessage('');
      setReplyAttachment(null);
      fetchBookings();
    } catch (error: any) {
      showToast(error.message || 'Error sending client reply', 'error');
    } finally {
      setSendingReply(false);
    }
  };

  if (loading && bookings.length === 0 && !hasFetched.current) {
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
        <Button variant="secondary" onClick={() => fetchBookings()}>
          <RefreshCw size={18} className="mr-2" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Card>
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-4" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('public')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'public'
                ? 'border-teal-500 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Public Requests ({bookings.filter(b => b.requestType === 'PUBLIC').length})
              {bookings.filter(b => b.requestType === 'PUBLIC' && !b.isRead).length > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
                  {bookings.filter(b => b.requestType === 'PUBLIC' && !b.isRead).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('inhouse')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'inhouse'
                ? 'border-teal-500 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              In-House Requests ({bookings.filter(b => b.requestType === 'INHOUSE').length})
              {bookings.filter(b => b.requestType === 'INHOUSE' && !b.isRead).length > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
                  {bookings.filter(b => b.requestType === 'INHOUSE' && !b.isRead).length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </Card>

      {/* Filters */}
      <Card>
        <div className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <Input
                placeholder="Search by course, client, or trainer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="min-w-[140px] h-11"
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'PENDING', label: 'Pending' },
                  { value: 'TENTATIVE', label: 'Tentative' },
                  { value: 'APPROVED', label: 'Approved' },
                  { value: 'QUOTED', label: 'Quoted' },
                  { value: 'CONFIRMED', label: 'Confirmed' },
                  { value: 'COMPLETED', label: 'Completed' },
                  { value: 'CANCELLED', label: 'Cancelled' },
                  { value: 'DENIED', label: 'Denied' },
                ]}
              />

              <label className="flex items-center gap-2 cursor-pointer bg-white border border-gray-200 rounded-xl px-4 h-11 transition-all hover:border-teal-300 hover:shadow-sm">
                <input
                  type="checkbox"
                  checked={showHidden}
                  onChange={(e) => setShowHidden(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Show Hidden</span>
              </label>

              <Button
                variant="secondary"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setShowHidden(false);
                }}
                className="h-11 px-6 rounded-xl border-gray-200 hover:bg-gray-50 text-gray-500 font-bold text-[10px] uppercase tracking-widest transition-all"
              >
                <RefreshCw size={14} className="mr-2" />
                Reset Filters
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Requests Table — Standard layout for both Public and In-House ────────────────────── */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date Range</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Course Title</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Company / Client / Email</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Course Mode</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Trainer Name</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 italic">
                    No bookings found for this selection
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    onClick={() => openDetailModal(booking)}
                    className="hover:bg-teal-50/30 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-5 align-top">
                      <div className="flex items-center gap-3">
                        {!booking.isRead && (
                          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" title="New request" />
                        )}
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-800">
                            {booking.requestedDate ? formatDate(booking.requestedDate) : 'Not specified'}
                          </span>
                          {booking.endDate && (
                            <span className="text-xs font-medium text-gray-400">
                              to {formatDate(booking.endDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-top max-w-[300px]">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900 group-hover:text-teal-700 transition-colors">
                          {booking.course?.title || 'Custom Training'}
                        </span>
                        {booking.course?.courseCode && (
                          <span className="text-[10px] font-semibold text-gray-400">{booking.course.courseCode}</span>
                        )}
                        <span className="text-[9px] font-bold text-gray-300 uppercase tracking-tighter mt-1">ID: {booking.id.slice(-8).toUpperCase()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-800 truncate">
                          {booking.client?.companyName || booking.companyName || 'Individual'}
                        </span>
                        <span className="text-sm text-gray-400 font-medium truncate">
                           {booking.clientName || booking.client?.userName || 'N/A'}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
                          <Mail size={10} />
                          <span className="truncate">{booking.clientEmail || booking.client?.companyEmail || 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <div className="flex justify-center">
                        <Badge variant="default" className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-gray-100 text-gray-500">
                          {booking.courseMode || 'TBD'}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
                          <User size={14} />
                        </div>
                        <span className="text-sm font-bold text-gray-700">
                          {booking.trainer?.fullName || 'Not Assigned'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <div className="flex items-center justify-between">
                        <Badge variant={getStatusBadgeVariant(booking.status)} className="uppercase text-[9px] tracking-widest font-bold px-2 py-1">
                          {booking.status}
                        </Badge>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Conflict Detection Modal */}
      <Modal
        isOpen={showConflictModal}
        onClose={() => setShowConflictModal(false)}
        title="Schedule Conflicts Detected"
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-amber-50 border border-amber-100 rounded-xl">
             <AlertTriangle className="text-amber-500 flex-shrink-0 mt-1" size={24} />
             <div>
               <h3 className="text-amber-800 font-bold mb-1">Trainer Conflict Warning</h3>
               <p className="text-amber-700 text-sm">
                 The trainer is already booked for other events during the requested dates. Please choose an action below.
               </p>
             </div>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Conflicting Schedule Items</p>
            {conflictingBookings.map((conflict, idx) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 text-sm">{conflict.course?.title || 'Another Event'}</p>
                    <p className="text-xs text-gray-500">Status: {conflict.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-teal-600">
                       {conflict.requestedDate ? formatDate(conflict.requestedDate) : ''}
                       {conflict.endDate ? ` to ${formatDate(conflict.endDate)}` : ''}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setShowConflictModal(false)}>
              Let me review first
            </Button>
            <Button
              variant="secondary"
              className="bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600"
              onClick={() => setShowEmailModal(true)}
            >
              <Mail size={16} className="mr-2" />
              Notify Conflicting Clients
            </Button>
            <Button variant="primary" onClick={handleConfirmWithConflicts}>
              Confirm Anyway
            </Button>
          </div>
        </div>
      </Modal>

      {/* Send Email Modal */}
      <Modal
        isOpen={showEmailModal}
        onClose={() => !sendingEmail && setShowEmailModal(false)}
        title="Notify Clients"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Send a message to all clients whose bookings are in conflict with this trainer's availability.
          </p>
          <div className="space-y-4">
            <Input
              label="Email Subject"
              placeholder="e.g., Training Schedule Update"
              value={emailTitle}
              onChange={(e) => setEmailTitle(e.target.value)}
              required
            />
            <Textarea
              label="Message Body"
              placeholder="Explain the situation and proposed alternative dates..."
              value={emailMessage}
              onChange={(e) => setEmailMessage(e.target.value)}
              rows={6}
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setShowEmailModal(false)} disabled={sendingEmail}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSendEmail} disabled={sendingEmail || !emailTitle || !emailMessage}>
              {sendingEmail ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Booking Confirmation / Event Creation Modal */}
      <Modal
        isOpen={showConfirmBookingModal}
        onClose={() => {
          setShowConfirmBookingModal(false);
          setSelectedBooking(null);
          setCourseData(null);
        }}
        title="Confirm Booking & Create Event"
        size="xl"
      >
        {selectedBooking && courseData && (
          <div className="space-y-6">
            <div className="p-4 bg-teal-50 border border-teal-100 rounded-xl">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-teal-900 font-bold mb-1">Confirming: {selectedBooking.course?.title}</h3>
                  <p className="text-teal-700 text-sm">
                    Client: {selectedBooking.client?.companyName || selectedBooking.companyName || 'Individual'}
                    <span className="mx-2 opacity-30">•</span>
                    Trainer: {selectedBooking.trainer?.fullName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-teal-900 font-bold text-sm">Requested Date</p>
                  <p className="text-teal-700 text-sm">{selectedBooking.requestedDate ? formatDate(selectedBooking.requestedDate) : 'TBD'}</p>
                </div>
              </div>
            </div>

            <EventCreationForm
              course={courseData}
              onSubmit={handleConfirmBookingSubmit}
              onCancel={() => {
                setShowConfirmBookingModal(false);
                setSelectedBooking(null);
                setCourseData(null);
              }}
              initialData={{
                venue: selectedBooking.location || '',
                city: selectedBooking.city || '',
                state: selectedBooking.state || '',
              }}
              isBookingConfirmation={true}
            />
          </div>
        )}
      </Modal>

      {/* Booking Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setDetailBooking(null);
          setIsEditing(false);
        }}
        title={isEditing ? 'Edit Booking Details' : 'Booking Information'}
        size="lg"
      >
        {(() => {
          if (!detailBooking) return null;
          const b = detailBooking;
          const s = b.status.toUpperCase();
          
          return (
            <div className="space-y-6">
              {/* Status Header */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${s === 'PENDING' ? 'bg-amber-100 text-amber-600' : 'bg-teal-100 text-teal-600'}`}>
                    {s === 'PENDING' ? <Clock size={20} /> : <CheckCircle size={20} />}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Current Status</p>
                    <Badge variant={getStatusBadgeVariant(b.status)} className="uppercase text-[10px] font-bold tracking-widest">
                       {b.status}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Reference ID</p>
                   <p className="text-xs font-bold text-gray-800">#{b.id.toUpperCase()}</p>
                </div>
              </div>

              {/* Grid content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Client Information</p>
                   <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                          <User size={14} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800 leading-tight">
                            {b.client?.companyName || b.companyName || 'Individual Client'}
                          </p>
                          <p className="text-xs text-gray-500">{b.clientName || b.client?.userName || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                          <Mail size={14} />
                        </div>
                        <div className="min-w-0">
                           <p className="text-xs text-gray-400 font-medium truncate">Contact Email</p>
                           <p className="text-sm text-gray-700 font-semibold truncate leading-tight mt-0.5">{b.clientEmail || b.client?.companyEmail || 'No Email provided'}</p>
                        </div>
                      </div>
                   </div>
                </div>

                <div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Training Details</p>
                   <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                          <Calendar size={14} />
                        </div>
                        <div>
                           <p className="text-xs text-gray-400 font-medium">Requested Dates</p>
                           <p className="text-sm text-gray-700 font-bold leading-tight mt-0.5">
                              {b.requestedDate ? formatDate(b.requestedDate) : 'TBD'}
                              {b.endDate && ` – ${formatDate(b.endDate)}`}
                           </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                          <MapPin size={14} />
                        </div>
                        <div>
                           <p className="text-xs text-gray-400 font-medium">Location</p>
                           <p className="text-sm text-gray-700 font-semibold leading-tight mt-0.5">
                             {b.location || 'Remote/Virtual'}
                             {b.city && `, ${b.city}`}
                             {b.state && `, ${b.state}`}
                           </p>
                        </div>
                      </div>
                   </div>
                </div>
              </div>

              {/* Editing Form (Toggled) */}
              {isEditing ? (
                <div className="bg-gray-50/50 p-6 rounded-2xl border border-indigo-100 space-y-4 mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider">Update Details</h3>
                    <Button variant="secondary" size="sm" onClick={() => setIsEditing(false)}>Cancel Edit</Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Course Mode"
                      value={editedData.courseMode}
                      onChange={(e) => setEditedData({...editedData, courseMode: e.target.value})}
                      options={[
                        { value: 'F2F', label: 'Face to Face (F2F)' },
                        { value: 'VIRTUAL', label: 'Virtual / Online' },
                        { value: 'HYBRID', label: 'Hybrid' }
                      ]}
                    />
                    <Select
                      label="Booking Status"
                      value={editedData.status}
                      onChange={(e) => setEditedData({...editedData, status: e.target.value})}
                      options={[
                        { value: 'PENDING', label: 'Pending' },
                        { value: 'TENTATIVE', label: 'Tentative' },
                        { value: 'APPROVED', label: 'Approved' },
                        { value: 'QUOTED', label: 'Quoted' },
                        { value: 'CONFIRMED', label: 'Confirmed' },
                        { value: 'COMPLETED', label: 'Completed' },
                        { value: 'CANCELLED', label: 'Cancelled' },
                        { value: 'DENIED', label: 'Denied' },
                      ]}
                    />
                    <div className="col-span-2">
                        <Select
                          label="Assign Trainer"
                          value={editedData.trainerId}
                          onChange={(e) => setEditedData({...editedData, trainerId: e.target.value})}
                          options={[
                            { value: '', label: 'Keep Unassigned' },
                            ...trainers.map(t => ({ value: t.id, label: t.fullName }))
                          ]}
                        />
                    </div>
                    <div className="col-span-2">
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Requested Start Date"
                          type="date"
                          value={editedData.requestedDate}
                          onChange={(e) => setEditedData({...editedData, requestedDate: e.target.value})}
                        />
                        <Input
                          label="Requested End Date"
                          type="date"
                          value={editedData.endDate}
                          onChange={(e) => setEditedData({...editedData, endDate: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="col-span-2">
                       <Input 
                        label="Location/Venue" 
                        value={editedData.location} 
                        onChange={(e) => setEditedData({...editedData, location: e.target.value})} 
                       />
                    </div>
                    <Input 
                      label="City" 
                      value={editedData.city} 
                      onChange={(e) => setEditedData({...editedData, city: e.target.value})} 
                    />
                    <Input 
                      label="State" 
                      value={editedData.state} 
                      onChange={(e) => setEditedData({...editedData, state: e.target.value})} 
                    />
                  </div>
                  <div className="flex justify-end pt-2">
                     <Button variant="primary" onClick={handleUpdateDetails} disabled={detailActionLoading}>
                       {detailActionLoading ? 'Saving...' : 'Save & Update Details'}
                     </Button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center py-4 px-6 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                  <div className="flex items-center gap-4 text-indigo-700">
                    <AlertTriangle size={18} />
                    <p className="text-xs font-semibold">Change mode, venue, or reassign trainer?</p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>Edit Details</Button>
                </div>
              )}

              {/* Danger Zone — Delete */}
              <div className="pt-6 border-t">
                <div className="flex items-center justify-between p-4 bg-red-50/50 rounded-xl border border-red-100">
                  <div className="flex flex-col">
                    <p className="text-xs font-bold text-red-800 leading-tight">Administrative Override</p>
                    <p className="text-[10px] text-red-600 mt-1">This will permanently remove the record. Proceed with caution.</p>
                  </div>
                  <Button 
                    variant="secondary" 
                    className="bg-red-50 text-red-600 border-red-200 hover:bg-red-600 hover:text-white transition-all"
                    onClick={async () => {
                      if (!confirm('EXTREMELY IMPORTANT: Are you sure you want to PERMANENTLY delete this booking record? This cannot be undone.')) return;
                      setDeletingBooking(true);
                      try {
                        await apiClient.deleteBooking(b.id);
                        showToast('Booking deleted permanently', 'success');
                        setShowDetailModal(false);
                        fetchBookings();
                      } catch (error: any) {
                        showToast(error.message || 'Error deleting booking', 'error');
                      } finally {
                        setDeletingBooking(false);
                      }
                    }}
                    disabled={deletingBooking}
                  >
                    <AlertTriangle size={16} className="mr-2" />
                    {deletingBooking ? 'Deleting...' : 'Delete Permanently'}
                  </Button>
                </div>
              </div>

              {/* Action buttons — contextual per status */}
              {!['COMPLETED', 'CANCELLED', 'DENIED'].includes(s) && (
                <div className="pt-4 border-t space-y-3">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Workflow Actions</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      className="border-sky-200 text-sky-700 bg-sky-50 hover:bg-sky-100"
                      onClick={() => openReplyModal(b)}
                      disabled={detailActionLoading || !(b.clientEmail || b.client?.companyEmail)}
                    >
                      <Mail size={16} className="mr-2" />Reply Client / Attach Files
                    </Button>
                    {/* QUOTED → Confirm & Create Event */}
                    {s === 'QUOTED' && (
                      <Button variant="primary" className="shadow-lg shadow-teal-100 px-6"
                        disabled={detailActionLoading}
                        onClick={() => handleDetailAction('CONFIRMED')}
                      >
                        <CheckCircle size={16} className="mr-2" />Confirm & Create Event
                      </Button>
                    )}

                    {/* APPROVED → Quotation Send */}
                    {s === 'APPROVED' && (
                      <Button variant="secondary"
                        className="border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                        disabled={detailActionLoading}
                        onClick={() => handleDetailAction('QUOTED')}
                      >
                        <Mail size={16} className="mr-2" />Send Quotation
                      </Button>
                    )}

                    {/* PENDING / TENTATIVE → Approve or Deny on behalf of trainer */}
                    {(s === 'PENDING' || s === 'TENTATIVE') && (
                      <div className="flex flex-wrap gap-2">
                        {s === 'PENDING' && (
                          <Button variant="secondary"
                            className="border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100"
                            disabled={detailActionLoading}
                            onClick={() => handleDetailAction('TENTATIVE')}
                          >
                            <Clock size={16} className="mr-2" />Set as Tentative
                          </Button>
                        )}
                        <Button variant="success"
                          className="bg-green-600 hover:bg-green-700 text-white px-6"
                          disabled={detailActionLoading}
                          onClick={() => handleDetailAction('APPROVED')}
                        >
                          <CheckCircle size={16} className="mr-2" />Approve Booking
                        </Button>
                        <Button variant="secondary"
                          className="border-red-200 text-red-600 bg-red-50 hover:bg-red-100"
                          disabled={detailActionLoading}
                          onClick={() => handleDetailAction('DENIED')}
                        >
                          <XCircle size={16} className="mr-2" />Deny Booking
                        </Button>
                      </div>
                    )}

                    {/* ALWAYS: Hide/Show Toggle */}
                    <Button variant="secondary"
                      className="border-gray-200 text-gray-500 hover:bg-gray-100 ml-auto"
                      disabled={detailActionLoading}
                      onClick={async () => {
                        setDetailActionLoading(true);
                        try {
                          await apiClient.toggleBookingVisibility(b.id);
                          showToast(b.isHidden ? 'Booking unhidden successfully' : 'Booking hidden from default view', 'success');
                          setShowDetailModal(false);
                          fetchBookings();
                        } catch (e: any) {
                          showToast(e.message || 'Error updating visibility', 'error');
                        } finally {
                          setDetailActionLoading(false);
                        }
                      }}
                    >
                      {b.isHidden ? <RefreshCw size={16} className="mr-2" /> : <XCircle size={16} className="mr-2" />}
                      {b.isHidden ? 'Restore to View' : 'Hide from View'}
                    </Button>

                    {/* Cancel — always visible for any non-terminal status */}
                    <Button variant="secondary"
                      className="border-gray-200 text-gray-500 hover:bg-gray-100"
                      disabled={detailActionLoading}
                      onClick={() => handleDetailAction('CANCELLED')}
                    >
                      <XCircle size={16} className="mr-2" />Cancel Booking
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) as React.ReactNode;
        })()}
      </Modal>

      <Modal
        isOpen={showReplyModal}
        onClose={() => {
          if (!sendingReply) {
            setShowReplyModal(false);
            setReplyAttachment(null);
          }
        }}
        title="Reply Client"
        size="lg"
      >
        {detailBooking && (
          <div className="space-y-4">
            <div className="p-4 bg-sky-50 border border-sky-100 rounded-xl">
              <p className="text-sm text-sky-900 font-semibold">
                Sending to: {detailBooking.clientEmail || detailBooking.client?.companyEmail || 'No email available'}
              </p>
              <p className="text-xs text-sky-700 mt-1">
                Use this next-step action to reply to the client and attach a brochure, quotation, or other supporting file.
              </p>
            </div>

            <Input
              label="Email Subject"
              value={replySubject}
              onChange={(e) => setReplySubject(e.target.value)}
              placeholder="Regarding your booking request..."
            />

            <Textarea
              label="Message"
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              rows={8}
              placeholder="Write your reply to the client here..."
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Attachment</label>
              <input
                type="file"
                onChange={(e) => setReplyAttachment(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-sky-50 file:px-4 file:py-2 file:font-semibold file:text-sky-700 hover:file:bg-sky-100"
              />
              <p className="text-xs text-gray-500">Optional. Attach brochure, quotation, PDF, DOCX, image, spreadsheet, or text file.</p>
            </div>

            {detailBooking.status.toUpperCase() === 'APPROVED' && (
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={markReplyAsQuoted}
                  onChange={(e) => setMarkReplyAsQuoted(e.target.checked)}
                />
                Mark booking status as <span className="font-semibold">QUOTED</span> after sending
              </label>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setShowReplyModal(false)} disabled={sendingReply}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSendBookingReply} disabled={sendingReply}>
                <Paperclip size={16} className="mr-2" />
                {sendingReply ? 'Sending...' : 'Send Reply'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Booking Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => {
          if (!cancelSubmitting) {
            setShowCancelModal(false);
            setBookingToCancel(null);
            setCancelReason('');
          }
        }}
        title="Cancel Booking"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-lg">
            <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-red-700">
              This will permanently cancel the booking and notify the client. Please provide a clear reason so the client understands why their booking was cancelled.
            </p>
          </div>

          <Textarea
            label="Cancellation Reason *"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={4}
            placeholder="e.g. Trainer unavailability on requested dates, budget constraints discussed, client requested cancellation via phone..."
            required
          />

          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button
              variant="secondary"
              onClick={() => {
                setShowCancelModal(false);
                setBookingToCancel(null);
                setCancelReason('');
              }}
              disabled={cancelSubmitting}
            >
              Go Back
            </Button>
            <Button
              variant="secondary"
              className="bg-red-600 hover:bg-red-700 text-white border-red-600"
              onClick={handleCancelSubmit}
              disabled={cancelSubmitting || !cancelReason.trim()}
            >
              {cancelSubmitting ? (
                <><Clock size={14} className="mr-2 animate-spin" />Cancelling...</>
              ) : (
                <><XCircle size={14} className="mr-2" />Confirm Cancellation</>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
