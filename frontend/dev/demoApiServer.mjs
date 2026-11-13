import http from 'node:http';
import crypto from 'node:crypto';
import child_process from 'node:child_process';
import nodePath from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = nodePath.dirname(__filename);

function loadEnvFile(envPath, override = false) {
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (val && (override || !process.env[key])) {
        process.env[key] = val;
      }
    }
  }
}

loadEnvFile(nodePath.resolve(__dirname, '../../backend/.env'));
loadEnvFile(nodePath.resolve(__dirname, '../.env'));

const PORT = Number(process.env.DEMO_API_PORT || 5000);
const ALLOWED_ORIGIN = process.env.DEMO_ALLOWED_ORIGIN || 'http://localhost:5173';
const REFRESH_COOKIE = 'dayform_refresh_token';

// Deterministic PRNG matching .NET Random(7)-style seeded demo generation
function createRng(seed = 7) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function isoDate(d) {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function parseIsoDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function addDays(str, delta) {
  const d = parseIsoDate(str);
  d.setUTCDate(d.getUTCDate() + delta);
  return isoDate(d);
}

function todayStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function weekdayShort(str) {
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return names[parseIsoDate(str).getUTCDay()];
}

function weekdayFull(str) {
  const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return names[parseIsoDate(str).getUTCDay()];
}

function monthShortYear(year, month) {
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${names[month - 1]} ${year}`;
}

function intensityFromPct(pct) {
  if (pct <= 0) return 0;
  if (pct < 35) return 1;
  if (pct < 65) return 2;
  if (pct < 90) return 3;
  return 4;
}

const state = {
  users: [],
  refreshTokens: new Map(), // token -> { userId, expiresAt }
  resetTokens: new Map(), // email -> token
  otps: new Map(), // email -> { otp, expiresAt, attempts }
  habits: [],
  habitLogs: [],
  learningPaths: [],
  studySessions: [],
  memories: [],
  journals: [],
  reminders: []
};

function seedUserData(userId, email, password, displayName, isDemo = false, seed = 7) {
  const existing = state.users.find((u) => u.id === userId || u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    existing.password = password;
    return existing;
  }

  const today = todayStr();
  const totalDays = 150;
  const startDate = addDays(today, -(totalDays - 1));
  const nowIso = new Date().toISOString();

  const user = {
    id: userId,
    displayName,
    email,
    password,
    themePreference: 'Auto',
    journeyStartDate: addDays(today, -83),
    timeZoneId: 'UTC',
    isDemoUser: isDemo,
    createdAtUtc: nowIso
  };
  state.users.push(user);

  const rng = createRng(seed);

  const habitSpecs = [
    ['Wake up early', 'Lifestyle', 'Before 6:30 AM', 'sun'],
    ['Morning walk', 'Health', '20–30 minutes', 'leaf'],
    ['Move your body', 'Health', '15 minutes', 'zap'],
    ['Mindful breathing', 'Mind', '5 minutes', 'wind'],
    ['Focused study', 'Learning', 'One deep-work session', 'book'],
    ['Language practice', 'Learning', '20 minutes', 'pen'],
    ['Hydrate well', 'Health', '2 liters of water', 'drop'],
    ['Read before bed', 'Lifestyle', '10 pages', 'moon']
  ];

  const habits = habitSpecs.map(([name, category, target, icon], idx) => ({
    id: crypto.randomUUID(),
    userId,
    name,
    category,
    target,
    icon,
    color: null,
    isActive: true,
    sortOrder: idx + 1,
    createdAtUtc: nowIso
  }));
  state.habits.push(...habits);

  for (let i = 0; i < totalDays; i++) {
    const d = addDays(startDate, i);
    const isToday = d === today;
    const dow = parseIsoDate(d).getUTCDay();
    const wave = Math.sin(i / 11.0) * 0.12;
    const baseProb = 0.48 + (0.34 * i) / totalDays + wave - (dow === 0 ? 0.14 : 0);

    for (let hIdx = 0; hIdx < habits.length; hIdx++) {
      const completed = isToday
        ? hIdx === 0 || hIdx === 1 || hIdx === 4
        : rng() < baseProb - (hIdx > 5 ? 0.08 : 0);
      if (completed) {
        state.habitLogs.push({
          id: crypto.randomUUID(),
          userId,
          habitId: habits[hIdx].id,
          logDate: d,
          isCompleted: true
        });
      }
    }
  }

  const pathSpecs = [
    ['Personal learning plan', 'Subjects, chapters and topics of your own', 'book', 68, 2400],
    ['Professional development', 'Skills, architecture and practice sessions', 'zap', 42, 1800],
    ['Language practice', 'Vocabulary, speaking and writing drills', 'pen', 55, 1200],
    ['Mindful reading', 'Long-form essays and reflective notes', 'leaf', 35, 900]
  ];

  const paths = pathSpecs.map(([name, description, icon, progress, targetMinutes]) => ({
    id: crypto.randomUUID(),
    userId,
    name,
    description,
    icon,
    progress,
    targetMinutes,
    isArchived: false,
    createdAtUtc: nowIso
  }));
  state.learningPaths.push(...paths);

  const topics = [
    'Reading notes',
    'Practice exercises',
    'Review and recap',
    'New lesson',
    'Problem solving',
    'Weekly revision',
    'Concept mapping',
    'Timed drills'
  ];
  const durations = [25, 30, 40, 50, 60];

  for (let i = 0; i < totalDays; i++) {
    const d = addDays(startDate, i);
    if (rng() < 0.58) {
      const count = rng() < 0.25 ? 2 : 1;
      for (let k = 0; k < count; k++) {
        const path = paths[Math.floor(rng() * paths.length)];
        const mins = durations[Math.floor(rng() * durations.length)];
        state.studySessions.push({
          id: crypto.randomUUID(),
          userId,
          learningPathId: path.id,
          topic: topics[Math.floor(rng() * topics.length)],
          minutes: mins,
          sessionDate: d,
          notes: 'Daily study block',
          startedAtUtc: null,
          completedAtUtc: null,
          clientSessionKey: null,
          createdAtUtc: nowIso
        });
      }
    }
  }

  const memorySpecs = [
    [8, 'A slow morning by the coast', 'Travel', 'Quiet walk, sea breeze, no rush.', 'drop'],
    [19, 'Golden hour walk', 'Everyday', 'The evening light across the park felt calm.', 'sun'],
    [31, 'A little café break', 'Everyday', 'Coffee, a notebook and unhurried thinking time.', 'cup'],
    [44, 'Green trails', 'Travel', 'An afternoon surrounded by pine trees and quiet trails.', 'leaf'],
    [56, 'Finished the first phase', 'Milestone', 'Closed a learning goal I had been working toward.', 'star'],
    [68, 'A city to explore', 'Travel', 'New streets, architecture and fresh perspectives.', 'pin'],
    [79, 'Sunday with family', 'Everyday', 'Long lunch and slow conversation.', 'heart'],
    [91, 'Hit a 14-day streak', 'Milestone', 'Consistency is starting to feel natural.', 'star'],
    [103, 'Rainy evening reading', 'Everyday', 'Warm tea, a novel and the sound of rain.', 'book'],
    [114, 'Hill sunrise', 'Travel', 'Early start, worth every single minute.', 'sun'],
    [124, 'Deep focus breakthrough', 'Milestone', 'Completed two full focus sessions without distraction.', 'zap'],
    [133, 'Evening bike ride', 'Everyday', 'Cool breeze after a busy workday.', 'wind'],
    [141, 'Botanical garden sketch', 'Travel', 'Spent an hour sketching leaves in a quiet greenhouse.', 'leaf'],
    [146, 'Quiet moonlit walk', 'Everyday', 'Wrapped up the week with fresh air and gratitude.', 'moon']
  ];

  memorySpecs.forEach(([offset, title, category, note, icon], idx) => {
    state.memories.push({
      id: crypto.randomUUID(),
      userId,
      memoryDate: addDays(startDate, Math.min(offset, totalDays - 1)),
      title,
      category,
      note,
      icon,
      gradientIndex: idx % 6,
      image: null,
      createdAtUtc: nowIso
    });
  });

  const accPool = [
    'Completed my morning focus block before checking messages.',
    'Stayed consistent with movement and outdoor walk.',
    'Finished summarizing two chapters into clean notes.',
    'Wrapped up the weekly review with clear priorities.',
    'Kept a calm pace and finished the core task early.'
  ];
  const distPool = [
    'Phone notifications during the mid-afternoon.',
    'Switching between too many browser tabs.',
    'Checking email before finishing deep work.',
    'Late evening scrolling before bed.'
  ];
  const impPool = [
    'Leave phone in another room during the first study block.',
    'Write tomorrow’s top single priority before dinner.',
    'Take a 5-minute breathing pause after lunch.',
    'Start wind-down routine 30 minutes earlier.'
  ];

  for (let i = 1; i < totalDays - 1; i++) {
    if (i % 3 === 0 || rng() < 0.22) {
      state.journals.push({
        id: crypto.randomUUID(),
        userId,
        entryDate: addDays(startDate, i),
        accomplishments: accPool[Math.floor(rng() * accPool.length)],
        distractions: distPool[Math.floor(rng() * distPool.length)],
        improvements: impPool[Math.floor(rng() * impPool.length)],
        createdAtUtc: nowIso,
        updatedAtUtc: nowIso
      });
    }
  }

  const reminderSpecs = [
    ['Morning breathing check-in', addDays(today, -14), '07:30', 'Daily'],
    ['Weekly reset & planning', addDays(today, 2), '18:00', 'Weekly'],
    ['Review monthly goals', addDays(today, 5), '09:00', 'Monthly'],
    ["Plan next month's study path", addDays(today, 9), '20:00', 'Never'],
    ['Annual reflection milestone', addDays(today, 25), '10:00', 'Yearly']
  ];
  reminderSpecs.forEach(([title, reminderDate, reminderTime, repeatFrequency]) => {
    state.reminders.push({
      id: crypto.randomUUID(),
      userId,
      title,
      reminderDate,
      reminderTime,
      repeatFrequency,
      isActive: true
    });
  });

  return user;
}

function createDemoDataset(resetExisting = false) {
  const demoEmail = 'alex@example.com';
  const prayagEmail = 'prayagk@gmail.com';

  if (resetExisting) {
    state.users = [];
    state.habits = [];
    state.habitLogs = [];
    state.learningPaths = [];
    state.studySessions = [];
    state.memories = [];
    state.journals = [];
    state.reminders = [];
  }

  const alex = seedUserData('00000000-0000-0000-0000-00000000d300', demoEmail, 'DayformDemo123!', 'Alex Morgan', true, 7);
  seedUserData('00000000-0000-0000-0000-000000000001', prayagEmail, 'Prayagk@123', 'Prayag', false, 42);

  return alex;
}

createDemoDataset(false);

function sanitizeUser(u) {
  return {
    id: u.id,
    displayName: u.displayName,
    email: u.email,
    themePreference: u.themePreference,
    journeyStartDate: u.journeyStartDate,
    timeZoneId: u.timeZoneId,
    isDemoUser: u.isDemoUser,
    createdAtUtc: u.createdAtUtc
  };
}

function issueAuth(res, user, status = 200, message = 'Success') {
  const accessToken = `dev.${Buffer.from(JSON.stringify({ sub: user.id, exp: Date.now() + 900_000 })).toString('base64url')}.sig`;
  const refresh = crypto.randomBytes(24).toString('hex');
  state.refreshTokens.set(refresh, { userId: user.id, expiresAt: Date.now() + 14 * 86400_000 });
  res.setHeader(
    'Set-Cookie',
    `${REFRESH_COOKIE}=${refresh}; HttpOnly; Path=/api/v1/auth; SameSite=Lax; Max-Age=${14 * 86400}`
  );
  sendJson(res, status, {
    success: true,
    message,
    data: {
      accessToken,
      expiresAtUtc: new Date(Date.now() + 900_000).toISOString(),
      user: sanitizeUser(user)
    }
  });
}

function getAuthUser(req) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return null;
  const parts = auth.slice(7).split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Date.now()) return null;
    return state.users.find((u) => u.id === payload.sub) || null;
  } catch {
    return null;
  }
}

function parseCookies(req) {
  if (req.cookies && typeof req.cookies === 'object' && Object.keys(req.cookies).length > 0) {
    return req.cookies;
  }
  const raw = req.headers.cookie || '';
  const map = {};
  raw.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx > 0) {
      map[pair.slice(0, idx).trim()] = decodeURIComponent(pair.slice(idx + 1).trim());
    }
  });
  return map;
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function sendProblem(res, status, title, detail) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/problem+json; charset=utf-8');
  res.end(JSON.stringify({ status, title, detail }));
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    if (Buffer.isBuffer(req.body)) return resolve(req.body);
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  const buf = await readRawBody(req);
  if (!buf || !buf.length) return {};
  try {
    return JSON.parse(buf.toString('utf8'));
  } catch {
    return {};
  }
}

function extractMultipartFile(buf, contentType) {
  const match = /boundary=([^;\s]+)/i.exec(contentType || '');
  if (!match) return null;
  const boundary = `--${match[1].replace(/^"|"$/g, '')}`;
  const raw = buf.toString('latin1');
  const parts = raw.split(boundary);
  for (const part of parts) {
    if (!part.includes('filename=')) continue;
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) continue;
    const headers = part.slice(0, headerEnd);
    const bodyLatin1 = part.slice(headerEnd + 4, part.endsWith('\r\n') ? part.length - 2 : part.length);
    const fnMatch = /filename="([^"]+)"/i.exec(headers);
    const ctMatch = /Content-Type:\s*([^\r\n]+)/i.exec(headers);
    return {
      fileName: fnMatch?.[1] || 'upload.png',
      mime: (ctMatch?.[1] || 'image/png').trim(),
      buffer: Buffer.from(bodyLatin1, 'latin1')
    };
  }
  return null;
}

function computeHabitStreaks(userId, asOfDate) {
  const activeHabits = state.habits.filter((h) => h.userId === userId && h.isActive);
  if (!activeHabits.length) return { current: 0, best: 0, weeklyAvg: 0 };

  const activeSet = new Set(activeHabits.map((h) => h.id));
  const countsByDate = new Map();
  for (const log of state.habitLogs) {
    if (log.userId === userId && log.isCompleted && activeSet.has(log.habitId)) {
      countsByDate.set(log.logDate, (countsByDate.get(log.logDate) || 0) + 1);
    }
  }

  let weeklySum = 0;
  for (let i = 0; i < 7; i++) {
    const d = addDays(asOfDate, -i);
    weeklySum += ((countsByDate.get(d) || 0) / activeHabits.length) * 100;
  }
  const weeklyAvg = Math.round(weeklySum / 7);

  const isSuccessDay = (d) => (countsByDate.get(d) || 0) > 0;
  let current = 0;
  let cursor = isSuccessDay(asOfDate) ? asOfDate : addDays(asOfDate, -1);
  while (current < 400 && isSuccessDay(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }

  const allDates = [...countsByDate.keys()].filter((d) => d <= asOfDate).sort();
  let best = 0;
  let run = 0;
  let prev = null;
  for (const d of allDates) {
    if (!isSuccessDay(d)) continue;
    if (prev && addDays(prev, 1) === d) run++;
    else run = 1;
    if (run > best) best = run;
    prev = d;
  }

  return { current, best, weeklyAvg };
}

function mapHabitDto(userId, h, date) {
  const completedToday = state.habitLogs.some(
    (l) => l.userId === userId && l.habitId === h.id && l.logDate === date && l.isCompleted
  );
  return {
    id: h.id,
    name: h.name,
    category: h.category,
    target: h.target,
    icon: h.icon,
    color: h.color,
    isActive: h.isActive,
    completedToday,
    createdAtUtc: h.createdAtUtc
  };
}

function mapSessionDto(userId, s) {
  const path = s.learningPathId ? state.learningPaths.find((p) => p.id === s.learningPathId && p.userId === userId) : null;
  return {
    id: s.id,
    learningPathId: s.learningPathId,
    learningPathName: path ? path.name : 'General study',
    topic: s.topic,
    minutes: s.minutes,
    sessionDate: s.sessionDate,
    notes: s.notes,
    startedAtUtc: s.startedAtUtc,
    completedAtUtc: s.completedAtUtc,
    createdAtUtc: s.createdAtUtc
  };
}

function mapLearningPathDto(userId, p) {
  const sessions = state.studySessions.filter((s) => s.userId === userId && s.learningPathId === p.id);
  const totalMinutesLogged = sessions.reduce((a, b) => a + b.minutes, 0);
  const lastSessionDate = sessions.map((s) => s.sessionDate).sort().at(-1) || null;
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    icon: p.icon,
    targetMinutes: p.targetMinutes,
    progress: p.progress,
    isArchived: p.isArchived,
    totalMinutesLogged,
    sessionCount: sessions.length,
    lastSessionDate,
    createdAtUtc: p.createdAtUtc
  };
}

function occursOn(rem, dateStr) {
  if (!rem.isActive || dateStr < rem.reminderDate) return false;
  if (dateStr === rem.reminderDate) return true;
  const start = parseIsoDate(rem.reminderDate);
  const cur = parseIsoDate(dateStr);
  switch (rem.repeatFrequency) {
    case 'Daily':
      return true;
    case 'Weekly':
      return start.getUTCDay() === cur.getUTCDay();
    case 'Monthly': {
      const dim = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() + 1, 0)).getUTCDate();
      return cur.getUTCDate() === Math.min(start.getUTCDate(), dim);
    }
    case 'Yearly':
      return start.getUTCMonth() === cur.getUTCMonth() && start.getUTCDate() === cur.getUTCDate();
    default:
      return false;
  }
}

function listDatesBetween(fromStr, toStr) {
  const out = [];
  let cur = fromStr;
  while (cur <= toStr && out.length < 400) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}

export async function handleRequest(req, res) {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  } else {
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  let path = parsedUrl.pathname;
  if (!path.startsWith('/api/') && path.startsWith('/v1/')) {
    path = '/api' + path;
  }
  const q = parsedUrl.searchParams;

  try {
    if (req.method === 'GET' && path === '/api/v1/health') {
      return sendJson(res, 200, { status: 'healthy', service: 'DAYFORM.DevDemoApi' });
    }

    // AUTH ROUTES
    if (req.method === 'POST' && path === '/api/v1/auth/login') {
      const body = await readJson(req);
      const email = String(body.email || '').trim().toLowerCase();
      const user = state.users.find((u) => u.email.toLowerCase() === email && u.password === body.password);
      if (!user) return sendProblem(res, 401, 'Unauthorized', 'Invalid email or password.');
      return issueAuth(res, user, 200, 'Signed in successfully.');
    }

    if (req.method === 'POST' && path === '/api/v1/auth/register') {
      const body = await readJson(req);
      const email = String(body.email || '').trim().toLowerCase();
      if (!body.displayName || !email || String(body.password || '').length < 8) {
        return sendProblem(res, 400, 'Validation failed', 'Please provide name, valid email, and 8+ character password.');
      }
      if (state.users.some((u) => u.email.toLowerCase() === email)) {
        return sendProblem(res, 409, 'Conflict', 'An account with this email already exists.');
      }
      const user = {
        id: crypto.randomUUID(),
        displayName: String(body.displayName).trim(),
        email: String(body.email).trim(),
        password: String(body.password),
        themePreference: 'Auto',
        journeyStartDate: todayStr(),
        timeZoneId: body.timeZoneId || 'UTC',
        isDemoUser: false,
        createdAtUtc: new Date().toISOString()
      };
      state.users.push(user);
      return issueAuth(res, user, 201, 'Account created successfully.');
    }

    if (req.method === 'POST' && path === '/api/v1/auth/send-otp') {
      const body = await readJson(req);
      const email = String(body.email || '').trim().toLowerCase();
      const displayName = String(body.displayName || 'there').trim();
      if (!email || !email.includes('@')) {
        return sendProblem(res, 400, 'Validation failed', 'Please provide a valid email address.');
      }
      if (state.users.some((u) => u.email.toLowerCase() === email)) {
        return sendProblem(res, 409, 'Conflict', 'An account with this email already exists.');
      }

      // Re-read .env in case the user just updated GMAIL_APP_PASSWORD
      loadEnvFile(nodePath.resolve(__dirname, '../../backend/.env'), true);
      const appPassword = (process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || process.env.Email__AppPassword || '').replace(/\s+/g, '');

      if (!appPassword) {
        return sendProblem(
          res,
          400,
          'Gmail App Password Missing',
          'Gmail App Password is not set for prayagk806@gmail.com. Please provide your 16-character Google App Password in backend/.env (GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx) so real emails can be delivered to user inboxes.'
        );
      }

      const otp = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = Date.now() + 10 * 60 * 1000;

      // Dispatch via backend/mailer/sendOtp.mjs
      const mailerScript = nodePath.resolve(__dirname, '../../backend/mailer/sendOtp.mjs');
      const mailResult = await new Promise((resolve) => {
        child_process.execFile(
          process.execPath,
          [mailerScript, '--to', email, '--otp', otp, '--name', displayName],
          {
            env: {
              ...process.env,
              SMTP_USER: 'prayagk806@gmail.com',
              GMAIL_APP_PASSWORD: appPassword
            }
          },
          (err, stdout, stderr) => {
            const raw = (stdout || stderr || '').trim();
            try {
              resolve(JSON.parse(raw));
            } catch {
              resolve({ success: !err, error: err ? err.message : raw });
            }
          }
        );
      });

      if (!mailResult.success) {
        return sendProblem(
          res,
          400,
          'Email Send Failed',
          mailResult.error || 'Failed to send email through Gmail SMTP. Please check your 16-character Google App Password.'
        );
      }

      state.otps.set(email, { otp, expiresAt, attempts: 0 });
      console.log(`[Demo API Server] Real email delivered to ${email} with OTP: ${otp}`);

      return sendJson(res, 200, {
        success: true,
        message: 'Verification code sent to your email.',
        data: {
          message: 'Verification code sent to your email.',
          expiresAtUtc: new Date(expiresAt).toISOString()
        }
      });
    }

    if (req.method === 'POST' && path === '/api/v1/auth/verify-otp-and-register') {
      const body = await readJson(req);
      const email = String(body.email || '').trim().toLowerCase();
      const displayName = String(body.displayName || '').trim();
      const password = String(body.password || '');
      const submittedOtp = String(body.otp || '').trim();

      if (!displayName || !email || password.length < 8) {
        return sendProblem(res, 400, 'Validation failed', 'Please provide name, valid email, and 8+ character password.');
      }

      if (state.users.some((u) => u.email.toLowerCase() === email)) {
        return sendProblem(res, 409, 'Conflict', 'An account with this email already exists.');
      }

      const otpEntry = state.otps.get(email);
      if (!otpEntry || Date.now() > otpEntry.expiresAt) {
        return sendProblem(res, 400, 'Invalid OTP', 'Verification code has expired or is invalid. Please request a new code.');
      }

      if (otpEntry.attempts >= 5) {
        return sendProblem(res, 400, 'Too many attempts', 'Too many invalid attempts. Please request a new verification code.');
      }

      if (otpEntry.otp !== submittedOtp) {
        otpEntry.attempts++;
        return sendProblem(res, 400, 'Incorrect OTP', 'Incorrect verification code. Please check and try again.');
      }

      state.otps.delete(email);

      const user = {
        id: crypto.randomUUID(),
        displayName,
        email: String(body.email).trim(),
        password,
        themePreference: 'Auto',
        journeyStartDate: todayStr(),
        timeZoneId: body.timeZoneId || 'UTC',
        isDemoUser: false,
        createdAtUtc: new Date().toISOString()
      };
      state.users.push(user);
      return issueAuth(res, user, 201, 'Account created successfully.');
    }

    if (req.method === 'POST' && path === '/api/v1/auth/demo-login') {
      const user = createDemoDataset(false);
      return issueAuth(res, user, 200, 'Signed into development demo account.');
    }

    if (req.method === 'POST' && path === '/api/v1/auth/refresh') {
      const cookies = parseCookies(req);
      const tok = cookies[REFRESH_COOKIE];
      const entry = tok ? state.refreshTokens.get(tok) : null;
      if (!entry || entry.expiresAt < Date.now()) {
        return sendProblem(res, 401, 'Unauthorized', 'Refresh token missing or expired.');
      }
      state.refreshTokens.delete(tok);
      const user = state.users.find((u) => u.id === entry.userId);
      if (!user) return sendProblem(res, 401, 'Unauthorized', 'User not found.');
      return issueAuth(res, user, 200, 'Session refreshed.');
    }

    if (req.method === 'POST' && path === '/api/v1/auth/logout') {
      const cookies = parseCookies(req);
      if (cookies[REFRESH_COOKIE]) state.refreshTokens.delete(cookies[REFRESH_COOKIE]);
      res.setHeader('Set-Cookie', `${REFRESH_COOKIE}=; HttpOnly; Path=/api/v1/auth; Max-Age=0`);
      res.statusCode = 204;
      return res.end();
    }

    if (req.method === 'POST' && path === '/api/v1/auth/forgot-password') {
      const body = await readJson(req);
      const email = String(body.email || '').trim().toLowerCase();
      const token = crypto.randomBytes(16).toString('hex');
      state.resetTokens.set(email, token);
      return sendJson(res, 200, {
        success: true,
        message: 'Reset instructions prepared.',
        data: { message: 'Reset instructions prepared.', developmentResetToken: token }
      });
    }

    if (req.method === 'POST' && path === '/api/v1/auth/reset-password') {
      const body = await readJson(req);
      const email = String(body.email || '').trim().toLowerCase();
      const user = state.users.find((u) => u.email.toLowerCase() === email);
      if (!user || state.resetTokens.get(email) !== body.token) {
        return sendProblem(res, 400, 'Invalid token', 'Invalid or expired reset token.');
      }
      user.password = String(body.newPassword || '');
      state.resetTokens.delete(email);
      return sendJson(res, 200, { success: true, message: 'Password updated.', data: { reset: true } });
    }

    // AUTHENTICATED ROUTES BELOW
    const user = getAuthUser(req);
    if (!user) {
      return sendProblem(res, 401, 'Unauthorized', 'Please sign in to access this resource.');
    }

    if (req.method === 'GET' && path === '/api/v1/auth/me') {
      return sendJson(res, 200, { success: true, message: 'Success', data: sanitizeUser(user) });
    }

    if (req.method === 'POST' && path === '/api/v1/auth/demo-reset') {
      if (!user.isDemoUser) return sendProblem(res, 403, 'Forbidden', 'Only the demo account can be reset.');
      createDemoDataset(true);
      return sendJson(res, 200, { success: true, message: 'Demo data reset.', data: { reset: true } });
    }

    // DASHBOARD
    if (req.method === 'GET' && (path === '/api/v1/dashboard/summary' || path === '/api/v1/dashboard')) {
      const date = q.get('date') || todayStr();
      const activeHabits = state.habits
        .filter((h) => h.userId === user.id && h.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      const todayHabits = activeHabits.map((h) => mapHabitDto(user.id, h, date));
      const completedHabitsToday = todayHabits.filter((h) => h.completedToday).length;
      const totalActiveHabits = activeHabits.length;
      const completionPercentToday = totalActiveHabits ? Math.round((completedHabitsToday / totalActiveHabits) * 100) : 0;
      const nextHabit = todayHabits.find((h) => !h.completedToday)?.name || null;
      const streaks = computeHabitStreaks(user.id, date);

      const last7Days = [];
      let focusMinutesLast7Days = 0;
      for (let i = 6; i >= 0; i--) {
        const d = addDays(date, -i);
        const done = state.habitLogs.filter(
          (l) => l.userId === user.id && l.logDate === d && l.isCompleted && activeHabits.some((h) => h.id === l.habitId)
        ).length;
        const studyMinutes = state.studySessions
          .filter((s) => s.userId === user.id && s.sessionDate === d)
          .reduce((a, b) => a + b.minutes, 0);
        focusMinutesLast7Days += studyMinutes;
        last7Days.push({
          date: d,
          weekdayShort: weekdayShort(d),
          completedCount: done,
          totalCount: totalActiveHabits,
          completionPercent: totalActiveHabits ? Math.round((done / totalActiveHabits) * 100) : 0,
          studyMinutes
        });
      }

      const startMs = parseIsoDate(user.journeyStartDate).getTime();
      const todayMs = parseIsoDate(date).getTime();
      const journeyDay = Math.max(1, Math.min(180, Math.floor((todayMs - startMs) / 86400_000) + 1));

      const recentMemories = state.memories
        .filter((m) => m.userId === user.id)
        .sort((a, b) => b.memoryDate.localeCompare(a.memoryDate))
        .slice(0, 5);

      return sendJson(res, 200, {
        success: true,
        message: 'Success',
        data: {
          todayDate: date,
          journeyDay,
          journeyTotalDays: 180,
          completedHabitsToday,
          totalActiveHabits,
          completionPercentToday,
          nextIncompleteHabitName: nextHabit,
          currentStreakDays: streaks.current,
          bestStreakDays: streaks.best,
          focusMinutesLast7Days,
          habitAverageLast7Days: streaks.weeklyAvg,
          last7Days,
          todayHabits,
          recentMemories
        }
      });
    }

    if (req.method === 'GET' && path === '/api/v1/dashboard/weekly-activity') {
      const date = q.get('date') || todayStr();
      const activeHabits = state.habits.filter((h) => h.userId === user.id && h.isActive);
      const totalActiveHabits = activeHabits.length;
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const d = addDays(date, -i);
        const done = state.habitLogs.filter(
          (l) => l.userId === user.id && l.logDate === d && l.isCompleted && activeHabits.some((h) => h.id === l.habitId)
        ).length;
        const studyMinutes = state.studySessions
          .filter((s) => s.userId === user.id && s.sessionDate === d)
          .reduce((a, b) => a + b.minutes, 0);
        last7Days.push({
          date: d,
          weekdayShort: weekdayShort(d),
          completedCount: done,
          totalCount: totalActiveHabits,
          completionPercent: totalActiveHabits ? Math.round((done / totalActiveHabits) * 100) : 0,
          studyMinutes
        });
      }
      return sendJson(res, 200, { success: true, message: 'Success', data: last7Days });
    }

    if (req.method === 'GET' && path === '/api/v1/dashboard/recent-memories') {
      const limit = Math.max(1, Math.min(20, Number(q.get('limit') || 5)));
      const recentMemories = state.memories
        .filter((m) => m.userId === user.id)
        .sort((a, b) => b.memoryDate.localeCompare(a.memoryDate))
        .slice(0, limit);
      return sendJson(res, 200, { success: true, message: 'Success', data: recentMemories });
    }

    // HABITS
    if (req.method === 'GET' && path === '/api/v1/habits') {
      const date = q.get('date') || todayStr();
      const includeArchived = q.get('includeArchived') === 'true';
      const category = q.get('category');
      let list = state.habits.filter((h) => h.userId === user.id && (includeArchived || h.isActive));
      if (category) list = list.filter((h) => h.category.toLowerCase() === category.toLowerCase());
      list.sort((a, b) => a.sortOrder - b.sortOrder);
      return sendJson(res, 200, { success: true, message: 'Success', data: list.map((h) => mapHabitDto(user.id, h, date)) });
    }

    if (req.method === 'GET' && path === '/api/v1/habits/summary') {
      const date = q.get('date') || todayStr();
      const activeCount = state.habits.filter((h) => h.userId === user.id && h.isActive).length;
      const s = computeHabitStreaks(user.id, date);
      return sendJson(res, 200, {
        success: true,
        message: 'Success',
        data: {
          weeklyAveragePercent: s.weeklyAvg,
          currentStreakDays: s.current,
          bestStreakDays: s.best,
          activeCount
        }
      });
    }

    if (req.method === 'GET' && path === '/api/v1/habits/heatmap') {
      const weeks = Math.max(1, Math.min(52, Number(q.get('weeks') || 21)));
      const endDate = q.get('date') || todayStr();
      const activeHabits = state.habits.filter((h) => h.userId === user.id && h.isActive);
      const total = activeHabits.length;
      const days = weeks * 7;
      const result = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = addDays(endDate, -i);
        const done = state.habitLogs.filter(
          (l) => l.userId === user.id && l.logDate === d && l.isCompleted && activeHabits.some((h) => h.id === l.habitId)
        ).length;
        const pct = total ? Math.round((done / total) * 100) : 0;
        result.push({
          date: d,
          completedCount: done,
          totalActiveCount: total,
          completionPercent: pct,
          intensityLevel: intensityFromPct(pct)
        });
      }
      return sendJson(res, 200, { success: true, message: 'Success', data: result });
    }

    if (req.method === 'POST' && path === '/api/v1/habits') {
      const body = await readJson(req);
      const h = {
        id: crypto.randomUUID(),
        userId: user.id,
        name: String(body.name || '').trim(),
        category: String(body.category || 'Health').trim(),
        target: body.target || null,
        icon: body.icon || 'sun',
        color: body.color || null,
        isActive: true,
        sortOrder: state.habits.filter((x) => x.userId === user.id).length + 1,
        createdAtUtc: new Date().toISOString()
      };
      state.habits.push(h);
      return sendJson(res, 201, { success: true, message: 'Habit created.', data: mapHabitDto(user.id, h, todayStr()) });
    }

    const habitMatch = /^\/api\/v1\/habits\/([^/]+)$/.exec(path);
    if (habitMatch) {
      const h = state.habits.find((x) => x.id === habitMatch[1] && x.userId === user.id);
      if (!h) return sendProblem(res, 404, 'Not Found', 'Habit not found.');
      if (req.method === 'GET') {
        return sendJson(res, 200, { success: true, message: 'Success', data: mapHabitDto(user.id, h, q.get('date') || todayStr()) });
      }
      if (req.method === 'PUT') {
        const body = await readJson(req);
        h.name = String(body.name ?? h.name).trim();
        h.category = String(body.category ?? h.category).trim();
        h.target = body.target ?? null;
        h.icon = body.icon ?? h.icon;
        h.color = body.color ?? h.color;
        if (typeof body.isActive === 'boolean') h.isActive = body.isActive;
        return sendJson(res, 200, { success: true, message: 'Habit updated.', data: mapHabitDto(user.id, h, todayStr()) });
      }
      if (req.method === 'DELETE') {
        state.habits = state.habits.filter((x) => x.id !== h.id);
        state.habitLogs = state.habitLogs.filter((l) => l.habitId !== h.id);
        res.statusCode = 204;
        return res.end();
      }
    }

    const habitLogsListMatch = /^\/api\/v1\/habits\/([^/]+)\/logs$/.exec(path);
    if (habitLogsListMatch && req.method === 'GET') {
      const habitId = habitLogsListMatch[1];
      const h = state.habits.find((x) => x.id === habitId && x.userId === user.id);
      if (!h) return sendProblem(res, 404, 'Not Found', 'Habit not found.');
      const from = q.get('from');
      const to = q.get('to');
      let logs = state.habitLogs.filter((l) => l.userId === user.id && l.habitId === habitId);
      if (from) logs = logs.filter((l) => l.logDate >= from);
      if (to) logs = logs.filter((l) => l.logDate <= to);
      logs.sort((a, b) => a.logDate.localeCompare(b.logDate));
      return sendJson(res, 200, { success: true, message: 'Success', data: logs });
    }

    const habitLogMatch = /^\/api\/v1\/habits\/([^/]+)\/logs\/(\d{4}-\d{2}-\d{2})$/.exec(path);
    if (habitLogMatch && req.method === 'PUT') {
      const [, habitId, logDate] = habitLogMatch;
      const h = state.habits.find((x) => x.id === habitId && x.userId === user.id);
      if (!h) return sendProblem(res, 404, 'Not Found', 'Habit not found.');
      const body = await readJson(req);
      let log = state.habitLogs.find((l) => l.userId === user.id && l.habitId === habitId && l.logDate === logDate);
      if (!log) {
        log = { id: crypto.randomUUID(), userId: user.id, habitId, logDate, isCompleted: Boolean(body.isCompleted) };
        state.habitLogs.push(log);
      } else {
        log.isCompleted = Boolean(body.isCompleted);
      }
      return sendJson(res, 200, { success: true, message: 'Updated.', data: log });
    }

    // LEARNING PATHS & STUDY SESSIONS
    if (req.method === 'GET' && path === '/api/v1/learning-paths') {
      const includeArchived = q.get('includeArchived') === 'true';
      const items = state.learningPaths
        .filter((p) => p.userId === user.id && (includeArchived || !p.isArchived))
        .map((p) => mapLearningPathDto(user.id, p));
      return sendJson(res, 200, { success: true, message: 'Success', data: items });
    }

    if (req.method === 'POST' && path === '/api/v1/learning-paths') {
      const body = await readJson(req);
      const lp = {
        id: crypto.randomUUID(),
        userId: user.id,
        name: String(body.name || '').trim(),
        description: body.description || null,
        icon: body.icon || 'book',
        targetMinutes: body.targetMinutes ?? null,
        progress: Number(body.progress ?? 0),
        isArchived: false,
        createdAtUtc: new Date().toISOString()
      };
      state.learningPaths.push(lp);
      return sendJson(res, 201, { success: true, message: 'Learning path created.', data: mapLearningPathDto(user.id, lp) });
    }

    const pathMatch = /^\/api\/v1\/learning-paths\/([^/]+)$/.exec(path);
    if (pathMatch) {
      const lp = state.learningPaths.find((p) => p.id === pathMatch[1] && p.userId === user.id);
      if (!lp) return sendProblem(res, 404, 'Not Found', 'Learning path not found.');
      if (req.method === 'GET') {
        return sendJson(res, 200, { success: true, message: 'Success', data: mapLearningPathDto(user.id, lp) });
      }
      if (req.method === 'PUT') {
        const body = await readJson(req);
        lp.name = String(body.name ?? lp.name).trim();
        lp.description = body.description ?? null;
        lp.icon = body.icon ?? lp.icon;
        lp.targetMinutes = body.targetMinutes ?? null;
        lp.progress = Number(body.progress ?? lp.progress);
        if (typeof body.isArchived === 'boolean') lp.isArchived = body.isArchived;
        return sendJson(res, 200, { success: true, message: 'Learning path updated.', data: mapLearningPathDto(user.id, lp) });
      }
      if (req.method === 'DELETE') {
        state.learningPaths = state.learningPaths.filter((p) => p.id !== lp.id);
        state.studySessions.forEach((s) => {
          if (s.userId === user.id && s.learningPathId === lp.id) s.learningPathId = null;
        });
        res.statusCode = 204;
        return res.end();
      }
    }

    if (req.method === 'GET' && path === '/api/v1/study-sessions') {
      const lpId = q.get('learningPathId');
      const from = q.get('from');
      const to = q.get('to');
      const page = Math.max(1, Number(q.get('page') || 1));
      const pageSize = Math.max(1, Number(q.get('pageSize') || 20));
      let list = state.studySessions.filter((s) => s.userId === user.id);
      if (lpId) list = list.filter((s) => s.learningPathId === lpId);
      if (from) list = list.filter((s) => s.sessionDate >= from);
      if (to) list = list.filter((s) => s.sessionDate <= to);
      list.sort((a, b) => b.sessionDate.localeCompare(a.sessionDate) || b.createdAtUtc.localeCompare(a.createdAtUtc));
      const totalCount = list.length;
      const items = list.slice((page - 1) * pageSize, page * pageSize).map((s) => mapSessionDto(user.id, s));
      return sendJson(res, 200, {
        success: true,
        message: 'Success',
        data: { items, page, pageSize, totalCount, totalPages: Math.ceil(totalCount / pageSize) }
      });
    }

    if (req.method === 'GET' && path === '/api/v1/study-sessions/summary') {
      const date = q.get('date') || todayStr();
      const weekStart = addDays(date, -6);
      const list = state.studySessions.filter((s) => s.userId === user.id);
      return sendJson(res, 200, {
        success: true,
        message: 'Success',
        data: {
          totalMinutesAllTime: list.reduce((a, b) => a + b.minutes, 0),
          totalSessionsAllTime: list.length,
          minutesThisWeek: list.filter((s) => s.sessionDate >= weekStart && s.sessionDate <= date).reduce((a, b) => a + b.minutes, 0)
        }
      });
    }

    if (req.method === 'POST' && path === '/api/v1/study-sessions') {
      const body = await readJson(req);
      if (body.clientSessionKey) {
        const existing = state.studySessions.find(
          (s) => s.userId === user.id && s.clientSessionKey === body.clientSessionKey
        );
        if (existing) {
          return sendJson(res, 200, { success: true, message: 'Session already logged.', data: mapSessionDto(user.id, existing) });
        }
      }
      const session = {
        id: crypto.randomUUID(),
        userId: user.id,
        learningPathId: body.learningPathId || null,
        topic: String(body.topic || '').trim(),
        minutes: Number(body.minutes || 25),
        sessionDate: body.sessionDate || todayStr(),
        notes: body.notes || null,
        startedAtUtc: body.startedAtUtc || null,
        completedAtUtc: body.completedAtUtc || null,
        clientSessionKey: body.clientSessionKey || null,
        createdAtUtc: new Date().toISOString()
      };
      state.studySessions.push(session);
      return sendJson(res, 201, { success: true, message: 'Study session logged.', data: mapSessionDto(user.id, session) });
    }

    const sessionMatch = /^\/api\/v1\/study-sessions\/([^/]+)$/.exec(path);
    if (sessionMatch) {
      const s = state.studySessions.find((x) => x.id === sessionMatch[1] && x.userId === user.id);
      if (!s) return sendProblem(res, 404, 'Not Found', 'Study session not found.');
      if (req.method === 'GET') {
        return sendJson(res, 200, { success: true, message: 'Success', data: mapSessionDto(user.id, s) });
      }
      if (req.method === 'PUT') {
        const body = await readJson(req);
        s.learningPathId = body.learningPathId ?? null;
        s.topic = String(body.topic ?? s.topic).trim();
        s.minutes = Number(body.minutes ?? s.minutes);
        s.sessionDate = body.sessionDate ?? s.sessionDate;
        s.notes = body.notes ?? null;
        return sendJson(res, 200, { success: true, message: 'Study session updated.', data: mapSessionDto(user.id, s) });
      }
      if (req.method === 'DELETE') {
        state.studySessions = state.studySessions.filter((x) => x.id !== s.id);
        res.statusCode = 204;
        return res.end();
      }
    }

    // MEMORIES
    if (req.method === 'GET' && path === '/api/v1/memories') {
      const category = q.get('category');
      const page = Math.max(1, Number(q.get('page') || 1));
      const pageSize = Math.max(1, Number(q.get('pageSize') || 50));
      let list = state.memories.filter((m) => m.userId === user.id);
      if (category) list = list.filter((m) => m.category.toLowerCase() === category.toLowerCase());
      list.sort((a, b) => b.memoryDate.localeCompare(a.memoryDate));
      const totalCount = list.length;
      return sendJson(res, 200, {
        success: true,
        message: 'Success',
        data: {
          items: list.slice((page - 1) * pageSize, page * pageSize),
          page,
          pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize)
        }
      });
    }

    if (req.method === 'POST' && path === '/api/v1/memories') {
      const body = await readJson(req);
      const mem = {
        id: crypto.randomUUID(),
        userId: user.id,
        title: String(body.title || '').trim(),
        memoryDate: body.memoryDate || todayStr(),
        category: body.category || 'Everyday',
        note: body.note || null,
        icon: body.icon || 'star',
        gradientIndex: state.memories.filter((x) => x.userId === user.id).length % 6,
        image: null,
        createdAtUtc: new Date().toISOString()
      };
      state.memories.push(mem);
      return sendJson(res, 201, { success: true, message: 'Memory saved.', data: mem });
    }

    const memImgMatch = /^\/api\/v1\/memories\/([^/]+)\/image$/.exec(path);
    if (memImgMatch) {
      const mem = state.memories.find((x) => x.id === memImgMatch[1] && x.userId === user.id);
      if (!mem) return sendProblem(res, 404, 'Not Found', 'Memory not found.');
      if (req.method === 'POST') {
        const buf = await readRawBody(req);
        const file = extractMultipartFile(buf, req.headers['content-type']);
        if (!file) return sendProblem(res, 400, 'Bad Request', 'Missing image file.');
        mem.image = {
          id: crypto.randomUUID(),
          provider: 'DevMemoryPreview',
          publicId: `dayform/dev/${mem.id}`,
          secureUrl: `data:${file.mime};base64,${file.buffer.toString('base64')}`,
          resourceType: 'image',
          format: file.mime.split('/')[1] || 'png',
          bytes: file.buffer.length,
          width: null,
          height: null
        };
        return sendJson(res, 200, { success: true, message: 'Image uploaded (dev preview).', data: mem });
      }
      if (req.method === 'DELETE') {
        mem.image = null;
        return sendJson(res, 200, { success: true, message: 'Image removed.', data: mem });
      }
    }

    const memMatch = /^\/api\/v1\/memories\/([^/]+)$/.exec(path);
    if (memMatch) {
      const mem = state.memories.find((x) => x.id === memMatch[1] && x.userId === user.id);
      if (!mem) return sendProblem(res, 404, 'Not Found', 'Memory not found.');
      if (req.method === 'GET') {
        return sendJson(res, 200, { success: true, message: 'Success', data: mem });
      }
      if (req.method === 'PUT') {
        const body = await readJson(req);
        mem.title = String(body.title ?? mem.title).trim();
        mem.memoryDate = body.memoryDate ?? mem.memoryDate;
        mem.category = body.category ?? mem.category;
        mem.note = body.note ?? null;
        mem.icon = body.icon ?? mem.icon;
        return sendJson(res, 200, { success: true, message: 'Memory updated.', data: mem });
      }
      if (req.method === 'DELETE') {
        state.memories = state.memories.filter((x) => x.id !== mem.id);
        res.statusCode = 204;
        return res.end();
      }
    }

    // REMINDERS & PLANNER
    if (req.method === 'GET' && path === '/api/v1/reminders') {
      const activeOnly = q.get('activeOnly') === 'true';
      const items = state.reminders
        .filter((r) => r.userId === user.id && (!activeOnly || r.isActive))
        .sort((a, b) => a.reminderDate.localeCompare(b.reminderDate));
      return sendJson(res, 200, { success: true, message: 'Success', data: items });
    }

    if (req.method === 'POST' && path === '/api/v1/reminders') {
      const body = await readJson(req);
      const rem = {
        id: crypto.randomUUID(),
        userId: user.id,
        title: String(body.title || '').trim(),
        reminderDate: body.reminderDate || todayStr(),
        reminderTime: body.reminderTime || null,
        repeatFrequency: body.repeatFrequency || 'Never',
        isActive: true
      };
      state.reminders.push(rem);
      return sendJson(res, 201, { success: true, message: 'Reminder saved.', data: rem });
    }

    const remMatch = /^\/api\/v1\/reminders\/([^/]+)$/.exec(path);
    if (remMatch) {
      const rem = state.reminders.find((x) => x.id === remMatch[1] && x.userId === user.id);
      if (!rem) return sendProblem(res, 404, 'Not Found', 'Reminder not found.');
      if (req.method === 'GET') {
        return sendJson(res, 200, { success: true, message: 'Success', data: rem });
      }
      if (req.method === 'PUT') {
        const body = await readJson(req);
        rem.title = String(body.title ?? rem.title).trim();
        rem.reminderDate = body.reminderDate ?? rem.reminderDate;
        rem.reminderTime = body.reminderTime ?? null;
        rem.repeatFrequency = body.repeatFrequency ?? rem.repeatFrequency;
        if (typeof body.isActive === 'boolean') rem.isActive = body.isActive;
        return sendJson(res, 200, { success: true, message: 'Reminder updated.', data: rem });
      }
      if (req.method === 'DELETE') {
        state.reminders = state.reminders.filter((x) => x.id !== rem.id);
        res.statusCode = 204;
        return res.end();
      }
    }

    if (req.method === 'GET' && path === '/api/v1/planner/calendar') {
      const from = q.get('from') || todayStr();
      const to = q.get('to') || todayStr();
      const activeHabits = state.habits.filter((h) => h.userId === user.id && h.isActive);
      const userReminders = state.reminders.filter((r) => r.userId === user.id && r.isActive);
      const dates = listDatesBetween(from, to);

      const days = dates.map((d) => {
        const done = state.habitLogs.filter(
          (l) => l.userId === user.id && l.logDate === d && l.isCompleted && activeHabits.some((h) => h.id === l.habitId)
        ).length;
        const pct = activeHabits.length ? Math.round((done / activeHabits.length) * 100) : 0;
        const studySessions = state.studySessions.filter((s) => s.userId === user.id && s.sessionDate === d).map((s) => mapSessionDto(user.id, s));
        const memories = state.memories.filter((m) => m.userId === user.id && m.memoryDate === d);
        const reminders = userReminders
          .filter((r) => occursOn(r, d))
          .map((r) => ({
            reminderId: r.id,
            title: r.title,
            occurrenceDate: d,
            reminderTime: r.reminderTime,
            repeatFrequency: r.repeatFrequency,
            isRecurringInstance: d !== r.reminderDate
          }));

        return {
          date: d,
          habitCompletionPercent: pct,
          habitIntensityLevel: intensityFromPct(pct),
          studyMinutes: studySessions.reduce((a, b) => a + b.minutes, 0),
          studySessionCount: studySessions.length,
          reminders,
          studySessions,
          memories
        };
      });

      return sendJson(res, 200, { success: true, message: 'Success', data: { from, to, days } });
    }

    // JOURNALS
    if (req.method === 'GET' && path === '/api/v1/journals') {
      const page = Math.max(1, Number(q.get('page') || 1));
      const pageSize = Math.max(1, Number(q.get('pageSize') || 20));
      const list = state.journals
        .filter((j) => j.userId === user.id)
        .sort((a, b) => b.entryDate.localeCompare(a.entryDate));
      return sendJson(res, 200, {
        success: true,
        message: 'Success',
        data: {
          items: list.slice((page - 1) * pageSize, page * pageSize),
          page,
          pageSize,
          totalCount: list.length,
          totalPages: Math.ceil(list.length / pageSize)
        }
      });
    }

    const journalMatch = /^\/api\/v1\/journals\/(\d{4}-\d{2}-\d{2})$/.exec(path);
    if (journalMatch) {
      const date = journalMatch[1];
      let entry = state.journals.find((j) => j.userId === user.id && j.entryDate === date);
      if (req.method === 'GET') {
        return sendJson(res, 200, { success: true, message: 'Success', data: entry || null });
      }
      if (req.method === 'PUT') {
        const body = await readJson(req);
        const now = new Date().toISOString();
        if (!entry) {
          entry = {
            id: crypto.randomUUID(),
            userId: user.id,
            entryDate: date,
            accomplishments: body.accomplishments || null,
            distractions: body.distractions || null,
            improvements: body.improvements || null,
            createdAtUtc: now,
            updatedAtUtc: now
          };
          state.journals.push(entry);
        } else {
          entry.accomplishments = body.accomplishments ?? null;
          entry.distractions = body.distractions ?? null;
          entry.improvements = body.improvements ?? null;
          entry.updatedAtUtc = now;
        }
        return sendJson(res, 200, { success: true, message: 'Reflection saved.', data: entry });
      }
      if (req.method === 'DELETE') {
        state.journals = state.journals.filter((j) => !(j.userId === user.id && j.entryDate === date));
        res.statusCode = 204;
        return res.end();
      }
    }

    // PROGRESS ANALYTICS
    if (req.method === 'GET' && path === '/api/v1/progress/summary') {
      const from = q.get('from') || addDays(todayStr(), -29);
      const to = q.get('to') || todayStr();
      const dates = listDatesBetween(from, to);
      const activeHabits = state.habits.filter((h) => h.userId === user.id && h.isActive);

      const rangeAvg = (ds) => {
        if (!activeHabits.length || !ds.length) return 0;
        const total = ds.reduce((acc, d) => {
          const done = state.habitLogs.filter(
            (l) => l.userId === user.id && l.logDate === d && l.isCompleted && activeHabits.some((h) => h.id === l.habitId)
          ).length;
          return acc + (done / activeHabits.length) * 100;
        }, 0);
        return Math.round(total / ds.length);
      };

      const habitAveragePercent = rangeAvg(dates);
      const prevFrom = addDays(from, -dates.length);
      const prevTo = addDays(from, -1);
      const previousPeriodHabitAveragePercent = rangeAvg(listDatesBetween(prevFrom, prevTo));
      const habitTrendDeltaPoints = Math.round(habitAveragePercent - previousPeriodHabitAveragePercent);

      const sessions = state.studySessions.filter((s) => s.userId === user.id && s.sessionDate >= from && s.sessionDate <= to);
      const memoriesCount = state.memories.filter((m) => m.userId === user.id && m.memoryDate >= from && m.memoryDate <= to).length;

      const insights = [];
      if (activeHabits.length && dates.length >= 3) {
        const rates = activeHabits
          .map((h) => ({
            name: h.name,
            pct: Math.round(
              (state.habitLogs.filter(
                (l) => l.userId === user.id && l.habitId === h.id && l.logDate >= from && l.logDate <= to && l.isCompleted
              ).length /
                dates.length) *
                100
            )
          }))
          .sort((a, b) => b.pct - a.pct);
        insights.push({
          icon: 'star',
          title: `Strongest habit: ${rates[0].name}`,
          description: `Completed on ${rates[0].pct}% of days in this period.`
        });
        if (rates.length > 1) {
          const last = rates[rates.length - 1];
          insights.push({
            icon: 'target',
            title: `Room to grow: ${last.name}`,
            description: `Currently at ${last.pct}% across the selected dates.`
          });
        }
      }

      const startMs = parseIsoDate(user.journeyStartDate).getTime();
      const todayMs = parseIsoDate(todayStr()).getTime();
      const currentDay = Math.max(1, Math.min(180, Math.floor((todayMs - startMs) / 86400_000) + 1));
      const phaseName = currentDay <= 60 ? 'Foundation' : currentDay <= 120 ? 'Momentum' : 'Mastery';

      return sendJson(res, 200, {
        success: true,
        message: 'Success',
        data: {
          from,
          to,
          habitAveragePercent,
          previousPeriodHabitAveragePercent,
          habitTrendDeltaPoints,
          studyMinutes: sessions.reduce((a, b) => a + b.minutes, 0),
          studySessionsCount: sessions.length,
          memoriesCount,
          insights,
          journey: {
            journeyStartDate: user.journeyStartDate,
            currentDay,
            totalDays: 180,
            remainingDays: 180 - currentDay,
            percentComplete: Math.round((currentDay / 180) * 100),
            phaseName,
            totalPhases: 3
          }
        }
      });
    }

    if (req.method === 'GET' && path === '/api/v1/progress/habits') {
      const from = q.get('from') || addDays(todayStr(), -29);
      const to = q.get('to') || todayStr();
      const dates = listDatesBetween(from, to);
      const activeHabits = state.habits.filter((h) => h.userId === user.id && h.isActive);
      const granularity = dates.length > 40 ? 'week' : 'day';
      const points = [];

      if (granularity === 'day') {
        for (const d of dates) {
          const done = state.habitLogs.filter(
            (l) => l.userId === user.id && l.logDate === d && l.isCompleted && activeHabits.some((h) => h.id === l.habitId)
          ).length;
          points.push({
            label: d.slice(5),
            from: d,
            to: d,
            completionPercent: activeHabits.length ? Math.round((done / activeHabits.length) * 100) : 0
          });
        }
      } else {
        for (let i = 0; i < dates.length; i += 7) {
          const chunk = dates.slice(i, i + 7);
          const avg = activeHabits.length
            ? Math.round(
                chunk.reduce((acc, d) => {
                  const done = state.habitLogs.filter(
                    (l) => l.userId === user.id && l.logDate === d && l.isCompleted && activeHabits.some((h) => h.id === l.habitId)
                  ).length;
                  return acc + (done / activeHabits.length) * 100;
                }, 0) / chunk.length
              )
            : 0;
          points.push({ label: chunk[0].slice(5), from: chunk[0], to: chunk[chunk.length - 1], completionPercent: avg });
        }
      }

      return sendJson(res, 200, { success: true, message: 'Success', data: { from, to, granularity, points } });
    }

    if (req.method === 'GET' && path === '/api/v1/progress/study') {
      const from = q.get('from') || addDays(todayStr(), -29);
      const to = q.get('to') || todayStr();
      const dates = listDatesBetween(from, to);
      const sessions = state.studySessions.filter((s) => s.userId === user.id && s.sessionDate >= from && s.sessionDate <= to);
      const byWeekday = new Map();
      sessions.forEach((s) => {
        const w = weekdayFull(s.sessionDate);
        byWeekday.set(w, (byWeekday.get(w) || 0) + s.minutes);
      });
      const bestWeekday = [...byWeekday.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null;
      const chunkSize = dates.length > 40 ? 7 : 1;
      const points = [];
      for (let i = 0; i < dates.length; i += chunkSize) {
        const chunk = dates.slice(i, i + chunkSize);
        const set = new Set(chunk);
        const matching = sessions.filter((s) => set.has(s.sessionDate));
        points.push({
          label: chunk[0].slice(5),
          from: chunk[0],
          to: chunk[chunk.length - 1],
          minutes: matching.reduce((a, b) => a + b.minutes, 0),
          sessions: matching.length
        });
      }

      return sendJson(res, 200, {
        success: true,
        message: 'Success',
        data: {
          from,
          to,
          totalMinutes: sessions.reduce((a, b) => a + b.minutes, 0),
          totalSessions: sessions.length,
          bestWeekday,
          points
        }
      });
    }

    if (req.method === 'GET' && path === '/api/v1/progress/monthly') {
      const months = Math.max(1, Math.min(12, Number(q.get('months') || 5)));
      const end = parseIsoDate(q.get('date') || todayStr());
      const activeHabits = state.habits.filter((h) => h.userId === user.id && h.isActive);
      const result = [];
      for (let i = months - 1; i >= 0; i--) {
        const d = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - i, 1));
        const yr = d.getUTCFullYear();
        const mo = d.getUTCMonth() + 1;
        const prefix = `${yr}-${String(mo).padStart(2, '0')}`;
        const daysInMo = new Date(Date.UTC(yr, mo, 0)).getUTCDate();
        const endCap = yr === end.getUTCFullYear() && mo === end.getUTCMonth() + 1 ? end.getUTCDate() : daysInMo;
        const moDates = Array.from({ length: endCap }, (_, idx) => `${prefix}-${String(idx + 1).padStart(2, '0')}`);
        const pct = activeHabits.length
          ? Math.round(
              moDates.reduce((acc, dt) => {
                const done = state.habitLogs.filter(
                  (l) => l.userId === user.id && l.logDate === dt && l.isCompleted && activeHabits.some((h) => h.id === l.habitId)
                ).length;
                return acc + (done / activeHabits.length) * 100;
              }, 0) / moDates.length
            )
          : 0;
        const moSessions = state.studySessions.filter((s) => s.userId === user.id && s.sessionDate.startsWith(prefix));
        const moMemories = state.memories.filter((m) => m.userId === user.id && m.memoryDate.startsWith(prefix));
        result.push({
          year: yr,
          month: mo,
          monthLabel: monthShortYear(yr, mo),
          habitCompletionPercent: pct,
          studyMinutes: moSessions.reduce((a, b) => a + b.minutes, 0),
          studySessions: moSessions.length,
          memoriesCount: moMemories.length
        });
      }
      return sendJson(res, 200, { success: true, message: 'Success', data: result });
    }

    // PROFILE & EXPORT
    if (req.method === 'GET' && path === '/api/v1/profile') {
      return sendJson(res, 200, { success: true, message: 'Success', data: sanitizeUser(user) });
    }

    if (req.method === 'PUT' && path === '/api/v1/profile') {
      const body = await readJson(req);
      if (body.displayName) user.displayName = String(body.displayName).trim();
      if (body.themePreference) user.themePreference = body.themePreference;
      if (body.timeZoneId) user.timeZoneId = body.timeZoneId;
      if (body.journeyStartDate) user.journeyStartDate = body.journeyStartDate;
      return sendJson(res, 200, { success: true, message: 'Profile updated.', data: sanitizeUser(user) });
    }

    if (req.method === 'GET' && path === '/api/v1/profile/export') {
      return sendJson(res, 200, {
        success: true,
        message: 'Success',
        data: {
          exportedAtUtc: new Date().toISOString(),
          profile: sanitizeUser(user),
          habits: state.habits.filter((h) => h.userId === user.id).map((h) => mapHabitDto(user.id, h, todayStr())),
          habitLogs: state.habitLogs.filter((l) => l.userId === user.id),
          learningPaths: state.learningPaths.filter((p) => p.userId === user.id).map((p) => mapLearningPathDto(user.id, p)),
          studySessions: state.studySessions.filter((s) => s.userId === user.id).map((s) => mapSessionDto(user.id, s)),
          memories: state.memories.filter((m) => m.userId === user.id),
          journalEntries: state.journals.filter((j) => j.userId === user.id),
          reminders: state.reminders.filter((r) => r.userId === user.id)
        }
      });
    }

    return sendProblem(res, 404, 'Not Found', `Route ${req.method} ${path} was not found.`);
  } catch (err) {
    return sendProblem(res, 500, 'Server Error', err instanceof Error ? err.message : 'Unexpected dev demo error.');
  }
}

const server = http.createServer(handleRequest);

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun) {
  server.listen(PORT, () => {
    console.log(`[DAYFORM DEV DEMO API] Listening at http://localhost:${PORT}/api/v1`);
    console.log('[DAYFORM DEV DEMO API] Seeded 150 days (5 months) of dummy data for alex@example.com / DayformDemo123!');
    console.log('[DAYFORM DEV DEMO API] Note: In-memory dev preview server (for hosts where .NET runtime is blocked).');
  });
}

export default handleRequest;
