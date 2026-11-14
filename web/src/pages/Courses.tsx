// Learning · Courses and study materials.
//   Courses page        — the three courses with their structure and material mix.
//   Course explorer     — Drive-style: subjects (in Group I / II) → chapters → materials; build the structure and upload here.
//   All materials page  — every material across courses, with the same toggles and filters.
import { BookOpen, ChevronRight, CloudUpload, FileText, Folder, FolderOpen, FolderPlus, Link2, MoreHorizontal, NotebookPen, Pencil, PlayCircle, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react';
import { useMemo, useRef, useState, type ElementType } from 'react';
import { toast } from 'sonner';
import { Page } from '../components/layout/Page';
import { celebrate } from '../components/Celebrate';
import { Badge, Button, Card, Dialog, DropdownContent, DropdownItem, DropdownMenu, DropdownSeparator, DropdownTrigger, EmptyState, Field, Input, Segmented, Select, Switch, btn } from '../components/ui';
import { KIND, placeOf, type Chapter, type CourseInfo, type Folder as FolderT, type Material, type MaterialKind, type Subject } from '../lib/courses';
import { href, navigate } from '../lib/router';
import { uid, useStore } from '../lib/store';
import { cn, fmtDate } from '../lib/utils';
import { CourseToggle, type CourseFilter } from './store/shared';

const ICON: Record<MaterialKind, ElementType> = { notes: NotebookPen, study: BookOpen, video: PlayCircle, link: Link2 };
const KIND_TONE: Record<MaterialKind, string> = { notes: 'tone-task', study: 'tone-class', video: 'tone-deadline', link: 'tone-event' };
/** "1 material", "3 materials" */
const n = (k: number, word: string) => `${k} ${word}${k === 1 ? '' : 's'}`;
const STATUS: Record<Material['status'], { label: string; tone: 'pop' | 'neutral' | 'ink' }> = { published: { label: 'Published', tone: 'pop' }, draft: { label: 'Draft', tone: 'neutral' }, archived: { label: 'Archived', tone: 'ink' } };
type Filters = { q: string; kind: 'all' | MaterialKind; status: 'all' | Material['status']; batch: string };
const NONE: Filters = { q: '', kind: 'all', status: 'all', batch: 'all' };
const matches = (m: Material, f: Filters) => (f.kind === 'all' || m.kind === f.kind) && (f.status === 'all' ? m.status !== 'archived' : m.status === f.status)
  && (f.batch === 'all' || !m.batchIds.length || m.batchIds.includes(f.batch)) && `${m.title} ${m.file ?? ''}`.toLowerCase().includes(f.q.toLowerCase());

// ---------- Courses page ----------
export function Courses() {
  const { courses, materials, batches, updateCourse } = useStore();
  return (
    <Page crumbs={[{ label: 'Learning', href: href({ page: 'learning' }) }, { label: 'Courses' }]} actions={<a href={href({ page: 'materials' })} className={btn('secondary')}><FileText /> All materials</a>}>
      <div className="mb-5"><h1 className="text-[28px] font-bold tracking-[-0.03em]">Courses</h1><p className="text-sm text-muted">Build what students see: course → subjects → chapters, with study materials inside.</p></div>
      <div className="grid gap-4 lg:grid-cols-3">{courses.map((c) => {
        const mine = materials.filter((m) => m.courseId === c.id && m.status !== 'archived'), chapters = c.subjects.reduce((a, s) => a + s.chapters.length, 0);
        const kinds = (Object.keys(KIND) as MaterialKind[]).map((k) => [k, mine.filter((m) => m.kind === k).length] as const).filter(([, n]) => n);
        const groups = [...new Set(c.subjects.map((s) => s.group).filter(Boolean))];
        return (
          <div key={c.id} className={cn('flex flex-col rounded-2xl bg-panel p-5 ring-1 ring-black/[0.04] dark:ring-white/[0.06]', !c.active && 'opacity-70')}>
            <div className="flex items-start justify-between gap-2">
              <div><div className="text-lg font-bold tracking-tight">{c.name}</div><div className="text-xs text-muted">{c.desc}</div></div>
              <label className="flex items-center gap-2 text-2xs text-muted">{c.active ? 'Active' : 'Hidden'}<Switch label={`${c.name} active`} checked={c.active} onCheckedChange={(v) => { updateCourse(c.id, { active: v }); toast(v ? `${c.name} is visible to students` : `${c.name} is hidden from students`); }} /></label>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">{[['Subjects', c.subjects.length], ['Chapters', chapters], ['Materials', mine.length]].map(([k, v]) => (
              <div key={k as string} className="rounded-xl bg-subtle p-2.5"><div className="tnum text-xl font-bold leading-tight">{v}</div><div className="text-2xs text-muted">{k}</div></div>
            ))}</div>
            <div className="mt-4 text-2xs text-muted">Materials by type</div>
            <div className="mt-1.5 flex h-2 gap-0.5 overflow-hidden rounded-full bg-border">{kinds.map(([k, n]) => <span key={k} className={cn('tone-bar', KIND_TONE[k])} style={{ flex: n }} title={`${KIND[k].label}: ${n}`} />)}</div>
            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted">{kinds.map(([k, n]) => <span key={k} className="flex items-center gap-1"><i className={cn('tone-bar size-1.5 rounded-full', KIND_TONE[k])} />{KIND[k].label} {n}</span>)}</div>
            <div className="mt-3 text-2xs text-muted">{groups.length ? `${groups.join(' · ')} · ` : ''}{batches.filter((b) => b.course === c.name && b.status === 'active').length} active batches</div>
            <a href={href({ page: 'course', id: c.id })} className={cn(btn('primary'), 'mt-4')}>Open course <ChevronRight /></a>
          </div>
        );
      })}</div>
    </Page>
  );
}

