const USER_STORAGE_KEY = "neuronest-users";
const SESSION_STORAGE_KEY = "neuronest-session";
const PLAN_STORAGE_KEY = "neuronest-plans";
const NOTE_STORAGE_KEY = "neuronest-notes";

const styleConfigs = {
  balanced: {
    label: "Balanced Flow",
    rhythm: "4 focused sessions + 1 revision block",
    methods: ["retrieval practice", "mixed review", "checkpoint quiz"],
  },
  deep: {
    label: "Deep Focus",
    rhythm: "3 long sessions + reflection review",
    methods: ["concept mapping", "teaching aloud", "long-form problem solving"],
  },
  sprint: {
    label: "Sprint Mode",
    rhythm: "5 short intense sessions + mock test",
    methods: ["timed drills", "active recall bursts", "error-log correction"],
  },
  gentle: {
    label: "Gentle Consistency",
    rhythm: "daily light sessions + weekly consolidation",
    methods: ["micro-learning", "flashcards", "low-pressure recap"],
  },
};

const weekdayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
let activePlan = null;
let activePage = "dashboard";
let pendingPage = "dashboard";

const form = document.getElementById("study-form");
const signupForm = document.getElementById("signup-form");
const loginForm = document.getElementById("login-form");
const signupFormPage = document.getElementById("signup-form-page");
const loginFormPage = document.getElementById("login-form-page");
const authTabs = document.querySelectorAll(".auth-tab");
const authMessage = document.getElementById("auth-message");
const authPageMessage = document.getElementById("auth-page-message");
const authModal = document.getElementById("auth-modal");
const authClose = document.getElementById("auth-close");
const plannerLock = document.getElementById("planner-lock");
const plannerUserNote = document.getElementById("planner-user-note");
const emptyState = document.getElementById("empty-state");
const results = document.getElementById("results");

const navItems = document.querySelectorAll(".nav-item");
const quickActionButtons = document.querySelectorAll("[data-page-target]");
const navLogin = document.getElementById("nav-login");
const navSignup = document.getElementById("nav-signup");
const navLogout = document.getElementById("nav-logout");
const navUserBadge = document.getElementById("nav-user-badge");
const navUserName = document.getElementById("nav-user-name");
const navTodayCount = document.getElementById("nav-today-count");
const navCompletedCount = document.getElementById("nav-completed-count");
const navProgressRate = document.getElementById("nav-progress-rate");

const heroFocus = document.getElementById("hero-focus");
const heroNextTask = document.getElementById("hero-next-task");
const heroStatus = document.getElementById("hero-status");
const heroGreeting = document.getElementById("hero-greeting");

const summaryGoal = document.getElementById("summary-goal");
const summaryMeta = document.getElementById("summary-meta");
const summaryStyle = document.getElementById("summary-style");
const summaryPriority = document.getElementById("summary-priority");
const summaryRhythm = document.getElementById("summary-rhythm");
const summaryReminder = document.getElementById("summary-reminder");
const coachNote = document.getElementById("coach-note");

const milestonesContainer = document.getElementById("milestones");
const scheduleContainer = document.getElementById("schedule");
const methodsContainer = document.getElementById("methods");
const todayTasksContainer = document.getElementById("today-tasks");
const weakAreasContainer = document.getElementById("weak-areas");
const rescheduleList = document.getElementById("reschedule-list");
const reminderList = document.getElementById("reminder-list");

const progressFill = document.getElementById("progress-fill");
const progressPill = document.getElementById("progress-pill");
const progressCompleted = document.getElementById("progress-completed");
const progressRate = document.getElementById("progress-rate");
const progressNote = document.getElementById("progress-note");

const detailCompleted = document.getElementById("detail-completed");
const detailPending = document.getElementById("detail-pending");
const detailRescheduled = document.getElementById("detail-rescheduled");
const detailMissed = document.getElementById("detail-missed");

const rescheduleNote = document.getElementById("reschedule-note");
const reminderNote = document.getElementById("reminder-note");

