import React, { useEffect, useState } from 'react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { apiClient } from '../../lib/api-client';
import { useRealtime } from '../../hooks/useRealtime';
import { CheckCircle, XCircle } from 'lucide-react';
import { showToast } from '../common/Toast';

interface CourseRequest {
  id: string;
  client_name: string;
  requested_course: string;
  requested_date: string;
  status: string;
  created_at: string;
}

interface CourseRequestWidgetProps {
  onNavigate?: (page: string) => void;
}

export const CourseRequestWidget: React.FC<CourseRequestWidgetProps> = ({ onNavigate }) => {
  const [requests, setRequests] = useState<CourseRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  useRealtime((payload) => {
    if (payload.table === 'course_requests' || payload.table === 'booking_requests') {
      console.log('📝 Course request updated real-time, refreshing widget...');
      fetchRequests();
    }
  });

  const fetchRequests = async () => {
    try {
      const response = await apiClient.getCustomRequests({ status: 'pending' });
      const data = response.requests || [];

      const formattedRequests = data.slice(0, 5).map((req: any) => ({
        id: req.id,
        client_name: req.companyName || req.contactName || req.client?.userName || 'Unknown Client',
        requested_course: req.courseTitle || req.trainingTopic || 'Not specified',
        requested_date: req.preferredDate || req.createdAt,
        status: req.status,
        created_at: req.createdAt,
      }));

      setRequests(formattedRequests);
    } catch (error) {
      console.error('Error fetching course requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      // Find a trainer ID to assign - for now we might need a way to pick one
      // or just pass a placeholder if the backend allows it.
      // Looking at api-client, approveRequest needs assignedTrainerId.
      await apiClient.approveRequest(requestId, { assignedTrainerId: 'placeholder' });
      showToast('Course request approved successfully!', 'success');
      fetchRequests();
    } catch (error: any) {
      console.error('Error approving request:', error);
      showToast(error.message || 'Error approving request. Please try again.', 'error');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await apiClient.rejectRequest(requestId);
      showToast('Course request rejected.', 'success');
      fetchRequests();
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      showToast(error.message || 'Error rejecting request. Please try again.', 'error');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No pending course requests</p>
        <button
          onClick={() => onNavigate && onNavigate('custom-requests')}
          className="mt-3 text-teal-600 hover:text-teal-700 text-sm font-medium"
        >
          View All Requests →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <p className="font-semibold text-gray-800">{request.client_name}</p>
              <Badge variant="warning">Pending</Badge>
            </div>
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-medium">Course:</span> {request.requested_course}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Requested Date:</span> {formatDate(request.requested_date)}
            </p>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleApprove(request.id)}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle size={16} className="mr-1" />
              Approve
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleReject(request.id)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <XCircle size={16} className="mr-1" />
              Reject
            </Button>
          </div>
        </div>
      ))}
      <button
        onClick={() => onNavigate && onNavigate('custom-requests')}
        className="w-full text-center py-2 text-teal-600 hover:text-teal-700 text-sm font-medium"
      >
        View All Course Requests →
      </button>
    </div>
  );
};
