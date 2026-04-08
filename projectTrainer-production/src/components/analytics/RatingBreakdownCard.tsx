import { Card, CardContent, CardHeader } from '../ui/Card';
import { RatingBreakdown } from '../../types/database';

interface RatingBreakdownCardProps {
  ratings: RatingBreakdown;
}

const QUESTION_LABELS: Record<keyof RatingBreakdown, string> = {
  q_content_clarity: 'Content Clarity',
  q_objectives_achieved: 'Objectives Achieved',
  q_materials_helpful: 'Materials Helpful',
  q_environment_learning: 'Learning Environment',
  q_trainer_knowledge: 'Trainer Knowledge',
  q_engagement: 'Engagement Level',
  q_new_knowledge: 'New Knowledge Gained',
  q_application_understanding: 'Practical Application',
  q_recommend_course: 'Course Recommendation'
};

export function RatingBreakdownCard({ ratings }: RatingBreakdownCardProps) {
  const getBarColor = (rating: number) => {
    if (rating >= 4) return 'bg-green-500';
    if (rating >= 3) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-gray-900">Rating Breakdown</h2>
        <p className="text-sm text-gray-600">Performance across all criteria</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(ratings).map(([key, value]) => (
            <div key={key}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">
                  {QUESTION_LABELS[key as keyof RatingBreakdown]}
                </span>
                <span className="text-sm font-bold text-gray-900">{value.toFixed(1)}/5.0</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all duration-300 ${getBarColor(value)}`}
                  style={{ width: `${(value / 5) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
