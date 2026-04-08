import { Card, CardContent, CardHeader } from '../ui/Card';
import { MonthlyEvent } from '../../types/database';

interface HistoricalTrendChartProps {
  events: MonthlyEvent[];
}

export function HistoricalTrendChart({ events }: HistoricalTrendChartProps) {
  const maxCount = Math.max(...events.map(e => e.count), 1);

  return (
    <Card className="shadow-modern-lg border-corporate-100 bg-white/50 backdrop-blur-sm animate-fade-in delay-100">
      <CardHeader className="border-b border-corporate-100/50">
        <div>
          <h2 className="text-xs font-bold text-corporate-400 uppercase tracking-[0.2em]">Operational Momentum</h2>
          <p className="text-xs text-corporate-300 mt-1 font-medium italic">Temporal distribution of session delivery over 180 days</p>
        </div>
      </CardHeader>
      <CardContent className="pt-12">
        <div className="h-72 flex items-end justify-around gap-4 px-2">
          {events.map((event, index) => {
            const heightPercentage = maxCount > 0 ? (event.count / maxCount) * 100 : 0;
            return (
              <div key={event.month} className="flex-1 flex flex-col items-center gap-4 group h-full justify-end">
                <div className="w-full flex-1 flex flex-col items-center justify-end">
                  <div
                    className="w-full relative flex flex-col items-center group/bar"
                    style={{ height: heightPercentage > 0 ? `${Math.max(heightPercentage, 5)}%` : '4px' }}
                  >
                    {/* Value Badge */}
                    <div className="absolute -top-10 opacity-0 group-hover/bar:opacity-100 transition-all duration-300 transform translate-y-2 group-hover/bar:translate-y-0">
                      <div className="bg-corporate-900 text-white text-[10px] font-bold py-1 px-2 rounded-md shadow-lg border border-corporate-700">
                        {event.count} SES
                      </div>
                      <div className="w-1.5 h-1.5 bg-corporate-900 rotate-45 mx-auto -mt-1 border-r border-b border-corporate-700" />
                    </div>

                    {/* Bar Segment */}
                    <div className={`
                      w-full bg-gradient-to-t from-accent-600 to-accent-400 rounded-2xl transition-all duration-500 
                      shadow-[0_0_15px_-3px_rgba(6,182,212,0.2)] group-hover/bar:shadow-[0_0_20px_2px_rgba(6,182,212,0.4)]
                      group-hover/bar:from-accent-500 group-hover/bar:to-accent-300
                      ${event.count === 0 ? 'opacity-20 bg-corporate-200 from-corporate-300 to-corporate-200 h-1' : ''}
                    `}
                      style={{
                        height: '100%',
                        animation: `bar-grow 1s ease-out forwards ${index * 0.1}s`,
                        opacity: 0
                      }}
                    />

                    {/* Inner Glow Detail */}
                    {event.count > 0 && (
                      <div className="absolute top-1 left-1.5 right-1.5 h-1.5 bg-white/40 rounded-full blur-[1px]" />
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <span className={`text-[10px] font-bold tracking-widest uppercase transition-colors duration-300 ${event.count > 0 ? 'text-corporate-600' : 'text-corporate-300'}`}>
                    {event.month}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