// ---------- Shared pieces ----------
function FilterBar({ f, set, batches, extra }: { f: Filters; set: (p: Partial<Filters>) => void; batches: { id: string; name: string }[]; extra?: React.ReactNode }) {
  const on = f.q || f.kind !== 'all' || f.status !== 'all' || f.batch !== 'all';
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64"><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" /><Input value={f.q} onChange={(e) => set({ q: e.target.value })} placeholder="Search materials" className="pl-10" aria-label="Search materials" /></div>
        <Select aria-label="Batch" value={f.batch} onChange={(e) => set({ batch: e.target.value })} className="w-full sm:w-52"><option value="all">Any batch</option>{batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select>
        <Segmented value={f.status} onChange={(v) => set({ status: v })} options={[{ value: 'all', label: 'All' }, { value: 'published', label: 'Published' }, { value: 'draft', label: 'Drafts' }, { value: 'archived', label: 'Archived' }]} />
        {extra}
        {on && <Button size="sm" variant="ghost" onClick={() => set(NONE)}><X /> Clear</Button>}
      </div>
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 [scrollbar-width:none]">{(['all', ...Object.keys(KIND)] as ('all' | MaterialKind)[]).map((k) => (
        <button key={k} type="button" onClick={() => set({ kind: k })} className={cn('flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ring-1 ring-inset transition-colors', f.kind === k ? 'bg-fg text-bg ring-fg' : 'text-muted ring-border-strong hover:text-fg')}>
          {k !== 'all' && (() => { const I = ICON[k]; return <I className="size-3.5" />; })()}{k === 'all' ? 'All types' : KIND[k].label}</button>
      ))}</div>
    </div>
  );
}

/** One material: type, title, where it sits, who can see it, status and its actions. */
function MaterialRow({ m, course, showPlace, onEdit, onReplace }: { m: Material; course?: CourseInfo; showPlace?: boolean; onEdit: () => void; onReplace: () => void }) {
  const { batches, patchMaterial, removeMaterial } = useStore();
  const I = ICON[m.kind];
  const access = m.batchIds.length ? `${m.batchIds.length === 1 ? batches.find((b) => b.id === m.batchIds[0])?.name : `${m.batchIds.length} batches`}` : `All ${course?.name ?? ''} batches`;
  return (
    <li className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-subtle">
      <span className={cn('tone-soft grid size-9 shrink-0 place-items-center rounded-lg', KIND_TONE[m.kind])}><I className="size-4" /></span>
      <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left">
        <span className="block truncate text-sm font-semibold">{m.title}</span>
        <span className="block truncate text-2xs text-muted">{showPlace && `${course?.name} › ${placeOf(course, m)} · `}{KIND[m.kind].label} · {m.file ?? m.url} · {access}</span>
      </button>
      <span className="hidden text-2xs text-faint sm:block">v{m.version} · {fmtDate(m.updatedAt)}</span>
      <Badge tone={STATUS[m.status].tone}>{STATUS[m.status].label}</Badge>
      <DropdownMenu>
        <DropdownTrigger className={btn('ghost', 'icon', 'size-8')} aria-label={`Actions for ${m.title}`}><MoreHorizontal /></DropdownTrigger>
        <DropdownContent align="end">
          <DropdownItem onSelect={onEdit}><Pencil /> Edit details</DropdownItem>
          {!KIND[m.kind].byLink || m.file ? <DropdownItem onSelect={onReplace}><RefreshCw /> Replace file</DropdownItem> : null}
          {m.status === 'published' ? <DropdownItem onSelect={() => { patchMaterial(m.id, { status: 'draft' }); toast('Unpublished: students no longer see it'); }}>Unpublish</DropdownItem>
            : <DropdownItem onSelect={() => { patchMaterial(m.id, { status: 'published' }); toast.success('Published to students'); }}>Publish</DropdownItem>}
          {m.status !== 'archived' && <DropdownItem onSelect={() => { patchMaterial(m.id, { status: 'archived' }); toast('Archived'); }}>Archive</DropdownItem>}
          <DropdownSeparator />
          <DropdownItem danger onSelect={() => { removeMaterial(m.id); toast(`“${m.title}” deleted`); }}><Trash2 /> Delete</DropdownItem>
        </DropdownContent>
      </DropdownMenu>
    </li>
  );
}