const quickNoteInput = document.getElementById("quick-note-input");
const notesPageInput = document.getElementById("notes-page-input");
const saveNoteButton = document.getElementById("save-note-button");
const saveNotePageButton = document.getElementById("save-note-page-button");
const notesList = document.getElementById("notes-list");
const quickAddTaskButton = document.getElementById("quick-add-task");
const quickCompleteTaskButton = document.getElementById("quick-complete-task");

initializeApp();

function initializeApp() {
  switchAuthView("login");
  switchPage("auth");
  bindEvents();
  renderSession();
}

function bindEvents() {
  navItems.forEach((item) => {
    item.addEventListener("click", () => switchPage(item.dataset.page));
  });

  quickActionButtons.forEach((button) => {
    button.addEventListener("click", () => switchPage(button.dataset.pageTarget));
  });

  authTabs.forEach((tab) => {
    tab.addEventListener("click", () => switchAuthView(tab.dataset.authView));
  });

  navLogin.addEventListener("click", () => {
    switchAuthView("login");
    openAuthModal();
  });

  navSignup.addEventListener("click", () => {
    switchAuthView("signup");
    openAuthModal();
  });

  navLogout.addEventListener("click", logoutCurrentUser);
  authClose.addEventListener("click", closeAuthModal);

  authModal.addEventListener("click", (event) => {
    const target = event.target;
    if (target instanceof HTMLElement && target.dataset.closeModal === "true") {
      closeAuthModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !authModal.classList.contains("hidden")) {
      closeAuthModal();
    }
  });

  signupForm.addEventListener("submit", handleSignup);
  loginForm.addEventListener("submit", handleLogin);
  signupFormPage.addEventListener("submit", handleSignup);
  loginFormPage.addEventListener("submit", handleLogin);
  form.addEventListener("submit", handlePlanSubmit);
  saveNoteButton.addEventListener("click", () => saveNote(quickNoteInput));
  saveNotePageButton.addEventListener("click", () => saveNote(notesPageInput));
  quickAddTaskButton.addEventListener("click", handleQuickAddTask);
  quickCompleteTaskButton.addEventListener("click", handleQuickCompleteTask);
}

function switchPage(page) {
  const currentUser = getCurrentUser();
  if (!currentUser && page !== "auth") {
    pendingPage = page;
    activePage = "auth";
    page = "auth";
  }

  activePage = page;

  document.querySelectorAll(".app-page").forEach((section) => {
    section.classList.toggle("hidden", section.id !== `page-${page}`);
  });

  navItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.page === page);
  });
}

function handleSignup(event) {
  event.preventDefault();

  const currentForm = event.currentTarget;
  const formData = new FormData(currentForm);
  const name = formData.get("name").toString().trim();
  const email = formData.get("email").toString().trim().toLowerCase();
  const password = formData.get("password").toString();
  const level = formData.get("level").toString();

  if (!name || !email || password.length < 6) {
    setAuthMessage("Please complete all signup fields with a password of at least 6 characters.", true);
    return;
  }

  const users = getUsers();
  if (users.some((user) => user.email === email)) {
    setAuthMessage("An account with that email already exists. Please login instead.", true);
    switchAuthView("login");
    return;
  }

  users.push({ name, email, password, level });
  saveUsers(users);
  saveSession(email);
  signupForm.reset();
  signupFormPage.reset();
  setAuthMessage("Account created successfully. Your dashboard is now unlocked.");
  renderSession();
  closeAuthModal();
}

function handleLogin(event) {
  event.preventDefault();

  const currentForm = event.currentTarget;
  const formData = new FormData(currentForm);
  const email = formData.get("email").toString().trim().toLowerCase();
  const password = formData.get("password").toString();
  const user = getUsers().find((entry) => entry.email === email);

  if (!user || user.password !== password) {
    setAuthMessage("Incorrect email or password. Please try again.", true);
    return;
  }

  saveSession(user.email);
  loginForm.reset();
  loginFormPage.reset();
  setAuthMessage(`Welcome back, ${user.name}.`);
  renderSession();
  closeAuthModal();
}

