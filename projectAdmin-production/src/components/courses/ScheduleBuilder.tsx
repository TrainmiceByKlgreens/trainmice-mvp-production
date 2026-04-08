import { useState, useEffect } from 'react';
import { Plus, Clock, BookOpen, Trash2, X } from 'lucide-react';

export interface ScheduleItemData {
  day_number: number;
  start_time: string;
  end_time: string;
  module_title: string | string[];
  submodule_title: string | string[] | null;
  duration_minutes: number;
}

interface ScheduleBuilderProps {
  scheduleItems: Array<ScheduleItemData & { id: string; submodules: string[]; module_titles?: string[] }>;
  onChange: (items: Array<ScheduleItemData & { id: string; submodules: string[]; module_titles?: string[] }>) => void;
  requiredDurationHours: number;
  durationUnit: 'days' | 'hours' | 'half_day';
}

const FULL_DAY_SESSIONS = [
  { name: 'Session 1', startTime: '09:00', endTime: '11:00' },
  { name: 'Session 2', startTime: '11:00', endTime: '14:00' },
  { name: 'Session 3', startTime: '14:00', endTime: '16:00' },
  { name: 'Session 4', startTime: '16:00', endTime: '18:00' },
];

const HALF_DAY_SESSIONS = [
  { name: 'Session 1', startTime: '09:00', endTime: '11:00' },
  { name: 'Session 2', startTime: '11:00', endTime: '14:00' },
];

const HOUR_SESSIONS = [
  { name: 'Session 1', startTime: '09:00', endTime: '11:00' },
  { name: 'Session 2', startTime: '11:00', endTime: '14:00' },
];

interface ModuleData {
  id: string;
  moduleTitle: string;
  submodules: string[];
}

interface SessionData {
  dayNumber: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  modules: ModuleData[];
}

