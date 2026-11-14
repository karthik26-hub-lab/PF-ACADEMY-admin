// Reports (Phase 4): one page per report, opened from the Reports tiles (#reports-revenue, -performance, …).
import type { ReportKind } from '../../lib/router';
import { Attendance } from './Attendance';
import { Learning } from './Learning';
import { Performance } from './Performance';
import { Revenue } from './Revenue';

export function ReportPage({ kind }: { kind: ReportKind }) {
  return kind === 'revenue' ? <Revenue /> : kind === 'performance' ? <Performance /> : kind === 'learning' ? <Learning /> : <Attendance />;
}