function handlePlanSubmit(event) {
  event.preventDefault();

  const currentUser = getCurrentUser();
  if (!currentUser) {
    setAuthMessage("Please login before generating a plan.", true);
    switchAuthView("login");
    openAuthModal();
    return;
  }

  const formData = new FormData(form);
  const goal = formData.get("goal").toString().trim();
  const topics = splitTopics(formData.get("topics").toString());
  const deadlineValue = formData.get("deadline").toString();
  const hoursPerWeek = Number(formData.get("hours"));
  const style = formData.get("style").toString();
  const challenge = formData.get("challenge").toString().trim();
  const reminderTime = formData.get("reminderTime").toString() || "18:00";
  const reminderMode = formData.get("reminderMode").toString() || "daily";

  if (!goal || !deadlineValue || topics.length === 0 || !hoursPerWeek) {
    return;
  }

  const deadline = new Date(`${deadlineValue}T00:00:00`);
  const daysLeft = getDaysLeft(deadline);
  const weeksLeft = Math.max(1, Math.ceil(daysLeft / 7));
  const totalHours = hoursPerWeek * weeksLeft;
  const topicWeights = buildTopicWeights(topics, challenge);

  activePlan = {
    id: `plan-${Date.now()}`,
    owner: currentUser.email,
    goal,
    deadline: deadline.toISOString(),
    hoursPerWeek,
    style,
    challenge,
    topics,
    reminderTime,
    reminderMode,
    createdAt: new Date().toISOString(),
    topicWeights,
    milestones: buildMilestones(topicWeights, weeksLeft),
    schedule: buildSchedule(topicWeights, hoursPerWeek, style, daysLeft),
    methods: buildMethods(style, challenge, currentUser.level),
    rescheduleLog: [],
    totalHours,
  };

  saveActivePlan();
  renderPlan(activePlan, currentUser);
  switchPage("dashboard");
}

function renderSession() {
  const user = getCurrentUser();
  const isLoggedIn = Boolean(user);

  form.classList.toggle("planner-form-locked", !isLoggedIn);
  plannerLock.classList.toggle("hidden", isLoggedIn);

  Array.from(form.elements).forEach((element) => {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement || element instanceof HTMLButtonElement) {
      element.disabled = !isLoggedIn;
    }
  });

  if (user) {
    const nextPage = activePage === "auth" ? pendingPage : activePage;
    switchPage(nextPage);
    heroGreeting.textContent = `Welcome back, ${user.name}.`;
    navUserName.textContent = "Account";
    navUserBadge.classList.remove("hidden");
    navLogin.classList.add("hidden");
    navSignup.classList.add("hidden");
    plannerUserNote.textContent = "Review today's tasks, generate plans, and track progress across every session.";
    loadPlanForUser(user);
    renderNotes();
  } else {
    switchPage("auth");
    heroGreeting.textContent = "Organize your study life like a real workspace.";
    navUserName.textContent = "Account";
    navUserBadge.classList.add("hidden");
    navLogin.classList.remove("hidden");
    navSignup.classList.remove("hidden");
    plannerUserNote.textContent = "Create an account or login from the navbar to unlock your personalized study dashboard.";
    clearPlanView();
    renderNotes();
  }
}

function loadPlanForUser(user) {
  activePlan = getPlans()[user.email] ?? null;
  if (activePlan) {
    populateForm(activePlan);
    renderPlan(activePlan, user);
  } else {
    clearPlanView();
  }
}

