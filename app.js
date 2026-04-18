const gutScoreEl = document.getElementById("gutScore");
const gutHeadlineEl = document.getElementById("gutHeadline");
const gutSummaryEl = document.getElementById("gutSummary");
const nextStepEl = document.getElementById("nextStep");
const logCountEl = document.getElementById("logCount");
const weekCountEl = document.getElementById("weekCount");
const streakCountEl = document.getElementById("streakCount");
const redFlagCountEl = document.getElementById("redFlagCount");
const avgBristolEl = document.getElementById("avgBristol");
const avgComfortEl = document.getElementById("avgComfort");
const patternListEl = document.getElementById("patternList");
const triggerListEl = document.getElementById("triggerList");
const trendPanelEl = document.getElementById("trendPanel");
const heatmapPanelEl = document.getElementById("heatmapPanel");
const recentListEl = document.getElementById("recentList");
const communityListEl = document.getElementById("communityList");
const statusEl = document.getElementById("status");
const signupStatusEl = document.getElementById("signupStatus");
const donationStatusEl = document.getElementById("donationStatus");
const dataControlStatusEl = document.getElementById("dataControlStatus");
const signupKickerEl = document.getElementById("signupKicker");
const signupTitleEl = document.getElementById("signupTitle");
const signupCopyEl = document.getElementById("signupCopy");
const googleAuthBlockEl = document.getElementById("googleAuthBlock");
const signedInPanelEl = document.getElementById("signedInPanel");
const signedInNameEl = document.getElementById("signedInName");
const signedInEmailEl = document.getElementById("signedInEmail");
const signOutButtonEl = document.getElementById("signOutButton");
const navActionEl = document.getElementById("navAction");
const privacyModeEl = document.getElementById("privacyMode");
const actionPlanEl = document.getElementById("actionPlan");
const importJsonButtonEl = document.getElementById("importJsonButton");
const importJsonInputEl = document.getElementById("importJsonInput");
const exportCsvButtonEl = document.getElementById("exportCsvButton");
const exportJsonButtonEl = document.getElementById("exportJsonButton");
const copySummaryButtonEl = document.getElementById("copySummaryButton");
const doctorReportButtonEl = document.getElementById("doctorReportButton");
const quickPresetButtons = document.querySelectorAll("[data-preset]");
const logFormEl = document.getElementById("logForm");
const signupFormEl = document.getElementById("signupForm");
const googleSignupButtonEl = document.getElementById("googleSignupButton");
const communityFormEl = document.getElementById("communityForm");
const donationFormEl = document.getElementById("donationForm");
const resetButtonEl = document.getElementById("resetButton");
const appContentEl = document.getElementById("appContent");
const appGateEl = document.getElementById("appGate");
const authOnlyEls = document.querySelectorAll("[data-auth-only]");
const amountButtons = document.querySelectorAll("[data-amount]");

const SIGNUP_STORAGE_KEY = "gutty_signup";
const LOG_STORAGE_KEY = "gutty_logs";
const COMMUNITY_STORAGE_KEY = "gutty_community";
const DONATION_STORAGE_KEY = "gutty_donations";
const SUPABASE_URL = "https://sbvckjbdhzuxnarntrdu.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_qKvK4JA9GtDb9UdimqWkjw_Pm2Ox7nV";
const supabaseClient = window.supabase?.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const bristolLabels = {
  1: "Hard separate lumps",
  2: "Lumpy sausage",
  3: "Cracked sausage",
  4: "Smooth soft sausage",
  5: "Soft blobs",
  6: "Mushy fluffy pieces",
  7: "Watery liquid",
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function localDatetimeValue(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function readStorage(key, fallback) {
  try {
    return JSON.parse(window.localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function formatDay(date) {
  return date.toISOString().slice(0, 10);
}

function daysAgoLabel(value) {
  if (!value) return "No logs yet";
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function collectFlags(form) {
  return Array.from(form.querySelectorAll('input[name="flags"]:checked')).map((input) => input.value);
}

function tokenizeList(value) {
  return String(value || "")
    .split(/[;,]/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 12);
}

function titleCase(value) {
  return String(value || "")
    .split(" ")
    .map((part) => part ? part[0].toUpperCase() + part.slice(1) : part)
    .join(" ");
}

function isDetailedLog(log) {
  return Number.isFinite(Number(log.bristol_type)) && Number(log.bristol_type) >= 1;
}

function normalizedLogDate(log) {
  const value = log.logged_at || log.date || new Date().toISOString();
  return new Date(value).toISOString();
}

function savedSignup() {
  return readStorage(SIGNUP_STORAGE_KEY, null);
}

async function apiRequest(path, payload) {
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }
    return data;
  } catch (error) {
    return null;
  }
}

async function supabaseInsert(table, row) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(row),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Could not save ${table}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data[0] : data;
}

function userFromSupabase(authUser) {
  const metadata = authUser?.user_metadata || {};
  return {
    name: metadata.full_name || metadata.name || authUser?.email?.split("@")[0] || "Gutty user",
    email: authUser?.email || "",
    provider: "google",
  };
}

async function rememberAuthenticatedUser(authUser) {
  if (!authUser?.email) return null;

  const user = userFromSupabase(authUser);
  writeStorage(SIGNUP_STORAGE_KEY, user);
  unlockApp(user);
  signupStatusEl.textContent = `Signed in with Google as ${user.name || user.email}.`;

  try {
    await supabaseInsert("signups", {
      name: user.name,
      email: user.email,
      reason: "google signup",
    });
  } catch (error) {
    console.warn("Supabase signup profile save failed", error);
  }

  await fetchSummary();
  return user;
}

async function initializeSupabaseAuth() {
  if (!supabaseClient) {
    signupStatusEl.textContent = "Google sign-in is loading. Try again in a moment.";
    return;
  }

  const { data } = await supabaseClient.auth.getSession();
  if (data?.session?.user) {
    await rememberAuthenticatedUser(data.session.user);
  }

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      rememberAuthenticatedUser(session.user);
    }
  });
}

