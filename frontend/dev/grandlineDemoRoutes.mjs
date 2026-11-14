// Dev Demo API Mock Routes for Grandline 11 Feature Modules
import crypto from 'node:crypto';

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8'
  });
  res.end(JSON.stringify(payload));
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString('utf8').trim();
  return text ? JSON.parse(text) : {};
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function handleGrandlineRoutes(req, res, path, user, state) {
  if (!state.goals) state.goals = [];
  if (!state.visionBoard) state.visionBoard = [];
  if (!state.tasks) state.tasks = [];
  if (!state.moodLogs) state.moodLogs = [];
  if (!state.reflections) state.reflections = [];
  if (!state.badHabits) state.badHabits = [];
  if (!state.focusSessions) state.focusSessions = [];
  if (!state.screenTimes) state.screenTimes = [];
  if (!state.healthLogs) state.healthLogs = [];
  if (!state.workouts) state.workouts = [];
  if (!state.meals) state.meals = [];
  if (!state.books) state.books = [];
  if (!state.notes) state.notes = [];
  if (!state.ideas) state.ideas = [];
  if (!state.quotes) state.quotes = [];
  if (!state.transactions) state.transactions = [];
  if (!state.budgets) state.budgets = [];
  if (!state.savingsGoals) state.savingsGoals = [];
  if (!state.debts) state.debts = [];
  if (!state.subscriptions) state.subscriptions = [];
  if (!state.gamification) state.gamification = new Map();
  if (!state.customRewards) state.customRewards = [];
  if (!state.challenges) state.challenges = [];
  if (!state.detoxes) state.detoxes = [];
  if (!state.futureLetters) state.futureLetters = [];
  if (!state.timelineEvents) state.timelineEvents = [];
  if (!state.personalRules) state.personalRules = [];

  const uid = user ? user.id : 'demo-user';

  // GOALS & VISION
  if (req.method === 'GET' && path === '/api/v1/goals') {
    const list = state.goals.filter((g) => g.userId === uid);
    return sendJson(res, 200, { success: true, data: list }), true;
  }
  if (req.method === 'POST' && path === '/api/v1/goals') {
    const b = await readJson(req);
    const item = {
      id: crypto.randomUUID(),
      userId: uid,
      title: b.title || 'New Goal',
      description: b.description || null,
      timeframe: b.timeframe || 'OneYear',
      category: b.category || 'Personal',
      targetDate: b.targetDate || null,
      completionPercentage: 0,
      status: 'InProgress',
      milestones: [],
      steps: [],
      createdAtUtc: new Date().toISOString()
    };
    state.goals.push(item);
    return sendJson(res, 200, { success: true, data: item }), true;
  }
  if (req.method === 'DELETE' && path.startsWith('/api/v1/goals/') && !path.includes('/vision')) {
    const id = path.split('/')[4];
    state.goals = state.goals.filter((g) => g.id !== id);
    return sendJson(res, 200, { success: true }), true;
  }
  if (req.method === 'GET' && path === '/api/v1/goals/vision') {
    const list = state.visionBoard.filter((v) => v.userId === uid);
    return sendJson(res, 200, { success: true, data: list }), true;
  }
  if (req.method === 'POST' && path === '/api/v1/goals/vision') {
    const b = await readJson(req);
    const item = {
      id: crypto.randomUUID(),
      userId: uid,
      title: b.title,
      imageUrl: b.imageUrl || null,
      category: b.category || 'Vision',
      targetYear: b.targetYear || null,
      createdAtUtc: new Date().toISOString()
    };
    state.visionBoard.push(item);
    return sendJson(res, 200, { success: true, data: item }), true;
  }
  if (req.method === 'DELETE' && path.startsWith('/api/v1/goals/vision/')) {
    const id = path.split('/')[5];
    state.visionBoard = state.visionBoard.filter((v) => v.id !== id);
    return sendJson(res, 200, { success: true }), true;
  }

  // TASKS
  if (req.method === 'GET' && path === '/api/v1/tasks') {
    const list = state.tasks.filter((t) => t.userId === uid);
    return sendJson(res, 200, { success: true, data: list }), true;
  }
  if (req.method === 'POST' && path === '/api/v1/tasks') {
    const b = await readJson(req);
    const item = {
      id: crypto.randomUUID(),
      userId: uid,
      title: b.title || 'New Task',
      description: b.description || null,
      priority: b.priority || 'Medium',
      timeframe: b.timeframe || 'Daily',
      dueDate: b.dueDate || null,
      isCompleted: false,
      isPinnedToDashboard: Boolean(b.isPinnedToDashboard),
      isRecurring: Boolean(b.isRecurring),
      recurrenceRule: b.recurrenceRule || null,
      subtasks: [],
      createdAtUtc: new Date().toISOString()
    };
    state.tasks.push(item);
    return sendJson(res, 200, { success: true, data: item }), true;
  }
  if (req.method === 'PUT' && path.includes('/toggle') && path.startsWith('/api/v1/tasks/')) {
    const id = path.split('/')[4];
    const task = state.tasks.find((t) => t.id === id);
    if (task) {
      task.isCompleted = !task.isCompleted;
      task.completedAtUtc = task.isCompleted ? new Date().toISOString() : null;
    }
    return sendJson(res, 200, { success: true, data: task }), true;
  }
  if (req.method === 'DELETE' && path.startsWith('/api/v1/tasks/')) {
    const id = path.split('/')[4];
    state.tasks = state.tasks.filter((t) => t.id !== id);
    return sendJson(res, 200, { success: true }), true;
  }

  // PERSONAL DEVELOPMENT
  if (req.method === 'GET' && path === '/api/v1/personal-development/mood') {
    const list = state.moodLogs.filter((m) => m.userId === uid);
    return sendJson(res, 200, { success: true, data: list }), true;
  }
  if (req.method === 'POST' && path === '/api/v1/personal-development/mood') {
    const b = await readJson(req);
    const item = {
      id: crypto.randomUUID(),
      userId: uid,
      logDate: b.logDate || todayStr(),
      moodScore: b.moodScore || 7,
      energyLevel: b.energyLevel || 7,
      stressLevel: b.stressLevel || 4,
      gratitudeNotes: b.gratitudeNotes || null,
      personalReflections: b.personalReflections || null,
      lessonsLearned: b.lessonsLearned || null,
      createdAtUtc: new Date().toISOString()
    };
    state.moodLogs.push(item);
    return sendJson(res, 200, { success: true, data: item }), true;
  }
  if (req.method === 'GET' && path === '/api/v1/personal-development/bad-habits') {
    const list = state.badHabits.filter((b) => b.userId === uid);
    return sendJson(res, 200, { success: true, data: list }), true;
  }
  if (req.method === 'POST' && path === '/api/v1/personal-development/bad-habits') {
    const b = await readJson(req);
    const item = {
      id: crypto.randomUUID(),
      userId: uid,
      name: b.name,
      triggers: b.triggers || null,
      replacementBehavior: b.replacementBehavior || null,
      cleanDaysStreak: 0,
      isActive: true,
      createdAtUtc: new Date().toISOString()
    };
    state.badHabits.push(item);
    return sendJson(res, 200, { success: true, data: item }), true;
  }
  if (req.method === 'DELETE' && path.startsWith('/api/v1/personal-development/bad-habits/')) {
    const id = path.split('/')[5];
    state.badHabits = state.badHabits.filter((b) => b.id !== id);
    return sendJson(res, 200, { success: true }), true;
  }

  // FOCUS
  if (req.method === 'GET' && path === '/api/v1/focus/sessions') {
    const list = state.focusSessions.filter((f) => f.userId === uid);
    return sendJson(res, 200, { success: true, data: list }), true;
  }
  if (req.method === 'POST' && path === '/api/v1/focus/sessions') {
    const b = await readJson(req);
    const item = {
      id: crypto.randomUUID(),
      userId: uid,
      sessionDate: b.sessionDate || todayStr(),
      sessionType: b.sessionType || 'Pomodoro',
      durationMinutes: b.durationMinutes || 25,
      distractionCount: b.distractionCount || 0,
      notes: b.notes || null,
      createdAtUtc: new Date().toISOString()
    };
    state.focusSessions.push(item);
    return sendJson(res, 200, { success: true, data: item }), true;
  }
  if (req.method === 'GET' && path === '/api/v1/focus/summary') {
    const today = todayStr();
    const todaySessions = state.focusSessions.filter((f) => f.userId === uid && f.sessionDate === today);
    const sum = {
      todayFocusMinutes: todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0),
      weeklyFocusMinutes: state.focusSessions.filter((f) => f.userId === uid).reduce((acc, s) => acc + s.durationMinutes, 0),
      distractionCountThisWeek: state.focusSessions.filter((f) => f.userId === uid).reduce((acc, s) => acc + s.distractionCount, 0)
    };
    return sendJson(res, 200, { success: true, data: sum }), true;
  }
  if (req.method === 'GET' && path === '/api/v1/focus/screen-time') {
    const list = state.screenTimes.filter((s) => s.userId === uid);
    return sendJson(res, 200, { success: true, data: list }), true;
  }
  if (req.method === 'POST' && path === '/api/v1/focus/screen-time') {
    const b = await readJson(req);
    const item = {
      id: crypto.randomUUID(),
      userId: uid,
      logDate: b.logDate || todayStr(),
      mobileMinutes: b.mobileMinutes || 0,
      desktopMinutes: b.desktopMinutes || 0,
      notes: b.notes || null,
      createdAtUtc: new Date().toISOString()
    };
    state.screenTimes.push(item);
    return sendJson(res, 200, { success: true, data: item }), true;
  }

  // HEALTH & LIFESTYLE
  if (req.method === 'GET' && path === '/api/v1/health-logs') {
    const list = state.healthLogs.filter((h) => h.userId === uid);
    return sendJson(res, 200, { success: true, data: list }), true;
  }
  if (req.method === 'POST' && path === '/api/v1/health-logs') {
    const b = await readJson(req);
    const item = {
      id: crypto.randomUUID(),
      userId: uid,
      logDate: b.logDate || todayStr(),
      sleepHours: b.sleepHours || 7.5,
      sleepQuality: b.sleepQuality || 8,
      waterIntakeMl: b.waterIntakeMl || 2500,
      weightKg: b.weightKg || null,
      steps: b.steps || 8000,
      walkingDistanceKm: b.walkingDistanceKm || null,
      notes: b.notes || null,
      createdAtUtc: new Date().toISOString()
    };
    state.healthLogs.push(item);
    return sendJson(res, 200, { success: true, data: item }), true;
  }
  if (req.method === 'GET' && path === '/api/v1/health-logs/summary') {
    const list = state.healthLogs.filter((h) => h.userId === uid);
    const sum = {
      avgSleepHours: list.length ? list.reduce((a, b) => a + (b.sleepHours || 7), 0) / list.length : 7.5,
      avgSleepQuality: list.length ? list.reduce((a, b) => a + (b.sleepQuality || 8), 0) / list.length : 8,
      avgWaterIntakeMl: list.length ? list.reduce((a, b) => a + (b.waterIntakeMl || 2000), 0) / list.length : 2400,
      avgSteps: list.length ? list.reduce((a, b) => a + (b.steps || 7000), 0) / list.length : 9500,
      totalWorkoutsThisMonth: state.workouts.filter((w) => w.userId === uid).length,
      currentWeightKg: list.length && list[list.length - 1].weightKg ? list[list.length - 1].weightKg : 73.2
    };
    return sendJson(res, 200, { success: true, data: sum }), true;
  }
  if (req.method === 'GET' && path === '/api/v1/health-logs/workouts') {
    const list = state.workouts.filter((w) => w.userId === uid);
    return sendJson(res, 200, { success: true, data: list }), true;
  }
  if (req.method === 'POST' && path === '/api/v1/health-logs/workouts') {
    const b = await readJson(req);
    const item = {
      id: crypto.randomUUID(),
      userId: uid,
      workoutDate: b.workoutDate || todayStr(),
      activityType: b.activityType || 'Workout',
      durationMinutes: b.durationMinutes || 30,
      intensity: b.intensity || 'Moderate',
      caloriesBurned: b.caloriesBurned || null,
      notes: b.notes || null,
      createdAtUtc: new Date().toISOString()
    };
    state.workouts.push(item);
    return sendJson(res, 200, { success: true, data: item }), true;
  }
  if (req.method === 'DELETE' && path.startsWith('/api/v1/health-logs/workouts/')) {
    const id = path.split('/')[5];
    state.workouts = state.workouts.filter((w) => w.id !== id);
    return sendJson(res, 200, { success: true }), true;
  }
  if (req.method === 'GET' && path === '/api/v1/health-logs/meals') {
    const list = state.meals.filter((m) => m.userId === uid);
    return sendJson(res, 200, { success: true, data: list }), true;
  }
  if (req.method === 'POST' && path === '/api/v1/health-logs/meals') {
    const b = await readJson(req);
    const item = {
      id: crypto.randomUUID(),
      userId: uid,
      mealDate: b.mealDate || todayStr(),
      mealType: b.mealType || 'Lunch',
      description: b.description || 'Meal',
      caloriesEstimate: b.caloriesEstimate || null,
      createdAtUtc: new Date().toISOString()
    };
    state.meals.push(item);
    return sendJson(res, 200, { success: true, data: item }), true;
  }
  if (req.method === 'DELETE' && path.startsWith('/api/v1/health-logs/meals/')) {
    const id = path.split('/')[5];
    state.meals = state.meals.filter((m) => m.id !== id);
    return sendJson(res, 200, { success: true }), true;
  }

  // KNOWLEDGE
  if (req.method === 'GET' && path === '/api/v1/knowledge/books') {
    const list = state.books.filter((b) => b.userId === uid);
    return sendJson(res, 200, { success: true, data: list }), true;
  }
  if (req.method === 'POST' && path === '/api/v1/knowledge/books') {
    const b = await readJson(req);
    const item = {
      id: crypto.randomUUID(),
      userId: uid,
      title: b.title,
      author: b.author,
      totalPages: b.totalPages || 300,
      currentPage: b.currentPage || 0,
      status: b.status || 'Reading',
      rating: b.rating || 5,
      keyLessons: b.keyLessons || null,
      createdAtUtc: new Date().toISOString()
    };
    state.books.push(item);
    return sendJson(res, 200, { success: true, data: item }), true;
  }
  if (req.method === 'PUT' && path.includes('/progress') && path.startsWith('/api/v1/knowledge/books/')) {
    const id = path.split('/')[5];
    const b = await readJson(req);
    const book = state.books.find((bk) => bk.id === id);
    if (book) {
      book.currentPage = b.currentPage;
      if (b.status) book.status = b.status;
    }
    return sendJson(res, 200, { success: true, data: book }), true;
  }
  if (req.method === 'GET' && path === '/api/v1/knowledge/notes') {
    const list = state.notes.filter((n) => n.userId === uid);
    return sendJson(res, 200, { success: true, data: list }), true;
  }
  if (req.method === 'POST' && path === '/api/v1/knowledge/notes') {
    const b = await readJson(req);
    const item = {
      id: crypto.randomUUID(),
      userId: uid,
      title: b.title,
      content: b.content,
      tags: b.tags || null,
      category: b.category || 'General',
      createdAtUtc: new Date().toISOString()
    };
    state.notes.push(item);
    return sendJson(res, 200, { success: true, data: item }), true;
  }
  if (req.method === 'GET' && path === '/api/v1/knowledge/ideas') {
    const list = state.ideas.filter((i) => i.userId === uid);
    return sendJson(res, 200, { success: true, data: list }), true;
  }
  if (req.method === 'POST' && path === '/api/v1/knowledge/ideas') {
    const b = await readJson(req);
    const item = {
      id: crypto.randomUUID(),
      userId: uid,
      title: b.title,
      description: b.description || null,
      status: b.status || 'Raw',
      category: b.category || 'General',
      createdAtUtc: new Date().toISOString()
    };
    state.ideas.push(item);
    return sendJson(res, 200, { success: true, data: item }), true;
  }
  if (req.method === 'GET' && path === '/api/v1/knowledge/quotes') {
    const list = state.quotes.filter((q) => q.userId === uid);
    return sendJson(res, 200, { success: true, data: list }), true;
  }
  if (req.method === 'POST' && path === '/api/v1/knowledge/quotes') {
    const b = await readJson(req);
    const item = {
      id: crypto.randomUUID(),
      userId: uid,
      quoteText: b.quoteText,
      author: b.author || null,
      tags: b.tags || null,
      isFavorite: Boolean(b.isFavorite),
      createdAtUtc: new Date().toISOString()
    };
    state.quotes.push(item);
    return sendJson(res, 200, { success: true, data: item }), true;
  }

  // FINANCE
  if (req.method === 'GET' && path === '/api/v1/finance/transactions') {
    const list = state.transactions.filter((t) => t.userId === uid);
    return sendJson(res, 200, { success: true, data: list }), true;
  }
  if (req.method === 'POST' && path === '/api/v1/finance/transactions') {
    const b = await readJson(req);
    const item = {
      id: crypto.randomUUID(),
      userId: uid,
      transactionDate: b.transactionDate || todayStr(),
      type: b.type || 'Expense',
      category: b.category || 'General',
      amount: b.amount || 0,
      description: b.description || null,
      createdAtUtc: new Date().toISOString()
    };
    state.transactions.push(item);
    return sendJson(res, 200, { success: true, data: item }), true;
  }
  if (req.method === 'DELETE' && path.startsWith('/api/v1/finance/transactions/')) {
    const id = path.split('/')[5];
    state.transactions = state.transactions.filter((t) => t.id !== id);
    return sendJson(res, 200, { success: true }), true;
  }
  if (req.method === 'GET' && path === '/api/v1/finance/budgets') {
    const list = state.budgets.filter((b) => b.userId === uid);
    return sendJson(res, 200, { success: true, data: list }), true;
  }
  if (req.method === 'POST' && path === '/api/v1/finance/budgets') {
    const b = await readJson(req);
    const item = {
      id: crypto.randomUUID(),
      userId: uid,
      category: b.category,
      monthlyBudgetLimit: b.monthlyBudgetLimit || 500,
      month: b.month || 1,
      year: b.year || 2026,
      createdAtUtc: new Date().toISOString()
    };
    state.budgets.push(item);
    return sendJson(res, 200, { success: true, data: item }), true;
  }
  if (req.method === 'GET' && path === '/api/v1/finance/savings-goals') {
    const list = state.savingsGoals.filter((s) => s.userId === uid);
    return sendJson(res, 200, { success: true, data: list }), true;
  }
  if (req.method === 'POST' && path === '/api/v1/finance/savings-goals') {
    const b = await readJson(req);
    const item = {
      id: crypto.randomUUID(),
      userId: uid,
      title: b.title,
      targetAmount: b.targetAmount || 10000,
      currentAmount: b.currentAmount || 0,
      targetDate: b.targetDate || null,
      createdAtUtc: new Date().toISOString()
    };
    state.savingsGoals.push(item);
    return sendJson(res, 200, { success: true, data: item }), true;
  }
  if (req.method === 'GET' && path === '/api/v1/finance/debts') {
    const list = state.debts.filter((d) => d.userId === uid);
    return sendJson(res, 200, { success: true, data: list }), true;
  }
  if (req.method === 'GET' && path === '/api/v1/finance/subscriptions') {
    const list = state.subscriptions.filter((s) => s.userId === uid);
    return sendJson(res, 200, { success: true, data: list }), true;
  }
  if (req.method === 'POST' && path === '/api/v1/finance/subscriptions') {
    const b = await readJson(req);
    const item = {
      id: crypto.randomUUID(),
      userId: uid,
      name: b.name,
      cost: b.cost || 10,
      billingCycle: b.billingCycle || 'Monthly',
      nextBillingDate: b.nextBillingDate || todayStr(),
      isActive: true,
      createdAtUtc: new Date().toISOString()
    };
    state.subscriptions.push(item);
    return sendJson(res, 200, { success: true, data: item }), true;
  }
  if (req.method === 'GET' && path === '/api/v1/finance/summary') {
    const tx = state.transactions.filter((t) => t.userId === uid);
    const inc = tx.filter((t) => t.type === 'Income').reduce((a, b) => a + b.amount, 0);
    const exp = tx.filter((t) => t.type === 'Expense').reduce((a, b) => a + b.amount, 0);
    const sum = {
      totalIncomeThisMonth: inc || 4800,
      totalExpensesThisMonth: exp || 1450,
      netSavingsThisMonth: (inc || 4800) - (exp || 1450),
      totalSavingsAccumulated: state.savingsGoals.reduce((a, b) => a + b.currentAmount, 0) || 12400,
      totalDebtRemaining: 0,
      activeSubscriptionsMonthlyTotal: state.subscriptions.filter((s) => s.isActive).reduce((a, b) => a + b.cost, 0) || 85
    };
    return sendJson(res, 200, { success: true, data: sum }), true;
  }

  // GAMIFICATION
  if (req.method === 'GET' && path === '/api/v1/gamification/status') {
    let g = state.gamification.get(uid);
    if (!g) {
      g = {
        totalXp: 12450,
        level: 14,
        tierTitle: 'Grandmaster Navigator',
        xpInCurrentLevel: 450,
        xpToNextLevel: 1000,
        progressPercent: 45,
        achievements: [
          { id: '1', badgeKey: 'early-bird', title: 'Dawn Patrol', description: 'Complete 14 early morning check-ins', icon: 'sun', category: 'Habits', unlockedAtUtc: todayStr() },
          { id: '2', badgeKey: 'century', title: 'Iron Century', description: 'Log 100 study sessions', icon: 'award', category: 'Study', unlockedAtUtc: todayStr() }
        ],
        dailyMissions: [
          { id: 'm1', missionDate: todayStr(), title: 'Complete all daily habits', targetCount: 5, currentCount: 5, xpReward: 50, isCompleted: true, isClaimed: false, category: 'Habits' },
          { id: 'm2', missionDate: todayStr(), title: 'Log 60 minutes of deep focus', targetCount: 60, currentCount: 60, xpReward: 75, isCompleted: true, isClaimed: false, category: 'Focus' },
          { id: 'm3', missionDate: todayStr(), title: 'Drink 2.5L water', targetCount: 2500, currentCount: 2500, xpReward: 30, isCompleted: true, isClaimed: false, category: 'Health' }
        ],
        availableRewards: [
          { id: 'r1', title: 'Weekend Coffee & Bookstore Treat', xpCost: 350, icon: 'coffee', isRedeemed: false, createdAtUtc: todayStr() }
        ]
      };
      state.gamification.set(uid, g);
    }
    return sendJson(res, 200, { success: true, data: g }), true;
  }
  if (req.method === 'POST' && path === '/api/v1/gamification/claim-mission') {
    const b = await readJson(req);
    const g = state.gamification.get(uid);
    if (g && g.dailyMissions) {
      const m = g.dailyMissions.find((ms) => ms.id === b.missionId);
      if (m && !m.isClaimed) {
        m.isClaimed = true;
        g.totalXp += m.xpReward;
        g.xpInCurrentLevel += m.xpReward;
      }
    }
    return sendJson(res, 200, { success: true, data: g }), true;
  }
  if (req.method === 'GET' && path === '/api/v1/gamification/rewards') {
    const g = state.gamification.get(uid);
    return sendJson(res, 200, { success: true, data: g ? (g.availableRewards || []) : [] }), true;
  }
  if (req.method === 'POST' && path === '/api/v1/gamification/rewards') {
    const b = await readJson(req);
    const g = state.gamification.get(uid);
    const reward = {
      id: crypto.randomUUID(),
      title: b.title,
      xpCost: b.xpCost || 200,
      isRedeemed: false,
      createdAtUtc: new Date().toISOString()
    };
    if (g) g.customRewards.push(reward);
    return sendJson(res, 200, { success: true, data: reward }), true;
  }

  // SPECIAL GRANDLINE
  if (req.method === 'GET' && path === '/api/v1/special/timeline') {
    const list = state.timelineEvents.filter((t) => t.userId === uid);
    return sendJson(res, 200, { success: true, data: list }), true;
  }
  if (req.method === 'POST' && path === '/api/v1/special/timeline') {
    const b = await readJson(req);
    const item = {
      id: crypto.randomUUID(),
      userId: uid,
      title: b.title,
      description: b.description || null,
      eventDate: b.eventDate || todayStr(),
      category: b.category || 'Milestone',
      createdAtUtc: new Date().toISOString()
    };
    state.timelineEvents.push(item);
    return sendJson(res, 200, { success: true, data: item }), true;
  }
  if (req.method === 'DELETE' && path.startsWith('/api/v1/special/timeline/')) {
    const id = path.split('/')[5];
    state.timelineEvents = state.timelineEvents.filter((t) => t.id !== id);
    return sendJson(res, 200, { success: true }), true;
  }
  if (req.method === 'GET' && path === '/api/v1/special/future-letters') {
    const list = state.futureLetters.filter((l) => l.userId === uid);
    return sendJson(res, 200, { success: true, data: list }), true;
  }
  if (req.method === 'POST' && path === '/api/v1/special/future-letters') {
    const b = await readJson(req);
    const item = {
      id: crypto.randomUUID(),
      userId: uid,
      title: b.title,
      content: b.content,
      writtenDate: todayStr(),
      deliveryDate: b.deliveryDate,
      isDelivered: false,
      createdAtUtc: new Date().toISOString()
    };
    state.futureLetters.push(item);
    return sendJson(res, 200, { success: true, data: item }), true;
  }
  if (req.method === 'GET' && path === '/api/v1/special/challenges') {
    const list = state.challenges.filter((c) => c.userId === uid);
    return sendJson(res, 200, { success: true, data: list }), true;
  }
  if (req.method === 'POST' && path === '/api/v1/special/challenges') {
    const b = await readJson(req);
    const item = {
      id: crypto.randomUUID(),
      userId: uid,
      title: b.title,
      description: b.description || null,
      startDate: b.startDate || todayStr(),
      endDate: b.endDate || todayStr(),
      targetDays: 90,
      completedDaysCount: 0,
      isActive: true,
      createdAtUtc: new Date().toISOString()
    };
    state.challenges.push(item);
    return sendJson(res, 200, { success: true, data: item }), true;
  }
  if (req.method === 'POST' && path.includes('/log-day') && path.startsWith('/api/v1/special/challenges/')) {
    const id = path.split('/')[5];
    const c = state.challenges.find((ch) => ch.id === id);
    if (c) c.completedDaysCount += 1;
    return sendJson(res, 200, { success: true, data: c }), true;
  }
  if (req.method === 'GET' && path === '/api/v1/special/personal-rules') {
    const list = state.personalRules.filter((r) => r.userId === uid);
    return sendJson(res, 200, { success: true, data: list }), true;
  }
  if (req.method === 'POST' && path === '/api/v1/special/personal-rules') {
    const b = await readJson(req);
    const item = {
      id: crypto.randomUUID(),
      userId: uid,
      title: b.title,
      category: b.category || 'General',
      isActive: true,
      consistencyPercent: 100,
      createdAtUtc: new Date().toISOString()
    };
    state.personalRules.push(item);
    return sendJson(res, 200, { success: true, data: item }), true;
  }
  if (req.method === 'DELETE' && path.startsWith('/api/v1/special/personal-rules/')) {
    const id = path.split('/')[5];
    state.personalRules = state.personalRules.filter((r) => r.id !== id);
    return sendJson(res, 200, { success: true }), true;
  }
  if (req.method === 'GET' && path === '/api/v1/special/digital-detox') {
    const list = state.detoxes.filter((d) => d.userId === uid);
    return sendJson(res, 200, { success: true, data: list }), true;
  }
  if (req.method === 'POST' && path === '/api/v1/special/digital-detox') {
    const b = await readJson(req);
    const item = {
      id: crypto.randomUUID(),
      userId: uid,
      title: b.title,
      distractingApps: b.distractingApps || null,
      startDate: b.startDate || todayStr(),
      endDate: b.endDate || todayStr(),
      cleanDaysCount: 0,
      isActive: true,
      createdAtUtc: new Date().toISOString()
    };
    state.detoxes.push(item);
    return sendJson(res, 200, { success: true, data: item }), true;
  }
  if (req.method === 'POST' && path.includes('/log-day') && path.startsWith('/api/v1/special/digital-detox/')) {
    const id = path.split('/')[5];
    const d = state.detoxes.find((dt) => dt.id === id);
    if (d) d.cleanDaysCount += 1;
    return sendJson(res, 200, { success: true, data: d }), true;
  }
  if (req.method === 'GET' && path === '/api/v1/special/discipline-score') {
    const scoreDto = {
      overallScore: 92,
      habitScore: 94,
      taskScore: 88,
      focusScore: 90,
      ratingTitle: 'High Discipline (Mastery)',
      description: 'Calculated as weighted composite: 40% habit consistency, 30% focus hours target, 20% task completion, 10% sleep regularity.',
      factorBreakdowns: [
        '1. Habit Consistency: 94% 30-day average (+37.6 pts)',
        '2. Focus Target Adherence: 90% target achieved (+27.0 pts)',
        '3. Critical Tasks Completed: 88% completion (+17.6 pts)',
        '4. Sleep Regularity: 98% within optimal window (+9.8 pts)'
      ]
    };
    return sendJson(res, 200, { success: true, data: scoreDto }), true;
  }

  // PROFILE PIN & DELETE
  if (req.method === 'POST' && path === '/api/v1/profile/pin') {
    const b = await readJson(req);
    if (user) user.pinCode = b.pin || null;
    return sendJson(res, 200, { success: true, message: 'PIN saved.' }), true;
  }
  if (req.method === 'POST' && path === '/api/v1/profile/pin/verify') {
    const b = await readJson(req);
    const matches = user && user.pinCode ? user.pinCode === b.pin : true;
    return sendJson(res, 200, { success: true, data: matches }), true;
  }
  if (req.method === 'GET' && path === '/api/v1/profile/export/csv') {
    const csv = 'Date,HabitsCompleted,StudyMinutes,TasksCompleted\n2026-11-14,7,120,4\n';
    res.writeHead(200, {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="grandline-export.csv"'
    });
    res.end(csv);
    return true;
  }
  if (req.method === 'DELETE' && path === '/api/v1/profile/account') {
    return sendJson(res, 200, { success: true, message: 'Account deleted.' }), true;
  }

  return false;
}