function renderPlan(plan, user) {
  activePlan = plan;
  const deadline = new Date(plan.deadline);
  const daysLeft = getDaysLeft(deadline);
  const todayTasks = getTodayTasks(plan);
  const completedSessions = plan.schedule.filter((session) => session.status === "done").length;
  const pendingSessions = plan.schedule.filter((session) => session.status === "pending").length;
  const rescheduledSessions = plan.schedule.filter((session) => session.status === "rescheduled").length;
  const missedCount = plan.topicWeights.reduce((sum, topic) => sum + topic.misses, 0);
  const percentage = plan.schedule.length ? Math.round((completedSessions / plan.schedule.length) * 100) : 0;
  const weakAreas = getWeakAreaStats(plan);
  const focusSubject = weakAreas[0]?.name ?? normalizeSubjectLabel(plan.topicWeights[0]?.name ?? "Core review");

  summaryGoal.textContent = plan.goal;
  summaryMeta.textContent = `${user.name}'s plan until ${formatDate(deadline)} with about ${plan.totalHours} guided study hours.`;
  summaryStyle.textContent = styleConfigs[plan.style].label;
  summaryPriority.textContent = percentage >= 70 ? "On track" : percentage >= 35 ? "Building momentum" : "Ready to start";
  summaryRhythm.textContent = styleConfigs[plan.style].rhythm;
  summaryReminder.textContent = `${formatReminderMode(plan.reminderMode)} at ${plan.reminderTime}`;
  coachNote.textContent = buildCoachNote(user, plan.goal, plan.style, plan.challenge, daysLeft);

  heroFocus.textContent = focusSubject;
  heroNextTask.textContent = todayTasks[0]?.title ?? "Use this time to review notes or create your next study block.";
  heroStatus.textContent = percentage >= 70 ? "On track" : percentage >= 35 ? "Building momentum" : "Start the next session";

  progressFill.style.width = `${percentage}%`;
  progressPill.textContent = `${percentage}%`;
  progressCompleted.textContent = `${completedSessions}/${plan.schedule.length}`;
  progressRate.textContent = `${percentage}%`;
  progressNote.textContent = percentage >= 75
    ? "Strong momentum. Keep the final revision blocks protected."
    : percentage >= 40
      ? "Good progress. Stay consistent and avoid stacking missed sessions."
      : "Early stage progress. Focus on finishing today's next block.";

  detailCompleted.textContent = `${completedSessions}`;
  detailPending.textContent = `${pendingSessions}`;
  detailRescheduled.textContent = `${rescheduledSessions}`;
  detailMissed.textContent = `${missedCount}`;

  navTodayCount.textContent = `${todayTasks.length}`;
  navCompletedCount.textContent = `${completedSessions}`;
  navProgressRate.textContent = `${percentage}%`;

  renderMilestones(plan.milestones);
  renderSchedule(plan.schedule);
  renderMethods(plan.methods);
  renderTodayTasks(todayTasks);
  renderWeakAreas(weakAreas);
  renderReschedule(plan);
  renderReminders(plan);

  emptyState.classList.add("hidden");
  results.classList.remove("hidden");
  saveActivePlan();
}

function renderMilestones(milestones) {
  milestonesContainer.innerHTML = "";
  milestones.forEach((milestone) => {
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.textContent = milestone;
    milestonesContainer.appendChild(chip);
  });
}

function renderSchedule(schedule) {
  scheduleContainer.innerHTML = "";

  schedule
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .forEach((session) => {
      const item = document.createElement("article");
      item.className = "schedule-item interactive-schedule-item";

      const title = document.createElement("strong");
      title.textContent = session.title;

      const detail = document.createElement("p");
      detail.textContent = `${formatShortDate(new Date(session.date))} | ${session.detail}`;

      const tag = document.createElement("span");
      tag.className = `status-pill ${session.status}`;
      tag.textContent = session.rescheduled ? `${capitalize(session.status)} | moved` : capitalize(session.status);

      const controls = document.createElement("div");
      controls.className = "session-actions";

      const doneButton = document.createElement("button");
      doneButton.type = "button";
      doneButton.className = "secondary-button action-button";
      doneButton.textContent = "Mark done";
      doneButton.disabled = session.status === "done";
      doneButton.addEventListener("click", () => updateSessionStatus(session.id, "done"));

      const missButton = document.createElement("button");
      missButton.type = "button";
      missButton.className = "ghost-link action-button";
      missButton.textContent = "Missed";
      missButton.disabled = session.status === "missed";
      missButton.addEventListener("click", () => updateSessionStatus(session.id, "missed"));

      controls.append(doneButton, missButton);

      const body = document.createElement("div");
      body.append(title, detail, tag, controls);

      const day = document.createElement("div");
      day.className = "schedule-day";
      day.textContent = session.day;

      item.append(day, body);
      scheduleContainer.appendChild(item);
    });
}