function unlockApp(user) {
  appContentEl.hidden = false;
  appContentEl.classList.remove("is-locked");
  appContentEl.removeAttribute("aria-hidden");
  authOnlyEls.forEach((element) => {
    element.hidden = false;
  });
  appGateEl.hidden = true;
  signupKickerEl.textContent = "Account ready";
  signupTitleEl.textContent = "You're signed in";
  signupCopyEl.textContent = "The analyzer is unlocked. Your poop logs stay on this device until Gutty has full account privacy controls.";
  googleAuthBlockEl.hidden = true;
  signedInPanelEl.hidden = false;
  signedInNameEl.textContent = user.name || "Gutty user";
  signedInEmailEl.textContent = user.email || "Google account connected";
  signupStatusEl.textContent = "Ready to log your gut signals.";
  navActionEl.textContent = "Open app";
  navActionEl.href = "#analyzer";
  privacyModeEl.textContent = "Signed in - local poop ledger";
  signupFormEl.querySelector("button").textContent = "Signed up";
  donationFormEl.elements.name.value = user.name || "";
  donationFormEl.elements.email.value = user.email || "";
}

function lockApp() {
  appContentEl.hidden = true;
  appContentEl.classList.add("is-locked");
  appContentEl.setAttribute("aria-hidden", "true");
  authOnlyEls.forEach((element) => {
    element.hidden = true;
  });
  appGateEl.hidden = false;
  signupKickerEl.textContent = "Start free";
  signupTitleEl.textContent = "Sign up with Google";
  signupCopyEl.textContent = "Use your Google account to create your free Gutty account. Your poop logs stay on this device in this MVP.";
  googleAuthBlockEl.hidden = false;
  signedInPanelEl.hidden = true;
  googleSignupButtonEl.disabled = false;
  signupStatusEl.textContent = "No payment. No shame. Just your Google account.";
  navActionEl.textContent = "Sign up";
  navActionEl.href = "#signup";
  privacyModeEl.textContent = "Private local MVP";
}

function renderPatterns(patterns) {
  patternListEl.innerHTML = "";
  patterns.forEach((pattern) => {
    const item = document.createElement("article");
    item.className = `pattern-card ${pattern.tone}`;
    item.innerHTML = `<h3>${escapeHtml(pattern.title)}</h3><p>${escapeHtml(pattern.detail)}</p>`;
    patternListEl.appendChild(item);
  });
}

function renderRecent(logs) {
  recentListEl.innerHTML = "";
  if (!logs.length) {
    recentListEl.innerHTML = '<p class="empty">No logs yet. The first flush of truth is still pending.</p>';
    return;
  }

  logs.forEach((log) => {
    const flags = log.flags?.length ? `<span class="flag-chip">Red flags: ${escapeHtml(log.flags.join(", "))}</span>` : "";
    const detailed = isDetailedLog(log);
    const item = document.createElement("article");
    item.className = "recent-item";
    item.innerHTML = `
      <div>
        <h3>${detailed ? `Type ${escapeHtml(log.bristol_type)}: ${escapeHtml(log.bristol_label)}` : "Bowel movement logged"}</h3>
        <p>${detailed ? `${escapeHtml(log.color)} · ${escapeHtml(log.amount)} · urgency ${escapeHtml(log.urgency)}/5 · comfort ${escapeHtml(log.comfort)}/5` : "Historical frequency-only entry imported from your private PDF."}</p>
        ${log.foods?.length ? `<p><span class="label">Foods</span> ${escapeHtml(log.foods.join(", "))}</p>` : ""}
        ${log.symptoms?.length ? `<p><span class="label">Symptoms</span> ${escapeHtml(log.symptoms.join(", "))}</p>` : ""}
        ${log.notes ? `<p>${escapeHtml(log.notes)}</p>` : ""}
        ${flags}
      </div>
      <span>${new Date(log.logged_at).toLocaleString()}</span>
    `;
    recentListEl.appendChild(item);
  });
}

