import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Trainer, Course } from '../lib/api-client';
import { auth } from '../lib/auth';
import { apiClient } from '../lib/api-client';

type BookingModalProps = {
  isOpen: boolean;
  onClose: () => void;
  trainer: Trainer | null;
  course: Course | null;
};

export function BookingModal({
  isOpen,
  onClose,
  trainer,
  course,
}: BookingModalProps) {
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const fetchUserData = async () => {
        try {
          const { user } = await auth.getSession();
          if (user) {
            const userName = user.fullName || user.email?.split('@')[0] || '';
            const userEmail = user.email || '';
            setFormData(prev => ({
              ...prev,
              clientName: userName,
              clientEmail: userEmail,
            }));
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setIsLoadingUser(false);
        }
      };
      fetchUserData();
    }
  }, [isOpen]);

  if (!isOpen || !course) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const { user } = await auth.getSession();
      if (!user) {
        setSubmitMessage({
          type: 'error',
          text: 'You must be logged in to book a course.',
        });
        setIsSubmitting(false);
        return;
      }

      await apiClient.createBookingRequest({
        courseId: course.id,
        trainerId: course.trainerId || course.trainer_id || null,
        clientId: user.id,
        requestType: 'PUBLIC',
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        status: 'PENDING',
      });

      setSubmitMessage({
        type: 'success',
        text: 'Your booking request has been submitted successfully! You will be notified upon confirmation.',
      });

      setTimeout(() => {
        onClose();
        setFormData({ clientName: '', clientEmail: '' });
        setSubmitMessage(null);
      }, 2000);
    } catch (error) {
      setSubmitMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to submit booking request',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Book Course
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {isLoadingUser ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-600">Loading your information...</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                <p className="text-gray-900 font-medium">{course.title}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trainer</label>
                <p className="text-gray-900 font-medium">{course.trainer_id || 'Not assigned'}</p>
              </div>

              <div>
                <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="clientName"
                  required
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="clientEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="clientEmail"
                  required
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {submitMessage && (
                <div
                  className={`p-3 rounded-md ${
                    submitMessage.type === 'success'
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {submitMessage.text}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isLoadingUser}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:bg-gray-400"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Booking'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