function renderMethods(methods) {
  methodsContainer.innerHTML = "";
  methods.forEach((method) => {
    const item = document.createElement("article");
    item.className = "method-item";
    item.innerHTML = `<strong>${method.title}</strong><p>${method.detail}</p>`;
    methodsContainer.appendChild(item);
  });
}

function renderTodayTasks(todayTasks) {
  todayTasksContainer.innerHTML = "";

  if (todayTasks.length === 0) {
    todayTasksContainer.innerHTML = '<div class="empty-mini">No tasks scheduled for today. Use this time for revision, notes, or generating the next study block.</div>';
    return;
  }

  todayTasks.forEach((session) => {
    const item = document.createElement("article");
    item.className = "task-item";
    item.innerHTML = `
      <div>
        <strong>${session.title}</strong>
        <p>${session.hours} hr block | ${formatTaskStatus(session.status)}</p>
      </div>
      <span class="task-date">${session.day}</span>
    `;
    todayTasksContainer.appendChild(item);
  });
}

function renderWeakAreas(weakAreas) {
  weakAreasContainer.innerHTML = "";

  if (weakAreas.length === 0) {
    weakAreasContainer.innerHTML = '<p class="dashboard-note">No weak areas yet. Generate a plan and complete sessions to see topic patterns here.</p>';
    return;
  }

  weakAreas.slice(0, 5).forEach((area) => {
    const item = document.createElement("article");
    item.className = "weak-area-item";
    item.innerHTML = `
      <div>
        <strong>${area.name}</strong>
        <p>${area.reason}</p>
      </div>
      <span class="weak-score ${area.level.toLowerCase()}">${area.level}</span>
    `;
    weakAreasContainer.appendChild(item);
  });
}

function renderReschedule(plan) {
  rescheduleList.innerHTML = "";

  if (plan.rescheduleLog.length === 0) {
    rescheduleNote.textContent = "Missed sessions will be moved forward automatically to protect your full plan.";
    return;
  }

  rescheduleNote.textContent = `${plan.rescheduleLog.length} session${plan.rescheduleLog.length === 1 ? "" : "s"} moved automatically.`;

  plan.rescheduleLog.slice(-5).reverse().forEach((entry) => {
    const item = document.createElement("article");
    item.className = "reminder-item";
    item.innerHTML = `<strong>${entry.topic}</strong><p>${entry.from} moved to ${entry.to}</p>`;
    rescheduleList.appendChild(item);
  });
}

function renderReminders(plan) {
  reminderList.innerHTML = "";
  const reminders = buildReminderEntries(plan);
  reminderNote.textContent = `Reminder mode: ${formatReminderMode(plan.reminderMode)} at ${plan.reminderTime}.`;

  reminders.forEach((reminder) => {
    const item = document.createElement("article");
    item.className = "reminder-item";
    item.innerHTML = `<strong>${reminder.title}</strong><p>${reminder.detail}</p>`;
    reminderList.appendChild(item);
  });
}

function updateSessionStatus(sessionId, nextStatus) {
  if (!activePlan) {
    return;
  }

  const session = activePlan.schedule.find((entry) => entry.id === sessionId);
  if (!session) {
    return;
  }

  const previousStatus = session.status;
  session.status = nextStatus;
  updateTopicStats(session.topic, previousStatus, nextStatus);

  if (nextStatus === "missed") {
    autoRescheduleSession(session);
  } else {
    session.rescheduled = false;
  }

  renderPlan(activePlan, getCurrentUser());
}

function updateTopicStats(topicName, previousStatus, nextStatus) {
  const topic = activePlan.topicWeights.find((entry) => entry.name === topicName);
  if (!topic) {
    return;
  }

  if (previousStatus === "done") {
    topic.completed = Math.max(0, topic.completed - 1);
  }

  if (previousStatus === "missed" || previousStatus === "rescheduled") {
    topic.misses = Math.max(0, topic.misses - 1);
  }

  if (nextStatus === "done") {
    topic.completed += 1;
  }

  if (nextStatus === "missed") {
    topic.misses += 1;
  }
}