function renderCommunity(posts) {
  communityListEl.innerHTML = "";
  if (!posts.length) {
    communityListEl.innerHTML = '<p class="empty">No community notes yet. Be brave, be useful, be kind.</p>';
    return;
  }

  posts.forEach((post) => {
    const item = document.createElement("article");
    item.className = "community-card";
    item.innerHTML = `
      <div class="community-head">
        <strong>${escapeHtml(post.display_name)}</strong>
        <span>${new Date(post.created_at).toLocaleString()}</span>
      </div>
      <p>${escapeHtml(post.story)}</p>
      <p><span class="label">Asking for</span>${escapeHtml(post.suggestion)}</p>
    `;
    communityListEl.appendChild(item);
  });
}

function countBy(items) {
  return items.reduce((counts, item) => {
    counts[item] = (counts[item] || 0) + 1;
    return counts;
  }, {});
}

function buildTriggerInsights(logs) {
  const rows = [];
  const foods = new Map();
  logs.filter(isDetailedLog).forEach((log) => {
    const rough = Number(log.comfort) <= 2 || [1, 2, 6, 7].includes(Number(log.bristol_type)) || (log.flags || []).length > 0;
    (log.foods || []).forEach((food) => {
      if (!foods.has(food)) foods.set(food, { name: food, total: 0, rough: 0 });
      const item = foods.get(food);
      item.total += 1;
      if (rough) item.rough += 1;
    });
  });

  foods.forEach((item) => {
    if (item.total >= 2) {
      rows.push({ ...item, rate: item.rough / item.total });
    }
  });

  return rows.sort((a, b) => b.rate - a.rate || b.total - a.total).slice(0, 5);
}

function buildTrendSnapshot(logs) {
  const recent = logs.filter(isDetailedLog).slice(0, 14);
  const bristolCounts = countBy(recent.map((log) => String(log.bristol_type)));
  const symptomCounts = countBy(logs.slice(0, 30).flatMap((log) => log.symptoms || []));
  const topSymptoms = Object.entries(symptomCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const maxBristol = Math.max(1, ...Object.values(bristolCounts));

  return {
    bristol: [1, 2, 3, 4, 5, 6, 7].map((type) => ({ type, count: bristolCounts[String(type)] || 0, max: maxBristol })),
    topSymptoms,
  };
}

function buildHeatmap(logs) {
  const byDay = new Map();
  logs.forEach((log) => {
    const day = formatDay(new Date(log.logged_at));
    const current = byDay.get(day) || { count: 0, redFlags: 0, rough: 0 };
    current.count += 1;
    current.redFlags += log.flags?.length || 0;
    if (Number(log.comfort) <= 2 || [1, 2, 6, 7].includes(Number(log.bristol_type))) current.rough += 1;
    byDay.set(day, current);
  });

  return Array.from({ length: 30 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - index));
    const day = formatDay(date);
    return { day, label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }), ...(byDay.get(day) || { count: 0, redFlags: 0, rough: 0 }) };
  });
}

