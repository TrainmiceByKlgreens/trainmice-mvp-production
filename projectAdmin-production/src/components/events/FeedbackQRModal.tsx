import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { apiClient } from '../../lib/api-client';
import { showToast } from '../common/Toast';
import { Copy, Download } from 'lucide-react';

interface FeedbackQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
}

export const FeedbackQRModal: React.FC<FeedbackQRModalProps> = ({
  isOpen,
  onClose,
  eventId,
  eventTitle,
}) => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [feedbackUrl, setFeedbackUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && eventId) {
      fetchQRCode();
    }
  }, [isOpen, eventId]);

  const fetchQRCode = async () => {
    setLoading(true);
    try {
      const response = await apiClient.generateFeedbackQR(eventId);
      setQrCode(response.qrCode);
      setFeedbackUrl(response.url);
    } catch (error: any) {
      console.error('Error generating QR code:', error);
      showToast(error.message || 'Failed to generate QR code', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyUrl = () => {
    if (feedbackUrl) {
      navigator.clipboard.writeText(feedbackUrl);
      showToast('URL copied to clipboard', 'success');
    }
  };

  const downloadQR = () => {
    if (qrCode) {
      const link = document.createElement('a');
      link.href = qrCode;
      link.download = `feedback-qr-${eventId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('QR code downloaded', 'success');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Feedback Form QR Code" size="md">
      <div className="space-y-6">
        <div>
          <p className="text-gray-600 mb-2">
            <strong>Event:</strong> {eventTitle}
          </p>
          <p className="text-sm text-gray-500">
            Share this QR code with participants to collect feedback for this event.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : qrCode ? (
          <>
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                <img src={qrCode} alt="Feedback Form QR Code" className="w-64 h-64" />
              </div>
              
              {feedbackUrl && (
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Feedback Form URL
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={feedbackUrl}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                    />
                    <button
                      onClick={copyUrl}
                      className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 flex items-center space-x-2"
                    >
                      <Copy size={16} />
                      <span>Copy</span>
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={downloadQR}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center space-x-2"
              >
                <Download size={16} />
                <span>Download QR Code</span>
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-800">
                <strong>Instructions:</strong>
              </p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                <li>Display or print this QR code at your event</li>
                <li>Participants can scan it to access the feedback form</li>
                <li>The form will automatically include event details</li>
                <li>All feedback will be stored and can be viewed in analytics</li>
              </ul>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            Failed to generate QR code
          </div>
        )}
      </div>
    </Modal>
  );
};
