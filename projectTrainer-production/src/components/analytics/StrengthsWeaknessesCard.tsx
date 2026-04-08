import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';

interface StrengthsWeaknessesCardProps {
  strengths: string[];
  improvementAreas: string[];
}

const QUESTION_LABELS: Record<string, string> = {
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

export function StrengthsWeaknessesCard({ strengths, improvementAreas }: StrengthsWeaknessesCardProps) {
  return (
    <Card className="shadow-modern-lg border-corporate-100 bg-white/50 backdrop-blur-sm animate-fade-in delay-200">
      <CardHeader className="border-b border-corporate-100/50">
        <h2 className="text-xs font-bold text-corporate-400 uppercase tracking-[0.2em]">Competency Vectors</h2>
      </CardHeader>
      <CardContent className="pt-8 px-6 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Strengths Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-accent-50 rounded-xl shadow-modern-sm">
                <TrendingUp className="w-5 h-5 text-accent-500" />
              </div>
              <div>
                <h3 className="text-sm font-black text-corporate-900 uppercase tracking-wider">Top Proficiency Nodes</h3>
                <p className="text-[10px] text-accent-600 font-bold uppercase tracking-widest mt-0.5">Primary Momentum</p>
              </div>
            </div>

            <div className="space-y-3">
              {strengths.map((strength, index) => (
                <div
                  key={index}
                  className="group flex items-center gap-4 p-4 bg-white border border-corporate-100 rounded-2xl shadow-modern-sm hover:border-accent-200 transition-all duration-300 hover:shadow-modern-md hover:-translate-x-1"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-accent-500 text-white rounded-xl flex items-center justify-center text-xs font-black shadow-lg shadow-accent-200/50 transform group-hover:rotate-12 transition-transform">
                    {index + 1}
                  </div>
                  <span className="text-sm font-bold text-corporate-700 tracking-tight">
                    {QUESTION_LABELS[strength] || strength}
                  </span>
                </div>
              ))}
              {strengths.length === 0 && (
                <div className="p-8 border-2 border-dashed border-corporate-100 rounded-3xl flex flex-col items-center justify-center text-center opacity-40">
                  <TrendingUp className="w-8 h-8 text-corporate-300 mb-2" />
                  <p className="text-xs font-bold text-corporate-400 uppercase">Awaiting Strength Matrix</p>
                </div>
              )}
            </div>
          </div>

          {/* Improvement Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-mustard-50 rounded-xl shadow-modern-sm">
                <TrendingDown className="w-5 h-5 text-mustard-500" />
              </div>
              <div>
                <h3 className="text-sm font-black text-corporate-900 uppercase tracking-wider">Optimization Areas</h3>
                <p className="text-[10px] text-mustard-600 font-bold uppercase tracking-widest mt-0.5">Critical Insight Vectors</p>
              </div>
            </div>

            <div className="space-y-3">
              {improvementAreas.map((area, index) => (
                <div
                  key={index}
                  className="group flex items-center gap-4 p-4 bg-white border border-corporate-100 rounded-2xl shadow-modern-sm hover:border-mustard-200 transition-all duration-300 hover:shadow-modern-md hover:translate-x-1"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-mustard-500 text-white rounded-xl flex items-center justify-center text-xs font-black shadow-lg shadow-mustard-200/50 transform group-hover:-rotate-12 transition-transform">
                    {index + 1}
                  </div>
                  <span className="text-sm font-bold text-corporate-700 tracking-tight">
                    {QUESTION_LABELS[area] || area}
                  </span>
                </div>
              ))}
              {improvementAreas.length === 0 && (
                <div className="p-8 border-2 border-dashed border-corporate-100 rounded-3xl flex flex-col items-center justify-center text-center opacity-40">
                  <TrendingDown className="w-8 h-8 text-corporate-300 mb-2" />
                  <p className="text-xs font-bold text-corporate-400 uppercase">System Peak Efficiency</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