function calculateStreak(logs) {
  if (!logs.length) return 0;

  const days = new Set(logs.map((log) => formatDay(new Date(log.logged_at))));
  let cursor = new Date();
  let streak = 0;

  while (days.has(formatDay(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function buildActionPlan(logs, patterns) {
  if (!logs.length) {
    return ["Log three poop situations to create a useful baseline.", "Keep each note boring and specific: food, stress, hydration, and timing.", "Use red flags only for symptoms you would not want a stranger to casually explain away."];
  }

  const latest = logs[0];
  if (latest && !isDetailedLog(latest)) {
    return ["Your PDF history is loaded for frequency and gap analysis.", "Start logging Bristol type, color, comfort, symptoms, and food clues from today forward.", "Use the doctor report if you want a clean summary of the historical rhythm."];
  }
  if (latest.flags?.length) {
    return ["Pause experiments and consider contacting a clinician.", "Write down when symptoms started, what changed, and whether pain, fever, or dehydration is present.", "Export your log before an appointment if it helps you explain the pattern."];
  }

  if (Number(latest.bristol_type) <= 2) {
    return ["Try a hydration and fiber check for the next 24 hours.", "Add movement if your routine has been unusually still.", "Change one variable at a time so the pattern stays readable."];
  }

  if (Number(latest.bristol_type) >= 6) {
    return ["Prioritize fluids while stools are loose.", "Look for recent changes: illness, stress, alcohol, caffeine, travel, or a new food.", "Avoid crowdsourcing if loose stool persists or comes with fever, severe pain, or dehydration."];
  }

  return [patterns[0]?.detail || "Your latest log is usable baseline data.", "Keep logging at the same level of detail for a few more days.", "If you experiment, make it small: one food, habit, or timing change at a time."];
}

function buildLocalSummary() {
  const logs = readStorage(LOG_STORAGE_KEY, []).sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at));
  const detailedLogs = logs.filter(isDetailedLog);
  const community = readStorage(COMMUNITY_STORAGE_KEY, []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const recent = detailedLogs.slice(0, 7);
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const avg = (items, key) => items.length ? items.reduce((sum, item) => sum + Number(item[key] || 0), 0) / items.length : 0;
  const latest = logs[0];
  const redFlagCount = logs.reduce((sum, log) => sum + (log.flags?.length || 0), 0);
  const streak = calculateStreak(logs);
  let score = 50;
  let headline = "Gutty is waiting for the first field report";
  let summary = "Everyone says trust your gut. First, let us find out whether your gut is behaving like a reliable narrator.";
  let nextStep = "Log your next poop situation with Bristol type, color, comfort, hydration, fiber, stress, and any red flags.";

  if (latest) {
    score = detailedLogs.length ? 82 : 72;
    recent.forEach((log) => {
      if ([1, 2, 6, 7].includes(Number(log.bristol_type))) score -= 5;
      if (["black", "red", "pale"].includes(log.color)) score -= 8;
      if (log.flags?.length) score -= 20;
      score += Number(log.hydration) - 3 + Number(log.fiber) - 3 + Number(log.comfort) - 3;
      score -= Math.max(0, Number(log.stress) - 3);
    });
    score = Math.max(0, Math.min(100, score));
    if (streak >= 3) score = Math.min(100, score + 4);
    if (isDetailedLog(latest)) {
      headline = latest.flags?.length ? "Your gut is asking for backup" : [3, 4].includes(Number(latest.bristol_type)) ? "Your latest log is in the smooth zone" : Number(latest.bristol_type) <= 2 ? "Your latest log leaned hard" : Number(latest.bristol_type) >= 6 ? "Your latest log leaned loose" : "Your gut is giving usable data";
      summary = `Latest report: type ${latest.bristol_type} (${latest.bristol_label}), ${latest.color} color, ${latest.amount} amount, urgency ${latest.urgency}/5.`;
      nextStep = latest.flags?.length ? "Red flags beat experiments. Consider contacting a medical professional, especially for blood, tarry black stool, severe pain, fever, or dehydration." : "Try one small controlled experiment for the next 24 hours: hydration, fiber, movement, or stress reduction. Change one variable at a time.";
    } else {
      headline = "Your historical rhythm is loaded";
      summary = `Latest imported entry: ${new Date(latest.logged_at).toLocaleDateString()}. These older records track frequency only.`;
      nextStep = "Use the imported history for rhythm and gap analysis, then log Bristol type, comfort, color, and symptoms going forward.";
    }
  }

  const patterns = buildLocalPatterns(recent);

  return {
    totals: {
      log_count: logs.length,
      week_count: logs.filter((log) => new Date(log.logged_at).getTime() >= weekAgo).length,
      streak,
      red_flag_count: redFlagCount,
      avg_bristol: detailedLogs.length ? avg(detailedLogs, "bristol_type").toFixed(1).replace(".0", "") : "n/a",
      avg_comfort: detailedLogs.length ? avg(detailedLogs, "comfort").toFixed(1).replace(".0", "") : "n/a",
      last_log: daysAgoLabel(latest?.logged_at),
    },
    gut_score: { score, headline, summary, next_step: nextStep },
    patterns,
    action_plan: buildActionPlan(logs, patterns),
    triggers: buildTriggerInsights(logs),
    trends: buildTrendSnapshot(logs),
    heatmap: buildHeatmap(logs),
    logs: logs.slice(0, 20),
    community: community.slice(0, 12),
  };
}

function buildLocalPatterns(recent) {
  const allLogs = readStorage(LOG_STORAGE_KEY, []);
  if (!recent.length && allLogs.length) {
    return [{ tone: "info", title: "Historical rhythm imported", detail: "Gutty can analyze frequency and gaps from your imported PDF, but Bristol type, color, pain, and trigger analysis need richer future logs." }];
  }
  if (!recent.length) {
    return [{ tone: "info", title: "Your gut needs a baseline", detail: "Log three situations and Gutty can start comparing texture, color, urgency, comfort, hydration, fiber, and stress." }];
  }
  const flags = recent.flatMap((log) => log.flags || []);
  if (flags.length) {
    return [{ tone: "urgent", title: "Do not crowdsource this one", detail: "You marked a red flag. Consider calling a clinician, urgent care, or emergency services if symptoms are severe." }];
  }
  const avgBristol = recent.reduce((sum, log) => sum + Number(log.bristol_type), 0) / recent.length;
  if (avgBristol <= 2.4) return [{ tone: "warning", title: "Harder stools are trending", detail: "Types 1-2 often show up with constipation patterns. Water, fiber, movement, and routine timing are the usual first things to review." }];
  if (avgBristol >= 5.8) return [{ tone: "warning", title: "Looser stools are trending", detail: "Types 6-7 can happen with illness, stress, alcohol, caffeine, or food triggers. Hydration matters if this keeps happening." }];
  return [{ tone: "good", title: "Texture looks mostly in range", detail: "Your recent logs are clustering near Bristol types 3-5, which is usually the calmer middle of the stool chart." }];
}

function renderTriggerInsights(items = []) {
  triggerListEl.innerHTML = "";
  const shell = document.createElement("div");
  shell.className = "insight-box";
  const title = document.createElement("h3");
  title.textContent = "Trigger lab";
  shell.appendChild(title);

  if (!items.length) {
    const empty = document.createElement("p");
    empty.textContent = "Add food clues for a few logs and Gutty will look for rough-day overlaps.";
    shell.appendChild(empty);
  } else {
    items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "trigger-row";
      row.innerHTML = `<span>${escapeHtml(titleCase(item.name))}</span><strong>${Math.round(item.rate * 100)}%</strong><em>${item.rough}/${item.total} rough logs</em>`;
      shell.appendChild(row);
    });
  }

  triggerListEl.appendChild(shell);
}

function renderTrendSnapshot(trends = { bristol: [], topSymptoms: [] }) {
  trendPanelEl.innerHTML = "";
  const shell = document.createElement("div");
  shell.className = "insight-box";
  shell.innerHTML = "<h3>Trend board</h3>";

  const bars = document.createElement("div");
  bars.className = "bristol-bars";
  trends.bristol.forEach((item) => {
    const bar = document.createElement("div");
    bar.className = "bristol-bar";
    bar.innerHTML = `<span>Type ${item.type}</span><i style="--bar:${item.max ? item.count / item.max : 0}"></i><strong>${item.count}</strong>`;
    bars.appendChild(bar);
  });
  shell.appendChild(bars);

  const symptoms = document.createElement("p");
  symptoms.innerHTML = trends.topSymptoms.length
    ? `<span class="label">Top symptoms</span> ${trends.topSymptoms.map(([name, count]) => `${escapeHtml(titleCase(name))} (${count})`).join(", ")}`
    : '<span class="label">Top symptoms</span> Add symptom clues to see repeats.';
  shell.appendChild(symptoms);
  trendPanelEl.appendChild(shell);
}

function renderHeatmap(days = []) {
  heatmapPanelEl.innerHTML = "";
  const shell = document.createElement("div");
  shell.className = "insight-box";
  shell.innerHTML = "<h3>30-day rhythm</h3>";
  const grid = document.createElement("div");
  grid.className = "heatmap-grid";
  days.forEach((day) => {
    const cell = document.createElement("span");
    cell.className = `heat-cell level-${Math.min(3, day.count)}${day.redFlags ? " has-alert" : ""}${day.rough ? " has-rough" : ""}`;
    cell.title = `${day.label}: ${day.count} log(s), ${day.redFlags} red flag(s)`;
    grid.appendChild(cell);
  });
  shell.appendChild(grid);
  heatmapPanelEl.appendChild(shell);
}

function renderActionPlan(items = []) {
  actionPlanEl.innerHTML = "";
  if (!items.length) return;

  const title = document.createElement("h3");
  title.textContent = "Next best moves";
  const list = document.createElement("ol");
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    list.appendChild(li);
  });
  actionPlanEl.append(title, list);
}

