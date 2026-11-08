# Parallax Flow Academy

The academy console for Parallax Flow, a hosted, multi-academy product. Academies run exams, monitor students and review AI-evaluated scripts. Students upload their answers from the Parallax Flow mobile app, never from this console.

The console lives in `web/`: a React + TypeScript + Tailwind app (crisp product UI, light and dark, Ctrl+K command menu). It has no backend yet: it starts empty and keeps what you add in your browser only. The older plain-HTML mockup in `mockup/` is superseded.

## Run the console
```
cd web
npm install
npm run dev
```
Open http://localhost:5180. `npm run build` makes one self-contained `dist/index.html`.

## View the mockup
```
node serve-mockup.js
```
Then open http://localhost:5173 and click **Sign in** (sign-in is not connected yet, so any details open the console).

## Screens
| Screen | What the academy does there |
|---|---|
| Sign in | Staff sign in. Students use the mobile app |
| Overview | Live exams, scripts received, review queue, students needing attention, activity |
| Exams | List by status: Draft, Scheduled, Live, In review, Published |
| Create exam | 1. Upload the Word question paper 2. Batches, timed or open practice, one window or a window per question, late uploads 3. Publish rule, reviewer, what students see 4. Confirm |
| Exam page | Submissions, not submitted (with reminders), questions, timing and results rule, publish |
| Reviews | Queue of flagged or held scripts, then a one-screen review: handwriting on the left, step marks on the right, correct a misread figure, approve |
| Students | Roster, batches, join requests; add a student and hand them a login ID and temporary password; import from Excel |
| Student profile | Score trend against the batch, topics, exam history, where marks were lost |
| Reports | Score spread, average by question, most-lost steps, AI vs faculty agreement, batch comparison |
| Settings | Academy, team and roles, student logins, exam defaults, plan and usage, marking rules (to be finalised) |

## Publish rules (set per exam)
- **Publish every result automatically**
- **Publish clean results, hold flagged ones** (recommended default)
- **Hold everything until faculty publishes**

## Files
- `mockup/index.html`, `mockup/styles.css`: page and design tokens (from parallaxflow.in, light and dark)
- `mockup/data.js`: sample academy, batches, exams, students, reviews (all invented)
- `mockup/app.js`: screens and interactions
- `serve-mockup.js`: a tiny local server for the mockup
