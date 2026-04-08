import { Lightbulb } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';

interface InsightSummaryCardProps {
  summary: string;
}

export function InsightSummaryCard({ summary }: InsightSummaryCardProps) {
  return (
    <Card className="relative overflow-hidden border-2 border-accent-200 bg-accent-50/30 glass-morphism shadow-modern-lg animate-scale-in delay-75">
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-accent-100/50 rounded-full blur-2xl" />
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-6 py-4">
          <div className="flex-shrink-0">
            <div className="p-4 bg-accent-500 rounded-2xl shadow-lg shadow-accent-200/50 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
              <Lightbulb className="w-8 h-8 text-white animate-pulse-slow" />
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black text-accent-700 uppercase tracking-widest">Key Strategic Insights</h3>
              <div className="h-1 w-12 bg-accent-200 rounded-full" />
            </div>
            <p className="text-corporate-700 text-sm font-semibold leading-relaxed tracking-tight italic">
              "{summary}"
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