function autoRescheduleSession(session) {
  const sessionDate = new Date(session.date);
  const movedDate = new Date(sessionDate);
  movedDate.setDate(sessionDate.getDate() + 2);

  session.date = movedDate.toISOString();
  session.day = weekdayNames[movedDate.getDay() === 0 ? 6 : movedDate.getDay() - 1];
  session.status = "rescheduled";
  session.rescheduled = true;

  activePlan.rescheduleLog.push({
    topic: session.topic,
    from: formatShortDate(sessionDate),
    to: formatShortDate(movedDate),
  });
}

function saveNote(sourceInput) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    setAuthMessage("Please login before saving notes.", true);
    switchAuthView("login");
    openAuthModal();
    return;
  }

  const content = sourceInput.value.trim();
  if (!content) {
    return;
  }

  const notes = getNotes();
  const userNotes = notes[currentUser.email] ?? [];
  userNotes.unshift({
    id: `note-${Date.now()}`,
    content,
    createdAt: new Date().toISOString(),
  });
  notes[currentUser.email] = userNotes;
  localStorage.setItem(NOTE_STORAGE_KEY, JSON.stringify(notes));

  quickNoteInput.value = "";
  notesPageInput.value = "";
  renderNotes();
}

function renderNotes() {
  const currentUser = getCurrentUser();
  const notes = currentUser ? (getNotes()[currentUser.email] ?? []) : [];
  notesList.innerHTML = "";

  if (notes.length === 0) {
    notesList.innerHTML = '<div class="empty-mini">No notes yet. Save a reflection, formula, or revision note here.</div>';
    return;
  }

  notes.forEach((note) => {
    const item = document.createElement("article");
    item.className = "note-item";
    item.innerHTML = `<strong>${formatDateTime(note.createdAt)}</strong><p>${escapeHtml(note.content)}</p>`;
    notesList.appendChild(item);
  });
}

function clearPlanView() {
  activePlan = null;
  results.classList.add("hidden");
  emptyState.classList.remove("hidden");
  milestonesContainer.innerHTML = "";
  scheduleContainer.innerHTML = "";
  methodsContainer.innerHTML = "";
  todayTasksContainer.innerHTML = '<div class="empty-mini">Login and generate a plan to see today\'s tasks.</div>';
  weakAreasContainer.innerHTML = '<div class="empty-mini">No progress data yet.</div>';
  rescheduleList.innerHTML = "";
  reminderList.innerHTML = "";
  progressFill.style.width = "0%";
  progressPill.textContent = "0%";
  progressCompleted.textContent = "0/0";
  progressRate.textContent = "0%";
  progressNote.textContent = "";
  rescheduleNote.textContent = "";
  reminderNote.textContent = "";
  detailCompleted.textContent = "0";
  detailPending.textContent = "0";
  detailRescheduled.textContent = "0";
  detailMissed.textContent = "0";
  navTodayCount.textContent = "0";
  navCompletedCount.textContent = "0";
  navProgressRate.textContent = "0%";
  heroFocus.textContent = "No plan yet";
  heroNextTask.textContent = "Generate a plan or add a study note to get started.";
  heroStatus.textContent = "Ready to start";
}

function populateForm(plan) {
  form.goal.value = plan.goal;
  form.topics.value = plan.topics.join(", ");
  form.deadline.value = plan.deadline.slice(0, 10);
  form.hours.value = plan.hoursPerWeek;
  form.style.value = plan.style;
  form.challenge.value = plan.challenge;
  form.reminderTime.value = plan.reminderTime;
  form.reminderMode.value = plan.reminderMode;
}

function switchAuthView(view) {
  const showSignup = view !== "login";
  signupForm.classList.toggle("hidden", !showSignup);
  loginForm.classList.toggle("hidden", showSignup);
  signupFormPage.classList.toggle("hidden", !showSignup);
  loginFormPage.classList.toggle("hidden", showSignup);
  authTabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.authView === view);
  });
}

function logoutCurrentUser() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
  form.reset();
  activePlan = null;
  pendingPage = "dashboard";
  setAuthMessage("You have been logged out.");
  switchAuthView("login");
  renderSession();
}

function openAuthModal() {
  authModal.classList.remove("hidden");
  authModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeAuthModal() {
  authModal.classList.add("hidden");
  authModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function getUsers() {
  return JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || "[]");
}

function saveUsers(users) {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users));
}

