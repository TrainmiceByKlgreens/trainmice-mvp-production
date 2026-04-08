import { ThumbsUp, AlertCircle, Smile } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { SentimentInsights } from '../../types/database';

interface SentimentAnalysisCardProps {
  insights: SentimentInsights;
}

export function SentimentAnalysisCard({ insights }: SentimentAnalysisCardProps) {
  const getSentimentIcon = () => {
    switch (insights.sentiment_category) {
      case 'Positive':
        return <Smile className="w-6 h-6 text-green-600" />;
      case 'Neutral':
        return <AlertCircle className="w-6 h-6 text-yellow-600" />;
      case 'Negative':
        return <AlertCircle className="w-6 h-6 text-red-600" />;
    }
  };

  const getSentimentColor = () => {
    switch (insights.sentiment_category) {
      case 'Positive':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'Neutral':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'Negative':
        return 'bg-red-50 text-red-700 border-red-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-gray-900">Sentiment Analysis</h2>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className={`flex items-center gap-2 p-3 rounded-lg border ${getSentimentColor()}`}>
            {getSentimentIcon()}
            <span className="font-semibold">Overall Sentiment: {insights.sentiment_category}</span>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <ThumbsUp className="w-4 h-4 text-green-600" />
              <h3 className="text-sm font-semibold text-gray-900">Top Positive Words</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {insights.top_positive_words.length > 0 ? (
                insights.top_positive_words.map((word, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                  >
                    {word}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-500">No data available</span>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              <h3 className="text-sm font-semibold text-gray-900">Top Improvement Areas</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {insights.top_improvement_words.length > 0 ? (
                insights.top_improvement_words.map((word, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium"
                  >
                    {word}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-500">No data available</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