// ---------- Course explorer ----------
/** Where you are: course root, a subject, a chapter, and optionally a folder inside either. */
type Path = { subjectId?: string; chapterId?: string; folderId?: string };
type Popup = { kind: 'upload'; at: Path } | { kind: 'edit'; m: Material } | { kind: 'replace'; m: Material }
  | { kind: 'subject'; subject?: Subject } | { kind: 'chapter'; subjectId: string; chapter?: Chapter } | { kind: 'folder'; at: Path; folder?: FolderT }
  | { kind: 'delete'; what: 'subject' | 'chapter' | 'folder'; id: string; name: string } | null;

/** Folders sitting directly in a place (a subject, chapter or folder). */
const foldersIn = (all: FolderT[], at: Path) => all.filter((f) => f.subjectId === at.subjectId && (f.chapterId ?? '') === (at.chapterId ?? '') && (f.parentId ?? '') === (at.folderId ?? ''));
/** A folder and everything nested under it. */
const withChildren = (all: FolderT[], id: string): string[] => [id, ...all.filter((f) => f.parentId === id).flatMap((f) => withChildren(all, f.id))];

export function CourseExplorer({ id }: { id: string }) {
  const { courses, materials, folders: allFolders, batches, updateCourse, removeMaterial, removeFolders } = useStore();
  const c = courses.find((x) => x.id === id);
  const [path, setPath] = useState<Path>({});
  const [f, setF] = useState<Filters>(NONE);
  const [pop, setPop] = useState<Popup>(null);
  const mine = useMemo(() => materials.filter((m) => m.courseId === id), [materials, id]);
  if (!c) return <Page crumbs={[{ label: 'Courses', href: href({ page: 'courses' }) }, { label: 'Not found' }]}><Card><EmptyState icon={Folder} title="Course not found" /></Card></Page>;
  const folders = allFolders.filter((x) => x.courseId === id);
  const set = (p: Partial<Filters>) => setF((x) => ({ ...x, ...p }));
  const subject = c.subjects.find((s) => s.id === path.subjectId), chapter = subject?.chapters.find((x) => x.id === path.chapterId);
  const chain: FolderT[] = []; for (let fid = path.folderId; fid;) { const fo = folders.find((x) => x.id === fid); if (!fo) break; chain.unshift(fo); fid = fo.parentId; }
  const searching = f.q || f.kind !== 'all' || f.status !== 'all' || f.batch !== 'all';
  const count = (sid: string, cid?: string) => mine.filter((m) => m.subjectId === sid && (!cid || m.chapterId === cid) && m.status !== 'archived').length;
  const inFolder = (fid: string) => { const ids = withChildren(folders, fid); return mine.filter((m) => m.folderId && ids.includes(m.folderId) && m.status !== 'archived').length; };
  const here = searching
    ? mine.filter((m) => matches(m, f) && (!subject || m.subjectId === subject.id) && (!chapter || m.chapterId === chapter.id) && (!path.folderId || withChildren(folders, path.folderId).includes(m.folderId ?? '')))
    : subject ? mine.filter((m) => m.status !== 'archived' && m.subjectId === subject.id && (m.chapterId ?? '') === (path.chapterId ?? '') && (m.folderId ?? '') === (path.folderId ?? '')) : [];
  const subFolders = subject && !searching ? foldersIn(folders, path) : [];
  const courseBatches = batches.filter((b) => b.course === c.name && b.status === 'active');
  const groups = [...new Set(c.subjects.map((s) => s.group))];
  const close = () => setPop(null);
  const go = (p: Path) => { setPath(p); setF(NONE); };
  const card = (key: string, name: string, sub: string, open: () => void, menu: React.ReactNode, mark?: 'folder') => (
    <div key={key} className="group flex items-center gap-3 rounded-2xl bg-subtle p-3 ring-1 ring-inset ring-border transition hover:bg-hover">
      <button type="button" onClick={open} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        {mark ? <FolderOpen className="size-8 shrink-0 text-muted" strokeWidth={1.25} /> : <Folder className="size-8 shrink-0 fill-[hsl(var(--sun)/0.35)] text-[hsl(var(--sun-fg))]" strokeWidth={1.25} />}
        <span className="min-w-0"><span className="block truncate text-sm font-semibold">{name}</span><span className="block text-2xs text-muted">{sub}</span></span></button>
      <DropdownMenu><DropdownTrigger className={btn('ghost', 'icon', 'size-7 opacity-60 group-hover:opacity-100')} aria-label={`Actions for ${name}`}><MoreHorizontal /></DropdownTrigger><DropdownContent align="end">{menu}</DropdownContent></DropdownMenu>
    </div>
  );
  const del = (what: 'subject' | 'chapter' | 'folder', did: string, name: string) => <><DropdownSeparator /><DropdownItem danger onSelect={() => setPop({ kind: 'delete', what, id: did, name })}><Trash2 /> Delete {what}</DropdownItem></>;
  const folderCards = subFolders.map((fo) => card(fo.id, fo.name, `${n(folders.filter((x) => x.parentId === fo.id).length, 'folder')} · ${n(inFolder(fo.id), 'material')}`, () => go({ ...path, folderId: fo.id }), <>
    <DropdownItem onSelect={() => setPop({ kind: 'folder', at: path, folder: fo })}><Pencil /> Rename</DropdownItem>{del('folder', fo.id, fo.name)}
  </>, 'folder'));

  return (
    <Page crumbs={[{ label: 'Learning', href: href({ page: 'learning' }) }, { label: 'Courses', href: href({ page: 'courses' }) }, { label: c.name }]}
      actions={<>
        {!subject ? <Button onClick={() => setPop({ kind: 'subject' })}><Plus /> New subject</Button>
          : <>{!chapter && !path.folderId && <Button onClick={() => setPop({ kind: 'chapter', subjectId: subject.id })}><Plus /> New chapter</Button>}<Button onClick={() => setPop({ kind: 'folder', at: path })}><FolderPlus /> New folder</Button></>}
        <Button variant="primary" onClick={() => setPop({ kind: 'upload', at: path })}><CloudUpload /> Upload</Button>
      </>}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-[28px] font-bold tracking-[-0.03em]">{c.name}</h1><p className="text-sm text-muted">{c.desc} · {mine.filter((m) => m.status !== 'archived').length} materials · {courseBatches.length} batches</p></div>
        <Badge tone={c.active ? 'pop' : 'neutral'}>{c.active ? 'Visible to students' : 'Hidden'}</Badge>
      </div>

      <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Tree: subjects by group, chapters inside */}
        <Card className="h-fit p-3">
          <button type="button" onClick={() => go({})} className={cn('mb-1 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold', !subject && 'bg-subtle')}><Folder className="size-4" />{c.name}</button>
          {groups.map((g) => (
            <div key={g || 'all'} className="mt-1">
              {g && <div className="px-2 pb-0.5 pt-2 text-[10px] font-bold uppercase tracking-wider text-faint">{g}</div>}
              {c.subjects.filter((s) => s.group === g).map((s) => (
                <div key={s.id}>
                  <button type="button" onClick={() => go({ subjectId: s.id })} className={cn('flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-xs', subject?.id === s.id && !chapter && !path.folderId ? 'bg-fg text-bg' : 'hover:bg-subtle')}>
                    <ChevronRight className={cn('size-3 shrink-0 transition-transform', subject?.id === s.id && 'rotate-90')} /><span className="truncate">{s.name}</span><span className="tnum ml-auto opacity-60">{count(s.id)}</span>
                  </button>
                  {subject?.id === s.id && s.chapters.map((ch) => (
                    <button key={ch.id} type="button" onClick={() => go({ subjectId: s.id, chapterId: ch.id })} className={cn('flex w-full items-center gap-1.5 rounded-lg py-1 pl-7 pr-2 text-left text-2xs', chapter?.id === ch.id ? 'bg-fg text-bg' : 'text-muted hover:bg-subtle hover:text-fg')}>
                      <span className="truncate">{ch.name}</span><span className="tnum ml-auto opacity-60">{count(s.id, ch.id)}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          ))}
          <button type="button" onClick={() => setPop({ kind: 'subject' })} className="mt-2 flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-muted hover:bg-subtle hover:text-fg"><Plus className="size-3.5" /> New subject</button>
        </Card>

        <Card className="min-w-0 p-4 sm:p-5">
          {/* Breadcrumb: course › subject › chapter › folders */}
          <div className="mb-3 flex flex-wrap items-center gap-1 text-sm">
            {[{ label: c.name, p: {} as Path }, ...(subject ? [{ label: subject.name, p: { subjectId: subject.id } }] : []), ...(chapter ? [{ label: chapter.name, p: { subjectId: subject!.id, chapterId: chapter.id } }] : []),
              ...chain.map((fo) => ({ label: fo.name, p: { subjectId: fo.subjectId, chapterId: fo.chapterId, folderId: fo.id } }))].map((x, i, arr) => (
              <span key={i} className="flex items-center gap-1">{i > 0 && <ChevronRight className="size-3.5 text-faint" />}<button type="button" onClick={() => go(x.p)} className={cn('font-semibold', i < arr.length - 1 && 'text-muted hover:text-fg')}>{x.label}</button></span>
            ))}
          </div>
          <div className="mb-4"><FilterBar f={f} set={set} batches={courseBatches} /></div>

          {!searching && !subject && groups.map((g) => (
            <section key={g || 'all'} className="mb-4">
              {g && <h3 className="mb-2 text-2xs font-semibold uppercase tracking-wide text-faint">{g}</h3>}
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{c.subjects.filter((s) => s.group === g).map((s) => card(s.id, s.name, `${n(s.chapters.length, 'chapter')} · ${n(count(s.id), 'material')}`, () => go({ subjectId: s.id }), <>
                <DropdownItem onSelect={() => setPop({ kind: 'subject', subject: s })}><Pencil /> Rename or move group</DropdownItem>
                <DropdownItem onSelect={() => setPop({ kind: 'chapter', subjectId: s.id })}><Plus /> Add chapter</DropdownItem>{del('subject', s.id, s.name)}
              </>))}</div>
            </section>
          ))}
          {!searching && subject && !chapter && !path.folderId && subject.chapters.length > 0 && (
            <section className="mb-4"><h3 className="mb-2 text-2xs font-semibold uppercase tracking-wide text-faint">Chapters</h3>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{subject.chapters.map((ch) => card(ch.id, ch.name, n(count(subject.id, ch.id), 'material'), () => go({ subjectId: subject.id, chapterId: ch.id }), <>
                <DropdownItem onSelect={() => setPop({ kind: 'chapter', subjectId: subject.id, chapter: ch })}><Pencil /> Rename</DropdownItem>{del('chapter', ch.id, ch.name)}
              </>))}</div></section>
          )}
          {folderCards.length > 0 && <section className="mb-4"><h3 className="mb-2 text-2xs font-semibold uppercase tracking-wide text-faint">Folders</h3><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{folderCards}</div></section>}
          {(searching || subject) && (here.length
            ? <section>{!searching && <h3 className="mb-1 text-2xs font-semibold uppercase tracking-wide text-faint">Files and links</h3>}
              <ul className="-mx-1 space-y-0.5">{here.map((m) => <MaterialRow key={m.id} m={m} course={c} showPlace={!!searching} onEdit={() => setPop({ kind: 'edit', m })} onReplace={() => setPop({ kind: 'replace', m })} />)}</ul></section>
            : searching ? <EmptyState compact icon={Search} title="No materials match" />
            : (chapter || path.folderId) && !folderCards.length && <EmptyState compact icon={CloudUpload} title="Nothing here yet" action={<><Button onClick={() => setPop({ kind: 'folder', at: path })}><FolderPlus /> New folder</Button><Button variant="primary" onClick={() => setPop({ kind: 'upload', at: path })}><CloudUpload /> Upload here</Button></>}>Add files and links, or make a folder to group them.</EmptyState>)}
        </Card>
      </div>

      {(pop?.kind === 'upload' || pop?.kind === 'edit' || pop?.kind === 'replace') && <MaterialDialog course={c} at={pop.kind === 'upload' ? pop.at : undefined} m={pop.kind === 'upload' ? undefined : pop.m} replace={pop.kind === 'replace'} onClose={close} />}
      {pop?.kind === 'subject' && <NameDialog title={pop.subject ? 'Edit subject' : `New subject in ${c.name}`} label="Subject name" placeholder="Advanced Accounting" initial={pop.subject?.name}
        taken={c.subjects.filter((s) => s.id !== pop.subject?.id).map((s) => s.name)} groups={c.subjects.some((s) => s.group) ? pop.subject?.group ?? c.subjects.find((s) => s.group)?.group ?? '' : undefined} onClose={close}
        onSave={(name, group = '') => { updateCourse(c.id, { subjects: pop.subject ? c.subjects.map((s) => (s.id === pop.subject!.id ? { ...s, name, group } : s)) : [...c.subjects, { id: uid(), name, group, chapters: [] }] }); if (pop.subject) toast.success('Subject saved'); else celebrate(`Subject “${name}” added`); }} />}
      {pop?.kind === 'chapter' && (() => { const s = c.subjects.find((x) => x.id === pop.subjectId)!; return <NameDialog title={pop.chapter ? 'Rename chapter' : `New chapter in ${s.name}`} label="Chapter name" placeholder="AS 10 – Property, Plant & Equipment" initial={pop.chapter?.name}
        taken={s.chapters.filter((x) => x.id !== pop.chapter?.id).map((x) => x.name)} onClose={close}
        onSave={(name) => { updateCourse(c.id, { subjects: c.subjects.map((x) => x.id !== s.id ? x : { ...x, chapters: pop.chapter ? x.chapters.map((ch) => (ch.id === pop.chapter!.id ? { ...ch, name } : ch)) : [...x.chapters, { id: uid(), name }] }) }); if (pop.chapter) toast.success('Chapter renamed'); else celebrate(`Chapter “${name}” added`, { description: 'Open it to add folders and upload materials.' }); }} />; })()}
      {pop?.kind === 'folder' && <FolderNameDialog course={c} at={pop.at} folder={pop.folder} onClose={close} />}
      {pop?.kind === 'delete' && (() => {
        const ids = pop.what === 'folder' ? withChildren(folders, pop.id) : folders.filter((x) => (pop.what === 'subject' ? x.subjectId : x.chapterId) === pop.id).map((x) => x.id);
        const inside = mine.filter((m) => pop.what === 'folder' ? ids.includes(m.folderId ?? '') : pop.what === 'subject' ? m.subjectId === pop.id : m.chapterId === pop.id);
        return <Dialog open onOpenChange={(v) => !v && close()} title={`Delete “${pop.name}”?`} desc={inside.length || ids.length > (pop.what === 'folder' ? 1 : 0) ? `Everything inside goes too: ${n(inside.length, 'material')}${ids.length - (pop.what === 'folder' ? 1 : 0) > 0 ? ` and ${n(ids.length - (pop.what === 'folder' ? 1 : 0), 'folder')}` : ''}. Archive materials instead if students may need them later.` : `This ${pop.what} is empty.`}
          footer={<><Button onClick={close}>Cancel</Button><Button variant="danger" onClick={() => {
            inside.forEach((m) => removeMaterial(m.id)); removeFolders(ids);
            if (pop.what === 'subject') updateCourse(c.id, { subjects: c.subjects.filter((s) => s.id !== pop.id) });
            if (pop.what === 'chapter') updateCourse(c.id, { subjects: c.subjects.map((s) => ({ ...s, chapters: s.chapters.filter((x) => x.id !== pop.id) })) });
            if ((pop.what === 'subject' && path.subjectId === pop.id) || (pop.what === 'chapter' && path.chapterId === pop.id) || (pop.what === 'folder' && path.folderId && ids.includes(path.folderId))) go(pop.what === 'chapter' ? { subjectId: path.subjectId } : pop.what === 'folder' ? { ...path, folderId: folders.find((x) => x.id === pop.id)?.parentId } : {});
            toast(`“${pop.name}” deleted`); close();
          }}>Delete</Button></>} />;
      })()}
    </Page>
  );
}

/**
 * Name a subject or chapter. Save runs once (no duplicates from double clicks or Enter),
 * and a name already used in the same place is refused.
 */
function NameDialog({ title, label, placeholder, initial, taken, groups, onSave, onClose }: { title: string; label: string; placeholder: string; initial?: string; taken: string[]; groups?: string; onSave: (name: string, group?: string) => void; onClose: () => void }) {
  const [name, setName] = useState(initial ?? ''), [group, setGroup] = useState(groups ?? '');
  const done = useRef(false);
  const clash = taken.some((t) => t.trim().toLowerCase() === name.trim().toLowerCase());
  const ok = !!name.trim() && !clash;
  const save = () => { if (!ok || done.current) return; done.current = true; onSave(name.trim(), groups === undefined ? undefined : group); onClose(); };
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()} title={title} footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!ok} onClick={save}>Save</Button></>}>
      <form className="grid gap-4 pb-2" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <Field label={label} hint={clash ? <span className="text-bad">“{name.trim()}” already exists here.</span> : undefined}><Input autoFocus autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} placeholder={placeholder} /></Field>
        {groups !== undefined && <Field label="Group"><Segmented value={group} onChange={setGroup} options={[{ value: 'Group I', label: 'Group I' }, { value: 'Group II', label: 'Group II' }, { value: '', label: 'No group' }]} /></Field>}
      </form>
    </Dialog>
  );
}

