import React, { useEffect, useState } from 'react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Modal } from '../components/common/Modal';
import { Textarea } from '../components/common/Textarea';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { apiClient } from '../lib/api-client';
import { useRealtime } from '../hooks/useRealtime';
import { showToast } from '../components/common/Toast';
import { CustomCourseRequest, Trainer } from '../types';
import { formatDateTime } from '../utils/helpers';
import {
  XCircle,
  Calendar, Briefcase, BookOpen, MessageSquare, User, RefreshCw,
  Eye, EyeOff,
} from 'lucide-react';

// ─── Status helpers ──────────────────────────────────────────────────────────
const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-white text-amber-600 border-amber-200',
  tbc: 'bg-white text-blue-600 border-blue-200',
  rejected: 'bg-white text-red-600 border-red-200',
  course_outline_pending: 'bg-white text-purple-600 border-purple-200',
  course_outline_ready: 'bg-white text-teal-600 border-teal-200',
};
const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  tbc: 'TBC',
  rejected: 'Rejected',
  course_outline_pending: 'Course Outline Pending',
  course_outline_ready: 'Course Outline Ready',
};

// ─── Extended request type (with new fields) ──────────────────────────────────
interface ExtendedRequest extends CustomCourseRequest {
  industry?: string;
  company_name?: string;
  preferred_mode?: string;
  training_mode?: string;
  proposed_venue?: string;
  number_of_training_days?: number;
  proposed_training_date?: string;
  isHidden?: boolean;
  isRead?: boolean;
}

