import { Users, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { ParticipationMetrics } from '../../types/database';

interface ParticipationStatsCardProps {
  metrics: ParticipationMetrics;
}

export function ParticipationStatsCard({ metrics }: ParticipationStatsCardProps) {
  const stats = [
    {
      label: 'TOTAL PARTICIPANTS',
      value: metrics.total_participants,
      icon: Users,
      color: 'text-accent-500',
      bg: 'bg-accent-50',
      description: 'Engaged learners'
    },
    {
      label: 'TOTAL SESSIONS',
      value: metrics.total_sessions,
      icon: Calendar,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
      description: 'Operational volume'
    }
  ];

  return (
    <Card className="shadow-modern-lg border-corporate-100 bg-white/50 backdrop-blur-sm animate-slide-in-right">
      <CardHeader className="border-b border-corporate-100/50">
        <h2 className="text-xs font-bold text-corporate-400 uppercase tracking-[0.2em]">Participation Metrics</h2>
      </CardHeader>
      <CardContent className="pt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="group relative flex items-center gap-6 p-6 rounded-3xl border border-corporate-100 bg-white shadow-modern-sm transition-all duration-300 hover:shadow-modern-md hover:-translate-y-1 hover:border-corporate-200"
              >
                <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} transition-transform duration-300 group-hover:scale-110`}>
                  <Icon className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-corporate-900 tracking-tighter">
                      {stat.value.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-corporate-400 uppercase tracking-widest mt-1">
                    {stat.label}
                  </p>
                  <p className="text-xs text-corporate-300 font-medium mt-0.5">
                    {stat.description}
                  </p>
                </div>

                {/* Decorative element */}
                <div className="absolute top-4 right-4 text-corporate-50 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <Icon className="w-16 h-16" />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
