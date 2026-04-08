import { useState, useEffect } from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Course, CourseSchedule } from '../../types/database';
import { fetchCourseSchedule, saveCourseSchedule, ScheduleItemData } from '../../lib/courseService';
import { Button } from '../ui/Button';
import { ScheduleBuilder } from './ScheduleBuilder';

interface CourseScheduleModalProps {
  course: Course;
  onClose: () => void;
  readOnly?: boolean;
}

export function CourseScheduleModal({ course, onClose, readOnly = false }: CourseScheduleModalProps) {
  const [schedule, setSchedule] = useState<CourseSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>('preview');
  const [isSaving, setIsSaving] = useState(false);
  const [editedItems, setEditedItems] = useState<Array<ScheduleItemData & { id: string; submodules: string[]; module_titles?: string[] }>>([]);
  const currentViewMode = readOnly ? 'preview' : viewMode;

  useEffect(() => {
    loadSchedule();
  }, [course.id]);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const data = await fetchCourseSchedule(course.id);
      setSchedule(data);

      // Convert database format to ScheduleBuilder format
      const mappedItems: Array<ScheduleItemData & { id: string; submodules: string[]; module_titles?: string[] }> = data.map(item => ({
        id: item.id || `module-${Math.random().toString(36).substr(2, 9)}`,
        day_number: item.day_number,
        start_time: item.start_time,
        end_time: item.end_time,
        module_title: typeof item.module_title === 'string' ? item.module_title : (Array.isArray(item.module_titles) ? item.module_titles[0] : ''),
        submodule_title: item.submodules || [],
        submodules: item.submodules || [],
        duration_minutes: item.duration_minutes || 120
      }));
      setEditedItems(mappedItems);
    } catch (error) {
      console.error('Error loading schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (readOnly) return;

    try {
      setIsSaving(true);
      await saveCourseSchedule(course.id, editedItems as any);
      await loadSchedule();
      setViewMode('preview');
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Failed to update schedule payload.');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to format time (convert 24h to 12h format)
  const formatTime = (time: string) => {
    if (!time) return '';
    const parts = time.split(':');
    if (parts.length < 2) return time;
    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
  };

  // Helper to get session name from time
  const getSessionName = (startTime: string) => {
    if (!startTime) return 'Session';
    const [hours] = startTime.split(':').map(Number);
    if (hours >= 9 && hours < 11) return 'Session 1';
    if (hours >= 11 && hours < 13) return 'Session 2';
    if (hours >= 14 && hours < 16) return 'Session 3';
    if (hours >= 16 && hours < 18) return 'Session 4';
    return 'Session';
  };

  const shouldInsertLunchBreak = (currentItem: CourseSchedule, nextItem?: CourseSchedule) =>
    currentItem.end_time === '13:00' && nextItem?.start_time === '14:00';

  // Group schedule items by day for preview
  const groupedSchedule: Record<number, any[]> = {};
  schedule.forEach(item => {
    if (!groupedSchedule[item.day_number]) {
      groupedSchedule[item.day_number] = [];
    }
    groupedSchedule[item.day_number].push(item);
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border-none shadow-2xl rounded-[2rem]">
        <CardHeader className="bg-corporate-50/50 border-b border-corporate-100 py-6 px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-1 bg-accent-500 rounded-full" />
                <span className="text-[10px] font-black text-accent-600 uppercase tracking-[0.2em]">Operational Schema</span>
              </div>
              <h2 className="text-xl font-black text-corporate-900 tracking-tight flex items-center gap-2 uppercase text-sm tracking-widest">
                <Calendar className="w-5 h-5 text-accent-500" />
                Operational Sequence
              </h2>
              <p className="text-[10px] font-black text-corporate-400 uppercase tracking-widest mt-1">
                Course Identifier: <span className="text-corporate-600 font-bold">{course.title}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              {readOnly ? (
                <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                  Preview Only
                </div>
              ) : (
                <div className="flex bg-corporate-100 p-1 rounded-xl border border-corporate-200">
                  <button
                    onClick={() => setViewMode('editor')}
                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === 'editor' ? 'bg-white text-corporate-900 shadow-sm' : 'text-corporate-500 hover:text-corporate-700'}`}
                  >
                    Editor
                  </button>
                  <button
                    onClick={() => setViewMode('preview')}
                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === 'preview' ? 'bg-white text-corporate-900 shadow-sm' : 'text-corporate-500 hover:text-corporate-700'}`}
                  >
                    Preview
                  </button>
                </div>
              )}
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center text-corporate-400 hover:text-corporate-900 transition-colors bg-white border border-corporate-100 rounded-xl hover:rotate-90 duration-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-12 h-12 border-4 border-accent-500/20 border-t-accent-600 rounded-full animate-spin" />
              <p className="text-[10px] font-black text-corporate-400 uppercase tracking-[0.2em] animate-pulse">Syncing Payload...</p>
            </div>
          ) : schedule.length === 0 && currentViewMode === 'preview' ? (
            <div className="text-center py-20 bg-corporate-50/30 rounded-3xl border-2 border-dashed border-corporate-200 m-8">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Calendar className="w-10 h-10 text-corporate-200" />
              </div>
              <h3 className="text-base font-bold text-corporate-900 uppercase tracking-[0.2em] mb-2">Null Sequence Detected</h3>
              <p className="text-sm text-corporate-500 font-medium max-w-xs mx-auto">
                No operational schedule has been encoded for this training artifact.
              </p>
            </div>
          ) : (
            <div className="p-8 space-y-8">
              {currentViewMode === 'editor' ? (
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-amber-50 border border-amber-100 p-5 rounded-2xl flex items-start gap-4 shadow-sm">
                    <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-amber-900 uppercase tracking-widest mb-1">Editor Mode Active</p>
                      <p className="text-[13px] text-amber-700 font-medium leading-relaxed">Adjustments made here will directly overwrite the course operational sequence. Ensure all parameters align with training requirements.</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-corporate-100 p-6 shadow-inner min-h-[400px]">
                    <ScheduleBuilder
                      scheduleItems={editedItems}
                      onChange={setEditedItems}
                      requiredDurationHours={course.duration_hours}
                      durationUnit={course.duration_unit}
                    />
                  </div>

                  <div className="flex justify-end gap-4 pt-8 border-t border-corporate-100">
                    <Button
                      variant="outline"
                      onClick={() => {
                        loadSchedule();
                        setViewMode('preview');
                      }}
                      disabled={isSaving}
                      className="text-[10px] font-black uppercase tracking-[0.2em] px-10 h-12 rounded-2xl border-corporate-200"
                    >
                      Abort Changes
                    </Button>
                    <Button
                      onClick={handleSave}
                      isLoading={isSaving}
                      className="text-[10px] font-black uppercase tracking-[0.2em] px-12 h-12 rounded-2xl shadow-modern shadow-accent-600/20"
                    >
                      Overwrite Sequence
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-12 animate-fade-in py-4 max-w-3xl mx-auto">
                  {Object.entries(groupedSchedule)
                    .sort(([dayA], [dayB]) => parseInt(dayA) - parseInt(dayB))
                    .map(([day, items]) => (
                      <div key={day} className="relative pl-12">
                        {/* Timeline Connector */}
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-corporate-100 via-corporate-200 to-corporate-100" />

                        <div className="absolute left-0 top-1 w-9 h-9 bg-white border-2 border-accent-500 rounded-2xl flex items-center justify-center z-10 shadow-lg shadow-accent-500/10">
                          <div className="w-3 h-3 bg-accent-500 rounded-full animate-pulse" />
                        </div>

                        <div className="flex items-center gap-4 mb-8">
                          <h3 className="text-2xl font-black text-corporate-900 uppercase tracking-tighter">
                            Day <span className="text-accent-600">{day}</span>
                          </h3>
                          <div className="h-px flex-1 bg-corporate-100" />
                          <span className="text-[10px] font-black text-corporate-400 uppercase tracking-[0.2em]">{items.length} SESSIONS</span>
                        </div>

                        <div className="space-y-8">
                          {[...items].sort((a, b) => a.start_time.localeCompare(b.start_time)).map((item, index, sortedItems) => {
                            const sessionName = getSessionName(item.start_time);
                            const nextItem = sortedItems[index + 1];

                            return (
                              <div key={index} className="space-y-4">
                                <div className="bg-white rounded-[2rem] border border-corporate-100 p-8 shadow-modern-sm hover:shadow-modern-lg transition-all duration-500 group relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-2 h-full bg-corporate-100 group-hover:bg-accent-500 transition-colors duration-500 shadow-sm" />

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-6 pb-6 border-b border-corporate-50">
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-accent-50 rounded-2xl flex items-center justify-center border border-accent-100 shrink-0 group-hover:bg-accent-500 group-hover:scale-110 transition-all duration-500">
                                      <Clock className="w-6 h-6 text-accent-600 group-hover:text-white transition-colors" />
                                    </div>
                                    <div>
                                      <span className="text-[10px] font-black text-accent-600 uppercase tracking-[0.2em] mb-1 block">
                                        {sessionName}
                                      </span>
                                      <div className="text-sm font-bold text-corporate-900 bg-corporate-50 px-3 py-1 rounded-lg border border-corporate-100">
                                        {formatTime(item.start_time)} — {formatTime(item.end_time)}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <h4 className="text-lg font-black text-corporate-900 mb-6 tracking-tight leading-tight group-hover:text-accent-600 transition-colors">
                                  {item.module_titles && item.module_titles.length > 0
                                    ? item.module_titles.join(' / ')
                                    : (item.module_title || 'Untitled Module')}
                                </h4>

                                {(item.submodules && item.submodules.length > 0) && (
                                  <div className="grid grid-cols-1 gap-3">
                                    {item.submodules.map((submodule: string, subIndex: number) => (
                                      <div key={subIndex} className="flex items-start gap-4 bg-corporate-50/50 p-4 rounded-2xl border border-transparent hover:border-corporate-100 hover:bg-white transition-all duration-300">
                                        <div className="w-1.5 h-1.5 rounded-full bg-accent-400 mt-2 shrink-0 group-hover:bg-accent-500" />
                                        <span className="text-sm font-medium text-corporate-700 leading-relaxed">{submodule}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                </div>
                                {shouldInsertLunchBreak(item, nextItem) && (
                                  <div className="rounded-[2rem] border border-amber-200 bg-amber-50 px-8 py-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                      <div>
                                        <p className="text-[10px] font-black text-amber-700 uppercase tracking-[0.2em]">Lunch Break</p>
                                        <p className="text-sm font-semibold text-amber-900 mt-1">Mandatory non-editable break block</p>
                                      </div>
                                      <div className="text-sm font-black text-amber-800 bg-white/70 px-4 py-2 rounded-xl border border-amber-200">
                                        1:00 PM - 2:00 PM
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
