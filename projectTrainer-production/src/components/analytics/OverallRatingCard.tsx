import { Star } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';

interface OverallRatingCardProps {
  rating: number;
}

export function OverallRatingCard({ rating }: OverallRatingCardProps) {
  const getTheme = (rating: number) => {
    if (rating >= 4.5) return {
      text: 'text-accent-500',
      bg: 'bg-accent-50/50',
      border: 'border-accent-200',
      glow: 'shadow-accent-100/50'
    };
    if (rating >= 4) return {
      text: 'text-emerald-500',
      bg: 'bg-emerald-50/50',
      border: 'border-emerald-200',
      glow: 'shadow-emerald-100/50'
    };
    if (rating >= 3) return {
      text: 'text-mustard-500',
      bg: 'bg-mustard-50/50',
      border: 'border-mustard-200',
      glow: 'shadow-mustard-100/50'
    };
    return {
      text: 'text-red-500',
      bg: 'bg-red-50/50',
      border: 'border-red-200',
      glow: 'shadow-red-100/50'
    };
  };

  const theme = getTheme(rating);

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className={`w-10 h-10 fill-current animate-pulse-slow ${theme.text}`} />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative w-10 h-10">
            <Star className="w-10 h-10 text-corporate-100" />
            <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
              <Star className={`w-10 h-10 fill-current ${theme.text}`} />
            </div>
          </div>
        );
      } else {
        stars.push(
          <Star key={i} className="w-10 h-10 text-corporate-100" />
        );
      }
    }
    return stars;
  };

  return (
    <Card className={`relative overflow-hidden border-2 transition-all duration-500 ${theme.border} ${theme.bg} shadow-modern-lg animate-scale-in`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/20 to-transparent -mr-16 -mt-16 rounded-full blur-3xl" />

      <CardHeader className="border-b border-corporate-100/50 pb-4">
        <h2 className="text-xs font-bold text-corporate-400 uppercase tracking-[0.2em]">Overall Performance Index</h2>
      </CardHeader>

      <CardContent className="pt-8">
        <div className="flex flex-col items-center py-4">
          <div className="relative group">
            <div className={`absolute inset-0 blur-2xl opacity-20 transition-all duration-500 group-hover:opacity-40 rounded-full ${theme.bg}`} />
            <div className={`relative text-8xl font-black mb-6 tracking-tighter ${theme.text} drop-shadow-sm`}>
              {rating.toFixed(1)}
              <span className="text-2xl text-corporate-300 ml-1 font-medium">/ 5.0</span>
            </div>
          </div>

          <div className="flex gap-2 mb-8 scale-110">
            {renderStars(rating)}
          </div>

          <div className="max-w-xs text-center">
            <p className="text-sm text-corporate-500 font-medium leading-relaxed">
              Synthesized performance metric derived from aggregate participant feedback vectors.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
