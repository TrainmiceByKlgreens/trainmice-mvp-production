import { useState } from 'react';
import { Edit, Upload, Calendar, Trash2, Eye, Clock } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Course, CourseMaterial } from '../../types/database';
import { MaterialsUploadModal } from './MaterialsUploadModal';
import { CourseScheduleModal } from './CourseScheduleModal';
import { fetchCourseMaterials } from '../../lib/courseService';

interface CourseListTableProps {
  courses: Course[];
  onEdit: (course: Course) => void;
  onDelete: (courseId: string) => void;
  onRefresh: () => void;
  onViewDetails: (course: Course) => void;
  currentUserId?: string;
}

export function CourseListTable({ courses, onEdit, onDelete, onRefresh, onViewDetails, currentUserId }: CourseListTableProps) {
  const [selectedCourseForMaterials, setSelectedCourseForMaterials] = useState<Course | null>(null);
  const [selectedCourseForSchedule, setSelectedCourseForSchedule] = useState<Course | null>(null);
  const [courseMaterials, setCourseMaterials] = useState<CourseMaterial[]>([]);

  const getStatusMeta = (status: Course['status']) => {
    switch (status) {
      case 'published':
      case 'APPROVED':
        return {
          label: 'Live',
          className: 'bg-black border-black text-accent-gold',
        };
      case 'PENDING_APPROVAL':
        return {
          label: 'Pending Review',
          className: 'bg-amber-50 border-amber-200 text-amber-700',
        };
      case 'DENIED':
        return {
          label: 'Needs Changes',
          className: 'bg-red-50 border-red-200 text-red-700',
        };
      default:
        return {
          label: 'Draft',
          className: 'bg-white border-corporate-100 text-corporate-400',
        };
    }
  };

  const getMyTrainerRecord = (course: Course) => (
    course.course_trainers?.find(ct => ct.trainerId === currentUserId) || null
  );

  const canManageCourse = (course: Course) => {
    if (!currentUserId) return true;

    const myTrainerRecord = getMyTrainerRecord(course);
    if (myTrainerRecord) {
      return myTrainerRecord.role === 'PRIMARY';
    }

    return course.trainer_id === currentUserId;
  };

  const isReadOnlyAssignment = (course: Course) => !canManageCourse(course);

  const handleManageMaterials = async (course: Course) => {
    onViewDetails(course);
    setSelectedCourseForMaterials(course);
    const materials = await fetchCourseMaterials(course.id);
    setCourseMaterials(materials);
  };

  const handleViewSchedule = (course: Course) => {
    onViewDetails(course);
    setSelectedCourseForSchedule(course);
  };

  const handleDelete = (courseId: string) => {
    if (confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      onDelete(courseId);
    }
  };

  const getTrainerRoleDisplay = (course: Course) => {
    if (!course.course_trainers || course.course_trainers.length === 0) {
      if (course.trainer_id === currentUserId) {
        return <span className="text-corporate-500 italic text-xs font-medium">Owner</span>;
      }

      return <span className="text-corporate-500 italic text-xs font-medium">No role assigned</span>;
    }

    const myTrainerRecord = getMyTrainerRecord(course);
    const primaryTrainer = course.course_trainers.find(ct => ct.role === 'PRIMARY');

    if (!myTrainerRecord) {
      return <span className="text-corporate-500 italic text-xs font-medium">Owner</span>;
    }

    if (myTrainerRecord.role === 'PRIMARY') {
      return <span className="px-2 py-0.5 text-[10px] font-black rounded bg-accent-gold text-black uppercase tracking-widest shadow-gold-glow/10">Primary</span>;
    }

    return (
      <div className="flex flex-col">
        <span className="px-2 py-0.5 text-[10px] font-black rounded bg-corporate-800 text-accent-gold uppercase tracking-widest w-fit border border-accent-gold/20">Co-Trainer</span>
        {primaryTrainer && primaryTrainer.trainer && (
          <span className="text-[10px] text-corporate-500 mt-1 font-medium">
            Primary: <span className="text-corporate-300">{primaryTrainer.trainer.fullName}</span>
          </span>
        )}
      </div>
    );
  };


  if (courses.length === 0) {
    return (
      <Card className="bg-white border-dashed border-2 border-corporate-200 shadow-none">
        <CardContent className="py-24">
          <div className="text-center">
            <div className="w-24 h-24 bg-gray-50 border border-corporate-100 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
              <Calendar className="w-10 h-10 text-corporate-300" />
            </div>
            <h3 className="text-2xl font-bold text-corporate-950 tracking-tight underline decoration-accent-gold decoration-4 underline-offset-8">Curriculum Database Empty</h3>
            <p className="text-corporate-500 mt-6 max-w-md mx-auto font-medium leading-relaxed text-sm">
              No instructional programs have been registered to your profile. Initialize your first curriculum to begin training operations.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border border-corporate-100 shadow-modern-lg overflow-hidden bg-white">
        <CardHeader className="bg-white text-black p-8 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-8 bg-black rounded-full shadow-sm" />
              <div>
                <h2 className="text-xl font-black tracking-tight uppercase underline decoration-accent-gold decoration-4 underline-offset-8">My Courses</h2>
                <p className="text-[10px] text-corporate-500 font-black uppercase tracking-widest mt-4">Curriculum Management</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-corporate-400 font-black uppercase tracking-[0.2em] mb-1">Total Units</p>
              <p className="text-sm font-black text-black">{courses.length} Units</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-corporate-100">
                  <th className="text-left py-5 px-8 text-[10px] font-black text-corporate-500 uppercase tracking-widest">Course Name</th>
                  <th className="text-left py-5 px-6 text-[10px] font-black text-corporate-500 uppercase tracking-widest">Classification</th>
                  <th className="text-left py-5 px-6 text-[10px] font-black text-corporate-500 uppercase tracking-widest">Operational Role</th>
                  <th className="text-left py-5 px-6 text-[10px] font-black text-corporate-500 uppercase tracking-widest">Duration</th>
                  <th className="text-left py-5 px-6 text-[10px] font-black text-corporate-500 uppercase tracking-widest">Status</th>
                  <th className="text-right py-5 px-8 text-[10px] font-black text-corporate-500 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-corporate-50">
                {courses.map((course) => {
                  const readOnlyAssignment = isReadOnlyAssignment(course);
                  const statusMeta = getStatusMeta(course.status);
                  const hasUnreadReviewChange = course.isRead === false && ['published', 'APPROVED', 'DENIED', 'PENDING_APPROVAL'].includes(course.status);

                  return (
                    <tr
                      key={course.id}
                      className="hover:bg-gray-50/50 transition-colors group/row cursor-pointer"
                      onClick={() => onViewDetails(course)}
                    >
                      <td className="py-6 px-8">
                        <div className="flex flex-col relative">
                          <div className="flex items-center gap-2">
                            <p className="font-black text-corporate-950 group-hover/row:text-black transition-colors tracking-tight uppercase text-sm leading-relaxed">{course.title}</p>
                            {hasUnreadReviewChange && (
                              <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse flex-shrink-0 border-2 border-white shadow-sm" title="Status updated" />
                            )}
                          </div>
                          {course.description && (
                            <p className="text-[11px] text-corporate-500 mt-1 line-clamp-1 font-medium italic">{course.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-6 px-6">
                        <span className="text-[10px] font-black text-corporate-600 uppercase tracking-widest bg-gray-100 px-2 py-1 rounded-md">
                          {typeof course.course_type === 'string' ? course.course_type : (Array.isArray(course.course_type) ? course.course_type.join(', ') : 'N/A')}
                        </span>
                      </td>
                      <td className="py-6 px-6">
                        {getTrainerRoleDisplay(course)}
                      </td>
                      <td className="py-6 px-6">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-black" />
                          <span className="text-[10px] font-black text-black uppercase tracking-tighter">
                            {course.duration_unit === 'days'
                              ? `${course.duration_hours} ${course.duration_hours === 1 ? 'DAY' : 'DAYS'}`
                              : `${course.duration_hours} ${course.duration_hours === 1 ? 'HOUR' : 'HOURS'}`
                            }
                          </span>
                        </div>
                      </td>
                      <td className="py-6 px-6">
                        <span className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border-2 shadow-sm ${statusMeta.className}`}>
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="py-6 px-8">
                        <div className="flex items-center justify-end gap-2 transition-opacity duration-300">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(course)}
                            disabled={readOnlyAssignment}
                            className="w-10 h-10 border-corporate-200 text-corporate-400 hover:border-black hover:text-black hover:bg-gray-50 p-0 rounded-xl transition-all shadow-sm flex items-center justify-center bg-white"
                            title={readOnlyAssignment ? 'Primary trainer only' : 'Technical Edit'}
                          >
                            <Edit className="w-5 h-5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleManageMaterials(course)}
                            className="w-10 h-10 border-corporate-200 text-corporate-400 hover:border-black hover:text-black hover:bg-gray-50 p-0 rounded-xl transition-all shadow-sm flex items-center justify-center bg-white"
                            title={readOnlyAssignment ? 'View materials' : 'Assets Management'}
                          >
                            <Upload className="w-5 h-5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewSchedule(course)}
                            className="w-10 h-10 border-corporate-200 text-corporate-400 hover:border-black hover:text-black hover:bg-gray-50 p-0 rounded-xl transition-all shadow-sm flex items-center justify-center bg-white"
                            title={readOnlyAssignment ? 'View schedule' : 'Verify Sequence'}
                          >
                            <Eye className="w-5 h-5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(course.id)}
                            disabled={readOnlyAssignment}
                            className="w-10 h-10 border-corporate-100 text-corporate-300 hover:border-red-500 hover:text-red-600 hover:bg-red-50 p-0 rounded-xl transition-all shadow-sm flex items-center justify-center bg-white"
                            title={readOnlyAssignment ? 'Primary trainer only' : 'Purge Sequence'}
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {selectedCourseForMaterials && (
        <MaterialsUploadModal
          courseId={selectedCourseForMaterials.id}
          courseName={selectedCourseForMaterials.title}
          materials={courseMaterials}
          onMaterialsUpdate={setCourseMaterials}
          readOnly={isReadOnlyAssignment(selectedCourseForMaterials)}
          onClose={() => {
            setSelectedCourseForMaterials(null);
            onRefresh();
          }}
        />
      )}

      {selectedCourseForSchedule && (
        <CourseScheduleModal
          course={selectedCourseForSchedule}
          readOnly={isReadOnlyAssignment(selectedCourseForSchedule)}
          onClose={() => setSelectedCourseForSchedule(null)}
        />
      )}
    </>
  );
}
