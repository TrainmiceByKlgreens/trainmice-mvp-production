import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { apiClient } from '../lib/api-client';
import { showToast } from '../components/common/Toast';
import { Filter, X, TrendingUp, Users, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDate } from '../utils/helpers';

interface Feedback {
  id: string;
  participantName: string | null;
  courseName: string | null;
  courseDuration: string | null;
  attendance: string | null;
  event: {
    id: string;
    title: string;
    eventDate: Date;
    eventCode: string | null;
  } | null;
  trainer: {
    id: string;
    fullName: string;
  } | null;
  course: {
    id: string;
    title: string;
    courseCode: string | null;
  } | null;
  courseDate: Date | null;
  contentClarity: number | null;
  objectivesAchieved: number | null;
  materialsHelpful: number | null;
  learningEnvironment: number | null;
  trainerKnowledge: number | null;
  trainerEngagement: number | null;
  knowledgeExposure: number | null;
  knowledgeApplication: number | null;
  durationSuitable: number | null;
  recommendCourse: number | null;
  likedMost: string | null;
  improvementSuggestion: string | null;
  additionalComments: string | null;
  recommendColleagues: boolean | null;
  referralDetails: string | null;
  futureTrainingTopics: string | null;
  inhouseTrainingNeeds: string | null;
  teamBuildingInterest: string | null;
  createdAt: Date;
}

interface FeedbackSummary {
  total: number;
  averages: {
    contentClarity: number | null;
    objectivesAchieved: number | null;
    materialsHelpful: number | null;
    learningEnvironment: number | null;
    trainerKnowledge: number | null;
    trainerEngagement: number | null;
    knowledgeExposure: number | null;
    knowledgeApplication: number | null;
    durationSuitable: number | null;
    recommendCourse: number | null;
  };
}

interface Trainer {
  id: string;
  fullName: string;
}

interface EventGroup {
  eventId: string;
  eventTitle: string;
  eventCode: string | null;
  eventDate: Date;
  trainer: { id: string; fullName: string } | null;
  feedbacks: Feedback[];
}