function renderSummary(data) {
  gutScoreEl.textContent = String(data.gut_score.score);
  gutHeadlineEl.textContent = data.gut_score.headline;
  gutSummaryEl.textContent = data.gut_score.summary;
  nextStepEl.textContent = data.gut_score.next_step;
  logCountEl.textContent = String(data.totals.log_count);
  weekCountEl.textContent = String(data.totals.week_count);
  streakCountEl.textContent = String(data.totals.streak || 0);
  redFlagCountEl.textContent = String(data.totals.red_flag_count || 0);
  avgBristolEl.textContent = String(data.totals.avg_bristol);
  avgComfortEl.textContent = String(data.totals.avg_comfort);
  renderPatterns(data.patterns);
  renderTriggerInsights(data.triggers);
  renderTrendSnapshot(data.trends);
  renderHeatmap(data.heatmap);
  renderActionPlan(data.action_plan);
  renderRecent(data.logs);
  renderCommunity(data.community);
}

async function fetchSummary() {
  try {
    const response = await fetch("/api/summary");
    if (!response.ok) throw new Error("No API");
    renderSummary(await response.json());
  } catch {
    renderSummary(buildLocalSummary());
  }
}

googleSignupButtonEl?.addEventListener("click", async () => {
  if (!supabaseClient) {
    signupStatusEl.textContent = "Google sign-in is still loading. Try again in a moment.";
    return;
  }

  googleSignupButtonEl.disabled = true;
  signupStatusEl.textContent = "Opening Google sign-in...";

  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    googleSignupButtonEl.disabled = false;
    signupStatusEl.textContent = "Google sign-in needs to be enabled in Supabase first.";
    console.warn("Google sign-in failed", error);
  }
});

