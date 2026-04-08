import { X, Calendar, MapPin, Users, Mail, FileText } from 'lucide-react';
import { BookingWithCourse } from '../../types/database';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';

interface EngagementDetailsModalProps {
  engagement: BookingWithCourse;
  onClose: () => void;
}

export function EngagementDetailsModal({ engagement, onClose }: EngagementDetailsModalProps) {
  const navigate = useNavigate();

  const formatDate = (dateStr: string | null, timeStr: string | null) => {
    if (!dateStr) return 'Date TBD';
    const date = new Date(dateStr);
    const dateFormatted = date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
    return timeStr ? `${dateFormatted} at ${timeStr}` : dateFormatted;
  };

  const handleViewMaterials = () => {
    if (engagement.course_id) {
      navigate(`/courses/${engagement.course_id}/materials`);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Engagement Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm text-blue-600 font-medium mb-1">Event ID</p>
                <p className="text-gray-900 font-mono text-sm">{engagement.id}</p>
              </div>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                engagement.status === 'approved' ? 'bg-green-100 text-green-700' :
                engagement.status === 'tentative' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {engagement.status.charAt(0).toUpperCase() + engagement.status.slice(1)}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-1">Course Title</p>
                <p className="text-lg font-semibold text-gray-900">
                  {engagement.courses?.title || 'Course Title N/A'}
                </p>
                {engagement.courses?.description && (
                  <p className="text-sm text-gray-600 mt-2">{engagement.courses.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-1">Venue</p>
                <p className="text-gray-900 font-medium">{engagement.location || 'Location TBD'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-1">Date & Time</p>
                <p className="text-gray-900 font-medium">
                  {formatDate(engagement.requested_date, engagement.requested_time)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-1">Client Information</p>
                <p className="text-gray-900 font-medium">{engagement.client_name || 'N/A'}</p>
                {engagement.client_email && (
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <p className="text-sm text-gray-600">{engagement.client_email}</p>
                  </div>
                )}
              </div>
            </div>

            {engagement.courses?.duration_hours && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Duration</p>
                <p className="text-gray-900 font-medium">
                  {engagement.courses.duration_hours} {engagement.courses.duration_hours === 1 ? 'hour' : 'hours'}
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-200">
            <Button
              onClick={handleViewMaterials}
              disabled={!engagement.course_id}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText className="w-4 h-4 mr-2" />
              View Materials
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