export const FeedbackAnalyticsPage: React.FC = () => {
  const [allFeedbacks, setAllFeedbacks] = useState<Feedback[]>([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState<Feedback[]>([]);
  const [summary, setSummary] = useState<FeedbackSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [filters, setFilters] = useState({
    eventCode: '',
    courseCode: '',
    trainerId: '',
    courseDate: '',
  });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      // Fetch all feedbacks for summary (no filters)
      const summaryResponse = await apiClient.getFeedbackAnalytics();
      setAllFeedbacks(summaryResponse.feedbacks);
      setSummary(summaryResponse.summary);

      // Fetch trainers for filter dropdown
      const trainersResponse = await apiClient.getTrainers();
      const trainersList = (trainersResponse.trainers || []).map((t: any) => ({
        id: t.id,
        fullName: t.fullName || '',
      }));
      setTrainers(trainersList);

      // Initially show all feedbacks in filtered list
      setFilteredFeedbacks(summaryResponse.feedbacks);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      showToast(error.message || 'Error fetching feedback analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredFeedbacks = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.eventCode) params.eventCode = filters.eventCode;
      if (filters.courseCode) params.courseCode = filters.courseCode;
      if (filters.trainerId) params.trainerId = filters.trainerId;
      if (filters.courseDate) params.courseDate = filters.courseDate;

      const response = await apiClient.getFeedbackAnalytics(params);
      setFilteredFeedbacks(response.feedbacks);
    } catch (error: any) {
      console.error('Error fetching filtered feedbacks:', error);
      showToast(error.message || 'Error fetching filtered feedbacks', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    fetchFilteredFeedbacks();
  };

  const clearFilters = () => {
    setFilters({ eventCode: '', courseCode: '', trainerId: '', courseDate: '' });
    setFilteredFeedbacks(allFeedbacks);
  };

  const formatRating = (rating: number | null) => {
    if (rating === null) return 'N/A';
    return rating.toFixed(2);
  };

  const calculateOverallRating = (feedback: Feedback): number => {
    const ratings = [
      feedback.contentClarity,
      feedback.objectivesAchieved,
      feedback.materialsHelpful,
      feedback.learningEnvironment,
      feedback.trainerKnowledge,
      feedback.trainerEngagement,
      feedback.knowledgeExposure,
      feedback.knowledgeApplication,
      feedback.durationSuitable,
      feedback.recommendCourse,
    ].filter((r): r is number => r !== null && r !== undefined);

    if (ratings.length === 0) return 0;
    return ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
  };

  const groupFeedbacksByEvent = (feedbacks: Feedback[]): EventGroup[] => {
    const grouped = new Map<string, EventGroup>();

    feedbacks.forEach((feedback) => {
      if (!feedback.event) return;

      const eventId = feedback.event.id;
      if (!grouped.has(eventId)) {
        grouped.set(eventId, {
          eventId,
          eventTitle: feedback.event.title,
          eventCode: feedback.event.eventCode,
          eventDate: feedback.event.eventDate,
          trainer: feedback.trainer,
          feedbacks: [],
        });
      }

      grouped.get(eventId)!.feedbacks.push(feedback);
    });

    return Array.from(grouped.values());
  };

  const calculateSectionAverage = (feedbacks: Feedback[], field: keyof Feedback): number | null => {
    const values = feedbacks
      .map((f) => f[field])
      .filter((v): v is number => typeof v === 'number' && v !== null);
    if (values.length === 0) return null;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  };

  const toggleRowExpansion = (feedbackId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(feedbackId)) {
        newSet.delete(feedbackId);
      } else {
        newSet.add(feedbackId);
      }
      return newSet;
    });
  };

  const eventGroups = groupFeedbacksByEvent(filteredFeedbacks);

  if (loading && allFeedbacks.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Feedback Analytics</h1>
          <p className="text-gray-600 mt-1">
            {summary?.total || 0} total feedback submission(s)
          </p>
        </div>
      </div>

      {/* Section 1: Summary of All Feedbacks */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Summary of All Feedbacks</h2>
        
        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Feedbacks</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{summary.total}</p>
                  </div>
                  <Users className="w-8 h-8 text-teal-600" />
                </div>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg. Overall Rating</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">
                      {summary.averages.recommendCourse
                        ? formatRating(summary.averages.recommendCourse)
                        : 'N/A'}
                    </p>
                  </div>
                  <Star className="w-8 h-8 text-yellow-500" />
                </div>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg. Trainer Rating</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">
                      {summary.averages.trainerKnowledge && summary.averages.trainerEngagement
                        ? formatRating(
                            (summary.averages.trainerKnowledge +
                              summary.averages.trainerEngagement) /
                              2
                          )
                        : 'N/A'}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-500" />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Average Ratings by Section */}
        {summary && summary.total > 0 && (
          <Card>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Average Ratings by Section</h3>
              
              {/* Section A - Course Quality */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-700 mb-3">Section A — Course Quality</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Content Clarity</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {formatRating(summary.averages.contentClarity)} / 5.00
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Objectives Achieved</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {formatRating(summary.averages.objectivesAchieved)} / 5.00
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Materials Helpful</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {formatRating(summary.averages.materialsHelpful)} / 5.00
                    </p>
                  </div>
                </div>
              </div>

              {/* Section B - Training Experience */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-700 mb-3">Section B — Training Experience</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Learning Environment</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {formatRating(summary.averages.learningEnvironment)} / 5.00
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Trainer Knowledge</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {formatRating(summary.averages.trainerKnowledge)} / 5.00
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Trainer Engagement</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {formatRating(summary.averages.trainerEngagement)} / 5.00
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Knowledge Exposure</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {formatRating(summary.averages.knowledgeExposure)} / 5.00
                    </p>
                  </div>
                </div>
              </div>

              {/* Section C - Duration & Impact */}
              <div>
                <h4 className="text-lg font-semibold text-gray-700 mb-3">Section C — Duration & Impact</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Knowledge Application</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {formatRating(summary.averages.knowledgeApplication)} / 5.00
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Duration Suitable</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {formatRating(summary.averages.durationSuitable)} / 5.00
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Recommend Course</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {formatRating(summary.averages.recommendCourse)} / 5.00
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Section 2: Event-Based Feedbacks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">Event-Based Feedbacks</h2>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Event-Based Feedback Filters</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Event Code"
                value={filters.eventCode}
                onChange={(e) => setFilters({ ...filters, eventCode: e.target.value })}
                placeholder="e.g., EVT-ABC123"
              />
              <Input
                label="Course Code"
                value={filters.courseCode}
                onChange={(e) => setFilters({ ...filters, courseCode: e.target.value })}
                placeholder="e.g., CRS-001"
              />
              <Select
                label="Trainer"
                value={filters.trainerId}
                onChange={(e) => setFilters({ ...filters, trainerId: e.target.value })}
                options={[
                  { value: '', label: 'All Trainers' },
                  ...trainers.map((t) => ({ value: t.id, label: t.fullName })),
                ]}
              />
              <Input
                label="Course Date"
                type="date"
                value={filters.courseDate}
                onChange={(e) => setFilters({ ...filters, courseDate: e.target.value })}
              />
            </div>
            <div className="flex justify-end space-x-3 mt-4">
              <Button variant="secondary" onClick={clearFilters}>
                Clear
              </Button>
              <Button variant="primary" onClick={handleApplyFilters}>
                Apply Filters
              </Button>
            </div>
          </div>
        </Card>

        {/* Event Groups */}
        {eventGroups.length === 0 ? (
          <Card>
            <div className="p-6 text-center py-12 text-gray-500">
              No event-based feedbacks found. Try adjusting your filters.
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {eventGroups.map((group) => {
              const sectionAAvg = {
                contentClarity: calculateSectionAverage(group.feedbacks, 'contentClarity'),
                objectivesAchieved: calculateSectionAverage(group.feedbacks, 'objectivesAchieved'),
                materialsHelpful: calculateSectionAverage(group.feedbacks, 'materialsHelpful'),
              };

              const sectionBAvg = {
                learningEnvironment: calculateSectionAverage(group.feedbacks, 'learningEnvironment'),
                trainerKnowledge: calculateSectionAverage(group.feedbacks, 'trainerKnowledge'),
                trainerEngagement: calculateSectionAverage(group.feedbacks, 'trainerEngagement'),
                knowledgeExposure: calculateSectionAverage(group.feedbacks, 'knowledgeExposure'),
              };

              const sectionCAvg = {
                knowledgeApplication: calculateSectionAverage(group.feedbacks, 'knowledgeApplication'),
                durationSuitable: calculateSectionAverage(group.feedbacks, 'durationSuitable'),
                recommendCourse: calculateSectionAverage(group.feedbacks, 'recommendCourse'),
              };

              const sectionDResponses = {
                likedMost: group.feedbacks.filter((f) => f.likedMost).map((f) => f.likedMost),
                improvementSuggestion: group.feedbacks
                  .filter((f) => f.improvementSuggestion)
                  .map((f) => f.improvementSuggestion),
                additionalComments: group.feedbacks
                  .filter((f) => f.additionalComments)
                  .map((f) => f.additionalComments),
              };

              const sectionEResponses = {
                recommendColleagues: {
                  yes: group.feedbacks.filter((f) => f.recommendColleagues === true).length,
                  no: group.feedbacks.filter((f) => f.recommendColleagues === false).length,
                },
                referralDetails: group.feedbacks
                  .filter((f) => f.referralDetails)
                  .map((f) => f.referralDetails),
                futureTrainingTopics: group.feedbacks
                  .filter((f) => f.futureTrainingTopics)
                  .map((f) => f.futureTrainingTopics),
                inhouseTrainingNeeds: group.feedbacks
                  .filter((f) => f.inhouseTrainingNeeds)
                  .map((f) => f.inhouseTrainingNeeds),
                teamBuildingInterest: group.feedbacks
                  .filter((f) => f.teamBuildingInterest)
                  .map((f) => f.teamBuildingInterest),
              };

              return (
                <Card key={group.eventId}>
                  <div className="p-6">
                    {/* Event Header */}
                    <div className="mb-6 pb-4 border-b">
                      <h3 className="text-xl font-semibold text-gray-800">
                        {group.eventTitle}
                      </h3>
                      <div className="mt-2 text-sm text-gray-600 space-y-1">
                        {group.eventCode && <p>Event Code: {group.eventCode}</p>}
                        <p>Date: {formatDate(group.eventDate.toString())}</p>
                        {group.trainer && <p>Trainer: {group.trainer.fullName}</p>}
                        <p>Total Feedbacks: {group.feedbacks.length}</p>
                      </div>
                    </div>

                    {/* Feedback Summary - Sections A, B, C */}
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-gray-700 mb-4">Feedback Summary</h4>
                      
                      {/* Section A */}
                      <div className="mb-4">
                        <h5 className="font-semibold text-gray-700 mb-2">Section A — Course Quality</h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-4">
                          <div>
                            <p className="text-sm text-gray-600">Content Clarity</p>
                            <p className="text-base font-semibold text-gray-800">
                              {formatRating(sectionAAvg.contentClarity)} / 5.00
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Objectives Achieved</p>
                            <p className="text-base font-semibold text-gray-800">
                              {formatRating(sectionAAvg.objectivesAchieved)} / 5.00
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Materials Helpful</p>
                            <p className="text-base font-semibold text-gray-800">
                              {formatRating(sectionAAvg.materialsHelpful)} / 5.00
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Section B */}
                      <div className="mb-4">
                        <h5 className="font-semibold text-gray-700 mb-2">Section B — Training Experience</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ml-4">
                          <div>
                            <p className="text-sm text-gray-600">Learning Environment</p>
                            <p className="text-base font-semibold text-gray-800">
                              {formatRating(sectionBAvg.learningEnvironment)} / 5.00
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Trainer Knowledge</p>
                            <p className="text-base font-semibold text-gray-800">
                              {formatRating(sectionBAvg.trainerKnowledge)} / 5.00
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Trainer Engagement</p>
                            <p className="text-base font-semibold text-gray-800">
                              {formatRating(sectionBAvg.trainerEngagement)} / 5.00
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Knowledge Exposure</p>
                            <p className="text-base font-semibold text-gray-800">
                              {formatRating(sectionBAvg.knowledgeExposure)} / 5.00
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Section C */}
                      <div className="mb-4">
                        <h5 className="font-semibold text-gray-700 mb-2">Section C — Duration & Impact</h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-4">
                          <div>
                            <p className="text-sm text-gray-600">Knowledge Application</p>
                            <p className="text-base font-semibold text-gray-800">
                              {formatRating(sectionCAvg.knowledgeApplication)} / 5.00
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Duration Suitable</p>
                            <p className="text-base font-semibold text-gray-800">
                              {formatRating(sectionCAvg.durationSuitable)} / 5.00
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Recommend Course</p>
                            <p className="text-base font-semibold text-gray-800">
                              {formatRating(sectionCAvg.recommendCourse)} / 5.00
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section D - Comments */}
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-gray-700 mb-4">Section D — Comments</h4>
                      
                      {sectionDResponses.likedMost.length > 0 && (
                        <div className="mb-4">
                          <h5 className="font-medium text-gray-700 mb-2">What did you like most about the course?</h5>
                          <div className="ml-4 space-y-2">
                            {sectionDResponses.likedMost.map((response, idx) => (
                              <p key={idx} className="text-sm text-gray-600 border-l-2 border-teal-500 pl-3">
                                {response}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {sectionDResponses.improvementSuggestion.length > 0 && (
                        <div className="mb-4">
                          <h5 className="font-medium text-gray-700 mb-2">If you could change one thing about this course, what would it be?</h5>
                          <div className="ml-4 space-y-2">
                            {sectionDResponses.improvementSuggestion.map((response, idx) => (
                              <p key={idx} className="text-sm text-gray-600 border-l-2 border-teal-500 pl-3">
                                {response}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {sectionDResponses.additionalComments.length > 0 && (
                        <div className="mb-4">
                          <h5 className="font-medium text-gray-700 mb-2">Any additional comments or suggestions</h5>
                          <div className="ml-4 space-y-2">
                            {sectionDResponses.additionalComments.map((response, idx) => (
                              <p key={idx} className="text-sm text-gray-600 border-l-2 border-teal-500 pl-3">
                                {response}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Section E - Referrals & Future Training */}
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-gray-700 mb-4">Section E — Referrals & Future Training</h4>
                      
                      <div className="mb-4">
                        <h5 className="font-medium text-gray-700 mb-2">Would you recommend your colleagues to attend our training programs?</h5>
                        <div className="ml-4">
                          <p className="text-sm text-gray-600">
                            Yes: {sectionEResponses.recommendColleagues.yes} | No: {sectionEResponses.recommendColleagues.no}
                          </p>
                        </div>
                      </div>

                      {sectionEResponses.referralDetails.length > 0 && (
                        <div className="mb-4">
                          <h5 className="font-medium text-gray-700 mb-2">Referral Details</h5>
                          <div className="ml-4 space-y-2">
                            {sectionEResponses.referralDetails.map((response, idx) => (
                              <p key={idx} className="text-sm text-gray-600 border-l-2 border-teal-500 pl-3">
                                {response}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {sectionEResponses.futureTrainingTopics.length > 0 && (
                        <div className="mb-4">
                          <h5 className="font-medium text-gray-700 mb-2">Training topics you want in the future</h5>
                          <div className="ml-4 space-y-2">
                            {sectionEResponses.futureTrainingTopics.map((response, idx) => (
                              <p key={idx} className="text-sm text-gray-600 border-l-2 border-teal-500 pl-3">
                                {response}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {sectionEResponses.inhouseTrainingNeeds.length > 0 && (
                        <div className="mb-4">
                          <h5 className="font-medium text-gray-700 mb-2">In-house training needs</h5>
                          <div className="ml-4 space-y-2">
                            {sectionEResponses.inhouseTrainingNeeds.map((response, idx) => (
                              <p key={idx} className="text-sm text-gray-600 border-l-2 border-teal-500 pl-3">
                                {response}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {sectionEResponses.teamBuildingInterest.length > 0 && (
                        <div className="mb-4">
                          <h5 className="font-medium text-gray-700 mb-2">Team-building session interest details</h5>
                          <div className="ml-4 space-y-2">
                            {sectionEResponses.teamBuildingInterest.map((response, idx) => (
                              <p key={idx} className="text-sm text-gray-600 border-l-2 border-teal-500 pl-3">
                                {response}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Individual Responses Table */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-700 mb-4">Individual Responses</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-50 border-b">
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Participant</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Overall Rating</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submission Date</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.feedbacks.map((feedback) => {
                              const isExpanded = expandedRows.has(feedback.id);
                              const overallRating = calculateOverallRating(feedback);

                              return (
                                <React.Fragment key={feedback.id}>
                                  <tr
                                    className="border-b hover:bg-gray-50 cursor-pointer"
                                    onClick={() => toggleRowExpansion(feedback.id)}
                                  >
                                    <td className="px-4 py-3 text-sm text-gray-900">
                                      {feedback.participantName || 'Anonymous'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700">
                                      {formatRating(overallRating)} / 5.00
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                      {formatDate(feedback.createdAt.toString())}
                                    </td>
                                    <td className="px-4 py-3">
                                      {isExpanded ? (
                                        <ChevronUp className="w-5 h-5 text-gray-500" />
                                      ) : (
                                        <ChevronDown className="w-5 h-5 text-gray-500" />
                                      )}
                                    </td>
                                  </tr>
                                  {isExpanded && (
                                    <tr>
                                      <td colSpan={4} className="px-4 py-4 bg-gray-50">
                                        <div className="space-y-4">
                                          {/* Basic Information */}
                                          <div>
                                            <h6 className="font-semibold text-gray-700 mb-2">Basic Information</h6>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 ml-4">
                                              {feedback.trainer && (
                                                <p>Trainer: {feedback.trainer.fullName}</p>
                                              )}
                                              {feedback.course?.title && (
                                                <p>Course: {feedback.course.title}</p>
                                              )}
                                              {feedback.courseName && (
                                                <p>Course Name: {feedback.courseName}</p>
                                              )}
                                              {feedback.event?.title && (
                                                <p>Event: {feedback.event.title}</p>
                                              )}
                                              {feedback.courseDate && (
                                                <p>Course Date: {formatDate(feedback.courseDate.toString())}</p>
                                              )}
                                              {feedback.courseDuration && (
                                                <p>Course Duration: {feedback.courseDuration}</p>
                                              )}
                                              {feedback.attendance && (
                                                <p>Attendance: {feedback.attendance}</p>
                                              )}
                                            </div>
                                          </div>

                                          {/* Section A Ratings */}
                                          <div>
                                            <h6 className="font-semibold text-gray-700 mb-2">Section A — Course Quality</h6>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600 ml-4">
                                              <p>Content Clarity: {formatRating(feedback.contentClarity)} / 5</p>
                                              <p>Objectives Achieved: {formatRating(feedback.objectivesAchieved)} / 5</p>
                                              <p>Materials Helpful: {formatRating(feedback.materialsHelpful)} / 5</p>
                                            </div>
                                          </div>

                                          {/* Section B Ratings */}
                                          <div>
                                            <h6 className="font-semibold text-gray-700 mb-2">Section B — Training Experience</h6>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-gray-600 ml-4">
                                              <p>Learning Environment: {formatRating(feedback.learningEnvironment)} / 5</p>
                                              <p>Trainer Knowledge: {formatRating(feedback.trainerKnowledge)} / 5</p>
                                              <p>Trainer Engagement: {formatRating(feedback.trainerEngagement)} / 5</p>
                                              <p>Knowledge Exposure: {formatRating(feedback.knowledgeExposure)} / 5</p>
                                            </div>
                                          </div>

                                          {/* Section C Ratings */}
                                          <div>
                                            <h6 className="font-semibold text-gray-700 mb-2">Section C — Duration & Impact</h6>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600 ml-4">
                                              <p>Knowledge Application: {formatRating(feedback.knowledgeApplication)} / 5</p>
                                              <p>Duration Suitable: {formatRating(feedback.durationSuitable)} / 5</p>
                                              <p>Recommend Course: {formatRating(feedback.recommendCourse)} / 5</p>
                                            </div>
                                          </div>

                                          {/* Section D Comments */}
                                          <div>
                                            <h6 className="font-semibold text-gray-700 mb-2">Section D — Comments</h6>
                                            <div className="space-y-2 text-sm text-gray-600 ml-4">
                                              {feedback.likedMost && (
                                                <div>
                                                  <p className="font-medium">Liked Most:</p>
                                                  <p className="ml-2">{feedback.likedMost}</p>
                                                </div>
                                              )}
                                              {feedback.improvementSuggestion && (
                                                <div>
                                                  <p className="font-medium">Improvement Suggestion:</p>
                                                  <p className="ml-2">{feedback.improvementSuggestion}</p>
                                                </div>
                                              )}
                                              {feedback.additionalComments && (
                                                <div>
                                                  <p className="font-medium">Additional Comments:</p>
                                                  <p className="ml-2">{feedback.additionalComments}</p>
                                                </div>
                                              )}
                                            </div>
                                          </div>

                                          {/* Section E Responses */}
                                          <div>
                                            <h6 className="font-semibold text-gray-700 mb-2">Section E — Referrals & Future Training</h6>
                                            <div className="space-y-2 text-sm text-gray-600 ml-4">
                                              <p>Recommend Colleagues: {feedback.recommendColleagues ? 'Yes' : 'No'}</p>
                                              {feedback.referralDetails && (
                                                <div>
                                                  <p className="font-medium">Referral Details:</p>
                                                  <p className="ml-2">{feedback.referralDetails}</p>
                                                </div>
                                              )}
                                              {feedback.futureTrainingTopics && (
                                                <div>
                                                  <p className="font-medium">Future Training Topics:</p>
                                                  <p className="ml-2">{feedback.futureTrainingTopics}</p>
                                                </div>
                                              )}
                                              {feedback.inhouseTrainingNeeds && (
                                                <div>
                                                  <p className="font-medium">In-House Training Needs:</p>
                                                  <p className="ml-2">{feedback.inhouseTrainingNeeds}</p>
                                                </div>
                                              )}
                                              {feedback.teamBuildingInterest && (
                                                <div>
                                                  <p className="font-medium">Team Building Interest:</p>
                                                  <p className="ml-2">{feedback.teamBuildingInterest}</p>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
