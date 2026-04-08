import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { apiClient } from '../lib/api-client';
import { formatDate, formatCurrency } from '../utils/helpers';
import { Users, BarChart3, History, MessageSquare, Star } from 'lucide-react';
import { showToast } from '../components/common/Toast';

interface Client {
  id: string;
  userName: string;
  companyEmail: string;
  contactNumber: string | null;
  user?: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
}

interface TrainingHistory {
  id: string;
  requestedDate: string;
  status: string;
  course?: {
    id: string;
    title: string;
    courseType: string;
    category: string | null;
  };
  trainer?: {
    id: string;
    fullName: string;
  };
}

interface Feedback {
  id: string;
  rating: number;
  comment: string | null;
  course?: {
    id: string;
    title: string;
  };
  trainer?: {
    id: string;
    fullName: string;
  };
  createdAt: string;
}

interface ClientAnalytics {
  totalBookings: number;
  completedBookings: number;
  totalSpending: number;
  coursesTaken: number;
  topCategories: Array<{ category: string; count: number }>;
}

export const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [trainingHistory, setTrainingHistory] = useState<TrainingHistory[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [analytics, setAnalytics] = useState<ClientAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchClients();
  }, [currentPage]);

  useEffect(() => {
    applyFilters();
  }, [clients, searchTerm]);

  const fetchClients = async () => {
    try {
      const response = await apiClient.getClients({ page: currentPage });
      setClients(response.clients || []);
      setTotalPages(response.totalPages || 1);
    } catch (error: any) {
      console.error('Error fetching clients:', error);
      showToast(error.message || 'Error fetching clients', 'error');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...clients];

    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.companyEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.contactNumber?.includes(searchTerm)
      );
    }

    setFilteredClients(filtered);
  };

  const handleViewDetails = async (client: Client) => {
    setSelectedClient(client);
    setShowDetailsModal(true);
    try {
      const response = await apiClient.getClient(client.id);
      setSelectedClient(response.client);
    } catch (error: any) {
      showToast(error.message || 'Error fetching client details', 'error');
    }
  };

  const handleViewHistory = async (client: Client) => {
    setSelectedClient(client);
    setShowHistoryModal(true);
    try {
      const response = await apiClient.getClientTrainingHistory(client.id);
      setTrainingHistory(response.history || []);
    } catch (error: any) {
      showToast(error.message || 'Error fetching training history', 'error');
    }
  };

  const handleViewFeedback = async (client: Client) => {
    setSelectedClient(client);
    setShowFeedbackModal(true);
    try {
      const response = await apiClient.getClientFeedback(client.id);
      setFeedbacks(response.feedbacks || []);
    } catch (error: any) {
      showToast(error.message || 'Error fetching feedback', 'error');
    }
  };

  const handleViewAnalytics = async (client: Client) => {
    setSelectedClient(client);
    setShowAnalyticsModal(true);
    setAnalyticsLoading(true);
    try {
      const response = await apiClient.getClientAnalytics(client.id);
      setAnalytics(response);
    } catch (error: any) {
      showToast(error.message || 'Error fetching analytics', 'error');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  if (loading && clients.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Clients Management</h1>
      </div>

      {/* Search */}
      <Card>
        <div className="p-4">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search clients by name, email, or phone..."
          />
        </div>
      </Card>

      {/* Clients Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    No clients found
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{client.userName}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {client.companyEmail}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {client.contactNumber || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleViewDetails(client)}
                          title="View Details"
                        >
                          <Users size={14} />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleViewHistory(client)}
                          title="Training History"
                        >
                          <History size={14} />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleViewFeedback(client)}
                          title="Feedback"
                        >
                          <MessageSquare size={14} />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleViewAnalytics(client)}
                          title="Analytics"
                        >
                          <BarChart3 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 flex items-center justify-between border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Client Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedClient(null);
        }}
        title={`Client Details - ${selectedClient?.userName || ''}`}
      >
        {selectedClient && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Contact Information</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Name:</span> {selectedClient.userName}</p>
                <p><span className="font-medium">Email:</span> {selectedClient.companyEmail}</p>
                {selectedClient.contactNumber && (
                  <p><span className="font-medium">Phone:</span> {selectedClient.contactNumber}</p>
                )}
                {selectedClient.user?.fullName && (
                  <p><span className="font-medium">User Name:</span> {selectedClient.user.fullName}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Training History Modal */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => {
          setShowHistoryModal(false);
          setSelectedClient(null);
          setTrainingHistory([]);
        }}
        title={`Training History - ${selectedClient?.userName || ''}`}
      >
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {trainingHistory.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No training history</p>
          ) : (
            trainingHistory.map((booking) => (
              <Card key={booking.id}>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        {booking.course?.title || 'Unknown Course'}
                      </h4>
                      {booking.trainer && (
                        <p className="text-sm text-gray-600">Trainer: {booking.trainer.fullName}</p>
                      )}
                    </div>
                    <Badge variant={
                      booking.status === 'COMPLETED' ? 'success' :
                      booking.status === 'CONFIRMED' ? 'info' : 'warning'
                    }>
                      {booking.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Date: {formatDate(booking.requestedDate)}</p>
                    {booking.course?.category && (
                      <p>Category: {booking.course.category}</p>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </Modal>

      {/* Feedback Modal */}
      <Modal
        isOpen={showFeedbackModal}
        onClose={() => {
          setShowFeedbackModal(false);
          setSelectedClient(null);
          setFeedbacks([]);
        }}
        title={`Feedback - ${selectedClient?.userName || ''}`}
      >
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {feedbacks.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No feedback available</p>
          ) : (
            feedbacks.map((feedback) => (
              <Card key={feedback.id}>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        {feedback.course?.title || 'Unknown Course'}
                      </h4>
                      {feedback.trainer && (
                        <p className="text-sm text-gray-600">Trainer: {feedback.trainer.fullName}</p>
                      )}
                    </div>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={i < feedback.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                  </div>
                  {feedback.comment && (
                    <p className="text-sm text-gray-700 mb-2">{feedback.comment}</p>
                  )}
                  <p className="text-xs text-gray-500">{formatDate(feedback.createdAt)}</p>
                </div>
              </Card>
            ))
          )}
        </div>
      </Modal>

      {/* Analytics Modal */}
      <Modal
        isOpen={showAnalyticsModal}
        onClose={() => {
          setShowAnalyticsModal(false);
          setSelectedClient(null);
          setAnalytics(null);
        }}
        title={`Analytics - ${selectedClient?.userName || ''}`}
      >
        {analyticsLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : analytics ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <div className="p-4">
                  <p className="text-sm text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-800">{analytics.totalBookings}</p>
                </div>
              </Card>
              <Card>
                <div className="p-4">
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-800">{analytics.completedBookings}</p>
                </div>
              </Card>
              <Card>
                <div className="p-4">
                  <p className="text-sm text-gray-600">Total Spending</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {formatCurrency(analytics.totalSpending)}
                  </p>
                </div>
              </Card>
              <Card>
                <div className="p-4">
                  <p className="text-sm text-gray-600">Courses Taken</p>
                  <p className="text-2xl font-bold text-gray-800">{analytics.coursesTaken}</p>
                </div>
              </Card>
            </div>
            {analytics.topCategories.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Top Categories</h3>
                <div className="space-y-2">
                  {analytics.topCategories.map((cat, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-800">{cat.category}</span>
                      <Badge variant="info">{cat.count} courses</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No analytics data available</p>
        )}
      </Modal>
    </div>
  );
};

