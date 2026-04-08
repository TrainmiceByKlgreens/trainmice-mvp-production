import React, { useEffect, useState, useRef } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Modal } from '../components/common/Modal';
import { Textarea } from '../components/common/Textarea';
import { apiClient } from '../lib/api-client';
import { useRealtime } from '../hooks/useRealtime';
import { showToast } from '../components/common/Toast';
import { FileText, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';

interface TrainerDocument {
  id: string;
  trainer_id: string;
  trainer_name: string;
  document_type: string;
  file_url: string;
  uploaded_at: string;
  verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  expires_at: string | null;
  notes: string | null;
}

export const HRDCVerificationPage: React.FC = () => {
  const [documents, setDocuments] = useState<TrainerDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<TrainerDocument | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'expiring'>('all');

  // Ref to always give the real-time callback access to the CURRENT filter value
  // without causing a stale closure (the filter the user has currently selected)
  const filterRef = useRef(filter);
  useEffect(() => {
    filterRef.current = filter;
  }, [filter]);

  useEffect(() => {
    fetchDocuments();
  }, [filter]);

  // Real-time synchronization — uses filterRef.current to avoid stale closure
  useRealtime((payload: any) => {
    if (payload.table === 'trainer_documents') {
      console.log('📄 Real-time update for HRDC documents (High-End):', payload.table);
      // Pass the current filter explicitly so real-time refresh respects active tab
      fetchDocuments(true, filterRef.current);
    }
  });

  // Accept optional currentFilter param so real-time callbacks can pass current state
  const fetchDocuments = async (silent = false, currentFilter?: string) => {
    const activeFilter = currentFilter ?? filter;
    try {
      if (!silent) setLoading(true);

      const params: any = {};
      if (activeFilter === 'pending') {
        params.verified = false;
      } else if (activeFilter === 'verified') {
        params.verified = true;
      }

      const response = await apiClient.getAdminDocuments(params);
      const documentsData = response.documents || [];

      // Filter expiring documents on frontend if needed
      let filteredDocs = documentsData;
      if (activeFilter === 'expiring') {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        filteredDocs = documentsData.filter((doc: any) => {
          if (!doc.expiresAt) return false;
          const expiryDate = new Date(doc.expiresAt);
          return expiryDate <= thirtyDaysFromNow;
        });
      }

      // Map backend camelCase to frontend snake_case
      const formattedDocs: TrainerDocument[] = filteredDocs.map((doc: any) => ({
        id: doc.id,
        trainer_id: doc.trainerId,
        trainer_name: doc.trainer?.fullName || 'Unknown Trainer',
        document_type: doc.documentType,
        file_url: doc.fileUrl,
        uploaded_at: doc.uploadedAt || new Date().toISOString(),
        verified: doc.verified || false,
        verified_by: doc.verifiedBy || null,
        verified_at: doc.verifiedAt || null,
        expires_at: doc.expiresAt || null,
        notes: doc.notes || null,
      }));

      setDocuments(formattedDocs);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleVerify = async (approve: boolean) => {
    if (!selectedDoc) return;

    try {
      await apiClient.verifyDocument(selectedDoc.id, {
        verified: approve,
        notes: verificationNotes || undefined,
      });
      // Backend handles activity logging automatically

      setShowVerifyModal(false);
      setSelectedDoc(null);
      setVerificationNotes('');
      fetchDocuments();

      showToast(`Document ${approve ? 'approved' : 'rejected'} successfully!`, approve ? 'success' : 'error');
    } catch (error: any) {
      console.error('Error verifying document:', error);
      showToast(error.message || 'Error processing verification. Please try again.', 'error');
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysUntilExpiry = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const days = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getExpiryBadge = (expiryDate: string | null) => {
    const days = getDaysUntilExpiry(expiryDate);
    if (days === null) return null;

    if (days < 0) {
      return <Badge variant="danger">Expired</Badge>;
    } else if (days <= 7) {
      return <Badge variant="danger">Expires in {days} days</Badge>;
    } else if (days <= 30) {
      return <Badge variant="warning">Expires in {days} days</Badge>;
    }
    return <Badge variant="success">Valid</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FileText className="text-teal-600" size={32} />
          <h1 className="text-3xl font-bold text-gray-800">HRDC Verification Center</h1>
        </div>
      </div>

      <div className="flex items-center space-x-4 bg-white p-4 rounded-lg shadow-sm">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'all'
            ? 'bg-teal-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          All Documents
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'pending'
            ? 'bg-teal-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          Pending Verification
        </button>
        <button
          onClick={() => setFilter('verified')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'verified'
            ? 'bg-teal-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          Verified
        </button>
        <button
          onClick={() => setFilter('expiring')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'expiring'
            ? 'bg-teal-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          Expiring Soon
        </button>
      </div>

      {documents.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <FileText className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">No documents found for the selected filter.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {documents.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`p-3 rounded-lg ${doc.verified
                      ? 'bg-green-100'
                      : 'bg-yellow-100'
                      }`}>
                      {doc.verified ? (
                        <CheckCircle className="text-green-600" size={24} />
                      ) : (
                        <Clock className="text-yellow-600" size={24} />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {doc.document_type}
                        </h3>
                        {doc.verified ? (
                          <Badge variant="success">Verified</Badge>
                        ) : (
                          <Badge variant="warning">Pending</Badge>
                        )}
                        {getExpiryBadge(doc.expires_at)}
                      </div>

                      <div className="space-y-1 text-sm text-gray-600">
                        <p>
                          <span className="font-medium">Trainer:</span> {doc.trainer_name}
                        </p>
                        <p>
                          <span className="font-medium">Uploaded:</span> {formatDate(doc.uploaded_at)}
                        </p>
                        {doc.expires_at && (
                          <p>
                            <span className="font-medium">Expires:</span> {formatDate(doc.expires_at)}
                          </p>
                        )}
                        {doc.verified_at && (
                          <p>
                            <span className="font-medium">Verified:</span> {formatDate(doc.verified_at)}
                          </p>
                        )}
                        {doc.notes && (
                          <p className="mt-2">
                            <span className="font-medium">Notes:</span> {doc.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => window.open(doc.file_url, '_blank')}
                    >
                      <Eye size={16} className="mr-1" />
                      View
                    </Button>
                    {!doc.verified && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setSelectedDoc(doc);
                          setShowVerifyModal(true);
                        }}
                      >
                        Verify
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={showVerifyModal}
        onClose={() => {
          setShowVerifyModal(false);
          setSelectedDoc(null);
          setVerificationNotes('');
        }}
        title="Verify Document"
      >
        <div className="space-y-4">
          {selectedDoc && (
            <>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p>
                  <span className="font-semibold">Document:</span> {selectedDoc.document_type}
                </p>
                <p>
                  <span className="font-semibold">Trainer:</span> {selectedDoc.trainer_name}
                </p>
                <p>
                  <span className="font-semibold">Uploaded:</span> {formatDate(selectedDoc.uploaded_at)}
                </p>
                {selectedDoc.expires_at && (
                  <p>
                    <span className="font-semibold">Expires:</span> {formatDate(selectedDoc.expires_at)}
                  </p>
                )}
              </div>

              <Textarea
                label="Verification Notes (Optional)"
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                rows={4}
                placeholder="Add any notes or comments about this verification..."
              />

              <div className="flex space-x-3">
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={() => handleVerify(true)}
                >
                  <CheckCircle size={18} className="mr-2" />
                  Approve
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => handleVerify(false)}
                >
                  <XCircle size={18} className="mr-2" />
                  Reject
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};
