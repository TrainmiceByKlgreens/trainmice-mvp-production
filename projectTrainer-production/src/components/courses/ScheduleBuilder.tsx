import { useEffect, useState } from 'react';
import { BookOpen, Clock } from 'lucide-react';
import { ScheduleItemData } from '../../lib/courseService';

interface ScheduleBuilderProps {
  scheduleItems: Array<ScheduleItemData & { id: string; submodules: string[]; module_titles?: string[] }>;
  onChange: (items: Array<ScheduleItemData & { id: string; submodules: string[]; module_titles?: string[] }>) => void;
  requiredDurationHours: number;
  durationUnit: 'days' | 'hours' | 'half_day';
}

interface SessionSlot {
  name: string;
  startTime: string;
  endTime: string;
  isBreak?: boolean;
}

const FULL_DAY_SLOTS: SessionSlot[] = [
  { name: 'Session 1', startTime: '09:00', endTime: '11:00' },
  { name: 'Session 2', startTime: '11:00', endTime: '13:00' },
  { name: 'Lunch Break', startTime: '13:00', endTime: '14:00', isBreak: true },
  { name: 'Session 3', startTime: '14:00', endTime: '16:00' },
  { name: 'Session 4', startTime: '16:00', endTime: '18:00' },
];

const formatSessionTime = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
};

const getDurationMinutes = (startTime: string, endTime: string) => {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  return ((endHours * 60) + endMinutes) - ((startHours * 60) + startMinutes);
};