/** New or renamed folder, inside a subject, chapter or another folder. */
function FolderNameDialog({ course, at, folder, onClose, onMade }: { course: CourseInfo; at: Path; folder?: FolderT; onClose: () => void; onMade?: (id: string) => void }) {
  const { folders, saveFolder } = useStore();
  const siblings = foldersIn(folders.filter((x) => x.courseId === course.id), folder ? { subjectId: folder.subjectId, chapterId: folder.chapterId, folderId: folder.parentId } : at).filter((x) => x.id !== folder?.id).map((x) => x.name);
  return <NameDialog title={folder ? 'Rename folder' : 'New folder'} label="Folder name" placeholder="Class handouts" initial={folder?.name} taken={siblings} onClose={onClose}
    onSave={(name) => { const fid = saveFolder(folder ? { ...folder, name } : { name, courseId: course.id, subjectId: at.subjectId!, chapterId: at.chapterId, parentId: at.folderId }, folder?.id); if (folder) toast.success('Folder renamed'); else celebrate(`Folder “${name}” created`); onMade?.(fid); }} />;
}

/** Upload (one material per file), edit details, or replace the file. Filed under subject → chapter → folder. Access: all the course's batches or chosen ones. */
function MaterialDialog({ course, at, m, replace, onClose }: { course: CourseInfo; at?: Path; m?: Material; replace?: boolean; onClose: () => void }) {
  const { batches, folders: allFolders, saveMaterial } = useStore();
  const courseBatches = batches.filter((b) => b.course === course.name && b.status === 'active');
  const [kind, setKind] = useState<MaterialKind>(m?.kind ?? 'notes');
  const [files, setFiles] = useState<string[]>([]), [url, setUrl] = useState(m?.url ?? ''), [title, setTitle] = useState(m?.title ?? '');
  const [subjectId, setSubjectId] = useState(m?.subjectId ?? at?.subjectId ?? course.subjects[0]?.id ?? ''), [chapterId, setChapterId] = useState(m?.chapterId ?? at?.chapterId ?? '');
  const [folderId, setFolderId] = useState(m?.folderId ?? at?.folderId ?? ''), [newFolder, setNewFolder] = useState(false);
  const [some, setSome] = useState(!!m?.batchIds.length), [batchIds, setBatchIds] = useState<string[]>(m?.batchIds ?? []);
  const done = useRef(false);
  const subject = course.subjects.find((s) => s.id === subjectId);
  // Folders in the chosen subject/chapter, shown with their path ("Handouts / Week 1").
  const place = allFolders.filter((x) => x.courseId === course.id && x.subjectId === subjectId && (x.chapterId ?? '') === chapterId);
  const pathOf = (fo: FolderT): string => { const p = place.find((x) => x.id === fo.parentId); return p ? `${pathOf(p)} / ${fo.name}` : fo.name; };
  const useLink = KIND[kind].byLink && (kind === 'link' || !files.length) && !m?.file;
  const validUrl = /^https?:\/\/\S+\.\S+/.test(url.trim());
  const ok = replace ? files.length === 1 : !!subjectId && (!some || batchIds.length > 0) && (m ? !!title.trim() && (!useLink || validUrl) : files.length > 0 || (useLink && validUrl && !!title.trim()));
  const base = { kind, courseId: course.id, subjectId, chapterId: chapterId || undefined, folderId: folderId || undefined, batchIds: some ? batchIds : [] };
  const save = (status: Material['status']) => {
    if (!ok || done.current) return; done.current = true;
    if (replace && m) { saveMaterial({ ...m, file: files[0] }, m.id, true); toast.success('File replaced', { description: `Now version ${m.version + 1}. Students see the new file.` }); return onClose(); }
    if (m) { saveMaterial({ ...m, ...base, title: title.trim(), url: useLink ? url.trim() : m.url }, m.id); toast.success('Details saved'); return onClose(); }
    if (files.length) files.forEach((file) => saveMaterial({ ...base, title: files.length === 1 && title.trim() ? title.trim() : file.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '), file, status }));
    else saveMaterial({ ...base, title: title.trim(), url: url.trim(), status });
    const n = Math.max(1, files.length);
    toast.success(`${n} ${n === 1 ? 'material' : 'materials'} ${status === 'published' ? 'published' : 'saved as draft'}`, { description: `${subject?.name ?? ''} · ${some ? `${batchIds.length} batches` : `all ${course.name} batches`}. Uploaded once, no copies per batch.` });
    onClose();
  };
  const chip = (on: boolean) => cn('rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset transition-colors', on ? 'bg-fg text-bg ring-fg' : 'text-muted ring-border-strong hover:text-fg');
  return (
    <Dialog wide open onOpenChange={(v) => !v && onClose()} title={replace ? `Replace file · ${m?.title}` : m ? 'Edit material' : `Upload to ${course.name}`} desc={replace ? 'The new file takes the old one’s place for every batch; the details stay the same.' : 'Upload once and choose which batches can see it.'}
      footer={<><Button onClick={onClose}>Cancel</Button>{m ? <Button variant="primary" disabled={!ok} onClick={() => save(m.status)}>{replace ? 'Replace' : 'Save'}</Button> : <><Button disabled={!ok} onClick={() => save('draft')}>Save as draft</Button><Button variant="primary" disabled={!ok} onClick={() => save('published')}>Publish</Button></>}</>}>
      <div className="space-y-4 pb-2">
        {!replace && <Field label="Type" hint={KIND[kind].hint}><Segmented value={kind} onChange={(k) => { setKind(k); setFiles([]); }} options={(Object.keys(KIND) as MaterialKind[]).map((k) => { const I = ICON[k]; return { value: k, label: <><I className="size-3.5" />{KIND[k].label}</> }; })} /></Field>}
        {(replace || kind !== 'link') && (!m || replace) && (
          <label className="flex cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 border-dashed border-border-strong bg-subtle px-4 py-6 text-center transition hover:border-fg/40">
            <CloudUpload className="size-5 text-muted" /><span className="text-sm font-semibold">{files.length ? files.join(', ') : replace ? 'Choose the new file' : `Choose ${KIND[kind].label.toLowerCase()} files`}</span>
            <span className="text-2xs text-muted">{replace ? m?.file : 'Several files make several materials, each filed in the same place'}</span>
            <input type="file" multiple={!replace} accept={KIND[kind].accept} className="sr-only" onChange={(e) => { setFiles([...(e.target.files ?? [])].map((x) => x.name)); e.target.value = ''; }} />
          </label>
        )}
        {!replace && <div className="grid gap-4 sm:grid-cols-2">
          {useLink && <Field label={kind === 'video' ? 'Or a video link' : 'Link'} className="sm:col-span-2" hint={url && !validUrl ? <span className="text-bad">Enter a full link starting with https://</span> : undefined}><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" autoComplete="off" /></Field>}
          {(m || files.length <= 1) && <Field label="Title" className="sm:col-span-2" hint={!m && files.length === 1 && !title ? 'Leave empty to use the file name.' : undefined}><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="AS 10 – Notes" autoComplete="off" /></Field>}
          <Field label="Subject"><Select value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setChapterId(''); setFolderId(''); }}>{course.subjects.map((s) => <option key={s.id} value={s.id}>{s.group ? `${s.group} · ` : ''}{s.name}</option>)}</Select></Field>
          <Field label="Chapter"><Select value={chapterId} onChange={(e) => { setChapterId(e.target.value); setFolderId(''); }}><option value="">Whole subject</option>{subject?.chapters.map((ch) => <option key={ch.id} value={ch.id}>{ch.name}</option>)}</Select></Field>
          <Field label="Folder" className="sm:col-span-2" optional>
            <div className="flex gap-2"><Select value={folderId} onChange={(e) => setFolderId(e.target.value)} className="flex-1"><option value="">No folder</option>{place.map((fo) => <option key={fo.id} value={fo.id}>{pathOf(fo)}</option>)}</Select>
              <Button disabled={!subjectId} onClick={() => setNewFolder(true)}><FolderPlus /> New folder</Button></div>
          </Field>
          <div className="space-y-2 sm:col-span-2">
            <div className="text-xs font-medium">Who can see it</div>
            <Segmented value={some ? 'some' : 'all'} onChange={(v) => { setSome(v === 'some'); if (v === 'some' && !batchIds.length) setBatchIds(courseBatches.map((b) => b.id)); }} options={[{ value: 'all', label: `All ${course.name} batches` }, { value: 'some', label: 'Selected batches' }]} />
            {some && <div className="flex flex-wrap gap-1.5">{courseBatches.map((b) => <button key={b.id} type="button" onClick={() => setBatchIds(batchIds.includes(b.id) ? batchIds.filter((x) => x !== b.id) : [...batchIds, b.id])} className={chip(batchIds.includes(b.id))}>{b.name}</button>)}
              <span className="self-center text-2xs text-muted">{batchIds.length} of {courseBatches.length}</span></div>}
          </div>
        </div>}
      </div>
      {newFolder && <FolderNameDialog course={course} at={{ subjectId, chapterId: chapterId || undefined, folderId: folderId || undefined }} onClose={() => setNewFolder(false)} onMade={setFolderId} />}
    </Dialog>
  );
}

// ---------- All materials ----------
export function Materials() {
  const { courses, materials, batches } = useStore();
  const [course, setCourse] = useState<CourseFilter>('all');
  const [f, setF] = useState<Filters>(NONE);
  const [pop, setPop] = useState<{ kind: 'edit' | 'replace'; m: Material } | { kind: 'upload' } | null>(null);
  const [upTo, setUpTo] = useState(courses[0]?.id ?? '');
  const byId = new Map(courses.map((c) => [c.id, c]));
  const shown = materials.filter((m) => (course === 'all' || byId.get(m.courseId)?.name === course) && matches(m, f));
  const tiles = (Object.keys(KIND) as MaterialKind[]).map((k) => [k, materials.filter((m) => m.kind === k && m.status !== 'archived').length] as const);
  const list = batches.filter((b) => b.status === 'active' && (course === 'all' || b.course === course));
  return (
    <Page crumbs={[{ label: 'Learning', href: href({ page: 'learning' }) }, { label: 'Study materials' }]}
      actions={<><a href={href({ page: 'courses' })} className={btn('secondary')}><Folder /> Browse by course</a><Button variant="primary" onClick={() => setPop({ kind: 'upload' })}><CloudUpload /> Upload</Button></>}>
      <div className="mb-5"><h1 className="text-[28px] font-bold tracking-[-0.03em]">Study materials</h1><p className="text-sm text-muted">Every material across courses. Upload once and give it to as many batches as you like.</p></div>
      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">{tiles.map(([k, n]) => { const I = ICON[k]; return (
        <button key={k} type="button" onClick={() => setF({ ...f, kind: f.kind === k ? 'all' : k })} className={cn('rounded-2xl bg-panel p-3 text-left ring-1 ring-black/[0.04] transition dark:ring-white/[0.06]', f.kind === k && 'ring-2 ring-fg')}>
          <span className={cn('tone-soft grid size-8 place-items-center rounded-lg', KIND_TONE[k])}><I className="size-4" /></span>
          <div className="tnum mt-2 text-xl font-bold leading-tight">{n}</div><div className="truncate text-2xs text-muted">{KIND[k].label}</div>
        </button>
      ); })}</div>
      <Card className="p-4 sm:p-5">
        <div className="mb-4"><FilterBar f={f} set={(p) => setF({ ...f, ...p })} batches={list} extra={<CourseToggle value={course} onChange={setCourse} />} /></div>
        <p className="mb-2 text-xs text-muted">{shown.length.toLocaleString('en-IN')} materials</p>
        {shown.length ? <ul className="-mx-1 space-y-0.5">{shown.slice(0, 80).map((m) => <MaterialRow key={m.id} m={m} course={byId.get(m.courseId)} showPlace onEdit={() => setPop({ kind: 'edit', m })} onReplace={() => setPop({ kind: 'replace', m })} />)}</ul> : <EmptyState compact icon={Search} title="No materials match" />}
        {shown.length > 80 && <p className="mt-2 text-2xs text-muted">Showing the first 80. Narrow with the filters, or <a className="underline" href={href({ page: 'courses' })}>browse by course</a>.</p>}
      </Card>
      {pop?.kind === 'upload' && (
        <Dialog open onOpenChange={(v) => !v && setPop(null)} title="Upload to which course?" footer={<><Button onClick={() => setPop(null)}>Cancel</Button><Button variant="primary" onClick={() => { setPop(null); navigate({ page: 'course', id: upTo }); }}>Open course</Button></>}>
          <div className="pb-2"><Segmented value={upTo} onChange={setUpTo} options={courses.map((c) => ({ value: c.id, label: c.name }))} /><p className="mt-2 text-xs text-muted">Materials are filed under a subject and chapter, so uploads start inside the course.</p></div>
        </Dialog>
      )}
      {pop && pop.kind !== 'upload' && byId.get(pop.m.courseId) && <MaterialDialog course={byId.get(pop.m.courseId)!} m={pop.m} replace={pop.kind === 'replace'} onClose={() => setPop(null)} />}
    </Page>
  );
}