function saveSession(email) {
  localStorage.setItem(SESSION_STORAGE_KEY, email);
}

function getCurrentUser() {
  const email = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!email) {
    return null;
  }
  return getUsers().find((user) => user.email === email) ?? null;
}

function getPlans() {
  return JSON.parse(localStorage.getItem(PLAN_STORAGE_KEY) || "{}");
}

function saveActivePlan() {
  const currentUser = getCurrentUser();
  if (!currentUser || !activePlan) {
    return;
  }
  const plans = getPlans();
  plans[currentUser.email] = activePlan;
  localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(plans));
}

function getNotes() {
  return JSON.parse(localStorage.getItem(NOTE_STORAGE_KEY) || "{}");
}

function setAuthMessage(message, isError = false) {
  authMessage.textContent = message;
  authMessage.classList.toggle("error", isError);
  authPageMessage.textContent = message;
  authPageMessage.classList.toggle("error", isError);
}

function splitTopics(rawTopics) {
  return rawTopics
    .split(/[\n,]+/)
    .map((topic) => topic.trim())
    .filter(Boolean);
}

function getDaysLeft(deadline) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = deadline.getTime() - today.getTime();
  return Math.max(3, Math.ceil(diff / 86400000));
}

function buildTopicWeights(topics, challenge) {
  const loweredChallenge = challenge.toLowerCase();
  return topics
    .map((name, index) => ({
      name,
      weight: Math.max(1, topics.length - index + (loweredChallenge && loweredChallenge.includes(name.toLowerCase()) ? 2 : 0)),
      misses: 0,
      completed: 0,
    }))
    .sort((a, b) => b.weight - a.weight);
}

function buildMilestones(topicWeights, weeksLeft) {
  const milestoneLabels = ["Foundation", "Strengthen", "Pressure-test", "Polish"];
  return milestoneLabels.map((label, index) => {
    const topic = topicWeights[index % topicWeights.length]?.name ?? "core material";
    const weekNumber = Math.min(weeksLeft, Math.max(1, Math.ceil(((index + 1) / milestoneLabels.length) * weeksLeft)));
    return `Week ${weekNumber}: ${label} ${topic}`;
  });
}

function buildSchedule(topicWeights, hoursPerWeek, style, daysLeft) {
  const config = styleConfigs[style];
  const sessionCount = style === "deep" ? 4 : style === "gentle" ? 5 : 6;
  const sessionHours = Math.max(0.75, Math.round((hoursPerWeek / sessionCount) * 10) / 10);
  const paceTag = daysLeft <= 10 ? "high-priority" : daysLeft <= 21 ? "steady" : "sustainable";
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  return Array.from({ length: sessionCount }, (_, index) => {
    const scheduledFor = new Date(startDate);
    scheduledFor.setDate(startDate.getDate() + index);
    const topic = normalizeSubjectLabel(topicWeights[index % topicWeights.length]?.name ?? "revision");
    const method = config.methods[index % config.methods.length];

    return {
      id: `session-${Date.now()}-${index}`,
      topic,
      method,
      day: weekdayNames[scheduledFor.getDay() === 0 ? 6 : scheduledFor.getDay() - 1],
      date: scheduledFor.toISOString(),
      title: `${topic}: ${capitalize(method)}`,
      detail: `${sessionHours} hr block with ${index === sessionCount - 1 ? "review + reset" : `${paceTag} focus`}. End with a 10-minute reflection and next-step note.`,
      hours: sessionHours,
      status: "pending",
      rescheduled: false,
    };
  });
}

function buildMethods(style, challenge, level) {
  const challengeText = challenge ? `especially for ${challenge}` : "for your toughest concepts";
  return [
    {
      title: "Recall before rereading",
      detail: `Start each session by writing what you remember from memory, ${challengeText}.`,
    },
    {
      title: `${level} level output`,
      detail: "Finish every session with one visible result such as a summary card, solved set, mind map, or self-test.",
    },
    {
      title: style === "sprint" ? "Timed performance checks" : "End-of-week calibration",
      detail: style === "sprint"
        ? "Use a timer twice a week to simulate exam pressure and sharpen retrieval speed."
        : "Review wins, mistakes, and carry-over topics every weekend so the plan keeps improving.",
    },
  ];
}

