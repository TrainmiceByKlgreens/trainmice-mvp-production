import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../lib/api-client';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface FeedbackFormData {
  participantName: string;
  contentClarity: string;
  objectivesAchieved: string;
  materialsHelpful: string;
  learningEnvironment: string;
  trainerKnowledge: string;
  trainerEngagement: string;
  knowledgeExposure: string;
  knowledgeApplication: string;
  durationSuitable: string;
  recommendCourse: string;
  likedMost: string;
  improvementSuggestion: string;
  additionalComments: string;
  recommendColleagues: boolean;
  referralDetails: string;
  futureTrainingTopics: string;
  inhouseTrainingNeeds: string;
  teamBuildingInterest: string;
}

export const FeedbackForm: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventData, setEventData] = useState<any>(null);
  const [formData, setFormData] = useState<FeedbackFormData>({
    participantName: '',
    contentClarity: '',
    objectivesAchieved: '',
    materialsHelpful: '',
    learningEnvironment: '',
    trainerKnowledge: '',
    trainerEngagement: '',
    knowledgeExposure: '',
    knowledgeApplication: '',
    durationSuitable: '',
    recommendCourse: '',
    likedMost: '',
    improvementSuggestion: '',
    additionalComments: '',
    recommendColleagues: false,
    referralDetails: '',
    futureTrainingTopics: '',
    inhouseTrainingNeeds: '',
    teamBuildingInterest: '',
  });

  useEffect(() => {
    if (eventId) {
      fetchEventData();
    }
  }, [eventId]);

  const fetchEventData = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getFeedbackForm(eventId!);
      setEventData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load feedback form');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof FeedbackFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) return;

    if (!formData.participantName.trim()) {
      setError('Please enter your name');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await apiClient.submitFeedback({
        eventId,
        ...formData,
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderRatingField = (
    label: string,
    field: keyof FeedbackFormData,
    description: string
  ) => {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {label} <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-500">{description}</p>
        <div className="flex items-center space-x-4">
          {[1, 2, 3, 4, 5].map((rating) => (
            <label key={rating} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name={field}
                value={rating}
                checked={formData[field] === String(rating)}
                onChange={(e) => handleChange(field, e.target.value)}
                className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                required
              />
              <span className="text-sm text-gray-700">{rating}</span>
            </label>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (error && !eventData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Thank You!</h2>
          <p className="text-gray-600 mb-6">
            Your feedback has been submitted successfully. We appreciate your time and input.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Event Feedback Form</h1>
          
          {/* Read-only event information */}
          <div className="bg-gray-50 rounded-md p-4 mb-6 space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Course Name:</span>
                <span className="ml-2 text-gray-900">{eventData?.courseName || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Course Date:</span>
                <span className="ml-2 text-gray-900">
                  {eventData?.courseDate ? new Date(eventData.courseDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Duration:</span>
                <span className="ml-2 text-gray-900">{eventData?.courseDuration || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Attendance:</span>
                <span className="ml-2 text-gray-900">{eventData?.attendance || 'N/A'} participants</span>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Participant Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Participant Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.participantName}
              onChange={(e) => handleChange('participantName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          {/* Section A - Course Quality */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Section A — Course Quality</h2>
            <div className="space-y-6">
              {renderRatingField(
                'Content Clarity',
                'contentClarity',
                'The contents were clear and easy to understand'
              )}
              {renderRatingField(
                'Objectives Achieved',
                'objectivesAchieved',
                'The course objectives were successfully achieved'
              )}
              {renderRatingField(
                'Materials Helpful',
                'materialsHelpful',
                'The course materials were enough and helpful'
              )}
            </div>
          </div>

          {/* Section B - Training Experience */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Section B — Training Experience</h2>
            <div className="space-y-6">
              {renderRatingField(
                'Learning Environment',
                'learningEnvironment',
                'The class environment enabled me to learn'
              )}
              {renderRatingField(
                'Trainer Knowledge',
                'trainerKnowledge',
                "My learning was enhanced by the trainer's knowledge and experience"
              )}
              {renderRatingField(
                'Trainer Engagement',
                'trainerEngagement',
                'I was well engaged during the session by the trainer'
              )}
              {renderRatingField(
                'Knowledge Exposure',
                'knowledgeExposure',
                'The course exposed me to new knowledge and practices'
              )}
            </div>
          </div>

          {/* Section C - Duration & Impact */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Section C — Duration & Impact</h2>
            <div className="space-y-6">
              {renderRatingField(
                'Knowledge Application',
                'knowledgeApplication',
                'I understand how to apply what I learned'
              )}
              {renderRatingField(
                'Duration Suitable',
                'durationSuitable',
                'The duration of the course was just right'
              )}
              {renderRatingField(
                'Recommend Course',
                'recommendCourse',
                'I would recommend this course to my colleagues'
              )}
            </div>
          </div>

          {/* Section D - Comments */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Section D — Comments</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What did you like most about the course?
                </label>
                <textarea
                  value={formData.likedMost}
                  onChange={(e) => handleChange('likedMost', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  If you could change one thing about this course, what would it be?
                </label>
                <textarea
                  value={formData.improvementSuggestion}
                  onChange={(e) => handleChange('improvementSuggestion', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Any additional comments or suggestions
                </label>
                <textarea
                  value={formData.additionalComments}
                  onChange={(e) => handleChange('additionalComments', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Section E - Referrals & Future Training */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Section E — Referrals & Future Training
            </h2>
            <div className="space-y-6">
              <div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.recommendColleagues}
                    onChange={(e) => handleChange('recommendColleagues', e.target.checked)}
                    className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Would you recommend your colleagues to attend our training programs?
                  </span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Referral Details (Name, Department/Position, Contact, Email)
                </label>
                <textarea
                  value={formData.referralDetails}
                  onChange={(e) => handleChange('referralDetails', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Training topics you want in the future
                </label>
                <textarea
                  value={formData.futureTrainingTopics}
                  onChange={(e) => handleChange('futureTrainingTopics', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  In-house training needs
                </label>
                <textarea
                  value={formData.inhouseTrainingNeeds}
                  onChange={(e) => handleChange('inhouseTrainingNeeds', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team-building session interest details
                </label>
                <textarea
                  value={formData.teamBuildingInterest}
                  onChange={(e) => handleChange('teamBuildingInterest', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="border-t pt-6">
            <button
              type="submit"
              disabled={submitting}
              className="w-full px-6 py-3 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Feedback</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