signOutButtonEl?.addEventListener("click", async () => {
  if (supabaseClient) {
    await supabaseClient.auth.signOut();
  }

  window.localStorage.removeItem(SIGNUP_STORAGE_KEY);
  lockApp();
  await fetchSummary();
});

signupFormEl.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(signupFormEl).entries());
  const user = { name: payload.name || "Gutty user", email: payload.email };
  let savedToSupabase = false;

  try {
    await supabaseInsert("signups", {
      name: user.name,
      email: user.email,
      reason: payload.reason || "",
    });
    savedToSupabase = true;
  } catch (error) {
    console.warn("Supabase signup save failed", error);
  }

  if (!savedToSupabase) {
    const data = await apiRequest("/api/signup", payload);
    savedToSupabase = Boolean(data?.user);
  }

  writeStorage(SIGNUP_STORAGE_KEY, user);
  unlockApp(user);
  signupStatusEl.textContent = savedToSupabase
    ? `Signed in as ${user.name || user.email}. Signup saved.`
    : `Signed in as ${user.name || user.email}. Saved in this browser.`;
  await fetchSummary();
});

quickPresetButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const preset = button.dataset.preset;
    const values = {
      smooth: { bristol_type: "4", urgency: "2", comfort: "5", hydration: "4", fiber: "4", stress: "2" },
      hard: { bristol_type: "2", urgency: "2", comfort: "2", hydration: "2", fiber: "2", stress: "3" },
      loose: { bristol_type: "6", urgency: "5", comfort: "2", hydration: "3", fiber: "2", stress: "4" },
    }[preset];

    if (!values) return;
    Object.entries(values).forEach(([key, value]) => {
      logFormEl.elements[key].value = value;
    });
    quickPresetButtons.forEach((item) => item.classList.remove("is-selected"));
    button.classList.add("is-selected");
    statusEl.textContent = "Preset loaded. Add food clues or notes, then analyze.";
  });
});

logFormEl.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(logFormEl).entries());
  payload.logged_at = payload.logged_at ? new Date(payload.logged_at).toISOString() : new Date().toISOString();
  payload.bristol_type = Number(payload.bristol_type);
  payload.bristol_label = bristolLabels[payload.bristol_type];
  payload.urgency = Number(payload.urgency);
  payload.comfort = Number(payload.comfort);
  payload.hydration = Number(payload.hydration);
  payload.fiber = Number(payload.fiber);
  payload.stress = Number(payload.stress);
  payload.flags = collectFlags(logFormEl);
  payload.foods = tokenizeList(payload.foods);
  payload.symptoms = tokenizeList(payload.symptoms);
  await apiRequest("/api/logs", payload);
  const logs = readStorage(LOG_STORAGE_KEY, []);
  logs.unshift({ id: crypto.randomUUID(), source: "browser", ...payload });
  writeStorage(LOG_STORAGE_KEY, logs);
  logFormEl.reset();
  logFormEl.elements.logged_at.value = localDatetimeValue();
  logFormEl.elements.bristol_type.value = "4";
  logFormEl.elements.color.value = "brown";
  logFormEl.elements.amount.value = "medium";
  statusEl.textContent = "Logged. Analysis refreshed.";
  await fetchSummary();
});

communityFormEl.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(communityFormEl).entries());
  await apiRequest("/api/community", payload);
  const posts = readStorage(COMMUNITY_STORAGE_KEY, []);
  posts.unshift({ id: crypto.randomUUID(), created_at: new Date().toISOString(), display_name: payload.display_name || "anonymous gut scout", story: payload.story, suggestion: payload.suggestion });
  writeStorage(COMMUNITY_STORAGE_KEY, posts);
  communityFormEl.reset();
  statusEl.textContent = "Published locally.";
  await fetchSummary();
});

