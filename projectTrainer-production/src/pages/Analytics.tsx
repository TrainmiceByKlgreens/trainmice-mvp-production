import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTrainerAnalytics } from '../hooks/useTrainerAnalytics';
import { useRealtime } from '../hooks/useRealtime';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { AnalyticsFilters } from '../components/analytics/AnalyticsFilters';
import { OverallRatingCard } from '../components/analytics/OverallRatingCard';
import { InsightSummaryCard } from '../components/analytics/InsightSummaryCard';
import { RatingBreakdownCard } from '../components/analytics/RatingBreakdownCard';
import { ParticipationStatsCard } from '../components/analytics/ParticipationStatsCard';
import { HistoricalTrendChart } from '../components/analytics/HistoricalTrendChart';
import { StrengthsWeaknessesCard } from '../components/analytics/StrengthsWeaknessesCard';
import { AlertCircle, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';

export function Analytics() {
  const { user } = useAuth();
  const [courseFilter, setCourseFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string | null>(null);

  const { analytics, loading, error, refetch } = useTrainerAnalytics(user?.id, {
    courseId: courseFilter,
    courseDate: dateFilter
  });

  useRealtime((payload) => {
    const relevantTables = ['course_feedback', 'bookings', 'events'];
    if (relevantTables.includes(payload.table)) {
      console.log('📈 Trainer Analytics: Real-time update for table:', payload.table);
      refetch();
    }
  });

  const handleFilterChange = (courseId: string | null, courseDate: string | null) => {
    setCourseFilter(courseId);
    setDateFilter(courseDate);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-10 animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold text-corporate-900 tracking-tight">Analytics</h1>
          <p className="text-corporate-500 mt-2 text-lg font-medium tracking-tight">System performance metrics and insight vectors.</p>
        </div>
        <Card className="border-red-100 bg-red-50/50 shadow-none">
          <CardContent>
            <div className="flex items-center gap-4 py-6">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              </div>
              <div>
                <h3 className="font-bold text-red-900 uppercase tracking-widest text-xs">Analysis Failure</h3>
                <p className="text-sm text-red-700 mt-1 font-medium">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analytics || analytics.participation_metrics.total_participants === 0) {
    return (
      <div className="space-y-10 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-corporate-900 tracking-tight">Analytics</h1>
            <p className="text-corporate-500 mt-2 text-lg font-medium tracking-tight">System performance metrics and insight vectors.</p>
          </div>
          {user?.id && (
            <div className="glass-morphism p-1 rounded-2xl shadow-modern-sm">
              <AnalyticsFilters
                trainerId={user.id}
                appliedCourseId={courseFilter}
                appliedDate={dateFilter}
                onFilterChange={handleFilterChange}
              />
            </div>
          )}
        </div>

        <Card className="bg-white/50 border-dashed border-2 border-corporate-200 shadow-none">
          <CardContent>
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="w-24 h-24 bg-corporate-50 rounded-3xl flex items-center justify-center mb-8 shadow-modern-sm">
                <BarChart3 className="w-12 h-12 text-corporate-300" />
              </div>
              <h3 className="text-xl font-bold text-corporate-900 mb-3">Insufficient Data Vectors</h3>
              <p className="text-corporate-500 text-center max-w-md font-medium leading-relaxed">
                {courseFilter || dateFilter
                  ? 'No feedback data discovered for the current filter parameters. Re-configure filtering criteria to continue.'
                  : 'Predictive analytics and performance metrics will populate here upon initial feedback acquisition from course participants.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-corporate-900 tracking-tight">Analytics</h1>
          <p className="text-corporate-500 mt-2 text-lg font-medium tracking-tight">Track performance metrics and insights from course feedback</p>
        </div>
        {user?.id && (
          <div className="glass-morphism p-1 rounded-2xl shadow-modern-sm">
            <AnalyticsFilters
              trainerId={user.id}
              appliedCourseId={courseFilter}
              appliedDate={dateFilter}
              onFilterChange={handleFilterChange}
            />
          </div>
        )}
      </div>

      <OverallRatingCard rating={analytics.overall_star_rating} />

      <InsightSummaryCard summary={analytics.insight_summary} />

      <ParticipationStatsCard metrics={analytics.participation_metrics} />

      <RatingBreakdownCard ratings={analytics.rating_breakdown} />

      <HistoricalTrendChart events={analytics.events_last_6_months} />

      <StrengthsWeaknessesCard
        strengths={analytics.strengths}
        improvementAreas={analytics.improvement_areas}
      />
    </div>
  );
}
