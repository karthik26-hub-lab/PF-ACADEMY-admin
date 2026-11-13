// Roles and permissions, copied from the client's Faculty UI brief.
// Each feature row gives what Faculty, Reviewer, Exam Manager and Academy Admin may do, in the client's words.
import type { CustomRole, Level } from './store';

export const BUILT_IN = [
  { name: 'Faculty', kind: 'Teaching role', desc: 'Teaches assigned subjects, accesses assigned students and conducts academic activities.' },
  { name: 'Reviewer', kind: 'Evaluation role', desc: 'Reviews answer scripts, evaluates descriptive questions and provides feedback.' },
  { name: 'Exam manager', kind: 'Examination role', desc: 'Creates and manages tests, schedules examinations and handles submissions and results.' },
  { name: 'Academy admin', kind: 'Administrative role', desc: 'Manages academy operations, users, academic content, examinations and reports.' },
] as const;

export const LEVELS: Record<Level | 'none', { label: string; desc: string }> = {
  full: { label: 'Full', desc: 'Can view, create, edit and manage.' },
  assigned: { label: 'Assigned', desc: 'Only their assigned subjects, batches or students.' },
  limited: { label: 'Limited', desc: 'Specified activities, but not the whole section.' },
  view: { label: 'View', desc: 'Read-only access.' },
  none: { label: 'No access', desc: 'Section is hidden or inaccessible.' },
};

type Row = [feature: string, faculty: string, reviewer: string, examManager: string, admin: string];
export const MODULES: { name: string; note?: string; rows: Row[] }[] = [
  { name: 'Academics', note: 'A Reviewer only sees students whose answer scripts they are assigned to evaluate, not the whole directory.', rows: [
    ['Batch directory', 'Assigned', 'Assigned', 'All', 'Full'], ['Create batches', 'No', 'No', 'No', 'Full'], ['Edit batch details', 'No', 'No', 'No', 'Full'],
    ['View students', 'Assigned', 'Assigned examinees', 'All', 'Full'], ['Add students', 'No', 'No', 'No', 'Full'], ['Edit student details', 'No', 'No', 'No', 'Full'],
    ['Suspend student', 'No', 'No', 'No', 'Full'], ['Faculty directory', 'No', 'No', 'No', 'Full'], ['Assign faculty', 'No', 'No', 'No', 'Full'],
    ['Academic calendar', 'Assigned schedules', 'Exam schedules', 'Full', 'Full'], ['Create academic events', 'No', 'No', 'Limited', 'Full'],
  ] },
  { name: 'Learning', note: 'Faculty may upload supplementary material; the Academy Admin decides whether it is published to students.', rows: [
    ['View courses', 'Assigned', 'Assigned', 'All', 'Full'], ['Create courses', 'No', 'No', 'No', 'Full'], ['Edit course structure', 'No', 'No', 'No', 'Full'],
    ['View study materials', 'Assigned', 'Assigned', 'All', 'Full'], ['Upload materials', 'Assigned', 'No', 'No', 'Full'], ['Edit/delete materials', 'Own uploads / assigned scope', 'No', 'No', 'Full'],
    ['Publish materials', 'Limited', 'No', 'No', 'Full'], ['Create announcements', 'Assigned batches', 'No', 'Exam-related only', 'Full'],
    ['Schedule announcements', 'No', 'No', 'Exam-related', 'Full'], ['Publish announcements', 'Assigned batches, if permitted', 'No', 'Exam-related', 'Full'],
  ] },
  { name: 'Assessments', note: 'Reviewers can’t change questions or exam settings, can enter marks but not publish results, and faculty can’t change marks after submission without an authorised review.', rows: [
    ['Question bank', 'Assigned subjects – view', 'No', 'Full', 'Full'], ['Add questions', 'Assigned subjects', 'No', 'Full', 'Full'], ['Edit questions', 'Own questions / assigned scope', 'No', 'Full', 'Full'],
    ['Create test', 'Assigned subjects, if permitted', 'No', 'Full', 'Full'], ['Schedule tests', 'No', 'No', 'Full', 'Full'], ['View scheduled tests', 'Assigned batches', 'Assigned evaluations', 'Full', 'Full'],
    ['Manage submissions', 'Assigned batches', 'Assigned scripts', 'Full', 'Full'], ['Evaluate MCQs (view results)', 'View results', 'No', 'Full', 'Full'],
    ['Evaluate descriptive', 'Assigned scripts', 'Assigned scripts', 'Full', 'Full'], ['AI-assisted evaluation', 'If authorised', 'If authorised', 'Full', 'Full'],
    ['Review evaluations', 'Assigned', 'Assigned', 'Full', 'Full'], ['Modify marks', 'No by default', 'No by default', 'Full', 'Full'], ['Publish results', 'No', 'No', 'Full', 'Full'],
    ['View results', 'Assigned students', 'Assigned evaluations', 'Full', 'Full'],
  ] },
  { name: 'Reports', note: 'Faculty follow their own students, without academy-wide comparisons or money. Reviewers see only what their evaluation needs.', rows: [
    ['Performance analytics', 'Assigned students', 'Assigned evaluations', 'Full', 'Full'], ['Learning analytics', 'Assigned students', 'No', 'View', 'Full'],
    ['Attendance', 'Assigned batches', 'No', 'View', 'Full'], ['Student-wise reports', 'Assigned students', 'Assigned evaluations', 'Full', 'Full'],
    ['Batch comparisons', 'Assigned batches', 'No', 'Full', 'Full'], ['Export reports', 'Limited', 'No', 'Full', 'Full'],
  ] },
  { name: 'Other sections', note: 'Store and money are permissioned separately; even an Academy Admin doesn’t get subscription billing or owner controls automatically.', rows: [
    ['Dashboard', 'Personal/assigned overview', 'Evaluation overview', 'Examination overview', 'Full academy dashboard'], ['Store', 'View, if needed', 'No', 'No', 'Full'],
    ['Revenue', 'No', 'No', 'No', 'View, if authorised'], ['Academy profile', 'No', 'No', 'No', 'Edit'], ['User access', 'No', 'No', 'No', 'Manage'],
    ['Roles & permissions', 'No', 'No', 'No', 'Manage'], ['Notifications', 'Own preferences', 'Own preferences', 'Own preferences', 'Manage academy settings'],
    ['Integrations', 'No', 'No', 'No', 'Manage'], ['Security', 'Own account', 'Own account', 'Own account', 'Manage academy security'],
    ['Subscription & billing', 'No', 'No', 'No', 'Owner only'],
  ] },
];

/** Reads the client's wording as a level, for colouring: "No…" → none, "Full/All/Manage/Edit" → full, "View…" → view, "Limited" → limited, else assigned. */
export const levelOf = (text: string): Level | 'none' =>
  /^no\b/i.test(text) ? 'none' : /^(full|all|manage|edit|owner)/i.test(text) ? 'full' : /^view\b/i.test(text) ? 'view' : /^limited/i.test(text) ? 'limited' : 'assigned';

/** A starting point for a new role: Faculty's levels. */
export const facultyPerms = (): CustomRole['perms'] =>
  Object.fromEntries(MODULES.flatMap((m) => m.rows).flatMap(([f, fac]) => { const l = levelOf(fac); return l === 'none' ? [] : [[f, l]]; }));