amountButtons.forEach((button) => {
  button.addEventListener("click", () => {
    donationFormEl.elements.amount.value = Number(button.dataset.amount).toFixed(2);
    amountButtons.forEach((item) => item.classList.remove("is-selected"));
    button.classList.add("is-selected");
  });
});

donationFormEl.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(donationFormEl).entries());
  payload.amount = Number(payload.amount);
  const pledge = {
    name: payload.name || "Gutty supporter",
    email: payload.email,
    amount: payload.amount,
    message: payload.message || "",
  };
  let savedToSupabase = false;

  try {
    await supabaseInsert("donation_pledges", pledge);
    savedToSupabase = true;
  } catch (error) {
    console.warn("Supabase donation save failed", error);
  }

  if (!savedToSupabase) {
    const data = await apiRequest("/api/donations", payload);
    savedToSupabase = Boolean(data?.amount);
  }

  const donations = readStorage(DONATION_STORAGE_KEY, []);
  donations.unshift({ id: crypto.randomUUID(), created_at: new Date().toISOString(), ...payload });
  writeStorage(DONATION_STORAGE_KEY, donations);
  donationStatusEl.textContent = savedToSupabase
    ? `Thank you. Your $${payload.amount.toFixed(2)} support pledge was saved.`
    : `Thank you. Your $${payload.amount.toFixed(2)} support pledge was saved in this browser.`;
  donationFormEl.elements.message.value = "";
});

function buildExportPayload() {
  return {
    exported_at: new Date().toISOString(),
    user: savedSignup(),
    summary: buildLocalSummary(),
    logs: readStorage(LOG_STORAGE_KEY, []),
    community: readStorage(COMMUNITY_STORAGE_KEY, []),
    donation_pledges: readStorage(DONATION_STORAGE_KEY, []),
  };
}

function exportLogsAsCsv() {
  const logs = readStorage(LOG_STORAGE_KEY, []);
  const headers = ["logged_at", "bristol_type", "bristol_label", "color", "amount", "urgency", "comfort", "hydration", "fiber", "stress", "foods", "symptoms", "flags", "notes"];
  const rows = logs.map((log) => headers.map((key) => {
    if (["flags", "foods", "symptoms"].includes(key)) return csvEscape((log[key] || []).join("; "));
    return csvEscape(log[key]);
  }).join(","));
  downloadFile("gutty-logs.csv", [headers.join(","), ...rows].join("\n"), "text/csv");
  dataControlStatusEl.textContent = logs.length ? "CSV export downloaded." : "CSV downloaded with no logs yet.";
}

function exportLogsAsJson() {
  downloadFile("gutty-export.json", JSON.stringify(buildExportPayload(), null, 2), "application/json");
  dataControlStatusEl.textContent = "JSON export downloaded.";
}

async function copyClinicianSummary() {
  const summary = buildLocalSummary();
  const logs = readStorage(LOG_STORAGE_KEY, []);
  const latest = logs[0];
  const text = [
    "Gutty summary",
    `Total logs: ${summary.totals.log_count}`,
    `Logs this week: ${summary.totals.week_count}`,
    `Current streak: ${summary.totals.streak} day(s)`,
    `Red flags marked: ${summary.totals.red_flag_count}`,
    `Average Bristol: ${summary.totals.avg_bristol}`,
    `Average comfort: ${summary.totals.avg_comfort}`,
    latest ? `Latest: type ${latest.bristol_type} (${latest.bristol_label}), ${latest.color}, ${latest.amount}, urgency ${latest.urgency}/5, comfort ${latest.comfort}/5.` : "Latest: no logs yet.",
    `Current note: ${summary.gut_score.next_step}`,
  ].join("\n");

  try {
    await navigator.clipboard.writeText(text);
    dataControlStatusEl.textContent = "Summary copied.";
  } catch {
    downloadFile("gutty-summary.txt", text, "text/plain");
    dataControlStatusEl.textContent = "Clipboard blocked, so a text summary downloaded.";
  }
}

