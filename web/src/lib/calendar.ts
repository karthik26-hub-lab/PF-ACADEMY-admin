import type { Batch, CalendarEvent, Course, Delivery, EventType, RecordedType } from './store';

// ---------- Live calendar (offline and online) ----------
export type LiveField = 'title' | 'subject' | 'topic' | 'faculty' | 'batch' | 'date' | 'time' | 'delivery';

/** Which fields each entry type asks for, as agreed with the client. Fields in neither list are hidden. */
export const LIVE_RULES: Record<EventType, { req: LiveField[]; opt: LiveField[]; allBatches?: boolean }> = {
  class: { req: ['title', 'subject', 'topic', 'faculty', 'batch', 'date', 'time', 'delivery'], opt: [] },
  exam: { req: ['title', 'subject', 'batch', 'date', 'time', 'delivery'], opt: [] },
  deadline: { req: ['title', 'date'], opt: ['batch'] },
  holiday: { req: ['batch', 'date'], opt: ['title'], allBatches: true },
  event: { req: ['title', 'batch', 'date', 'time'], opt: [], allBatches: true },
  task: { req: ['title', 'subject', 'batch', 'date'], opt: ['time'] },
};

/** `tone` names the soft colour set in index.css (tone-soft, tone-bar, …); `dot` is a ready-made swatch. */
export const LIVE_TYPE: Record<EventType, { label: string; plural: string; tone: string; dot: string }> = {
  class: { label: 'Class', plural: 'Classes', tone: 'tone-class', dot: 'tone-class tone-bar' },
  exam: { label: 'Exam', plural: 'Exams', tone: 'tone-exam', dot: 'tone-exam tone-bar' },
  deadline: { label: 'Deadline', plural: 'Deadlines', tone: 'tone-deadline', dot: 'tone-deadline tone-bar' },
  holiday: { label: 'Holiday', plural: 'Holidays', tone: 'tone-holiday', dot: 'tone-holiday tone-bar' },
  event: { label: 'Event', plural: 'Events', tone: 'tone-event', dot: 'tone-event tone-bar' },
  task: { label: 'Task', plural: 'Tasks', tone: 'tone-task', dot: 'tone-task tone-bar' },
};
export const LIVE_TYPES = Object.keys(LIVE_TYPE) as EventType[];

export const DELIVERY: Record<Delivery, string> = { offline: 'Offline', online: 'Online Live' };

/** Classes and exams appear where their switches are on; every other type belongs to both live views. */
export function inLiveView(e: CalendarEvent, view: Delivery) {
  if (e.type === 'class' || e.type === 'exam') return (e.delivery ?? ['offline', 'online']).includes(view);
  return true;
}

/** The course whose students see a deadline, or null when the whole academy does. */
export const deadlineCourse = (e: CalendarEvent, batches: Batch[]): Course | null => (e.batchId ? batches.find((b) => b.id === e.batchId)?.course ?? null : null);

/** Batch filter: deadlines reach the whole course of their batch; other entries match their batch or the whole academy. */
export function matchesBatch(e: CalendarEvent, batchId: string, batches: Batch[]) {
  if (batchId === 'all' || !e.batchId) return true;
  if (e.type === 'deadline') return deadlineCourse(e, batches) === batches.find((b) => b.id === batchId)?.course;
  return e.batchId === batchId;
}

export const timeRange = (e: Pick<CalendarEvent, 'time' | 'end'>) => (e.time ? (e.end ? `${e.time}–${e.end}` : e.time) : 'All day');

// ---------- Recorded plans ----------
export type RecField = 'day' | 'type' | 'subject' | 'chapter' | 'videos' | 'topics';
export const REC_RULES: Record<RecordedType, RecField[]> = {
  class: ['day', 'type', 'subject', 'chapter', 'videos', 'topics'],
  revision: ['day', 'type', 'subject', 'chapter', 'topics'],
  task: ['day', 'type', 'subject', 'chapter', 'topics'],
  buffer: ['day', 'type'],
};
export const REC_TYPE: Record<RecordedType, { label: string; plural: string; tone: string; dot: string }> = {
  class: { label: 'Class', plural: 'Classes', tone: 'tone-class', dot: 'tone-class tone-bar' },
  revision: { label: 'Revision', plural: 'Revision', tone: 'tone-revision', dot: 'tone-revision tone-bar' },
  buffer: { label: 'Buffer', plural: 'Buffer', tone: 'tone-buffer', dot: 'tone-buffer tone-bar' },
  task: { label: 'Task', plural: 'Tasks', tone: 'tone-task', dot: 'tone-task tone-bar' },
};
export const REC_TYPES = Object.keys(REC_TYPE) as RecordedType[];

/** "Video 1, Video 2; Video 3" → ["Video 1", "Video 2", "Video 3"] */
export const parseVideos = (s: string) => s.split(/[,;\n]/).map((x) => x.trim()).filter(Boolean);
