// The academy's data. Starts empty: everything here is created from the screens
// (and, once the backend exists, loaded from the server). Nothing is saved yet.
window.DB = {
  academy: { name: '', city: '', email: '', phone: '', code: '', plan: '', scriptsUsed: 0, scriptsLimit: 0 },
  me: { name: '', email: '', role: 'Academy admin' },
  batches: [],      // { id, name, course, faculty }
  faculty: [],      // { name, email, role, batches }
  exams: [],        // { id, title, subject, batches[], mode, status, window, deadline, late, policy, reviewer, see, file, enrolled, received, evaluated, reviewed, flagged, published }
  students: [],     // { id, name, roll, batch, phone, email, loginId, status, avg, taken, missed, trend[] }
  joinRequests: [], // { name, phone, batch, roll, when, note }
  reviews: [],      // scripts waiting for a reviewer
  activity: [],     // { ic, tone, text, time }
  reports: null,    // filled once the first exam is marked
};
