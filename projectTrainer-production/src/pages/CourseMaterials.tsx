import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Download, User, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Course, CourseMaterial } from '../types/database';
import { fetchCourseById, fetchCourseMaterials } from '../lib/courseService';

export function CourseMaterials() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId) {
      fetchCourseAndMaterials();
    }
  }, [courseId]);

  const fetchCourseAndMaterials = async () => {
    try {
      const [courseResult, materialsResult] = await Promise.all([
        fetchCourseById(courseId!),
        fetchCourseMaterials(courseId!),
      ]);

      if (courseResult) {
        setCourse(courseResult as Course);
      }

      if (materialsResult) {
        setMaterials(materialsResult as CourseMaterial[]);
      }
    } catch (error) {
      console.error('Error fetching course materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Course not found</p>
          <Button onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const courseTypes = Array.isArray(course.course_type)
    ? course.course_type
    : (course.course_type ? [course.course_type] : []);

  return (
    <div className="space-y-10 max-w-6xl mx-auto animate-fade-in mb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="animate-slide-in-right">
          <h1 className="text-4xl font-bold text-corporate-900 tracking-tight">Resource Center</h1>
          <p className="text-corporate-500 mt-2 text-lg font-medium tracking-tight">Repository of instructional assets and operational materials.</p>
        </div>
        <Button
          onClick={() => navigate('/dashboard')}
          variant="outline"
          className="bg-white/80 backdrop-blur-md border-corporate-100 hover:bg-corporate-50 rounded-xl h-12"
        >
          <ArrowLeft className="w-4 h-4 mr-2 text-accent-600" />
          Hub Alpha
        </Button>
      </div>

      <Card className="overflow-hidden border-none shadow-modern-lg">
        <div className="h-2 bg-gradient-to-r from-accent-500 via-corporate-900 to-accent-600" />
        <CardHeader className="pt-10 pb-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-1.5 h-6 bg-accent-500 rounded-full" />
                <p className="text-[10px] text-corporate-400 font-bold uppercase tracking-[0.2em]">Course Specification</p>
              </div>
              <h2 className="text-3xl font-bold text-corporate-900 tracking-tight mb-4">{course.title}</h2>
              {course.description && (
                <p className="text-corporate-500 font-medium leading-relaxed max-w-3xl">{course.description}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {courseTypes.length > 0 ? (
                courseTypes.map((type: string, index: number) => (
                  <span key={index} className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg border ${type === 'In-House' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                    type === 'Public' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                      type === 'Virtual' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' :
                        'bg-corporate-50 border-corporate-100 text-corporate-500'
                    }`}>
                    {type}
                  </span>
                ))
              ) : (
                <span className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg border bg-corporate-50 border-corporate-100 text-corporate-500">
                  STANDARD
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-10 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-morphism rounded-2xl p-6 border border-corporate-50 group hover:border-accent-500/30 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-corporate-900 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Clock className="w-6 h-6 text-accent-400" />
                </div>
                <div>
                  <p className="text-[10px] text-corporate-400 font-bold uppercase tracking-widest">Temporal Unit</p>
                  <p className="text-lg font-bold text-corporate-900">
                    {course.duration_hours} {course.duration_hours === 1 ? 'HOUR' : 'HOURS'}
                  </p>
                </div>
              </div>
            </div>

            {course.target_audience && (
              <div className="glass-morphism rounded-2xl p-6 border border-corporate-50 md:col-span-2 group hover:border-accent-500/30 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-accent-500/10 rounded-xl flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-accent-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-corporate-400 font-bold uppercase tracking-widest">Target Vector</p>
                    <p className="text-sm font-bold text-corporate-800 mt-1 leading-relaxed">{course.target_audience}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {course.learning_objectives && course.learning_objectives.length > 0 && (
            <div className="mt-12 bg-corporate-50/50 rounded-3xl p-8 border border-corporate-100/50">
              <h3 className="text-xs font-black text-corporate-900 mb-6 uppercase tracking-[0.3em] flex items-center gap-3">
                <span className="w-8 h-px bg-corporate-200" />
                Operational Objectives
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                {course.learning_objectives.map((objective, index) => (
                  <div key={index} className="flex items-start gap-4 group">
                    <div className="w-6 h-6 rounded-lg bg-white border border-corporate-100 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-accent-500 group-hover:border-accent-500 transition-all duration-300">
                      <span className="text-[10px] font-black text-corporate-400 group-hover:text-white">{index + 1}</span>
                    </div>
                    <span className="text-sm text-corporate-600 font-medium group-hover:text-corporate-900 transition-colors">{objective}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-none shadow-modern-lg overflow-hidden">
        <CardHeader className="bg-corporate-900 text-white p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-8 bg-accent-500 rounded-full glow-effect" />
              <div>
                <h2 className="text-xl font-bold tracking-tight uppercase tracking-[0.1em]">Asset Repository</h2>
                <p className="text-[10px] text-corporate-400 font-bold uppercase tracking-widest mt-1">Authorized Materials Only</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-accent-400 font-black uppercase tracking-[0.2em] mb-1">Index Status</p>
              <p className="text-sm font-bold">{materials.length} {materials.length === 1 ? 'ARTIFACT' : 'ARTIFACTS'}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          {materials.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-20 h-20 bg-corporate-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <FileText className="w-10 h-10 text-corporate-200" />
              </div>
              <h3 className="text-lg font-bold text-corporate-900">Virtual Archive Empty</h3>
              <p className="text-corporate-500 mt-2 max-w-xs mx-auto font-medium leading-relaxed">No instructional resources have been localized for this specific unit.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {materials.map((material, i) => (
                <div
                  key={material.id}
                  className="flex items-center justify-between gap-6 p-6 bg-white border border-corporate-100 rounded-2xl hover:border-accent-500/30 hover:shadow-modern-sm transition-all duration-300 group animate-slide-in-bottom"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="flex items-center gap-5 flex-1 min-w-0">
                    <div className="w-14 h-14 bg-corporate-50 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-accent-50 group-hover:scale-105 transition-all">
                      <FileText className="w-7 h-7 text-corporate-400 group-hover:text-accent-600 transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-corporate-900 font-bold text-lg tracking-tight truncate">{material.file_name}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-corporate-300" />
                          <p className="text-[10px] font-bold text-corporate-400 uppercase tracking-widest">
                            {formatDate(material.uploaded_at)}
                          </p>
                        </div>
                        <span className="w-1 h-1 bg-corporate-200 rounded-full" />
                        <p className="text-[10px] font-black text-accent-600 uppercase tracking-[0.2em]">Live Artifact</p>
                      </div>
                    </div>
                  </div>
                  <a
                    href={material.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-6 h-14 bg-corporate-900 hover:bg-black text-white rounded-2xl shadow-modern transition-all flex-shrink-0 group/btn"
                  >
                    <Download className="w-5 h-5 text-accent-400 group-hover/btn:translate-y-0.5 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Secure Download</span>
                  </a>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