export function ScheduleBuilder({ scheduleItems, onChange, requiredDurationHours, durationUnit }: ScheduleBuilderProps) {
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');
  const [sessionTexts, setSessionTexts] = useState<Record<string, string>>({});

  // Determine default sessions base
  const defaultSessions = (() => {
    if (durationUnit === 'half_day') return HALF_DAY_SESSIONS;
    if (durationUnit === 'days') return FULL_DAY_SESSIONS;
    return HOUR_SESSIONS;
  })();

  const defaultDaysCount = (() => {
    if (durationUnit === 'half_day') return 1;
    if (durationUnit === 'days') return requiredDurationHours > 0 ? Math.round(requiredDurationHours) : 1;
    return 1;
  })();

  const [customSessions, setCustomSessions] = useState<Record<number, typeof FULL_DAY_SESSIONS>>(() => {
    const initial: Record<number, typeof FULL_DAY_SESSIONS> = {};
    for (let i = 1; i <= defaultDaysCount; i++) {
      initial[i] = [...defaultSessions];
    }
    return initial;
  });

  const daysCount = defaultDaysCount;

  // Sync customSessions with props if they change significantly
  useEffect(() => {
    setCustomSessions(prev => {
      const next: Record<number, typeof FULL_DAY_SESSIONS> = { ...prev };
      for (let i = 1; i <= defaultDaysCount; i++) {
        if (!next[i]) next[i] = [...defaultSessions];
      }
      return next;
    });
  }, [defaultDaysCount, durationUnit]);

  const addSessionToDay = (day: number) => {
    setCustomSessions(prev => {
      const daySessions = prev[day] || [...defaultSessions];
      const lastSession = daySessions[daySessions.length - 1];
      const newStart = lastSession ? lastSession.endTime : '09:00';
      const [h, m] = newStart.split(':').map(Number);
      const newEnd = `${String(h + 2).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

      return {
        ...prev,
        [day]: [
          ...daySessions,
          { name: `Session ${daySessions.length + 1}`, startTime: newStart, endTime: newEnd }
        ]
      };
    });
  };

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
        // Include inline elements but not nested lists
        if (tag && !['ul', 'ol'].includes(tag)) {
          text += (child as Element).textContent || '';
        }
      }
    });
    // Strip any leading bullet glyphs that may have been inlined into the text
    return text.trim().replace(/^[\u2022\u2023\u25E6\u2043\u2219\u2013\u2014\u00B7\*]\s*/, '');
  };

  /**
   * Recursively processes a <ul>/<ol> element and its nested lists into
   * 2-space-indented lines. `baseDepth` is the indent level of the top <li>s.
   */
  const extractList = (listEl: Element, baseDepth: number, out: string[]) => {
    Array.from(listEl.children).forEach(child => {
      if (child.tagName?.toLowerCase() !== 'li') return;
      const itemText = getLiText(child);
      if (itemText) {
        out.push('  '.repeat(baseDepth) + itemText);
      }
      // Recurse into any nested lists inside this <li>
      Array.from(child.children).forEach(nested => {
        const nt = nested.tagName?.toLowerCase();
        if (nt === 'ul' || nt === 'ol') {
          extractList(nested, baseDepth + 1, out);
        }
      });
    });
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
   * Word encodes this as `mso-list:... level1` (1-based) in the style attribute,
   * or via margin-left (0.5in per level starting at 0.5in = depth 0).
   */
  const getMsoDepth = (el: Element): number => {
    const style = el.getAttribute('style') || '';
    const lvl = style.match(/mso-list:[^;]*\blevel(\d+)/i);
    if (lvl) return parseInt(lvl[1]) - 1; // level1 → 0, level2 → 1 …
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
   * into the 2-space-indented plain text that the editor parser understands.
   *
   * Rules:
   * - Standard <ul>/<li> hierarchy → depth determined by nesting level.
   * - Word <p class="MsoListParagraph"> → depth determined by mso-list level style.
   * - A plain <p>/<h*> title before a list or Word bullets → list items become submodules.
   * - A list or Word bullets with NO preceding title → top-level items are module titles.
   */
  const parseHtmlClipboard = (html: string): string => {
    const div = document.createElement('div');
    div.innerHTML = html;
    const out: string[] = [];

    // Get text from an element, excluding nested list children,
    // and stripping Word's inline bullet glyphs.
    const getElText = (el: Element): string => {
      let t = '';
      el.childNodes.forEach(node => {
        const childTag = (node as Element).tagName?.toLowerCase();
        if (node.nodeType === Node.TEXT_NODE) {
          t += node.textContent ?? '';
        } else if (childTag && !['ul', 'ol'].includes(childTag)) {
          t += (node as Element).textContent ?? '';
        }
      });
      // Normalise NBSP then strip leading bullet glyph
      t = t.replace(/\u00a0/g, ' ');
      t = t.replace(/^\s*[\u2022\u2023\u25E6\u2043\u00B7\u2219\uf0b7\u00b7\*]\s*/, '');
      return t.trim();
    };

    // Extract a standard <ul>/<ol> tree recursively
    const extractUl = (listEl: Element, depth: number) => {
      for (const child of Array.from(listEl.children)) {
        if (child.tagName?.toLowerCase() !== 'li') continue;
        const t = getLiText(child);
        if (t) out.push('  '.repeat(depth) + t);
        for (const nested of Array.from(child.children)) {
          const nt = nested.tagName?.toLowerCase();
          if (nt === 'ul' || nt === 'ol') extractUl(nested, depth + 1);
        }
      }
    };

    // Walk top-level block elements in document order
    let titleSeen = false; // did a plain paragraph/heading precede the current list?

    for (const el of Array.from(div.children)) {
      const tag = el.tagName?.toLowerCase();

      // ── Standard HTML list (Google Docs, ChatGPT, etc.) ──────────────────
      if (tag === 'ul' || tag === 'ol') {
        extractUl(el, titleSeen ? 1 : 0);
        // Don't reset titleSeen — bullets are still "under" the same title
        continue;
      }

      // ── Block elements (<p>, headings, <div>) ────────────────────────────
      if (['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'section'].includes(tag)) {
        // Case A: wrapper element that contains a <ul>/<ol>
        const innerList = Array.from(el.children).find(c =>
          ['ul', 'ol'].includes(c.tagName?.toLowerCase())
        );
        if (innerList) {
          extractUl(innerList, titleSeen ? 1 : 0);
          continue;
        }

        // Case B: Microsoft Word list paragraph (<p class="MsoListParagraph...">)
        if (isMsoListItem(el)) {
          const depth = getMsoDepth(el);          // depth 0 = first bullet level in Word
          const t = getElText(el);
          if (!t || t === '\u00a0') continue;     // skip empty / &nbsp; spacer lines
          // If a plain title preceded, shift depth up by 1 (bullets become submodules).
          // Otherwise depth 0 = module title, depth 1+ = submodule.
          const effective = titleSeen ? depth + 1 : depth;
          out.push('  '.repeat(effective) + t);
          continue;
        }

        // Case C: plain paragraph or heading → module title
        const text = (el.textContent ?? '').trim();
        if (!text || text === '\u00a0') continue; // skip spacer paragraphs
        out.push(text);
        titleSeen = true;
      }
    }

    return out.join('\n');
  };

  /**
   * Normalises plain-text clipboard content:
   * - Lines with NO bullet and NO indent → module titles.
   * - Bullet chars (•, -, *, –) at column 0 that follow a plain title → submodules.
   * - Bullet chars at column 0 with NO preceding plain title → module titles.
   * - Indented bullet chars → submodules (depth proportional to indent).
   * - Already-indented plain lines → submodules.
   */
  const normalizePlainText = (text: string): string => {
    const rawLines = text.split('\n');
    // Match a bullet only at the very start of the line (after optional spaces)
    // Use a word-boundary-like check: bullet char must be followed by a space
    const bulletRe = /^(\s*)([\u2022\u2023\u25E6\u2043\u2219\u2013\u2014\u00B7\*]|(?<![\w\d])-(?=[\s]))\s+/;
    const numberedRe = /^(\s*)\d+[.)\s]\s*/;

    const out: string[] = [];
    // Was the most-recent non-blank non-bullet line a plain title at column 0?
    let afterPlainTitle = false;

    for (const raw of rawLines) {
      const trimmed = raw.trim();
      if (!trimmed) {
        out.push('');
        // A blank line resets context so next bullets are new modules
        afterPlainTitle = false;
        continue;
      }

      const bm = raw.match(bulletRe);
      const nm = raw.match(numberedRe);
      const existingIndent = raw.match(/^(\s+)/)?.[1]?.length ?? 0;

      if (bm || nm) {
        const prefix = (bm || nm)![0];
        const content = raw.slice(prefix.length).trim();
        const leadingSpaces = bm?.[1]?.length ?? nm?.[1]?.length ?? 0;

        if (leadingSpaces === 0) {
          if (afterPlainTitle) {
            // Top-level bullet after a plain title → submodule
            out.push('  ' + content);
          } else {
            // Standalone top-level bullet → module title
            out.push(content);
            // Keep afterPlainTitle false; next bullets at col-0 are also module titles
          }
        } else {
          // Indented bullet → submodule; depth = indent / 2, minimum 1
          const depth = Math.max(1, Math.round(leadingSpaces / 2));
          out.push('  '.repeat(depth) + content);
        }
      } else if (existingIndent > 0) {
        // Space-indented plain line → submodule
        const depth = Math.max(1, Math.round(existingIndent / 2));
        out.push('  '.repeat(depth) + trimmed);
      } else {
        // Plain unindented line → module title
        out.push(trimmed);
        afterPlainTitle = true;
      }
    }

    return out.join('\n');
  };

  const onPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>, key: string) => {
    e.preventDefault();
    const target = e.target as HTMLTextAreaElement;
    const cursorStart = target.selectionStart;
    const cursorEnd = target.selectionEnd;
    const currentText = sessionTexts[key] || '';

    let normalized = '';

    // 1. Try HTML clipboard first (Word, Google Docs, ChatGPT rich copy)
    const htmlData = e.clipboardData.getData('text/html');
    if (htmlData && htmlData.trim()) {
      const parsed = parseHtmlClipboard(htmlData);
      if (parsed.trim()) normalized = parsed;
    }

    // 2. Fall back to plain text
    if (!normalized) {
      const plain = e.clipboardData.getData('text/plain') || e.clipboardData.getData('text');
      if (plain) {
        normalized = normalizePlainText(plain.replace(/\t/g, '  '));
      }
    }

    if (!normalized) return;

    const newValue = currentText.substring(0, cursorStart) + normalized + currentText.substring(cursorEnd);
    handleTextChange(key, newValue);
    setTimeout(() => {
      target.selectionStart = target.selectionEnd = cursorStart + normalized.length;
    }, 0);
  };

  // Initialize session texts from scheduleItems
  useEffect(() => {
    // Only re-initialize if the schedule items were cleared (effectively a reset)
    if (scheduleItems.length === 0) {
      setSessionTexts({});
      return;
    }

    // Group existing items by session once to initial setup
    // But we don't want to overwrite user typing in real-time
    if (Object.keys(sessionTexts).length === 0 && scheduleItems.length > 0) {
      const newTexts: Record<string, string> = {};
      const grouping: Record<string, Array<{ title: string, submodules: string[] }>> = {};

      scheduleItems.forEach(item => {
        const key = `${item.day_number}-${item.start_time}`;
        if (!grouping[key]) grouping[key] = [];
        const title = typeof item.module_title === 'string' ? item.module_title : '';
        const subs = Array.isArray(item.submodules) ? item.submodules : [];
        grouping[key].push({ title, submodules: subs });
      });

      Object.entries(grouping).forEach(([key, modules]) => {
        newTexts[key] = modules.map(m => {
          const subsText = m.submodules.map(s => `  ${s}`).join('\n');
          return `${m.title}${subsText ? '\n' + subsText : ''}`;
        }).join('\n\n');
      });
      setSessionTexts(newTexts);
    }
  }, [scheduleItems, sessionTexts]);

  const syncToSchedule = (newSessionTexts: Record<string, string>) => {
    const newItems: Array<ScheduleItemData & { id: string; submodules: string[]; module_titles?: string[] }> = [];

    for (let day = 1; day <= daysCount; day++) {
      const daySessions = customSessions[day] || defaultSessions;
      for (const session of daySessions) {
        const key = `${day}-${session.startTime}`;
        const text = newSessionTexts[key];
        if (!text || !text.trim()) continue;

        const lines = text.split('\n');
        let current: { title: string; submodules: string[] } | null = null;

        for (const line of lines) {
          if (!line.trim()) continue;

          const isIndented = /^\s+/.test(line);
          const cleaned = line.trim();

          if (isIndented && current) {
            current.submodules.push(cleaned);
          } else {
            if (current) {
              newItems.push({
                id: `mod-${day}-${session.startTime}-${newItems.length}-${Date.now()}`,
                day_number: day,
                start_time: session.startTime,
                end_time: session.endTime,
                module_title: current.title,
                submodule_title: current.submodules,
                duration_minutes: 60,
                submodules: current.submodules
              });
            }
            current = { title: cleaned, submodules: [] };
          }
        }

        if (current) {
          newItems.push({
            id: `mod-${day}-${session.startTime}-${newItems.length}-${Date.now()}`,
            day_number: day,
            start_time: session.startTime,
            end_time: session.endTime,
            module_title: current.title,
            submodule_title: current.submodules,
            duration_minutes: 60,
            submodules: current.submodules
          });
        }
      }
    }

    onChange(newItems);
  };

  const handleTextChange = (key: string, text: string) => {
    const updated = { ...sessionTexts, [key]: text };
    setSessionTexts(updated);
    syncToSchedule(updated);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, key: string) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const selStart = target.selectionStart;
      const selEnd = target.selectionEnd;
      const text = sessionTexts[key] || '';

      if (selStart === selEnd) {
        // No selection — insert 2 spaces at cursor position
        const newValue = text.substring(0, selStart) + '  ' + text.substring(selEnd);
        handleTextChange(key, newValue);
        setTimeout(() => {
          target.selectionStart = target.selectionEnd = selStart + 2;
        }, 0);
      } else {
        // Multi-line selection — indent or unindent each line in the selection
        // Extend selection start to the beginning of the first selected line
        const lineStart = text.lastIndexOf('\n', selStart - 1) + 1;
        const region = text.substring(lineStart, selEnd);

        let newRegion: string;
        if (e.shiftKey) {
          // Shift+Tab: remove up to 2 leading spaces from each non-empty line
          newRegion = region.replace(/^(  | )/gm, '');
        } else {
          // Tab: add 2 spaces to the start of each line (skip blank lines)
          newRegion = region.replace(/^(?!$)/gm, '  ');
        }

        const newValue = text.substring(0, lineStart) + newRegion + text.substring(selEnd);
        handleTextChange(key, newValue);

        // Restore a visible selection covering the modified region
        setTimeout(() => {
          target.selectionStart = lineStart;
          target.selectionEnd = lineStart + newRegion.length;
        }, 0);
      }
    }
  };

  const sessionMap = (() => {
    const map = new Map<string, SessionData>();
    for (let day = 1; day <= daysCount; day++) {
      const daySessions = customSessions[day] || defaultSessions;
      daySessions.forEach((session) => {
        const key = `${day}-${session.startTime}`;
        map.set(key, {
          dayNumber: day,
          startTime: session.startTime,
          endTime: session.endTime,
          durationMinutes: 60,
          modules: [],
        });
      });
    }

    scheduleItems.forEach((item) => {
      const key = `${item.day_number}-${item.start_time}`;
      const session = map.get(key);
      if (session) {
        // Prevent duplicate modules by ID
        if (!session.modules.find(m => m.id === item.id)) {
          session.modules.push({
            id: item.id,
            moduleTitle: typeof item.module_title === 'string' ? item.module_title : '',
            submodules: Array.isArray(item.submodules) ? item.submodules : [],
          });
        }
      }
    });
    return map;
  })();

  const addModuleToSession = (day: number, session: any) => {
    const newModule = {
      id: `mod-${Date.now()}-${Math.random()}`,
      day_number: day,
      start_time: session.startTime,
      end_time: session.endTime,
      module_title: 'New Module',
      submodule_title: [],
      submodules: [],
      duration_minutes: 60,
    };
    onChange([...scheduleItems, newModule]);
  };

  const deleteModule = (id: string) => {
    onChange(scheduleItems.filter(m => m.id !== id));
  };

  const updateModuleTitle = (id: string, newTitle: string) => {
    onChange(scheduleItems.map(m => m.id === id ? { ...m, module_title: newTitle } : m));
  };

  const addSubmodule = (moduleId: string) => {
    onChange(scheduleItems.map(m => m.id === moduleId ? { ...m, submodules: [...m.submodules, 'New subtopic'] } : m));
  };

  const updateSubmodule = (moduleId: string, subIdx: number, newTitle: string) => {
    onChange(scheduleItems.map(m => {
      if (m.id === moduleId) {
        const newSubs = [...m.submodules];
        newSubs[subIdx] = newTitle;
        return { ...m, submodules: newSubs };
      }
      return m;
    }));
  };

  const removeSubmodule = (moduleId: string, subIdx: number) => {
    onChange(scheduleItems.map(m => {
      if (m.id === moduleId) {
        const newSubs = m.submodules.filter((_, i) => i !== subIdx);
        return { ...m, submodules: newSubs };
      }
      return m;
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-50 rounded-lg">
            <BookOpen className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Course Syllabus</h3>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-0.5">Session-Based Editor</p>
          </div>
        </div>
        <div className="flex bg-gray-100/80 p-1.5 rounded-xl border border-gray-200/50">
          <button
            type="button"
            onClick={() => setViewMode('editor')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${viewMode === 'editor' ? 'bg-white text-teal-600 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${viewMode === 'editor' ? 'bg-teal-500 animate-pulse' : 'bg-gray-300'}`}></div>
            Editor Mode
          </button>
          <button
            type="button"
            onClick={() => setViewMode('preview')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${viewMode === 'preview' ? 'bg-white text-teal-600 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${viewMode === 'preview' ? 'bg-teal-500' : 'bg-gray-300'}`}></div>
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
                Add modules for each session below. **Parent Modules** (no indent). **Subtopics** (indented with Tab/Space).
                Indentation is preserved when pasting.
              </p>
            </div>
          </div>

          {Array.from({ length: daysCount }, (_, dayIndex) => {
            const day = dayIndex + 1;
            return (
              <div key={day} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center text-xs font-bold">D{day}</span>
                    <h4 className="font-bold text-gray-900">Day {day} Schedule</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => addSessionToDay(day)}
                    className="text-[10px] font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-100 transition-all hover:shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Session
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(customSessions[day] || defaultSessions).map(session => {
                    const key = `${day}-${session.startTime}`;
                    return (
                      <div key={key} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{session.name}</span>
                          <span className="text-[10px] text-teal-600 font-bold">{session.startTime} - {session.endTime}</span>
                        </div>
                        <textarea
                          className="w-full h-48 p-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-mono text-sm leading-relaxed transition-all resize-y whitespace-pre"
                          placeholder="Module Title&#10;  Subtopic 1..."
                          value={sessionTexts[key] || ''}
                          onChange={(e) => handleTextChange(key, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, key)}
                          onPaste={(e) => onPaste(e, key)}
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
        <div className="space-y-8">
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
                    <p className="text-sm text-gray-500">Structured Learning Path</p>
                  </div>
                  <div className="flex-1 border-b border-dashed border-gray-200 ml-2"></div>
                </div>

                <div className="space-y-6 ml-5 pl-5 border-l-2 border-teal-50">
                  {(customSessions[day] || defaultSessions).map((session) => {
                    const key = `${day}-${session.startTime}`;
                    const sessionData = sessionMap.get(key);
                    const modules = sessionData?.modules || [];

                    return (
                      <div key={session.startTime} className="relative group">
                        <div className="absolute -left-[35px] top-0 w-5 h-5 bg-white border-2 border-teal-200 rounded-full z-10 group-hover:bg-teal-500 group-hover:border-teal-500 transition-colors shadow-sm"></div>

                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold border border-gray-200">
                              <Clock className="w-3 h-3 mr-1.5 text-gray-500" />
                              {session.startTime} - {session.endTime}
                            </div>
                            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">{session.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => addModuleToSession(day, session)}
                            className="text-[10px] font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 bg-teal-50 px-2 py-1 rounded-md transition-all hover:bg-teal-100"
                          >
                            <Plus className="w-3 h-3" /> Add Module
                          </button>
                        </div>

                        <div className="space-y-4">
                          {modules.map((module, idx) => (
                            <div
                              key={module.id}
                              className="bg-white rounded-xl border border-gray-100 shadow-sm transition-all hover:shadow-md overflow-hidden"
                            >
                              <div className="p-4">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="w-6 h-6 rounded-md bg-teal-50 text-teal-600 flex items-center justify-center text-[10px] font-bold border border-teal-100">
                                    {idx + 1}
                                  </div>
                                  <input
                                    type="text"
                                    value={module.moduleTitle}
                                    onChange={(e) => updateModuleTitle(module.id, e.target.value)}
                                    className="flex-1 text-gray-900 font-semibold text-sm border-none focus:ring-0 p-0 hover:bg-gray-50 rounded px-1 transition-colors"
                                    placeholder="Module Title"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => deleteModule(module.id)}
                                    className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>

                                <div className="pl-9 space-y-1.5 mt-1">
                                   {module.submodules.map((sm, smIdx) => (
                                     <div key={smIdx} className="flex items-center gap-2 group/sub">
                                       <div className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />
                                       <input
                                         type="text"
                                         value={sm}
                                         onChange={(e) => updateSubmodule(module.id, smIdx, e.target.value)}
                                         className="flex-1 text-gray-600 text-sm border-none focus:ring-0 p-0 bg-transparent hover:bg-gray-50 rounded px-1 transition-colors"
                                       />
                                       <button
                                         type="button"
                                         onClick={() => removeSubmodule(module.id, smIdx)}
                                         className="opacity-0 group-hover/sub:opacity-100 p-0.5 text-gray-300 hover:text-red-400 transition-all"
                                       >
                                         <X className="w-3.5 h-3.5" />
                                       </button>
                                     </div>
                                   ))}
                                   <button
                                     type="button"
                                     onClick={() => addSubmodule(module.id)}
                                     className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-teal-600 mt-2 transition-colors"
                                   >
                                     <Plus className="w-3.5 h-3.5" /> Add subtopic
                                   </button>
                                 </div>
                              </div>
                            </div>
                          ))}
                          {modules.length === 0 && (
                            <div className="bg-gray-50/50 border border-dashed border-gray-100 rounded-xl p-4 text-center cursor-pointer hover:bg-gray-100/50 transition-colors" onClick={() => addModuleToSession(day, session)}>
                              <p className="text-[11px] text-gray-300 italic">No modules assigned. Click "Add Module" to start.</p>
                            </div>
                          )}
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