function downloadDoctorReport() {
  const summary = buildLocalSummary();
  const lines = [
    "Gutty doctor-ready report",
    `Generated: ${new Date().toLocaleString()}`,
    "",
    "Snapshot",
    `- Total logs: ${summary.totals.log_count}`,
    `- Logs this week: ${summary.totals.week_count}`,
    `- Streak: ${summary.totals.streak} day(s)` ,
    `- Red flags marked: ${summary.totals.red_flag_count}`,
    `- Average Bristol: ${summary.totals.avg_bristol}`,
    `- Average comfort: ${summary.totals.avg_comfort}`,
    "",
    "Possible trigger overlaps",
    ...(summary.triggers.length ? summary.triggers.map((item) => `- ${titleCase(item.name)}: ${item.rough}/${item.total} rough logs`) : ["- Not enough food clue data yet"]),
    "",
    "Next best moves",
    ...summary.action_plan.map((item) => `- ${item}`),
    "",
    "Medical boundary",
    "Gutty is a tracker, not a diagnosis. Red stool, black tarry stool, severe pain, fever, dehydration, or persistent symptoms should be reviewed with a clinician.",
  ];
  downloadFile("gutty-doctor-report.txt", lines.join("\n"), "text/plain");
  dataControlStatusEl.textContent = "Doctor-ready report downloaded.";
}

function normalizeImportedLog(entry, index) {
  const loggedAt = normalizedLogDate(entry);
  const detailed = isDetailedLog(entry);
  return {
    id: entry.id || `import-${loggedAt.slice(0, 10)}-${index}`,
    source: entry.source || "import",
    imported_at: new Date().toISOString(),
    logged_at: loggedAt,
    bristol_type: detailed ? Number(entry.bristol_type) : null,
    bristol_label: detailed ? (entry.bristol_label || bristolLabels[Number(entry.bristol_type)]) : "Bowel movement logged - details not recorded",
    color: detailed ? (entry.color || "brown") : "not recorded",
    amount: detailed ? (entry.amount || "medium") : "not recorded",
    urgency: detailed ? Number(entry.urgency || 3) : null,
    comfort: detailed ? Number(entry.comfort || 3) : null,
    hydration: detailed ? Number(entry.hydration || 3) : null,
    fiber: detailed ? Number(entry.fiber || 3) : null,
    stress: detailed ? Number(entry.stress || 3) : null,
    foods: Array.isArray(entry.foods) ? entry.foods : tokenizeList(entry.foods),
    symptoms: Array.isArray(entry.symptoms) ? entry.symptoms : tokenizeList(entry.symptoms),
    flags: Array.isArray(entry.flags) ? entry.flags : [],
    notes: entry.notes || entry.note || "Imported historical frequency-only record.",
  };
}

function importLogsFromJson(payload) {
  const incoming = Array.isArray(payload) ? payload : payload.logs || payload.entries || [];
  if (!incoming.length) throw new Error("No logs found in import file");
  const existing = readStorage(LOG_STORAGE_KEY, []);
  const byKey = new Map(existing.map((log) => [log.id || `${log.logged_at}-${log.source}`, log]));
  incoming.map(normalizeImportedLog).forEach((log) => {
    byKey.set(log.id || `${log.logged_at}-${log.source}`, log);
  });
  const merged = Array.from(byKey.values()).sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at));
  writeStorage(LOG_STORAGE_KEY, merged);
  dataControlStatusEl.textContent = `Imported ${incoming.length} log entries. Your browser now has ${merged.length} total logs.`;
  return fetchSummary();
}

importJsonButtonEl?.addEventListener("click", () => importJsonInputEl.click());
importJsonInputEl?.addEventListener("change", async () => {
  const file = importJsonInputEl.files?.[0];
  if (!file) return;
  try {
    const payload = JSON.parse(await file.text());
    await importLogsFromJson(payload);
  } catch (error) {
    dataControlStatusEl.textContent = "Import failed. Choose a Gutty JSON export or private import file.";
    console.warn("Import failed", error);
  } finally {
    importJsonInputEl.value = "";
  }
});

exportCsvButtonEl?.addEventListener("click", exportLogsAsCsv);
exportJsonButtonEl?.addEventListener("click", exportLogsAsJson);
copySummaryButtonEl?.addEventListener("click", copyClinicianSummary);
doctorReportButtonEl?.addEventListener("click", downloadDoctorReport);

resetButtonEl.addEventListener("click", async () => {
  if (!window.confirm("Reset all local Gutty demo data?")) return;
  await apiRequest("/api/reset", {});
  writeStorage(LOG_STORAGE_KEY, []);
  writeStorage(COMMUNITY_STORAGE_KEY, []);
  writeStorage(DONATION_STORAGE_KEY, []);
  statusEl.textContent = "Gutty data reset. Your gut gets a fresh notebook.";
  dataControlStatusEl.textContent = "Local logs, community notes, and pledge drafts cleared.";
  await fetchSummary();
});

logFormEl.elements.logged_at.value = localDatetimeValue();
initializeSupabaseAuth();
const user = savedSignup();
if (user) {
  unlockApp(user);
  fetchSummary();
} else {
  lockApp();
  fetchSummary();
}