export function ScheduleBuilder({ scheduleItems, onChange, requiredDurationHours, durationUnit }: ScheduleBuilderProps) {
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');
  const [sessionTexts, setSessionTexts] = useState<Record<string, string>>({});

  const displaySlots = FULL_DAY_SLOTS;
  const editableSlots = displaySlots.filter((slot) => !slot.isBreak);
  const daysCount = durationUnit === 'days'
    ? (requiredDurationHours > 0 ? Math.round(requiredDurationHours) : 1)
    : 1;

  /**
   * Extracts text from a <li> element, ignoring its nested <ul>/<ol> children.
   * Returns the cleaned text of just that list item.
   */
  const getLiText = (li: Element): string => {
    let text = '';
    li.childNodes.forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) {
        text += child.textContent || '';
      } else {
        const tag = (child as Element).tagName?.toLowerCase();
        if (tag && !['ul', 'ol'].includes(tag)) {
          text += (child as Element).textContent || '';
        }
      }
    });
    return text.trim().replace(/^[\u2022\u2023\u25E6\u2043\u2219\u2013\u2014\u00B7\*]\s*/, '');
  };

  /**
   * Returns true if this <p> element is a Microsoft Word list paragraph.
   * Word uses <p class="MsoListParagraph*"> instead of <ul>/<li>.
   */
  const isMsoListItem = (el: Element): boolean => {
    if (/msolist/i.test(el.getAttribute('class') || '')) return true;
    const raw = (el.textContent || '').replace(/\u00a0/g, ' ').trim();
    return /^[\u2022\u2023\u25E6\u2043\u00B7\u2219\uf0b7\u00b7]/.test(raw);
  };

  /**
   * Returns the 0-based indent depth of a Word list paragraph.
   */
  const getMsoDepth = (el: Element): number => {
    const style = el.getAttribute('style') || '';
    const lvl = style.match(/mso-list:[^;]*\blevel(\d+)/i);
    if (lvl) return parseInt(lvl[1]) - 1;
    const mli = style.match(/margin-left:\s*([\d.]+)\s*in/i);
    if (mli) return Math.max(0, Math.round(parseFloat(mli[1]) / 0.5) - 1);
    const mlp = style.match(/margin-left:\s*([\d.]+)\s*pt/i);
    if (mlp) return Math.max(0, Math.round(parseFloat(mlp[1]) / 36) - 1);
    const mlc = style.match(/margin-left:\s*([\d.]+)\s*cm/i);
    if (mlc) return Math.max(0, Math.round(parseFloat(mlc[1]) / 1.27) - 1);
    return 0;
  };

  /**
   * Converts HTML clipboard content (from Word, Google Docs, ChatGPT, etc.)
   */
  const parseHtmlClipboard = (html: string): string => {
    const div = document.createElement('div');
    div.innerHTML = html;
    const out: string[] = [];

    const getElText = (el: Element): string => {
      let text = '';
      el.childNodes.forEach(node => {
        const childTag = (node as Element).tagName?.toLowerCase();
        if (node.nodeType === Node.TEXT_NODE) {
          text += node.textContent ?? '';
        } else if (childTag && !['ul', 'ol'].includes(childTag)) {
          text += (node as Element).textContent ?? '';
        }
      });
      text = text.replace(/\u00a0/g, ' ');
      text = text.replace(/^\s*[\u2022\u2023\u25E6\u2043\u00B7\u2219\uf0b7\u00b7\*]\s*/, '');
      return text.trim();
    };

    const extractList = (listEl: Element, depth: number) => {
      for (const child of Array.from(listEl.children)) {
        if (child.tagName?.toLowerCase() !== 'li') continue;
        const text = getLiText(child);
        if (text) out.push('  '.repeat(depth) + text);
        for (const nested of Array.from(child.children)) {
          const nestedTag = nested.tagName?.toLowerCase();
          if (nestedTag === 'ul' || nestedTag === 'ol') extractList(nested, depth + 1);
        }
      }
    };

    let titleSeen = false;
    for (const el of Array.from(div.children)) {
      const tag = el.tagName?.toLowerCase();
      if (tag === 'ul' || tag === 'ol') {
        extractList(el, titleSeen ? 1 : 0);
        continue;
      }
      if (['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'section'].includes(tag)) {
        const innerList = Array.from(el.children).find(child => ['ul', 'ol'].includes(child.tagName?.toLowerCase()));
        if (innerList) {
          extractList(innerList, titleSeen ? 1 : 0);
          continue;
        }
        if (isMsoListItem(el)) {
          const depth = getMsoDepth(el);
          const text = getElText(el);
          if (!text || text === '\u00a0') continue;
          out.push('  '.repeat(titleSeen ? depth + 1 : depth) + text);
          continue;
        }

        const text = (el.textContent ?? '').trim();
        if (!text || text === '\u00a0') continue;
        out.push(text);
        titleSeen = true;
      }
    }

    return out.join('\n');
  };

  /**
   * Normalises plain-text clipboard content.
   */
  const normalizePlainText = (text: string): string => {
    const rawLines = text.split('\n');
    const bulletRe = /^(\s*)([\u2022\u2023\u25E6\u2043\u2219\u2013\u2014\u00B7\*]|(?<![\w\d])-(?=[\s]))\s+/;
    const numberedRe = /^(\s*)\d+[.)\s]\s*/;
    const out: string[] = [];
    let afterPlainTitle = false;

    for (const raw of rawLines) {
      const trimmed = raw.trim();
      if (!trimmed) {
        out.push('');
        afterPlainTitle = false;
        continue;
      }

      const bulletMatch = raw.match(bulletRe);
      const numberedMatch = raw.match(numberedRe);
      const existingIndent = raw.match(/^(\s+)/)?.[1]?.length ?? 0;

      if (bulletMatch || numberedMatch) {
        const prefix = (bulletMatch || numberedMatch)![0];
        const content = raw.slice(prefix.length).trim();
        const leadingSpaces = bulletMatch?.[1]?.length ?? numberedMatch?.[1]?.length ?? 0;
        if (leadingSpaces === 0) {
          out.push(afterPlainTitle ? `  ${content}` : content);
        } else {
          const depth = Math.max(1, Math.round(leadingSpaces / 2));
          out.push('  '.repeat(depth) + content);
        }
      } else if (existingIndent > 0) {
        const depth = Math.max(1, Math.round(existingIndent / 2));
        out.push('  '.repeat(depth) + trimmed);
      } else {
        out.push(trimmed);
        afterPlainTitle = true;
      }
    }

    return out.join('\n');
  };

  const syncToSchedule = (newSessionTexts: Record<string, string>) => {
    const newItems: Array<ScheduleItemData & { id: string; submodules: string[]; module_titles?: string[] }> = [];

    for (let day = 1; day <= daysCount; day++) {
      for (const session of editableSlots) {
        const key = `${day}-${session.startTime}`;
        const text = newSessionTexts[key];
        if (!text || !text.trim()) continue;

        const lines = text.split('\n');
        let currentModule: { title: string; submodules: string[] } | null = null;

        for (const line of lines) {
          if (!line.trim()) continue;

          const cleanedLine = line.trim();
          const isIndented = /^\s+/.test(line);

          if (isIndented && currentModule) {
            currentModule.submodules.push(cleanedLine);
            continue;
          }

          if (currentModule) {
            newItems.push({
              id: `module-${day}-${session.startTime}-${newItems.length}`,
              day_number: day,
              start_time: session.startTime,
              end_time: session.endTime,
              module_title: currentModule.title,
              submodule_title: currentModule.submodules,
              duration_minutes: getDurationMinutes(session.startTime, session.endTime),
              submodules: currentModule.submodules,
            });
          }

          currentModule = {
            title: cleanedLine,
            submodules: [],
          };
        }

        if (currentModule) {
          newItems.push({
            id: `module-${day}-${session.startTime}-${newItems.length}`,
            day_number: day,
            start_time: session.startTime,
            end_time: session.endTime,
            module_title: currentModule.title,
            submodule_title: currentModule.submodules,
            duration_minutes: getDurationMinutes(session.startTime, session.endTime),
            submodules: currentModule.submodules,
          });
        }
      }
    }

    onChange(newItems);
  };

  const handleTextChange = (key: string, text: string) => {
    const updatedSessionTexts = { ...sessionTexts, [key]: text };
    setSessionTexts(updatedSessionTexts);
    syncToSchedule(updatedSessionTexts);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>, key: string) => {
    if (event.key !== 'Tab') return;

    event.preventDefault();
    const target = event.target as HTMLTextAreaElement;
    const selectionStart = target.selectionStart;
    const selectionEnd = target.selectionEnd;
    const text = sessionTexts[key] || '';

    if (selectionStart === selectionEnd) {
      const newValue = `${text.substring(0, selectionStart)}  ${text.substring(selectionEnd)}`;
      handleTextChange(key, newValue);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = selectionStart + 2;
      }, 0);
      return;
    }

    const lineStart = text.lastIndexOf('\n', selectionStart - 1) + 1;
    const region = text.substring(lineStart, selectionEnd);
    const newRegion = event.shiftKey
      ? region.replace(/^(  | )/gm, '')
      : region.replace(/^(?!$)/gm, '  ');
    const newValue = `${text.substring(0, lineStart)}${newRegion}${text.substring(selectionEnd)}`;
    handleTextChange(key, newValue);

    setTimeout(() => {
      target.selectionStart = lineStart;
      target.selectionEnd = lineStart + newRegion.length;
    }, 0);
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>, key: string) => {
    event.preventDefault();
    const target = event.target as HTMLTextAreaElement;
    const selectionStart = target.selectionStart;
    const selectionEnd = target.selectionEnd;
    const currentText = sessionTexts[key] || '';

    let normalized = '';
    const htmlData = event.clipboardData.getData('text/html');
    if (htmlData && htmlData.trim()) {
      const parsedHtml = parseHtmlClipboard(htmlData);
      if (parsedHtml.trim()) {
        normalized = parsedHtml;
      }
    }

    if (!normalized) {
      const plainText = event.clipboardData.getData('text/plain') || event.clipboardData.getData('text');
      if (plainText) {
        normalized = normalizePlainText(plainText.replace(/\t/g, '  '));
      }
    }

    if (!normalized) return;

    const newValue = `${currentText.substring(0, selectionStart)}${normalized}${currentText.substring(selectionEnd)}`;
    handleTextChange(key, newValue);
    setTimeout(() => {
      target.selectionStart = target.selectionEnd = selectionStart + normalized.length;
    }, 0);
  };

  useEffect(() => {
    if (scheduleItems.length === 0) {
      setSessionTexts({});
      return;
    }

    if (Object.keys(sessionTexts).length > 0) {
      return;
    }

    const newTexts: Record<string, string> = {};
    const groupedSessions: Record<string, Array<{ title: string; submodules: string[] }>> = {};

    scheduleItems.forEach(item => {
      const key = `${item.day_number}-${item.start_time}`;
      if (!groupedSessions[key]) {
        groupedSessions[key] = [];
      }

      groupedSessions[key].push({
        title: typeof item.module_title === 'string' ? item.module_title : '',
        submodules: Array.isArray(item.submodules) ? item.submodules : [],
      });
    });

    Object.entries(groupedSessions).forEach(([key, modules]) => {
      newTexts[key] = modules
        .map((module) => {
          const submodulesText = module.submodules.map((submodule) => `  ${submodule}`).join('\n');
          return `${module.title}${submodulesText ? `\n${submodulesText}` : ''}`;
        })
        .join('\n\n');
    });

    setSessionTexts(newTexts);
  }, [scheduleItems, sessionTexts]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-50 rounded-lg">
            <BookOpen className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Course Syllabus</h3>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-0.5">Fixed Session Schedule</p>
          </div>
        </div>
        <div className="flex bg-gray-100/80 p-1.5 rounded-xl border border-gray-200/50">
          <button
            type="button"
            onClick={() => setViewMode('editor')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${viewMode === 'editor' ? 'bg-white text-teal-600 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${viewMode === 'editor' ? 'bg-teal-500 animate-pulse' : 'bg-gray-300'}`} />
            Editor Mode
          </button>
          <button
            type="button"
            onClick={() => setViewMode('preview')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${viewMode === 'preview' ? 'bg-white text-teal-600 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${viewMode === 'preview' ? 'bg-teal-500' : 'bg-gray-300'}`} />
            Preview Mode
          </button>
        </div>
      </div>

      {viewMode === 'editor' ? (
        <div className="space-y-8">
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-500 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-900">Session Editor Guide</p>
              <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                The schedule is locked to the fixed TrainMICE slots. Use each session box for main modules and indent subtopics with Tab or two spaces. Lunch Break is system-managed and cannot be edited.
              </p>
            </div>
          </div>

          {Array.from({ length: daysCount }, (_, dayIndex) => {
            const day = dayIndex + 1;
            return (
              <div key={day} className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center text-xs font-bold">D{day}</span>
                  <h4 className="font-bold text-gray-900">Day {day} Schedule</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displaySlots.map((slot) => {
                    const key = `${day}-${slot.startTime}`;

                    if (slot.isBreak) {
                      return (
                        <div key={key} className="bg-amber-50 p-4 rounded-2xl border border-amber-200 shadow-sm flex flex-col justify-center">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">{slot.name}</span>
                            <span className="text-[10px] font-bold text-amber-800">{formatSessionTime(slot.startTime)} - {formatSessionTime(slot.endTime)}</span>
                          </div>
                          <p className="text-sm font-semibold text-amber-900 mt-4">Lunch Break</p>
                        </div>
                      );
                    }

                    return (
                      <div key={key} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{slot.name}</span>
                          <span className="text-[10px] text-teal-600 font-bold">{formatSessionTime(slot.startTime)} - {formatSessionTime(slot.endTime)}</span>
                        </div>
                        <textarea
                          className="w-full h-48 p-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-mono text-sm leading-relaxed transition-all resize-y whitespace-pre"
                          placeholder="Module Title&#10;  Subtopic 1"
                          value={sessionTexts[key] || ''}
                          onChange={(event) => handleTextChange(key, event.target.value)}
                          onKeyDown={(event) => handleKeyDown(event, key)}
                          onPaste={(event) => handlePaste(event, key)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-8 animate-fade-in">
          {Array.from({ length: daysCount }, (_, dayIndex) => {
            const day = dayIndex + 1;
            return (
              <div key={day} className="relative">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center justify-center w-10 h-10 bg-teal-600 text-white rounded-xl font-bold shadow-md">
                    {day}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Day {day}</h3>
                    <p className="text-sm text-gray-500">Read-only schedule preview</p>
                  </div>
                  <div className="flex-1 border-b border-dashed border-gray-200 ml-2" />
                </div>

                <div className="space-y-6 ml-5 pl-5 border-l-2 border-teal-50">
                  {displaySlots.map((slot) => {
                    const key = `${day}-${slot.startTime}`;
                    const text = sessionTexts[key] || '';

                    if (slot.isBreak) {
                      return (
                        <div key={key} className="relative">
                          <div className="absolute -left-[35px] top-0 w-5 h-5 bg-white border-2 border-amber-300 rounded-full z-10 shadow-sm" />
                          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="text-sm font-black text-amber-900 uppercase tracking-widest">{slot.name}</p>
                              </div>
                              <span className="text-xs font-bold text-amber-800">{formatSessionTime(slot.startTime)} - {formatSessionTime(slot.endTime)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={key} className="relative group">
                        <div className="absolute -left-[35px] top-0 w-5 h-5 bg-white border-2 border-teal-200 rounded-full z-10 shadow-sm" />
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold border border-gray-200">
                                <Clock className="w-3 h-3 mr-1.5 text-gray-500" />
                                {formatSessionTime(slot.startTime)} - {formatSessionTime(slot.endTime)}
                              </div>
                              <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">{slot.name}</span>
                            </div>
                          </div>
                          <div className="p-5">
                            {text.trim() ? (
                              <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-gray-800 bg-gray-50 rounded-xl border border-gray-100 p-4">
                                {text}
                              </div>
                            ) : (
                              <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4 text-center">
                                <p className="text-[11px] text-gray-400 italic">No syllabus items assigned to this session.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