function buildCoachNote(user, goal, style, challenge, daysLeft) {
  const urgency = daysLeft <= 10
    ? "Your window is tight, so protect consistency and avoid over-designing the system."
    : "You have enough runway to build depth before switching into revision pressure.";
  const challengeNote = challenge
    ? ` Give extra repetition to ${challenge}, because that friction point will shape your confidence.`
    : " Pick one weak area each week so your progress stays measurable.";
  return `${user.name}, ${goal} will feel more manageable if you treat this as a ${styleConfigs[style].label.toLowerCase()} system instead of a last-minute push. ${urgency}${challengeNote}`;
}

function getWeakAreaStats(plan) {
  return plan.topicWeights
    .map((topic) => ({
      name: normalizeSubjectLabel(topic.name),
      score: topic.weight + topic.misses * 2 - topic.completed,
      level: getWeakAreaLevel(topic),
      reason: topic.misses > 0
        ? `${topic.misses} missed session${topic.misses === 1 ? "" : "s"} and still a high-priority topic.`
        : topic.completed > 0
          ? `Progress improving with ${topic.completed} completed session${topic.completed === 1 ? "" : "s"}.`
          : "Priority topic that has not been reinforced yet.",
    }))
    .sort((a, b) => b.score - a.score);
}

function getWeakAreaLevel(topic) {
  if (topic.misses >= 2 || (topic.misses >= 1 && topic.completed === 0)) {
    return "Weak";
  }

  if (topic.completed >= 2 && topic.misses === 0) {
    return "Strong";
  }

  return "Improving";
}

function buildReminderEntries(plan) {
  const upcomingSessions = plan.schedule
    .filter((session) => session.status !== "done")
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 4);

  if (plan.reminderMode === "weekly") {
    return [{
      title: "Weekly review reminder",
      detail: `Every week at ${plan.reminderTime}, review completion rate and weak areas before the next block.`,
    }];
  }

  if (plan.reminderMode === "daily") {
    return upcomingSessions.map((session) => ({
      title: `${session.topic} reminder`,
      detail: `${formatShortDate(new Date(session.date))} at ${plan.reminderTime} for ${session.title}.`,
    }));
  }

  return upcomingSessions.map((session) => ({
    title: "Session-day reminder",
    detail: `${formatShortDate(new Date(session.date))} at ${plan.reminderTime} before ${session.topic}.`,
  }));
}

function getTodayTasks(plan) {
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  return plan.schedule.filter((session) => session.date.slice(0, 10) === todayKey);
}

function formatReminderMode(mode) {
  if (mode === "session") {
    return "session day";
  }
  if (mode === "weekly") {
    return "weekly";
  }
  return "daily";
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatShortDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function normalizeSubjectLabel(value) {
  const cleaned = (value || "").trim();
  const lookup = {
    os: "Operating Systems",
    operatingsystems: "Operating Systems",
    dbms: "Database Management Systems",
    cn: "Computer Networks",
    oop: "Object-Oriented Programming",
    ai: "Artificial Intelligence",
    ml: "Machine Learning",
    ds: "Data Structures",
    algo: "Algorithms",
  };

  const compact = cleaned.toLowerCase().replace(/[^a-z]/g, "");
  if (lookup[compact]) {
    return lookup[compact];
  }

  return cleaned
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatTaskStatus(status) {
  if (status === "done") {
    return "Completed";
  }
  if (status === "rescheduled") {
    return "Rescheduled";
  }
  if (status === "missed") {
    return "Missed";
  }
  return "Pending";
}

function handleQuickAddTask() {
  switchPage("generate");
  form.goal.focus();
}

function handleQuickCompleteTask() {
  if (!activePlan) {
    switchPage("generate");
    return;
  }

  const nextPendingSession = activePlan.schedule.find((session) => session.status === "pending" || session.status === "rescheduled");
  if (!nextPendingSession) {
    return;
  }

  updateSessionStatus(nextPendingSession.id, "done");
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}