export const CustomRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<ExtendedRequest[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);

  // Detail modal state
  const [detailRequest, setDetailRequest] = useState<ExtendedRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Rejection modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [showHidden, setShowHidden] = useState(false);
  const [deletingRequest, setDeletingRequest] = useState(false);

  useEffect(() => { fetchData(); }, [showHidden]);

  useRealtime((payload: any) => {
    if (payload.table === 'course_requests' || payload.table === 'custom_course_requests') fetchData(true);
  });

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [requestsResponse, trainersResponse] = await Promise.all([
        apiClient.getCustomRequests({ includeHidden: showHidden }),
        apiClient.getTrainers(),
      ]);

      const mappedRequests: ExtendedRequest[] = (requestsResponse.requests || []).map((r: any) => ({
        id: r.id,
        client_name: r.contactPerson || '',
        client_email: r.email || '',
        client_phone: r.clientPhone || null,
        course_title: r.courseName || '',
        description: r.reason || null,
        preferred_dates: r.preferredDates || null,
        budget: r.budget ? parseFloat(r.budget) : null,
        status: r.status?.toLowerCase() || 'pending',
        assigned_trainer_id: r.assignedTrainerId || null,
        admin_notes: r.adminNotes || null,
        created_at: r.createdAt || new Date().toISOString(),
        updated_at: r.updatedAt || new Date().toISOString(),
        industry: r.industry || null,
        company_name: r.companyName || null,
        preferred_mode: r.preferredMode || null,
        training_mode: r.trainingMode || null,
        proposed_venue: r.proposedVenue || null,
        number_of_training_days: r.numberOfTrainingDays || null,
        proposed_training_date: r.proposedTrainingDate || null,
        isHidden: r.isHidden || false,
      }));

      setRequests(mappedRequests);

      const mappedTrainers: Trainer[] = (trainersResponse.trainers || []).map((t: any) => ({
        id: t.id,
        user_id: t.userId || null,
        email: t.email || '',
        full_name: t.fullName || '',
        phone: t.phoneNumber || null,
        specialization: Array.isArray(t.areasOfExpertise) && t.areasOfExpertise.length > 0
          ? t.areasOfExpertise[0] : null,
        bio: t.professionalBio || null,
        hourly_rate: null,
        hrdc_certified: !!t.hrdcAccreditationId,
        created_at: t.createdAt || new Date().toISOString(),
        updated_at: t.updatedAt || new Date().toISOString(),
      }));

      setTrainers(mappedTrainers);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleApproveToDraft = async (request: ExtendedRequest) => {
    try {
      setIsProcessing(true);
      
      // Auto-save the assigned trainer and other details before approving
      await apiClient.updateCustomRequestStatus(request.id, {
        status: request.status.toUpperCase(),
        trainerId: request.assigned_trainer_id,
        adminNotes: request.admin_notes,
      });

      await apiClient.approveRequest(request.id);
      showToast('Request approved and added to courses draft', 'success');
      setShowDetailModal(false);
      setDetailRequest(null);
      fetchData();
    } catch (error: any) {
      showToast(error.message || 'Error approving request', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateDetail = async () => {
    if (!detailRequest) return;
    try {
      setIsProcessing(true);
      await apiClient.updateCustomRequestStatus(detailRequest.id, {
        status: detailRequest.status.toUpperCase(),
        trainerId: detailRequest.assigned_trainer_id,
        adminNotes: detailRequest.admin_notes,
      });
      showToast('Request details updated', 'success');
      fetchData();
    } catch (error: any) {
      showToast(error.message || 'Error updating details', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const openRejectModal = () => {
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!detailRequest) return;
    if (!rejectReason.trim()) {
      showToast('Please provide a reason for rejection', 'error');
      return;
    }

    try {
      setIsProcessing(true);
      await apiClient.rejectRequest(detailRequest.id, rejectReason);
      showToast('Request rejected', 'success');
      setShowRejectModal(false);
      setShowDetailModal(false);
      setDetailRequest(null);
      fetchData();
    } catch (error: any) {
      showToast(error.message || 'Error rejecting request', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleHide = async () => {
    if (!detailRequest) return;

    // Optimistic Update
    const originalRequest = { ...detailRequest };
    const newIsHidden = !detailRequest.isHidden;

    setRequests(prev => prev.map(r =>
      r.id === detailRequest.id ? { ...r, isHidden: newIsHidden } : r
    ));
    setDetailRequest({ ...detailRequest, isHidden: newIsHidden });

    try {
      await apiClient.patch(`admin/custom-requests/${detailRequest.id}/toggle-hide`, {});
      showToast(newIsHidden ? 'Request hidden from list' : 'Request restored to list', 'success');
      // No need to fetchData(true) as we updated state optimistically
    } catch (error: any) {
      // Revert on error
      setRequests(prev => prev.map(r =>
        r.id === detailRequest.id ? originalRequest : r
      ));
      setDetailRequest(originalRequest);
      showToast(error.message || 'Error toggling hide status', 'error');
    }
  };

  const handleDelete = async () => {
    if (!detailRequest) return;
    if (!window.confirm('Are you absolutely sure you want to permanently delete this request? This action cannot be undone.')) return;

    setDeletingRequest(true);
    try {
      await apiClient.delete(`admin/custom-requests/${detailRequest.id}`);
      showToast('Request permanently deleted', 'success');
      setShowDetailModal(false);
      setDetailRequest(null);
      fetchData();
    } catch (error: any) {
      showToast(error.message || 'Error deleting request', 'error');
    } finally {
      setDeletingRequest(false);
    }
  };

  const getTrainerName = (trainerId: string | null) => {
    if (!trainerId) return 'Not assigned';
    return trainers.find(t => t.id === trainerId)?.full_name || 'Unknown';
  };

  const filtered = requests.filter((r) => {
    const searchString = searchTerm.toLowerCase();

    // Check if hidden (if not showing hidden)
    if (!showHidden && r.isHidden) return false;

    return (
      r.course_title.toLowerCase().includes(searchString) ||
      r.client_name.toLowerCase().includes(searchString) ||
      (r.company_name && r.company_name.toLowerCase().includes(searchString))
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Custom Course Requests</h1>
          <p className="text-gray-500 mt-1 text-sm font-medium">
            Manage and review bespoke training inquiries
          </p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <div className="flex items-center bg-white border border-gray-200 rounded-xl px-4 py-2 h-[42px] shadow-sm">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-gray-600">
              <input
                type="checkbox"
                checked={showHidden}
                onChange={(e) => setShowHidden(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              Show Hidden
            </label>
          </div>
          <div className="relative w-full md:w-80">
            <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-sm shadow-sm"
              placeholder="Search topic, client or company..."
            />
          </div>
        </div>
      </div>

      {/* Table Section */}
      {filtered.length === 0 ? (
        <Card className="text-center py-24 text-gray-400 bg-white border border-dashed border-gray-200 rounded-[2rem] shadow-sm">
          <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen size={32} className="opacity-20" />
          </div>
          <p className="font-bold text-lg text-gray-600">No requests found</p>
          <p className="text-sm">Requests from clients will appear here.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden border-none shadow-xl rounded-[1.5rem]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#64748b] uppercase tracking-wider whitespace-nowrap">Preferred Date</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Course / Topic Name</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Company / Client / Email</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#64748b] uppercase tracking-wider text-center">Training Mode</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#64748b] uppercase tracking-wider text-center">Trainer</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#64748b] uppercase tracking-wider text-center">Status</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filtered.map((request) => (
                  <tr
                    key={request.id}
                    onClick={async () => {
                      setDetailRequest(request);
                      setShowDetailModal(true);

                      // Mark as read if needed
                      if (!request.isRead) {
                        try {
                          const response = await apiClient.getCustomRequest(request.id);
                          if (response.request) {
                            setRequests(prev => prev.map(r => r.id === request.id ? { ...r, isRead: true } : r));
                          }
                        } catch (err) {
                          console.error('Error marking request as read:', err);
                        }
                      }
                    }}
                    className="hover:bg-teal-50/50 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">
                          {request.proposed_training_date
                            ? new Date(request.proposed_training_date).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
                            : 'TBC'}
                        </span>
                        {request.preferred_dates && (
                          <span className="text-[10px] text-gray-400 font-medium truncate max-w-[120px]">
                            {request.preferred_dates}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm font-bold text-gray-900 leading-tight line-clamp-2 max-w-xs group-hover:text-teal-700 transition-colors">
                        {request.course_title}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-gray-900 line-clamp-1">{request.company_name || 'Individual Client'}</span>
                        <span className="text-xs text-gray-600 font-medium">{request.client_name}</span>
                        <span className="text-[11px] text-gray-400">{request.client_email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      {request.training_mode && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 text-[10px] font-bold text-indigo-700 uppercase border border-indigo-100 shadow-sm">
                          {request.training_mode}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 shadow-sm border border-gray-100">
                          <User size={12} />
                        </div>
                        <div className="text-sm font-bold text-gray-700 whitespace-nowrap">
                          {getTrainerName(request.assigned_trainer_id)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border shadow-sm ${STATUS_STYLE[request.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                            {STATUS_LABEL[request.status] || request.status}
                          </span>
                          {(request.status === 'pending' || !request.isRead) && (
                            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" title="Attention required" />
                          )}
                        </div>
                        {request.isHidden && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-gray-100 text-gray-500 border border-gray-200 shadow-sm">
                            Hidden
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <Button variant="secondary" size="sm" className="rounded-lg text-xs">View Details</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { if (!isProcessing) { setShowDetailModal(false); setDetailRequest(null); } }}
        title="Custom Course Request Management"
        size="2xl"
      >
        {detailRequest && (() => {
          const r = detailRequest;
          return (
            <div className="space-y-6">
              {/* Header Summary */}
              <div className="flex justify-between items-start bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${STATUS_STYLE[r.status]}`}>
                      {STATUS_LABEL[r.status]}
                    </span>
                    {r.isHidden && (
                      <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-[10px] font-bold rounded uppercase">Hidden</span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{r.course_title}</h2>
                  <p className="text-xs text-gray-500">Request #{r.id.slice(-8).toUpperCase()} • Submitted {formatDateTime(r.created_at)}</p>
                </div>
                {r.status === 'tbc' && (
                  <Button
                    variant="success"
                    size="sm"
                    className="font-bold text-xs"
                    onClick={() => handleApproveToDraft(r)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? <LoadingSpinner size="sm" /> : <Briefcase size={14} className="mr-2" />}
                    Convert to Course Draft
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Requirements & Client */}
                <div className="space-y-6">
                  <div className="p-5 bg-white border border-gray-200 rounded-xl space-y-4 shadow-sm">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
                      <BookOpen size={14} /> Course Requirement
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Training Mode</p>
                        <p className="text-sm font-medium text-gray-700">{r.training_mode || 'Physical'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Request Type</p>
                        <p className="text-sm font-medium text-gray-700">{r.preferred_mode?.replace('_', ' ') || 'In-House'}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Outcomes / Description</p>
                      <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap leading-relaxed">{r.description || 'No description provided.'}</p>
                    </div>
                  </div>

                  <div className="p-5 bg-white border border-gray-200 rounded-xl space-y-4 shadow-sm">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
                      <User size={14} /> Client Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Company / Contact</p>
                        <p className="text-sm font-bold text-gray-800">{r.company_name || 'Individual'}</p>
                        <p className="text-xs text-gray-600">{r.client_name}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Email</p>
                          <p className="text-xs font-medium text-blue-600 truncate">{r.client_email}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Phone</p>
                          <p className="text-xs font-medium text-gray-700">{r.client_phone || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-white border border-gray-200 rounded-xl space-y-4 shadow-sm">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
                      <Calendar size={14} /> Logistics
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Proposed Date</p>
                        <p className="text-sm font-medium text-gray-800">
                          {r.proposed_training_date ? new Date(r.proposed_training_date).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBC'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Duration</p>
                        <p className="text-sm font-medium text-gray-800">{r.number_of_training_days || '?'} Days</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Proposed Venue</p>
                      <p className="text-sm text-gray-700">{r.proposed_venue || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Right: Internal Admin */}
                <div className="space-y-6">
                  <div className="p-5 bg-amber-50/30 border border-amber-100 rounded-xl space-y-5 shadow-sm">
                    <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wider border-b border-amber-100 pb-2 flex items-center gap-2">
                      <MessageSquare size={14} /> Administration
                    </h3>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Update Status</label>
                      <select
                        value={r.status}
                        onChange={(e) => setDetailRequest({ ...r, status: e.target.value as any })}
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      >
                        {Object.keys(STATUS_LABEL).map(key => (
                          <option key={key} value={key}>{STATUS_LABEL[key]}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Assign Trainer</label>
                      <select
                        value={r.assigned_trainer_id || ''}
                        onChange={(e) => setDetailRequest({ ...r, assigned_trainer_id: e.target.value || null })}
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      >
                        <option value="">No Trainer Assigned</option>
                        {trainers.map(t => (
                          <option key={t.id} value={t.id}>{t.full_name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Admin Notes</label>
                      <textarea
                        value={r.admin_notes || ''}
                        onChange={(e) => setDetailRequest({ ...r, admin_notes: e.target.value })}
                        rows={4}
                        className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        placeholder="Internal notes..."
                      />
                    </div>

                    <Button
                      variant="primary"
                      className="w-full flex justify-center items-center py-2.5"
                      onClick={handleUpdateDetail}
                      disabled={isProcessing}
                    >
                      {isProcessing ? <LoadingSpinner size="sm" className="mr-2" /> : <RefreshCw size={14} className="mr-2" />}
                      Save Updates
                    </Button>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-xl space-y-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Danger Zone</p>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full justify-start text-indigo-600"
                        onClick={handleToggleHide}
                        disabled={isProcessing}
                      >
                        {r.isHidden ? <Eye size={14} className="mr-2" /> : <EyeOff size={14} className="mr-2" />}
                        {r.isHidden ? 'Restore to Main List' : 'Hide from List'}
                      </Button>

                      <Button
                        variant="danger"
                        size="sm"
                        className="w-full justify-start"
                        onClick={openRejectModal}
                        disabled={isProcessing || r.status === 'rejected'}
                      >
                        <XCircle size={14} className="mr-2" /> Reject Request
                      </Button>

                      <Button
                        variant="danger"
                        size="sm"
                        className="w-full justify-start mt-2 border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                        onClick={handleDelete}
                        disabled={isProcessing || deletingRequest}
                      >
                        <XCircle size={14} className="mr-2" />
                        {deletingRequest ? 'Deleting...' : 'Permanently Delete'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Rejection Reason Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => { if (!isProcessing) setShowRejectModal(false); }}
        title="Reason for Rejection"
        size="md"
      >
        <div className="space-y-5">
          <p className="text-sm text-gray-500 font-medium leading-relaxed">
            Please provide a brief reason for rejecting this custom course request.
          </p>

          <Textarea
            label="Rejection Reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
            placeholder="e.g. Budget constraints, schedule conflicts..."
            required
            disabled={isProcessing}
            className="rounded-2xl"
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setShowRejectModal(false)}
              disabled={isProcessing}
              className="rounded-xl px-6 font-bold text-xs uppercase"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              disabled={!rejectReason.trim() || isProcessing}
              className="rounded-xl px-6 font-black text-xs uppercase tracking-widest shadow-lg shadow-red-200"
            >
              {isProcessing ? <LoadingSpinner size="sm" className="mr-2" /> : <XCircle size={14} className="mr-2" />}
              Confirm Reject
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
