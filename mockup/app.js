// Parallax Flow Academy — clickable design mockup.
// Starts with no data. Batches, students, faculty and exams created on the screens live
// in memory only until the backend exists; a reload starts empty again.
(() => {
  const D = window.DB;

  // ---------- icons ----------
  const P = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
    file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 13h8M8 17h5"/>',
    review: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    chart: '<path d="M3 3v18h18"/><path d="M7 15v3M12 10v8M17 6v12"/>',
    settings: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
    alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    zin: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3M11 8v6M8 11h6"/>',
    zout: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3M8 11h6"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
    eyeLogo: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="3.2" fill="currentColor"/>',
    key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  };
  const I = (n, s = 16) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`;

  // ---------- helpers ----------
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const batch = (id) => D.batches.find((b) => b.id === id) || { name: '—', course: '', faculty: '' };
  const batchNames = (ids) => (ids || []).map((b) => batch(b).name).join(', ') || '—';
  const batchSize = (id) => D.students.filter((s) => s.batch === id).length;
  const exam = (id) => D.exams.find((e) => e.id === id);
  const student = (id) => D.students.find((s) => s.id === id);
  const initials = (n) => String(n || '').trim().split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '—';
  const fmt = (n) => (Math.round(n * 10) / 10).toString();
  const uid = (p) => p + Math.random().toString(36).slice(2, 8);
  const academyName = () => D.academy.name || 'Your academy';
  const myName = () => D.me.name || 'Academy admin';
  const pad2 = (n) => String(n).padStart(2, '0');
  const localISO = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  const nice = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  };
  const STATUS = {
    draft: ['Draft', ''], scheduled: ['Scheduled', 'info'], live: ['Live', 'good'],
    closed: ['Closed', ''], review: ['In review', 'warn'], published: ['Published', 'accent'],
  };
  const statusPill = (e) => `<span class="pill ${STATUS[e.status][1]}">${STATUS[e.status][0]}</span>`;
  const POLICY = {
    auto: { short: 'Auto-publish all', title: 'Publish every result automatically', desc: 'Students see their marks as soon as the AI finishes. Flagged scripts are still listed for review, and a reviewer’s change updates the student’s result.' },
    clean: { short: 'Auto-publish clean, hold flagged', title: 'Publish clean results, hold flagged ones', desc: 'Results with no review flags go out automatically. Flagged scripts wait until a reviewer approves them.' },
    manual: { short: 'Faculty publishes', title: 'Hold everything until faculty publishes', desc: 'Nothing reaches students until a reviewer or admin clicks Publish, for each script or the whole exam.' },
  };
  const SEE = { steps: 'step marks', needed: 'what was needed', model: 'model answer', rank: 'rank' };
  const LATE = { none: 'Not allowed after the deadline', 30: 'Allowed for 30 minutes, marked late', day: 'Allowed for 24 hours, marked late' };
  const COURSES = ['CA Foundation', 'CA Inter', 'CA Final'];
  const modePill = (e) => e.mode === 'practice' ? '<span class="pill plain">Open practice</span>' : '<span class="pill plain">Timed</span>';
  const statusOfStudent = (s) => s.status === 'at-risk' ? '<span class="pill bad">Needs attention</span>'
    : s.taken ? '<span class="pill good">Active</span>' : '<span class="pill info">Login created</span>';
  const spark = (arr, w = 84, h = 26) => {
    if (!arr || arr.length < 2) return '<span class="muted small">—</span>';
    const min = Math.min(...arr) - 3, max = Math.max(...arr) + 3;
    const pts = arr.map((v, i) => `${(i / (arr.length - 1)) * w},${h - ((v - min) / (max - min)) * h}`).join(' ');
    const up = arr[arr.length - 1] >= arr[0];
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="${up ? 'var(--accent)' : 'var(--bad)'}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  };
  const empty = (icon, title, text, action = '') => `<div class="empty-state"><div class="big">${I(icon, 22)}</div><b>${title}</b><p>${text}</p>${action}</div>`;
  const log = (ic, text, tone = '') => D.activity.unshift({ ic, tone, text, time: 'Just now' });

  // ---------- state ----------
  const S = {
    examFilter: 'all', reviewFilter: 'waiting', studentsTab: 'all', studentBatch: 'all', settingsTab: 'academy',
    examTab: 'subs', paneTab: 'script', q: 0, page: 1, marks: {}, wizard: null, navOpen: false, lastLogin: null,
  };
  const newWizard = () => {
    const open = new Date(); open.setDate(open.getDate() + 1); open.setHours(10, 0, 0, 0);
    const close = new Date(open); close.setHours(13);
    return {
      step: 1, title: '', subject: 'Taxation', file: null, batches: D.batches.length ? [D.batches[0].id] : [], mode: 'timed', timing: 'paper',
      opens: localISO(open), closes: localISO(close), late: 'none', nq: 4,
      practiceFrom: localISO(new Date()).slice(0, 10), practiceTo: '', attempts: 'unlimited',
      policy: 'clean', reviewer: 'Any reviewer', see: { steps: true, needed: true, model: true, rank: false },
    };
  };

  // ---------- routing (plain #names only, which artifact links keep) ----------
  const toHash = (p) => {
    const [a, b] = p.split('/');
    if (p === 'students?join') return 'students-join';
    if (a === 'settings') return 'academy-settings';
    if (!b) return a;
    if (a === 'exams') return b === 'new' ? 'exams-new' : 'exam-' + b;
    return (a === 'reviews' ? 'review-' : 'student-') + b;
  };
  const route = () => {
    const h = location.hash.replace(/^#\/?/, '');
    if (!h || h === 'login') return ['login'];
    if (h === 'exams-new') return ['exams', 'new'];
    if (h === 'students-join') return ['students'];
    if (h === 'academy-settings') return ['settings'];
    const m = h.match(/^(exam|review|student)-(.+)$/);
    if (m) return [m[1] + 's', m[2]];
    return [h];
  };
  const go = (h) => { location.hash = '#' + toHash(h); };
  window.addEventListener('hashchange', () => { S.navOpen = false; render(); window.scrollTo(0, 0); });

  // ---------- shell ----------
  const waiting = () => D.reviews.filter((r) => !r.published && !r.done).length;
  const joinCount = () => D.joinRequests.filter((j) => !j.done).length;

  function shell(active, crumbs, body) {
    const nav = [
      ['overview', 'home', 'Overview'],
      ['exams', 'file', 'Exams'],
      ['reviews', 'review', 'Reviews', waiting(), ''],
      ['students', 'users', 'Students', joinCount(), 'soft'],
      ['reports', 'chart', 'Reports'],
      ['settings', 'settings', 'Settings'],
    ];
    const dark = document.documentElement.dataset.theme === 'dark' ||
      (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
    return `
    <div class="shell ${S.navOpen ? 'nav-open' : ''}">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-mark">${I('eyeLogo', 18)}</div>
          <div><div class="brand-name">Parallax Flow</div><div class="brand-sub">Academy console</div></div>
        </div>
        <a class="academy-chip" href="#/settings" style="color:inherit;text-decoration:none">
          <div class="academy-logo">${D.academy.name ? initials(D.academy.name) : I('plus', 14)}</div>
          <div><b>${esc(academyName())}</b><span>${D.academy.name ? esc([D.academy.city, D.academy.plan].filter(Boolean).join(' · ') || 'Academy') : 'Add your academy details'}</span></div>
        </a>
        <div class="nav-label">Workspace</div>
        <nav class="nav">
          ${nav.map(([r, ic, label, n, tone]) => `<a href="#/${r}" class="${active === r ? 'active' : ''}">${I(ic)}<span>${label}</span>${n ? `<span class="count ${tone || ''}">${n}</span>` : ''}</a>`).join('')}
        </nav>
        <div class="sidebar-foot">
          <div class="avatar">${D.me.name ? initials(D.me.name) : I('user', 14)}</div>
          <div style="min-width:0;flex:1"><b>${esc(myName())}</b><span>${esc(D.me.email || D.me.role)}</span></div>
          <a class="icon-btn" href="#/login" title="Sign out" aria-label="Sign out">${I('logout')}</a>
        </div>
      </aside>
      <div class="main">
        <header class="topbar">
          <button class="icon-btn menu-btn" data-act="nav" aria-label="Menu">${I('menu')}</button>
          <div class="crumbs">${crumbs}</div>
          <label class="search">${I('search')}<input placeholder="Search students, exams…" aria-label="Search"></label>
          <button class="icon-btn" data-act="theme" title="Switch theme" aria-label="Switch theme">${I(dark ? 'sun' : 'moon')}</button>
          <button class="icon-btn" data-act="bell" title="Notifications" aria-label="Notifications">${I('bell')}${D.activity.length ? '<span class="dot"></span>' : ''}</button>
        </header>
        <main class="content">${body}</main>
      </div>
    </div>`;
  }
  const crumb = (...parts) => parts.map((p, i) => i === parts.length - 1 ? `<b>${p}</b>` : `<span>${p}</span>${I('right', 13)}`).join('');

  // ---------- login ----------
  function viewLogin() {
    return `
    <div class="login">
      <section class="login-art">
        <div class="brand"><div class="brand-mark">${I('eyeLogo', 18)}</div><div><div class="brand-name">Parallax Flow</div><div class="brand-sub">For academies</div></div></div>
        <div>
          <div class="eyebrow">The science of knowledge. The art of evaluation.</div>
          <h1>Every answer script,<br><span class="serif">evaluated with care.</span></h1>
          <p>Run exams for your batches, let the AI mark handwritten answers step by step, and review only what needs a faculty eye.</p>
        </div>
        <div class="login-points"><span>Exams</span><span>Step-wise evaluation</span><span>Reviews</span><span>Student progress</span></div>
      </section>
      <section class="login-form">
        <form class="card login-card" data-form="login">
          <h2>Sign in to your academy</h2>
          <p class="muted" style="margin:4px 0 20px">For academy admins, faculty and reviewers.</p>
          <div class="stack" style="gap:14px">
            <div class="field"><label for="lg-email">Email</label><input id="lg-email" class="input" type="email" placeholder="you@youracademy.com" autocomplete="off"></div>
            <div class="field"><label for="lg-pass">Password</label><input id="lg-pass" class="input" type="password" placeholder="Password" autocomplete="off"></div>
            <button class="btn dark" type="submit" style="padding:11px">Sign in</button>
            <a class="small" href="#/login" data-act="toast" data-msg="A reset link will be emailed once sign-in is connected">Forgot password?</a>
          </div>
          <div class="divider"></div>
          <div class="note">${I('info')}<div>Students don’t sign in here. They use the <b>Parallax Flow app</b> with the login ID their academy gives them, or join with the academy code.</div></div>
          <p class="small muted" style="margin:12px 0 0">Design preview: sign-in isn’t connected yet, so any details open the console.</p>
        </form>
      </section>
    </div>`;
  }

  // ---------- overview ----------
  function viewOverview() {
    const live = D.exams.filter((e) => e.status === 'live');
    const scheduled = D.exams.filter((e) => e.status === 'scheduled');
    const atRisk = D.students.filter((s) => s.status === 'at-risk').length;
    const received = live.reduce((a, e) => a + e.received, 0);
    const flagged = D.reviews.filter((r) => !r.done && !String(r.reason).startsWith('Held')).length;
    const kpis = [
      ['file', 'Live exams', live.length, scheduled.length ? `${scheduled.length} scheduled next` : 'None scheduled'],
      ['upload', 'Scripts received', received, live.length ? 'Across live exams' : 'No exam is open'],
      ['review', 'Waiting for review', waiting(), `${flagged} flagged by AI`],
      ['users', 'Students needing attention', atRisk, 'Falling scores or missed exams'],
    ];
    const h = new Date().getHours();
    const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
    const setup = [
      [!!D.academy.name, 'Add your academy details', 'Name, city and the code students use to join', '#/settings', 'Open settings'],
      [D.batches.length > 0, 'Create a batch', 'For example CA Inter, May 2027', null, 'New batch', 'newBatch'],
      [D.students.length > 0, 'Add students', 'Create logins, import from Excel, or approve join requests', '#/students', 'Add students'],
      [D.exams.length > 0, 'Create the first exam', 'Upload the question paper and set the timing', '#/exams/new', 'Create exam'],
    ];
    const setupDone = setup.every((s) => s[0]);
    const attention = [];
    if (flagged) attention.push(attentionRow('flag', 'warn', `<b>${flagged} scripts flagged</b> by the AI`, 'Held back from students until a reviewer checks them', '#/reviews', 'Review'));
    if (joinCount()) attention.push(attentionRow('user', '', `<b>${joinCount()} students</b> asked to join with the academy code`, 'Approve them so they can see their batch’s exams', '#/students?join', 'Approve'));
    D.exams.filter((e) => e.status === 'review').forEach((e) => attention.push(attentionRow('review', '', `<b>${esc(e.title)}</b> is waiting to be published`, `${e.reviewed} of ${e.received} scripts reviewed`, `#/exams/${e.id}`, 'Open')));
    return `
    <div class="page-head">
      <div><div class="eyebrow">${today}</div><h1>${greet}${D.me.name ? `, <span class="serif">${esc(D.me.name.split(' ')[0])}</span>` : ''}</h1><p>${D.exams.length ? 'Here’s what is happening across your batches today.' : 'Set up your academy to start running exams.'}</p></div>
      <div class="actions"><a class="btn" href="#/reports">${I('chart')} Reports</a><a class="btn dark" href="#/exams/new">${I('plus')} Create exam</a></div>
    </div>
    ${setupDone ? '' : `
    <div class="card" style="margin-bottom:16px">
      <div class="card-head"><h3>Get your academy ready</h3><span class="small muted">${setup.filter((s) => s[0]).length} of ${setup.length} done</span></div>
      <div class="card-body list">${setup.map(([done, t, d, href, label, act], i) => `
        <div class="list-item"><div class="ic ${done ? 'good' : ''}">${done ? I('check', 15) : `<b style="font-size:12px">${i + 1}</b>`}</div>
          <div class="grow"><div style="${done ? 'text-decoration:line-through;color:var(--muted)' : ''}">${t}</div><div class="small muted">${d}</div></div>
          ${done ? '' : act ? `<button class="btn sm" data-act="${act}">${label}</button>` : `<a class="btn sm" href="${href}">${label}</a>`}</div>`).join('')}</div>
    </div>`}
    <div class="grid g-4">${kpis.map(([ic, l, v, d]) => `<div class="card kpi"><div class="label">${I(ic, 14)} ${l}</div><div class="value">${v}</div><div class="delta">${d}</div></div>`).join('')}</div>
    <div class="grid g-main" style="margin-top:16px">
      <div class="stack">
        <div class="card">
          <div class="card-head"><h3>Live exams</h3><a class="small" href="#/exams">All exams →</a></div>
          <div class="card-body ${live.length ? 'grid g-2' : ''}">${live.length ? live.map(examCard).join('') : empty('file', 'No exam is open right now', 'Exams appear here while students can upload.', '<a class="btn sm dark" href="#/exams/new">Create exam</a>')}</div>
        </div>
        <div class="card">
          <div class="card-head"><h3>Needs your attention</h3></div>
          <div class="card-body list">${attention.join('') || '<div class="muted small" style="padding:6px 0">Nothing needs your attention. Flagged scripts, join requests and exams waiting to be published show up here.</div>'}</div>
        </div>
      </div>
      <div class="stack">
        <div class="card">
          <div class="card-head"><h3>Activity</h3></div>
          <div class="card-body list">${activityList()}</div>
        </div>
        <div class="card">
          <div class="card-head"><h3>Coming up</h3></div>
          <div class="card-body list">${scheduled.length ? scheduled.map((e) => `<div class="list-item"><div class="ic">${I('calendar', 15)}</div><div class="grow"><b>${esc(e.title)}</b><div class="small muted">${esc(batchNames(e.batches))} · ${esc(e.window)}</div></div></div>`).join('') : '<div class="muted small" style="padding:6px 0">No exams scheduled.</div>'}</div>
        </div>
      </div>
    </div>`;
  }
  const activityList = () => D.activity.length
    ? D.activity.map((a) => `<div class="list-item"><div class="ic ${a.tone || ''}">${I(a.ic, 15)}</div><div class="grow">${a.text}</div><div class="time">${a.time}</div></div>`).join('')
    : '<div class="muted small" style="padding:6px 0">Uploads, marking, reviews and join requests will show up here as they happen.</div>';
  const attentionRow = (ic, tone, title, sub, href, label) => `
    <div class="list-item"><div class="ic ${tone}">${I(ic, 15)}</div><div class="grow"><div>${title}</div><div class="small muted">${sub}</div></div><a class="btn sm" href="${href}">${label}</a></div>`;

  function funnel(e) {
    const base = Math.max(e.enrolled, e.received) || 1;
    const p = (n) => Math.min(100, (n / base) * 100);
    return `<div class="bar"><span class="b1" style="width:${p(e.published)}%"></span><span class="b2" style="width:${p(e.evaluated - e.published)}%"></span><span class="b3" style="width:${p(e.received - e.evaluated)}%"></span></div>`;
  }
  function examCard(e) {
    return `<div class="exam-card" data-go="exams/${e.id}" tabindex="0">
      <div class="row"><div><h4>${esc(e.title)}</h4><div class="meta">${esc(batchNames(e.batches))}</div></div>${modePill(e)}</div>
      ${funnel(e)}
      <div class="legend"><span><i style="background:var(--accent)"></i>${e.published} published</span><span><i style="background:color-mix(in srgb,var(--accent) 45%,transparent)"></i>${e.evaluated - e.published} marked</span><span><i style="background:color-mix(in srgb,var(--accent) 18%,transparent)"></i>${e.received - e.evaluated} marking</span></div>
      <div class="small muted" style="margin-top:10px;display:flex;gap:6px;align-items:center">${I('clock', 13)} ${esc(e.mode === 'practice' ? e.window : 'Closes ' + e.deadline)} · ${e.received}${e.mode === 'practice' ? ' attempts' : '/' + e.enrolled + ' uploaded'}</div>
    </div>`;
  }

  // ---------- exams ----------
  function viewExams() {
    const filters = [['all', 'All'], ['live', 'Live'], ['scheduled', 'Scheduled'], ['review', 'In review'], ['published', 'Published'], ['draft', 'Drafts']];
    const rows = D.exams.filter((e) => S.examFilter === 'all' || e.status === S.examFilter);
    return `
    <div class="page-head">
      <div><h1>Exams</h1><p>Upload a question paper, choose the batch and timing, and decide how results reach students.</p></div>
      <a class="btn dark" href="#/exams/new">${I('plus')} Create exam</a>
    </div>
    <div class="card">
      ${D.exams.length ? `
      <div class="toolbar"><div class="chips">${filters.map(([k, l]) => `<button class="chip ${S.examFilter === k ? 'active' : ''}" data-act="examFilter" data-v="${k}">${l}<span class="muted"> ${k === 'all' ? D.exams.length : D.exams.filter((e) => e.status === k).length}</span></button>`).join('')}</div></div>
      <div class="table-wrap"><table class="t">
        <thead><tr><th>Exam</th><th>Batch</th><th>Type</th><th>Window</th><th class="num">Uploads</th><th>Results</th><th>Status</th></tr></thead>
        <tbody>${rows.map((e) => `<tr class="click" data-go="exams/${e.id}">
          <td><b style="font-weight:500">${esc(e.title)}</b><div class="small muted">${esc(e.subject)}${e.file ? ' · ' + esc(e.file) : ''}</div></td>
          <td>${esc(batchNames(e.batches))}</td><td>${modePill(e)}</td>
          <td class="small">${esc(e.window)}</td>
          <td class="num">${e.mode === 'practice' ? e.received : `${e.received}/${e.enrolled}`}</td>
          <td class="small muted">${POLICY[e.policy].short}</td>
          <td>${statusPill(e)}</td></tr>`).join('') || '<tr><td colspan="7" class="empty">No exams with this status.</td></tr>'}</tbody>
      </table></div>`
      : empty('file', 'No exams yet', 'Create an exam by uploading the question paper as a Word file. You choose the batch, the timing and how results are published.', '<a class="btn dark" href="#/exams/new">' + I('plus', 14) + ' Create exam</a>')}
    </div>`;
  }

  function viewExam(id) {
    const e = exam(id);
    if (!e) return empty('file', 'This exam doesn’t exist', 'It may have been deleted.', '<a class="btn" href="#/exams">All exams</a>');
    const enrolledStudents = D.students.filter((s) => e.batches.includes(s.batch));
    const notSub = Math.max(0, e.enrolled - e.received);
    const tabs = [['subs', 'Submissions', e.received], ['missing', 'Not submitted', e.mode === 'practice' ? 0 : notSub], ['questions', 'Questions', ''], ['rules', 'Timing & results', '']];
    let body = '';
    if (S.examTab === 'subs') {
      body = empty('upload', 'No uploads yet', e.status === 'draft' ? 'This exam is a draft. Schedule it so students can see it.' : e.status === 'scheduled' ? `Students can upload once the exam opens (${esc(e.window)}).` : 'Uploads from the Parallax Flow app appear here as students submit.');
    } else if (S.examTab === 'missing') {
      body = e.mode === 'practice' ? '<div class="empty">Practice papers have no deadline, so nobody is missing.</div>'
        : enrolledStudents.length ? `<div class="card-body"><div class="note warn">${I('clock')}<div><b>${notSub} students</b> haven’t uploaded yet.${e.status === 'live' ? ` The window closes ${esc(e.deadline)}.` : ''}</div></div>
        <div class="list" style="margin-top:10px">${enrolledStudents.map((s) => `<div class="list-item"><div class="avatar">${initials(s.name)}</div><div class="grow"><b>${esc(s.name)}</b><div class="small muted">${esc(s.roll)} · ${esc(batch(s.batch).name)}</div></div><button class="btn sm" data-act="toast" data-msg="Reminder sent in the app" ${e.status === 'live' ? '' : 'disabled'}>Send reminder</button></div>`).join('')}</div></div>`
        : empty('users', 'No students in this batch yet', 'Add students to the batch and they’ll see this exam in the app.', '<a class="btn sm" href="#/students">Add students</a>');
    } else if (S.examTab === 'questions') {
      body = e.file ? empty('file', esc(e.file), 'The questions, steps, marks and ICAI keywords are listed here once the server reads the paper.')
        : empty('upload', 'No question paper yet', 'Upload the Word file to finish this exam.', '<button class="btn sm dark" data-act="toast" data-msg="Opens the exam editor">Upload paper</button>');
    } else {
      body = `<div class="card-body"><div class="kv">
        <span>Type</span><b>${e.mode === 'practice' ? 'Open practice paper' : 'Timed exam'}</b>
        <span>Window</span><b>${esc(e.window)}</b><span>Deadline</span><b>${esc(e.deadline)}</b>
        <span>Late uploads</span><b>${esc(e.mode === 'practice' ? '—' : LATE[e.late])}</b>
        <span>Results</span><b>${POLICY[e.policy].title}</b>
        <span>Students see</span><b>${Object.entries(e.see).filter(([, v]) => v).map(([k]) => SEE[k]).join(', ') || 'Total only'}</b>
        <span>Reviewer</span><b>${esc(e.reviewer)}</b></div></div>`;
    }
    return `
    <div class="page-head">
      <div><div class="actions" style="margin-bottom:6px">${statusPill(e)}${modePill(e)}</div><h1>${esc(e.title)}</h1><p>${esc(batchNames(e.batches))} · ${esc(e.subject)}</p></div>
      <div class="actions">
        ${e.status === 'live' ? `<button class="btn" data-act="closeExam" data-id="${e.id}">Close exam</button>` : ''}
        ${e.status === 'draft' ? `<button class="btn dark" data-act="scheduleDraft" data-id="${e.id}" ${e.file ? '' : 'disabled'}>${I('calendar', 14)} Schedule</button>` : ''}
        <button class="btn danger" data-act="deleteExam" data-id="${e.id}">Delete</button>
      </div>
    </div>
    <div class="grid g-4">
      ${[['Uploaded', e.mode === 'practice' ? e.received : `${e.received}/${e.enrolled}`, e.mode === 'practice' ? 'attempts so far' : `${notSub} still to upload`],
        ['Marked by AI', e.evaluated, `${e.received - e.evaluated} in progress`],
        ['Flagged', e.flagged, `${e.reviewed} reviewed so far`],
        ['Published', e.published, POLICY[e.policy].short]].map(([l, v, d]) => `<div class="card kpi"><div class="label">${l}</div><div class="value">${v}</div><div class="delta">${d}</div></div>`).join('')}
    </div>
    <div class="card" style="margin-top:16px">
      <div class="tabs" style="padding:0 12px;margin:0">${tabs.map(([k, l, n]) => `<button class="${S.examTab === k ? 'active' : ''}" data-act="examTab" data-v="${k}">${l}${n !== '' ? `<span class="n">${n}</span>` : ''}</button>`).join('')}</div>
      ${body}
    </div>`;
  }

  // ---------- create exam ----------
  function viewNewExam() {
    const w = S.wizard || (S.wizard = newWizard());
    const steps = ['Question paper', 'Students & timing', 'Results & review', 'Confirm'];
    let body = '';
    if (w.step === 1) {
      body = `
        <div class="form-grid">
          <div class="field"><label for="w-title">Exam title</label><input id="w-title" class="input" data-bind="title" value="${esc(w.title)}" placeholder="e.g. PGBP Unit Test 1"></div>
          <div class="field"><label for="w-subj">Subject</label><select id="w-subj" class="input" data-bind="subject">${['Taxation', 'Accounting', 'Corporate Law', 'Cost & Mgmt Accounting', 'Audit', 'Financial Management'].map((s) => `<option ${w.subject === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
        </div>
        <div style="margin-top:16px">
          ${w.file ? `
          <div class="note">${I('check')}<div><b>${esc(w.file)}</b> is attached. The questions, steps, marks and ICAI keywords are read from it when the exam is saved, and you can check them on the exam page.</div></div>
          <label class="btn sm ghost" style="margin-top:8px">${I('upload', 14)} Replace file<input id="w-file2" type="file" accept=".docx,.pdf,.xlsx" data-act="wfile" hidden></label>`
          : `<div class="dropzone"><div class="big">${I('upload', 22)}</div><b>Upload the question paper</b><div class="small muted">One Word file with the questions, steps, marks, ICAI keywords and model answers. PDF and Excel also work.</div>
              <div class="actions" style="margin-top:6px"><label class="btn dark">Choose file<input id="w-file" type="file" accept=".docx,.pdf,.xlsx" data-act="wfile" hidden></label></div></div>`}
        </div>`;
    } else if (w.step === 2) {
      body = `
        <div class="field"><div class="label">Who writes this exam</div>
          ${D.batches.length ? `<div class="options row">${D.batches.map((b) => `<label class="option ${w.batches.includes(b.id) ? 'selected' : ''}"><input type="checkbox" data-act="wbatch" data-v="${b.id}" ${w.batches.includes(b.id) ? 'checked' : ''}><div><b>${esc(b.name)}</b><p>${batchSize(b.id)} students</p></div></label>`).join('')}</div>
          <button class="btn sm ghost" style="align-self:flex-start" data-act="newBatch">${I('plus', 13)} New batch</button>`
          : `<div class="note warn">${I('alert')}<div>There are no batches yet. Create one, then pick it here. <button class="btn sm" style="margin-left:6px" data-act="newBatch">${I('plus', 13)} New batch</button></div></div>`}
        </div>
        <div class="field" style="margin-top:18px"><div class="label">Type</div>
          <div class="options row">
            ${opt('wmode', 'timed', w.mode, 'Timed exam', 'Opens and closes at set times. Uploads after the deadline are blocked or marked late.')}
            ${opt('wmode', 'practice', w.mode, 'Open practice paper', 'Students attempt whenever they like, as many times as you allow.')}
          </div></div>
        ${w.mode === 'timed' ? `
        <div class="field" style="margin-top:18px"><div class="label">Timing</div>
          <div><div class="seg"><button class="${w.timing === 'paper' ? 'active' : ''}" data-act="wtiming" data-v="paper">Same window for the whole paper</button><button class="${w.timing === 'question' ? 'active' : ''}" data-act="wtiming" data-v="question">Different window per question</button></div></div>
          ${w.timing === 'paper' ? `
          <div class="form-grid" style="margin-top:10px">
            <div class="field"><label for="w-open">Opens</label><input id="w-open" type="datetime-local" class="input" data-bind="opens" value="${w.opens}"></div>
            <div class="field"><label for="w-close">Deadline</label><input id="w-close" type="datetime-local" class="input" data-bind="closes" value="${w.closes}"></div>
          </div>` : `
          <div class="form-grid" style="margin-top:10px"><div class="field"><label for="w-nq">Number of questions</label><input id="w-nq" class="input" type="number" min="1" max="20" value="${w.nq}" data-act="wnq"><span class="hint">Matched to the questions read from the paper.</span></div></div>
          <div style="margin-top:6px"><div class="time-grid small muted"><span>Question</span><span>Opens</span><span>Deadline</span><span>Time to write</span></div>
          ${Array.from({ length: w.nq }, (_, i) => `<div class="time-grid"><span><b>Q${i + 1}</b></span><input id="w-q${i}-open" class="input" type="date" value="${w.opens.slice(0, 10)}" aria-label="Q${i + 1} opens"><input id="w-q${i}-close" class="input" type="time" value="${w.closes.slice(11)}" aria-label="Q${i + 1} deadline"><select id="w-q${i}-dur" class="input" aria-label="Q${i + 1} time to write"><option>30 min</option><option selected>45 min</option><option>60 min</option></select></div>`).join('')}</div>`}
          <div class="form-grid" style="margin-top:10px"><div class="field"><label for="w-late">Late uploads</label><select id="w-late" class="input" data-bind="late">
            ${Object.entries(LATE).map(([k, v]) => `<option value="${k}" ${w.late === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div></div>
        </div>` : `
        <div class="form-grid" style="margin-top:18px">
          <div class="field"><label for="w-pf">Available from</label><input id="w-pf" type="date" class="input" data-bind="practiceFrom" value="${w.practiceFrom}"></div>
          <div class="field"><label for="w-pt">Available until <span class="muted">(optional)</span></label><input id="w-pt" type="date" class="input" data-bind="practiceTo" value="${w.practiceTo}"></div>
          <div class="field"><label for="w-att">Attempts</label><select id="w-att" class="input" data-bind="attempts">${[['unlimited', 'Unlimited'], ['1', '1 attempt'], ['3', 'Up to 3 attempts']].map(([v, l]) => `<option value="${v}" ${w.attempts === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        </div>`}`;
    } else if (w.step === 3) {
      const reviewers = D.faculty.filter((f) => f.role === 'Reviewer');
      body = `
        <div class="field"><div class="label">When do students see their results?</div>
          <div class="options">
            ${['clean', 'auto', 'manual'].map((k) => opt('wpolicy', k, w.policy, POLICY[k].title, POLICY[k].desc, k === 'clean' ? '<span class="pill accent plain tagline">Recommended</span>' : '')).join('')}
          </div></div>
        <div class="form-grid" style="margin-top:18px">
          <div class="field"><label for="w-rev">Reviewer</label><select id="w-rev" class="input" data-bind="reviewer"><option>Any reviewer</option>${reviewers.map((f) => `<option ${w.reviewer === f.name ? 'selected' : ''}>${esc(f.name)}</option>`).join('')}</select>
          <span class="hint">${reviewers.length ? 'Flagged scripts land in this person’s review queue.' : 'No reviewers yet. Invite faculty in Settings → Team & roles.'}</span></div>
        </div>
        <div class="field" style="margin-top:18px"><div class="label">What students see in their result</div>
          <div class="card" style="box-shadow:none;padding:0 16px">
            ${[['steps', 'Marks for each step', 'Not just the total'], ['needed', 'What was needed for each lost step', 'From your marking scheme'], ['model', 'Model answer', 'Shown after the deadline'], ['rank', 'Rank in the batch', 'Shown once results are published']].map(([k, t, d]) => `
            <div class="setting"><div class="grow"><b>${t}</b><p>${d}</p></div><label class="switch"><input id="w-see-${k}" type="checkbox" data-act="wsee" data-v="${k}" ${w.see[k] ? 'checked' : ''}><span></span></label></div>`).join('')}
          </div></div>`;
    } else {
      const problems = [];
      if (!w.title.trim()) problems.push('Give the exam a title (step 1).');
      if (!w.file) problems.push('Upload the question paper (step 1).');
      if (!w.batches.length) problems.push('Choose at least one batch (step 2).');
      body = `
        <div class="kv">
          <span>Exam</span><b>${esc(w.title || '—')} · ${esc(w.subject)}</b>
          <span>Question paper</span><b>${esc(w.file || 'Not uploaded')}</b>
          <span>Batches</span><b>${esc(batchNames(w.batches))}</b>
          <span>Type</span><b>${w.mode === 'timed' ? 'Timed exam' : 'Open practice paper'}</b>
          <span>Timing</span><b>${w.mode === 'timed' ? (w.timing === 'paper' ? `${nice(w.opens)} → ${nice(w.closes)}` : `Own window for each of ${w.nq} questions`) : `From ${w.practiceFrom}${w.practiceTo ? ' to ' + w.practiceTo : ', no end date'}`}</b>
          ${w.mode === 'timed' ? `<span>Late uploads</span><b>${LATE[w.late]}</b>` : ''}
          <span>Results</span><b>${POLICY[w.policy].title}</b>
          <span>Reviewer</span><b>${esc(w.reviewer)}</b>
          <span>Students see</span><b>${Object.entries(w.see).filter(([, v]) => v).map(([k]) => SEE[k]).join(', ') || 'Total only'}</b>
        </div>
        ${problems.length ? `<div class="note warn" style="margin-top:14px">${I('alert')}<div>Before scheduling: ${problems.join(' ')} You can still save a draft.</div></div>`
          : `<div class="note" style="margin-top:14px">${I('info')}<div>Students in ${w.batches.length > 1 ? 'these batches' : 'this batch'} get a notification in the app when the exam opens.</div></div>`}`;
    }
    const ready = w.title.trim() && w.file && w.batches.length;
    return `
    <div class="page-head"><div><h1>Create exam</h1><p>Four short steps. Nothing goes to students until the exam opens.</p></div><a class="btn ghost" href="#/exams" data-act="wreset">Cancel</a></div>
    <div class="steps">${steps.map((s, i) => `<button class="step-dot ${w.step === i + 1 ? 'active' : w.step > i + 1 ? 'done' : ''}" data-act="wstep" data-v="${i + 1}"><i>${w.step > i + 1 ? '✓' : i + 1}</i>${s}</button>`).join('')}</div>
    <div class="card"><div class="card-body" style="padding-top:20px">${body}</div>
      <div class="wizard-foot">
        <button class="btn" data-act="wstep" data-v="${w.step - 1}" ${w.step === 1 ? 'disabled' : ''}>${I('left', 14)} Back</button>
        <div class="actions">
          <button class="btn ghost" data-act="wsave" data-v="draft" ${w.title.trim() ? '' : 'disabled'}>Save draft</button>
          ${w.step < 4 ? `<button class="btn dark" data-act="wstep" data-v="${w.step + 1}">Continue ${I('right', 14)}</button>` : `<button class="btn dark" data-act="wsave" data-v="schedule" ${ready ? '' : 'disabled'}>${I('calendar', 14)} Schedule exam</button>`}
        </div>
      </div>
    </div>`;
  }
  const opt = (act, v, cur, title, desc, extra = '') => `<label class="option ${cur === v ? 'selected' : ''}"><input type="radio" name="${act}" data-act="${act}" data-v="${v}" ${cur === v ? 'checked' : ''}><div><b>${title}</b><p>${desc}</p></div>${extra}</label>`;

  function saveExam(kind) {
    const w = S.wizard;
    const enrolled = w.batches.reduce((a, b) => a + batchSize(b), 0);
    let status = 'draft', windowText = 'Not scheduled', deadline = '—';
    if (w.mode === 'timed') {
      windowText = w.timing === 'paper' ? `${nice(w.opens)} – ${nice(w.closes)}` : `Per question, from ${nice(w.opens)}`;
      deadline = nice(w.closes);
    } else {
      windowText = `Open from ${new Date(w.practiceFrom).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
      deadline = w.practiceTo ? new Date(w.practiceTo).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'No deadline';
    }
    if (kind === 'schedule') {
      const start = new Date(w.mode === 'timed' ? w.opens : w.practiceFrom);
      status = start > new Date() ? 'scheduled' : 'live';
    }
    const e = {
      id: uid('e'), title: w.title.trim(), subject: w.subject, batches: [...w.batches], mode: w.mode, status,
      window: windowText, deadline, late: w.late, policy: w.policy, reviewer: w.reviewer, see: { ...w.see }, file: w.file,
      enrolled, received: 0, evaluated: 0, reviewed: 0, flagged: 0, published: 0,
    };
    D.exams.unshift(e);
    log('file', `<b>${esc(e.title)}</b> ${status === 'draft' ? 'saved as a draft' : status === 'live' ? 'is open for uploads' : 'was scheduled'}`);
    S.wizard = null; S.examTab = 'rules';
    toast(status === 'draft' ? 'Saved as draft' : status === 'live' ? 'Exam is open. Students were notified' : 'Exam scheduled. Students are notified when it opens');
    go('exams/' + e.id);
  }

  // ---------- reviews ----------
  function viewReviews() {
    const f = S.reviewFilter;
    const held = (r) => String(r.reason).startsWith('Held');
    const list = D.reviews.filter((r) => f === 'waiting' ? !r.published && !r.done : f === 'flag' ? !r.published && !r.done && !held(r) : f === 'held' ? held(r) && !r.done : f === 'pub' ? r.published : r.done);
    const chips = [['waiting', 'Waiting', waiting()], ['flag', 'Flagged by AI', D.reviews.filter((r) => !r.published && !r.done && !held(r)).length], ['held', 'Held by exam rule', D.reviews.filter((r) => held(r) && !r.done).length], ['pub', 'Published, still flagged', D.reviews.filter((r) => r.published).length], ['done', 'Done', D.reviews.filter((r) => r.done).length]];
    return `
    <div class="page-head"><div><h1>Reviews</h1><p>Only scripts that need a faculty eye. Clean scripts follow each exam’s publish rule.</p></div>
      ${list.length ? `<div class="actions"><button class="btn dark" data-go="reviews/${list[0].id}">Start reviewing ${I('right', 14)}</button></div>` : ''}</div>
    <div class="card">
      <div class="toolbar"><div class="chips">${chips.map(([k, l, n]) => `<button class="chip ${f === k ? 'active' : ''}" data-act="reviewFilter" data-v="${k}">${l} <span class="muted">${n}</span></button>`).join('')}</div></div>
      ${list.length ? `<div class="table-wrap"><table class="t"><thead><tr><th>Student</th><th>Exam</th><th>Why it’s here</th><th class="num">AI marks</th><th>Confidence</th><th>Waiting</th><th></th></tr></thead>
      <tbody>${list.map((r) => { const s = student(r.student) || { name: '—', roll: '' }, e = exam(r.exam) || { title: '—', policy: 'clean' }; return `<tr class="click" data-go="reviews/${r.id}">
        <td><div class="who"><div class="avatar">${initials(s.name)}</div><div><b>${esc(s.name)}</b><span>${esc(s.roll)}</span></div></div></td>
        <td>${esc(e.title)}<div class="small muted">${POLICY[e.policy].short}</div></td>
        <td><span class="pill ${held(r) ? '' : 'warn'}">${esc(r.reason)}</span><div class="small muted" style="margin-top:3px">${esc(r.detail)}</div></td>
        <td class="num mono">${fmt(r.ai)}/${r.of}</td>
        <td><span class="pill ${r.conf === 'low' ? 'bad' : r.conf === 'medium' ? 'warn' : 'good'}">${r.conf}</span></td>
        <td class="small muted">${esc(r.age)}</td><td class="num"><a class="btn sm" href="#/reviews/${r.id}">Review</a></td></tr>`; }).join('')}</tbody></table></div>`
      : empty('review', f === 'waiting' ? 'Nothing to review' : 'No scripts here', 'Scripts the AI flags, and scripts held by an exam’s publish rule, appear here once students start uploading.')}
    </div>`;
  }

  // The review workspace renders r.script once the backend supplies it:
  // { questions:[{no,title,of,ai,flagged}], question, data:[[label,amount]], steps:[{n,title,of,ai,conf,why,ev,needed,status}], keywords:[{k,hit}], pages:[html] }
  function viewReview(id) {
    const r = D.reviews.find((x) => x.id === id);
    if (!r || !r.script) return empty('review', 'This script isn’t available', 'It may have been reviewed already, or the exam was deleted.', '<a class="btn" href="#/reviews">Back to reviews</a>');
    const s = student(r.student), e = exam(r.exam), R = r.script;
    const idx = D.reviews.indexOf(r), next = D.reviews[(idx + 1) % D.reviews.length], prev = D.reviews[(idx - 1 + D.reviews.length) % D.reviews.length];
    const q = R.questions[S.q] || R.questions[0];
    const stepMark = (st) => S.marks[st.n] ?? st.ai;
    const qTotal = R.steps.reduce((a, st) => a + stepMark(st), 0);
    const paper = R.questions.reduce((a, qq, i) => a + (i === S.q ? qTotal : qq.ai), 0);
    const tab = S.paneTab;
    const left = tab === 'script' ? (R.pages[S.page - 1] || '<div class="empty">No page</div>')
      : tab === 'question' ? `<div class="doc"><h4>${q.no} · ${q.of} marks</h4><p>${esc(R.question)}</p><table>${R.data.map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join('')}</table></div>`
      : `<div class="doc"><h4>Marking scheme</h4><table><tr><th>Step</th><th>Marks</th></tr>${R.steps.map((st) => `<tr><td>${st.n}. ${esc(st.title)}</td><td>${st.of}</td></tr>`).join('')}</table><h4>ICAI keywords</h4>${R.keywords.map((k) => `<span class="kw">${esc(k.k)}</span>`).join('')}</div>`;
    return `
    <div class="page-head" style="margin-bottom:14px">
      <div><div class="actions" style="margin-bottom:6px"><a class="btn sm ghost" href="#/reviews">${I('left', 14)} Queue</a><span class="pill warn">${esc(r.reason)}</span></div>
        <h1 style="font-size:24px">${esc(s.name)} <span class="muted" style="font-weight:400;font-size:16px">${esc(s.roll)}</span></h1><p>${esc(e.title)} · ${POLICY[e.policy].short}</p></div>
      <div class="actions"><span class="small muted">Script ${idx + 1} of ${D.reviews.length}</span><a class="icon-btn" href="#/reviews/${prev.id}" aria-label="Previous script">${I('left')}</a><a class="icon-btn" href="#/reviews/${next.id}" aria-label="Next script">${I('right')}</a></div>
    </div>
    <div class="review">
      <div class="card pane">
        <div class="pane-tabs">${[['script', 'Student’s answer'], ['question', 'Question'], ['scheme', 'Marking scheme']].map(([k, l]) => `<button class="${tab === k ? 'active' : ''}" data-act="paneTab" data-v="${k}">${l}</button>`).join('')}</div>
        <div class="pane-scroll">${left}</div>
        ${tab === 'script' ? `<div class="page-nav"><div class="actions"><button class="icon-btn" data-act="page" data-v="-1" data-max="${R.pages.length}" aria-label="Previous page">${I('left', 14)}</button><span>Page ${S.page} of ${R.pages.length}</span><button class="icon-btn" data-act="page" data-v="1" data-max="${R.pages.length}" aria-label="Next page">${I('right', 14)}</button></div><div class="actions"><button class="icon-btn" aria-label="Zoom out">${I('zout', 14)}</button><button class="icon-btn" aria-label="Zoom in">${I('zin', 14)}</button></div></div>` : ''}
      </div>
      <div class="card pane">
        <div style="padding:14px 18px 0"><div class="q-tabs">${R.questions.map((qq, i) => `<button class="q-tab ${S.q === i ? 'active' : ''} ${qq.flagged ? 'flag' : ''}" data-act="q" data-v="${i}">${qq.no}<small>${fmt(i === S.q ? qTotal : qq.ai)}/${qq.of}</small></button>`).join('')}</div></div>
        <div class="pane-scroll stack" style="gap:10px">
          <div><b>${q.no}. ${esc(q.title)}</b><div class="small muted">${q.of} marks · ${R.steps.length} steps</div></div>
          ${R.steps.map((st) => { const m = stepMark(st), lost = m < st.of, flagged = st.status === 'flag'; return `
          <div class="step ${flagged ? 'flagged' : ''} ${lost && !flagged ? 'lost' : ''}">
            <div class="step-top"><b>Step ${st.n}. ${esc(st.title)}</b>
              <div class="mark-box"><input aria-label="Marks for step ${st.n}" data-step="${st.n}" data-of="${st.of}" value="${fmt(m)}" class="${S.marks[st.n] != null ? 'changed' : ''}"><span class="muted">/ ${st.of}</span></div></div>
            <p class="why">${esc(st.why)}</p>
            <div class="ev">“${esc(st.ev)}”</div>
            ${lost && st.needed ? `<div class="needed"><b>Needed:</b> ${esc(st.needed)}</div>` : ''}
            <div class="meta"><span class="pill ${st.conf < 0.6 ? 'bad' : st.conf < 0.8 ? 'warn' : 'good'}">AI confidence ${st.conf.toFixed(2)}</span></div>
          </div>`; }).join('')}
          <div><div class="small muted" style="margin-bottom:6px">ICAI keywords</div>${R.keywords.map((k) => `<span class="kw ${k.hit ? 'hit' : 'miss'}">${k.hit ? '✓' : '✗'} ${esc(k.k)}</span>`).join('')}</div>
          <div class="field"><label for="rv-comment">Comment for the student</label><textarea id="rv-comment" class="input" placeholder="Optional. Shown with the result."></textarea></div>
        </div>
        <div class="total-bar">
          <div><div class="small muted">Paper total</div><div class="score"><span id="paper-total" data-base="${paper - qTotal}">${fmt(paper)}</span><span class="muted" style="font-size:15px"> / ${R.questions.reduce((a, qq) => a + qq.of, 0)}</span></div></div>
          <div class="actions" style="margin-left:auto"><button class="btn" data-act="toast" data-msg="Saved. Not published yet">Save</button><button class="btn dark" data-act="approve" data-id="${r.id}" data-next="${next.id}">${I('check', 14)} Approve${e.policy === 'manual' ? '' : ' & publish'}</button></div>
        </div>
      </div>
    </div>`;
  }

  // ---------- students ----------
  function viewStudents() {
    const tab = location.hash === '#students-join' ? 'join' : S.studentsTab;
    const list = D.students.filter((s) => S.studentBatch === 'all' || s.batch === S.studentBatch);
    let body;
    if (tab === 'all') {
      body = D.students.length ? `<div class="toolbar">
          <select id="st-batch" class="input" style="width:auto" data-act="studentBatch" aria-label="Batch"><option value="all">All batches</option>${D.batches.map((b) => `<option value="${b.id}" ${S.studentBatch === b.id ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}</select>
          <span class="small muted">${list.length} student${list.length === 1 ? '' : 's'}</span></div>
        <div class="table-wrap"><table class="t"><thead><tr><th>Student</th><th>Batch</th><th>Login ID</th><th class="num">Average</th><th class="num">Exams</th><th>Trend</th><th>Status</th></tr></thead>
        <tbody>${list.map((s) => `<tr class="click" data-go="students/${s.id}">
          <td><div class="who"><div class="avatar">${initials(s.name)}</div><div><b>${esc(s.name)}</b><span>${esc(s.roll)}</span></div></div></td>
          <td class="small">${esc(batch(s.batch).name)}</td>
          <td class="mono small">${esc(s.loginId)}</td>
          <td class="num mono">${s.taken ? s.avg + '%' : '—'}</td>
          <td class="num">${s.taken}${s.missed ? ` <span class="small" style="color:var(--bad)">· ${s.missed} missed</span>` : ''}</td>
          <td>${spark(s.trend)}</td><td>${statusOfStudent(s)}</td></tr>`).join('') || '<tr><td colspan="7" class="empty">No students in this batch.</td></tr>'}</tbody></table></div>`
        : empty('users', 'No students yet', D.batches.length ? 'Add students one by one and hand them a login, import them from Excel, or let them join with the academy code.' : 'Create a batch first, then add students to it.',
          D.batches.length ? `<div class="actions"><button class="btn" data-act="import">${I('upload', 14)} Import from Excel</button><button class="btn dark" data-act="addStudent">${I('plus', 14)} Add student</button></div>` : `<button class="btn dark" data-act="newBatch">${I('plus', 14)} New batch</button>`);
    } else if (tab === 'batches') {
      body = `<div class="card-body grid g-2">${D.batches.map((b) => `<div class="exam-card" data-act="openBatch" data-v="${b.id}">
        <div class="row"><div><h4>${esc(b.name)}</h4><div class="meta">${batchSize(b.id)} students${b.faculty ? ' · Faculty ' + esc(b.faculty) : ''}</div></div><span class="pill plain">${esc(b.course)}</span></div>
        <div class="small muted">${D.exams.filter((e) => e.batches.includes(b.id)).length} exams</div></div>`).join('')}
        <button class="exam-card" style="display:grid;place-items:center;color:var(--muted);border-style:dashed;min-height:96px;font:inherit" data-act="newBatch">${I('plus')} New batch</button></div>`;
    } else {
      body = `<div class="card-body">
        <div class="note">${I('key')}<div>${D.academy.code ? `Students can join from the Parallax Flow app with the academy code <b class="mono">${esc(D.academy.code)}</b>.` : 'Create an academy code in Settings → Student logins so students can join from the app.'} They can’t see any exam until you approve them here.</div></div>
        ${D.joinRequests.length ? `<div class="list" style="margin-top:8px">${D.joinRequests.map((j, i) => j.done ? '' : `
          <div class="list-item" style="flex-wrap:wrap"><div class="avatar">${initials(j.name)}</div>
            <div class="grow" style="min-width:180px"><b>${esc(j.name)}</b><div class="small muted">${esc(j.phone)} · asked ${esc(j.when)}</div></div>
            <select id="jr-batch-${i}" class="input" style="width:auto" aria-label="Batch for ${esc(j.name)}">${D.batches.map((b) => `<option value="${b.id}">${esc(b.name)}</option>`).join('')}</select>
            <input id="jr-roll-${i}" class="input" style="width:110px" placeholder="Roll no." value="${esc(j.roll)}" aria-label="Roll number for ${esc(j.name)}">
            <div class="actions"><button class="btn sm" data-act="join" data-i="${i}" data-v="no">Decline</button><button class="btn sm dark" data-act="join" data-i="${i}" data-v="ok">${I('check', 13)} Approve</button></div>
          </div>`).join('')}</div>` : '<div class="empty">No join requests waiting.</div>'}</div>`;
    }
    return `
    <div class="page-head"><div><h1>Students</h1><p>Add students yourself and hand them a login, or approve the ones who join with your academy code.</p></div>
      <div class="actions"><button class="btn" data-act="import" ${D.batches.length ? '' : 'disabled'}>${I('upload', 14)} Import from Excel</button><button class="btn dark" data-act="addStudent" ${D.batches.length ? '' : 'disabled'}>${I('plus')} Add student</button></div></div>
    <div class="card">
      <div class="tabs" style="padding:0 12px;margin:0">${[['all', 'All students', D.students.length], ['batches', 'Batches', D.batches.length], ['join', 'Join requests', joinCount()]].map(([k, l, n]) => `<button class="${tab === k ? 'active' : ''}" data-act="studentsTab" data-v="${k}">${l}<span class="n">${n}</span></button>`).join('')}</div>
      ${body}
    </div>`;
  }

  function viewStudent(id) {
    const s = student(id);
    if (!s) return empty('user', 'Student not found', 'They may have been removed.', '<a class="btn" href="#/students">All students</a>');
    const b = batch(s.batch);
    const t = s.trend || [];
    let chart = empty('chart', 'No exams written yet', 'The score trend appears after the first published result.');
    if (t.length > 1) {
      const W = 600, H = 170, pad = 24;
      const x = (i) => pad + (i / (t.length - 1)) * (W - pad * 2);
      const y = (v) => H - pad - (v / 100) * (H - pad * 2);
      chart = `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Score trend">
        ${[25, 50, 75].map((v) => `<line x1="${pad}" x2="${W - pad}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)" /><text x="2" y="${y(v) + 4}" font-size="10" fill="var(--muted)">${v}</text>`).join('')}
        <polyline points="${t.map((v, i) => `${x(i)},${y(v)}`).join(' ')}" fill="none" stroke="var(--accent)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>
        ${t.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="4" fill="var(--surface)" stroke="var(--accent)" stroke-width="2"></circle>`).join('')}</svg>`;
    }
    return `
    <div class="page-head">
      <div style="display:flex;gap:14px;align-items:center"><div class="avatar lg">${initials(s.name)}</div><div><h1>${esc(s.name)}</h1><p>${esc(s.roll)} · ${esc(b.name)} · ${statusOfStudent(s)}</p></div></div>
      <div class="actions"><button class="btn" data-act="resetPw" data-id="${s.id}">${I('lock', 14)} Reset password</button><a class="btn" href="#/students">${I('left', 14)} All students</a></div>
    </div>
    <div class="grid g-4">
      ${[['Average score', s.taken ? s.avg + '%' : '—', 'Published results only'], ['Exams written', s.taken, `${s.missed} missed`], ['Login ID', s.loginId, s.phone || 'No mobile added'], ['Steps lost most', '—', 'Shown after a few exams']].map(([l, v, d]) => `<div class="card kpi"><div class="label">${l}</div><div class="value" style="${String(v).length > 8 ? 'font-size:20px;margin-top:8px' : ''}">${esc(v)}</div><div class="delta">${esc(d)}</div></div>`).join('')}
    </div>
    <div class="grid g-main" style="margin-top:16px">
      <div class="card"><div class="card-head"><h3>Score trend</h3></div><div class="card-body">${chart}</div></div>
      <div class="card"><div class="card-head"><h3>By topic</h3></div><div class="card-body">${empty('layers', 'No topics yet', 'Strong and weak topics show up once results are published.')}</div></div>
    </div>
    <div class="card" style="margin-top:16px"><div class="card-head"><h3>Exam history</h3></div>
      ${empty('file', 'No exam history', 'Every exam this student writes is listed here with the marks and where they were lost.')}</div>`;
  }

  // ---------- reports ----------
  function viewReports() {
    if (!D.reports) {
      return `
      <div class="page-head"><div><h1>Reports</h1><p>How each exam went, where students lose marks, and how often faculty change the AI’s marks.</p></div></div>
      <div class="card">${empty('chart', 'No reports yet', 'Reports appear once the first exam has been marked: score spread, average by question, the steps most students lost, AI vs faculty agreement and batch comparison.', '<a class="btn" href="#/exams">Go to exams</a>')}</div>`;
    }
    return '';
  }

  // ---------- settings ----------
  function viewSettings() {
    const t = S.settingsTab;
    const A = D.academy;
    const tabs = [['academy', 'Academy'], ['team', 'Team & roles'], ['signup', 'Student logins'], ['defaults', 'Exam defaults'], ['usage', 'Plan & usage'], ['marking', 'Marking rules']];
    const sw = (id, title, desc, on) => `<div class="setting"><div class="grow"><b>${title}</b><p>${desc}</p></div><label class="switch"><input id="${id}" type="checkbox" ${on ? 'checked' : ''}><span></span></label></div>`;
    let body;
    if (t === 'academy') body = `<form data-form="academy"><div class="form-grid">
        <div class="field"><label for="st-name">Academy name</label><input id="st-name" class="input" name="name" value="${esc(A.name)}" placeholder="Your academy’s name" required></div>
        <div class="field"><label for="st-city">City</label><input id="st-city" class="input" name="city" value="${esc(A.city)}" placeholder="City"></div>
        <div class="field"><label for="st-mail">Contact email</label><input id="st-mail" class="input" name="email" type="email" value="${esc(A.email)}" placeholder="office@youracademy.com"></div>
        <div class="field"><label for="st-ph">Phone</label><input id="st-ph" class="input" name="phone" value="${esc(A.phone)}" placeholder="Phone"></div>
        <div class="field"><label for="st-me">Your name</label><input id="st-me" class="input" name="me" value="${esc(D.me.name)}" placeholder="Shown to your team"></div>
        <div class="field"><div class="label">Logo</div><div style="display:flex;gap:12px;align-items:center"><div class="academy-logo" style="width:40px;height:40px">${A.name ? initials(A.name) : '—'}</div><label class="btn sm">${I('upload', 13)} Upload logo<input id="st-logo" type="file" accept="image/*" hidden></label></div></div>
      </div><div style="margin-top:18px"><button class="btn dark" type="submit">Save changes</button></div></form>`;
    else if (t === 'team') body = `<div class="actions" style="justify-content:space-between;margin-bottom:10px"><span class="small muted">Admins manage everything. Exam managers create and publish exams. Reviewers see only their batches’ scripts.</span><button class="btn dark sm" data-act="invite">${I('plus', 13)} Invite</button></div>
      <div class="table-wrap"><table class="t"><thead><tr><th>Name</th><th>Role</th><th>Batches</th></tr></thead><tbody>
      <tr><td><div class="who"><div class="avatar">${D.me.name ? initials(D.me.name) : I('user', 14)}</div><div><b>${esc(myName())} <span class="muted small">(you)</span></b><span>${esc(D.me.email || '—')}</span></div></div></td><td>Academy admin</td><td class="small">All</td></tr>
      ${D.faculty.map((f, i) => `<tr><td><div class="who"><div class="avatar">${initials(f.name)}</div><div><b>${esc(f.name)}</b><span>${esc(f.email)}</span></div></div></td><td><select id="tm-role-${i}" class="input" style="width:auto" aria-label="Role for ${esc(f.name)}">${['Academy admin', 'Exam manager', 'Reviewer'].map((r) => `<option ${r === f.role ? 'selected' : ''}>${r}</option>`).join('')}</select></td><td class="small">${esc(f.batches || 'All')}</td></tr>`).join('')}</tbody></table></div>
      ${D.faculty.length ? '' : '<p class="small muted">No one else yet. Invite faculty and reviewers by email.</p>'}`;
    else if (t === 'signup') body = `
      ${sw('su-create', 'Academy creates student logins', 'Add a student and hand them a login ID and a temporary password. They set their own password on first sign-in.', true)}
      ${sw('su-code', 'Students can join with the academy code', 'Students enter the code in the Parallax Flow app.', true)}
      ${sw('su-approve', 'Approve every join request', 'A student who joins with the code sees nothing until an admin approves them and picks the batch.', true)}
      ${sw('su-otp', 'Students can reset their own password', 'By OTP to their registered mobile.', false)}
      <div class="setting"><div class="grow"><b>Academy code</b><p>${A.code ? 'Change it if it has been shared outside the academy. Already approved students are not affected.' : 'No code yet. Create one to let students join from the app.'}</p></div>${A.code ? `<span class="mono">${esc(A.code)}</span>` : ''}<button class="btn sm" data-act="newCode">${A.code ? 'New code' : 'Create code'}</button></div>`;
    else if (t === 'defaults') body = `<p class="muted" style="margin-top:0">Pre-filled on every new exam. You can still change them per exam.</p>
      <div class="field"><div class="label">Results</div><div class="options">${['clean', 'auto', 'manual'].map((k) => opt('noop', k, 'clean', POLICY[k].title, POLICY[k].desc)).join('')}</div></div>
      <div class="form-grid" style="margin-top:16px"><div class="field"><label for="df-late">Late uploads</label><select id="df-late" class="input">${Object.values(LATE).map((v) => `<option>${v}</option>`).join('')}</select></div>
      <div class="field"><label for="df-flag">Flag a step when AI confidence is below</label><select id="df-flag" class="input"><option>0.6</option><option selected>0.7</option><option>0.8</option></select></div></div>`;
    else if (t === 'usage') body = `
      <div class="kv"><span>Plan</span><b>${esc(A.plan || 'Not chosen yet')}</b></div>
      <div style="margin-top:16px"><div class="small muted">Scripts evaluated this month</div><div style="font-size:26px;font-weight:500">${A.scriptsUsed}${A.scriptsLimit ? ` <span class="muted" style="font-size:15px">of ${A.scriptsLimit}</span>` : ''}</div>
      <div class="bar" style="margin-top:8px"><span class="b1" style="width:${A.scriptsLimit ? (A.scriptsUsed / A.scriptsLimit) * 100 : 0}%"></span></div></div>
      <div class="note" style="margin-top:16px">${I('info')}<div>The AI runs on Parallax Flow’s servers, so your academy doesn’t need its own API key.</div></div>`;
    else body = `
      <div class="note warn">${I('alert')}<div><b>Being finalised with the client.</b> The rule below is the current direction and is shown for layout only.</div></div>
      <div class="kv" style="margin-top:16px"><span>Skipped step</span><b>Only that step gets 0. Every other step is marked on what the student wrote.</b>
      <span>Partial step</span><b>Part marks as per the marking scheme</b>
      <span>Final answer</span><b>To be decided</b></div>`;
    return `
    <div class="page-head"><div><h1>Settings</h1><p>${esc(academyName())}</p></div></div>
    <div class="card"><div class="tabs" style="padding:0 12px;margin:0">${tabs.map(([k, l]) => `<button class="${t === k ? 'active' : ''}" data-act="settingsTab" data-v="${k}">${l}</button>`).join('')}</div><div class="card-body" style="padding-top:18px">${body}</div></div>`;
  }

  // ---------- modals ----------
  function modal(html, wide) {
    document.getElementById('modal-root').innerHTML = `<div class="modal-back" data-act="closeModal"><div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true">${html}</div></div>`;
    setTimeout(() => document.querySelector('.modal input:not([type=hidden]), .modal select')?.focus(), 0);
  }
  const closeModal = () => { document.getElementById('modal-root').innerHTML = ''; };
  const head = (t) => `<div class="modal-head"><h3>${t}</h3><button class="icon-btn" type="button" data-act="closeModal" aria-label="Close">${I('x')}</button></div>`;

  function batchModal() {
    modal(`<form data-form="batch">${head('New batch')}
      <div class="modal-body"><div class="form-grid">
        <div class="field full"><label for="nb-name">Batch name</label><input id="nb-name" name="name" class="input" placeholder="e.g. CA Inter · May 2027 · Batch A" required></div>
        <div class="field"><label for="nb-course">Course</label><select id="nb-course" name="course" class="input">${COURSES.map((c) => `<option>${c}</option>`).join('')}</select></div>
        <div class="field"><label for="nb-fac">Faculty <span class="muted">(optional)</span></label><select id="nb-fac" name="faculty" class="input"><option value="">Not assigned</option>${D.faculty.map((f) => `<option>${esc(f.name)}</option>`).join('')}</select></div>
      </div></div>
      <div class="modal-foot"><button class="btn" type="button" data-act="closeModal">Cancel</button><button class="btn dark" type="submit">Create batch</button></div></form>`);
  }
  function addStudentModal() {
    modal(`<form data-form="student">${head('Add student')}
      <div class="modal-body"><div class="form-grid">
        <div class="field full"><label for="as-name">Full name</label><input id="as-name" name="name" class="input" required></div>
        <div class="field"><label for="as-batch">Batch</label><select id="as-batch" name="batch" class="input">${D.batches.map((b) => `<option value="${b.id}" ${S.studentBatch === b.id ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}</select></div>
        <div class="field"><label for="as-roll">Roll no.</label><input id="as-roll" name="roll" class="input" required></div>
        <div class="field"><label for="as-ph">Mobile</label><input id="as-ph" name="phone" class="input" inputmode="tel" placeholder="For login OTP and SMS"></div>
        <div class="field"><label for="as-em">Email <span class="muted">(optional)</span></label><input id="as-em" name="email" type="email" class="input"></div>
      </div></div>
      <div class="modal-foot"><button class="btn" type="button" data-act="closeModal">Cancel</button><button class="btn dark" type="submit">Create login</button></div></form>`);
  }
  function credentialsModal(s, pw) {
    modal(`${head('Login created')}
      <div class="modal-body"><p class="muted" style="margin-top:0">Give these to ${esc(s.name)}. They sign in on the Parallax Flow app and choose their own password.</p>
      <div class="cred" id="cred"><span>Academy</span><b>${esc(academyName())}</b><span>Login ID</span><b class="mono">${esc(s.loginId)}</b><span>Temporary password</span><b class="mono">${esc(pw)}</b><span>Batch</span><b>${esc(batch(s.batch).name)}</b></div>
      <p class="small muted" style="margin-bottom:0">The password is shown only once.</p></div>
      <div class="modal-foot"><button class="btn" data-act="copyCred">${I('copy', 14)} Copy</button><button class="btn" data-act="addStudent">Add another</button><button class="btn dark" data-act="closeModal">Done</button></div>`);
  }
  function inviteModal() {
    modal(`<form data-form="invite">${head('Invite to your team')}
      <div class="modal-body"><div class="form-grid">
        <div class="field"><label for="iv-name">Name</label><input id="iv-name" name="name" class="input" required></div>
        <div class="field"><label for="iv-mail">Email</label><input id="iv-mail" name="email" type="email" class="input" required></div>
        <div class="field"><label for="iv-role">Role</label><select id="iv-role" name="role" class="input"><option>Reviewer</option><option>Exam manager</option><option>Academy admin</option></select></div>
        <div class="field"><label for="iv-b">Batches</label><select id="iv-b" name="batches" class="input"><option value="All">All batches</option>${D.batches.map((b) => `<option>${esc(b.name)}</option>`).join('')}</select></div>
      </div></div>
      <div class="modal-foot"><button class="btn" type="button" data-act="closeModal">Cancel</button><button class="btn dark" type="submit">Send invite</button></div></form>`);
  }
  function importModal() {
    modal(`${head('Import students from Excel')}
      <div class="modal-body"><div class="dropzone"><div class="big">${I('upload', 22)}</div><b>Choose an Excel or CSV file</b><div class="small muted">Columns: Name, Roll no., Batch, Mobile, Email</div><label class="btn sm">Choose file<input id="im-file" type="file" accept=".xlsx,.csv" data-act="importFile" hidden></label></div>
      <div class="note" style="margin-top:14px">${I('info')}<div>Each student gets a login ID and a temporary password. You can send them all by SMS in one go.</div></div></div>
      <div class="modal-foot"><button class="btn" data-act="closeModal">Close</button></div>`);
  }
  function bellModal() {
    modal(`${head('Notifications')}<div class="modal-body list">${activityList()}</div>`);
  }

  let toastTimer;
  function toast(msg) {
    let t = document.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.innerHTML = `${I('check', 15)} ${esc(msg)}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.remove(), 2600);
  }

  // ---------- render ----------
  function render() {
    const [r, id] = route();
    const app = document.getElementById('app');
    const views = {
      overview: () => shell('overview', crumb('Overview'), viewOverview()),
      exams: () => id === 'new' ? shell('exams', crumb('Exams', 'Create exam'), viewNewExam())
        : id ? shell('exams', crumb('Exams', esc(exam(id)?.title || 'Exam')), viewExam(id))
        : shell('exams', crumb('Exams'), viewExams()),
      reviews: () => id ? shell('reviews', crumb('Reviews', 'Script'), viewReview(id)) : shell('reviews', crumb('Reviews'), viewReviews()),
      students: () => id ? shell('students', crumb('Students', esc(student(id)?.name || 'Student')), viewStudent(id)) : shell('students', crumb('Students'), viewStudents()),
      reports: () => shell('reports', crumb('Reports'), viewReports()),
      settings: () => shell('settings', crumb('Settings'), viewSettings()),
    };
    app.innerHTML = (r === 'login' || !views[r] ? viewLogin() : views[r]()).replace(/href="#\/([^"]*)"/g, (m, p) => `href="#${toHash(p)}"`);
  }

  // ---------- events ----------
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ', digits = '23456789';
  const pick = (set, n) => Array.from({ length: n }, () => set[Math.floor(Math.random() * set.length)]).join('');
  const acts = {
    nav: () => { S.navOpen = !S.navOpen; render(); },
    theme: () => {
      const root = document.documentElement;
      const dark = root.dataset.theme === 'dark' || (!root.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
      root.dataset.theme = dark ? 'light' : 'dark';
      try { localStorage.setItem('pf-theme', root.dataset.theme); } catch {}
      render();
    },
    bell: bellModal,
    toast: (el) => toast(el.dataset.msg),
    examFilter: (el) => { S.examFilter = el.dataset.v; render(); },
    examTab: (el) => { S.examTab = el.dataset.v; render(); },
    reviewFilter: (el) => { S.reviewFilter = el.dataset.v; render(); },
    studentsTab: (el) => { S.studentsTab = el.dataset.v; if (location.hash === '#students-join') history.replaceState(null, '', '#students'); render(); },
    settingsTab: (el) => { S.settingsTab = el.dataset.v; render(); },
    paneTab: (el) => { S.paneTab = el.dataset.v; render(); },
    q: (el) => { S.q = +el.dataset.v; S.marks = {}; render(); },
    page: (el) => { S.page = Math.min(+el.dataset.max, Math.max(1, S.page + +el.dataset.v)); render(); },
    approve: (el) => {
      const r = D.reviews.find((x) => x.id === el.dataset.id); if (r) r.done = true;
      S.marks = {}; S.q = 0; S.page = 1;
      toast('Approved');
      go(waiting() ? 'reviews/' + el.dataset.next : 'reviews');
    },
    closeExam: (el) => { const e = exam(el.dataset.id); e.status = 'closed'; log('lock', `<b>${esc(e.title)}</b> closed to new uploads`); render(); toast('Exam closed to new uploads'); },
    scheduleDraft: (el) => { const e = exam(el.dataset.id); e.status = 'scheduled'; render(); toast('Exam scheduled'); },
    deleteExam: (el) => {
      const e = exam(el.dataset.id);
      modal(`${head('Delete this exam?')}<div class="modal-body"><p style="margin-top:0"><b>${esc(e.title)}</b> and its uploads will be deleted for everyone. This can’t be undone.</p></div>
        <div class="modal-foot"><button class="btn" data-act="closeModal">Cancel</button><button class="btn danger" data-act="deleteExam2" data-id="${e.id}">Delete exam</button></div>`);
    },
    deleteExam2: (el) => { D.exams = D.exams.filter((e) => e.id !== el.dataset.id); closeModal(); toast('Exam deleted'); go('exams'); },
    join: (el) => {
      const j = D.joinRequests[el.dataset.i]; j.done = true;
      if (el.dataset.v === 'ok') {
        const b = document.getElementById('jr-batch-' + el.dataset.i)?.value, roll = document.getElementById('jr-roll-' + el.dataset.i)?.value || '';
        D.students.push({ id: uid('s'), name: j.name, roll, batch: b, phone: j.phone, loginId: (D.academy.code || 'pf').toLowerCase() + '-' + roll.toLowerCase().replace(/[^a-z0-9]/g, ''), status: 'active', avg: 0, taken: 0, missed: 0, trend: [] });
      }
      render(); toast(el.dataset.v === 'ok' ? 'Approved. The student can now see the batch’s exams' : 'Request declined');
    },
    newBatch: batchModal,
    addStudent: addStudentModal,
    import: importModal,
    invite: inviteModal,
    resetPw: () => { toast(`New temporary password: ${pick(letters, 4)}-${pick(digits, 4)}`); },
    copyCred: () => {
      const text = document.getElementById('cred').innerText;
      navigator.clipboard?.writeText(text).then(() => toast('Copied'), () => { getSelection().selectAllChildren(document.getElementById('cred')); toast('Selected. Press Ctrl+C to copy'); });
    },
    newCode: () => {
      const base = (D.academy.name || 'PF').replace(/[^A-Za-z ]/g, '').split(/\s+/).filter(Boolean).map((w) => w[0]).join('').toUpperCase().slice(0, 4) || 'PF';
      D.academy.code = `${base}-${pick(digits, 2)}${pick(letters, 2)}`; render(); toast('Academy code created');
    },
    closeModal: (el, ev) => { if (ev.target === el || el.tagName === 'BUTTON') closeModal(); },
    openBatch: (el) => { S.studentBatch = el.dataset.v; S.studentsTab = 'all'; render(); },
    wstep: (el) => { const v = +el.dataset.v; if (v >= 1 && v <= 4) { S.wizard.step = v; render(); window.scrollTo(0, 0); } },
    wbatch: (el) => { const w = S.wizard, v = el.dataset.v; w.batches = w.batches.includes(v) ? w.batches.filter((b) => b !== v) : [...w.batches, v]; render(); },
    wmode: (el) => { S.wizard.mode = el.dataset.v; render(); },
    wtiming: (el) => { S.wizard.timing = el.dataset.v; render(); },
    wpolicy: (el) => { S.wizard.policy = el.dataset.v; render(); },
    wsee: (el) => { S.wizard.see[el.dataset.v] = el.checked; },
    wsave: (el) => saveExam(el.dataset.v),
    wreset: () => { S.wizard = null; },
    noop: () => {},
  };

  const forms = {
    login: (f) => { const email = f.querySelector('#lg-email').value.trim(); if (email) D.me.email = email; go('overview'); },
    academy: (f) => {
      const v = Object.fromEntries(new FormData(f));
      Object.assign(D.academy, { name: v.name.trim(), city: v.city.trim(), email: v.email.trim(), phone: v.phone.trim() });
      D.me.name = v.me.trim();
      render(); toast('Saved');
    },
    batch: (f) => {
      const v = Object.fromEntries(new FormData(f));
      const b = { id: uid('b'), name: v.name.trim(), course: v.course, faculty: v.faculty };
      D.batches.push(b);
      if (S.wizard && !S.wizard.batches.length) S.wizard.batches.push(b.id);
      log('layers', `Batch <b>${esc(b.name)}</b> created`);
      closeModal(); render(); toast('Batch created');
    },
    student: (f) => {
      const v = Object.fromEntries(new FormData(f));
      const roll = v.roll.trim();
      const loginId = (D.academy.code ? D.academy.code.split('-')[0] : 'pf').toLowerCase() + '-' + roll.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (D.students.some((s) => s.loginId === loginId)) { toast('A student with this roll number already exists'); return; }
      const s = { id: uid('s'), name: v.name.trim(), roll, batch: v.batch, phone: v.phone.trim(), email: v.email.trim(), loginId, status: 'active', avg: 0, taken: 0, missed: 0, trend: [] };
      D.students.push(s);
      log('user', `<b>${esc(s.name)}</b> added to ${esc(batch(s.batch).name)}`);
      render();
      credentialsModal(s, `${pick(letters, 4)}-${pick(digits, 4)}`);
    },
    invite: (f) => {
      const v = Object.fromEntries(new FormData(f));
      D.faculty.push({ name: v.name.trim(), email: v.email.trim(), role: v.role, batches: v.batches });
      closeModal(); render(); toast(`Invite will go to ${v.email.trim()}`);
    },
  };

  document.addEventListener('submit', (ev) => {
    const f = ev.target.closest('[data-form]');
    if (!f) return;
    ev.preventDefault();
    forms[f.dataset.form]?.(f);
  });
  document.addEventListener('click', (ev) => {
    const a = ev.target.closest('[data-act]');
    if (a && acts[a.dataset.act]) {
      if (a.tagName === 'SELECT' || (a.tagName === 'INPUT' && (a.type === 'file' || a.type === 'number'))) return;
      if (a.dataset.act === 'closeModal') return acts.closeModal(a, ev);
      if (a.tagName !== 'INPUT' && a.tagName !== 'A') ev.preventDefault();
      acts[a.dataset.act](a, ev);
      return;
    }
    const g = ev.target.closest('[data-go]');
    if (g && !ev.target.closest('a,button:not([data-go])')) go(g.dataset.go);
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') closeModal();
    if (ev.key === 'Enter' && ev.target.matches('[data-go]')) go(ev.target.dataset.go);
  });
  document.addEventListener('change', (ev) => {
    const el = ev.target;
    if (el.dataset.act === 'studentBatch') { S.studentBatch = el.value; render(); }
    if (el.dataset.act === 'wfile' && el.files[0]) {
      const name = el.files[0].name;
      S.wizard.file = name;
      if (!S.wizard.title.trim()) S.wizard.title = name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');
      render();
    }
    if (el.dataset.act === 'wnq') { S.wizard.nq = Math.max(1, Math.min(20, parseInt(el.value, 10) || 1)); render(); }
    if (el.dataset.act === 'importFile' && el.files[0]) { closeModal(); toast(`${el.files[0].name} selected. Importing runs on the server, which isn’t connected yet`); }
  });
  document.addEventListener('input', (ev) => {
    const el = ev.target;
    if (el.dataset.bind && S.wizard) {
      S.wizard[el.dataset.bind] = el.value;
      if (el.dataset.bind === 'title') document.querySelectorAll('[data-act=wsave][data-v=draft]').forEach((b) => { b.disabled = !el.value.trim(); });
    }
    if (el.dataset.step) {
      const v = parseFloat(el.value);
      if (!isNaN(v)) {
        S.marks[+el.dataset.step] = Math.max(0, Math.min(+el.dataset.of, v));
        el.classList.add('changed');
      }
    }
  });

  try { const t = localStorage.getItem('pf-theme'); if (t) document.documentElement.dataset.theme = t; } catch {}
  render();
})();
