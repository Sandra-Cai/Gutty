const gutScoreEl = document.getElementById("gutScore");
const gutHeadlineEl = document.getElementById("gutHeadline");
const gutSummaryEl = document.getElementById("gutSummary");
const nextStepEl = document.getElementById("nextStep");
const logCountEl = document.getElementById("logCount");
const weekCountEl = document.getElementById("weekCount");
const avgBristolEl = document.getElementById("avgBristol");
const avgComfortEl = document.getElementById("avgComfort");
const patternListEl = document.getElementById("patternList");
const recentListEl = document.getElementById("recentList");
const communityListEl = document.getElementById("communityList");
const statusEl = document.getElementById("status");
const signupStatusEl = document.getElementById("signupStatus");
const donationStatusEl = document.getElementById("donationStatus");
const signupKickerEl = document.getElementById("signupKicker");
const signupTitleEl = document.getElementById("signupTitle");
const signupCopyEl = document.getElementById("signupCopy");
const googleAuthBlockEl = document.getElementById("googleAuthBlock");
const signedInPanelEl = document.getElementById("signedInPanel");
const signedInNameEl = document.getElementById("signedInName");
const signedInEmailEl = document.getElementById("signedInEmail");
const signOutButtonEl = document.getElementById("signOutButton");
const logFormEl = document.getElementById("logForm");
const signupFormEl = document.getElementById("signupForm");
const googleSignupButtonEl = document.getElementById("googleSignupButton");
const communityFormEl = document.getElementById("communityForm");
const donationFormEl = document.getElementById("donationForm");
const resetButtonEl = document.getElementById("resetButton");
const appContentEl = document.getElementById("appContent");
const appGateEl = document.getElementById("appGate");
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

function collectFlags(form) {
  return Array.from(form.querySelectorAll('input[name="flags"]:checked')).map((input) => input.value);
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
  appContentEl.classList.remove("is-locked");
  appContentEl.removeAttribute("aria-hidden");
  appGateEl.hidden = true;
  signupKickerEl.textContent = "Account ready";
  signupTitleEl.textContent = "You're signed in";
  signupCopyEl.textContent = "The analyzer is unlocked. Your poop logs stay on this device until Gutty has full account privacy controls.";
  googleAuthBlockEl.hidden = true;
  signedInPanelEl.hidden = false;
  signedInNameEl.textContent = user.name || "Gutty user";
  signedInEmailEl.textContent = user.email || "Google account connected";
  signupStatusEl.textContent = "Ready to log your gut signals.";
  signupFormEl.querySelector("button").textContent = "Signed up";
  donationFormEl.elements.name.value = user.name || "";
  donationFormEl.elements.email.value = user.email || "";
}

function lockApp() {
  appContentEl.classList.add("is-locked");
  appContentEl.setAttribute("aria-hidden", "true");
  appGateEl.hidden = false;
  signupKickerEl.textContent = "Start free";
  signupTitleEl.textContent = "Sign up with Google";
  signupCopyEl.textContent = "Use your Google account to create your free Gutty account. Your poop logs stay on this device in this MVP.";
  googleAuthBlockEl.hidden = false;
  signedInPanelEl.hidden = true;
  googleSignupButtonEl.disabled = false;
  signupStatusEl.textContent = "No payment. No shame. Just your Google account.";
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
    const item = document.createElement("article");
    item.className = "recent-item";
    item.innerHTML = `
      <div>
        <h3>Type ${escapeHtml(log.bristol_type)}: ${escapeHtml(log.bristol_label)}</h3>
        <p>${escapeHtml(log.color)} · ${escapeHtml(log.amount)} · urgency ${escapeHtml(log.urgency)}/5 · comfort ${escapeHtml(log.comfort)}/5</p>
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

function buildLocalSummary() {
  const logs = readStorage(LOG_STORAGE_KEY, []).sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at));
  const community = readStorage(COMMUNITY_STORAGE_KEY, []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const recent = logs.slice(0, 7);
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const avg = (items, key) => items.length ? items.reduce((sum, item) => sum + Number(item[key] || 0), 0) / items.length : 0;
  const latest = logs[0];
  let score = 50;
  let headline = "Gutty is waiting for the first field report";
  let summary = "Everyone says trust your gut. First, let us find out whether your gut is behaving like a reliable narrator.";
  let nextStep = "Log your next poop situation with Bristol type, color, comfort, hydration, fiber, stress, and any red flags.";

  if (latest) {
    score = 82;
    recent.forEach((log) => {
      if ([1, 2, 6, 7].includes(Number(log.bristol_type))) score -= 5;
      if (["black", "red", "pale"].includes(log.color)) score -= 8;
      if (log.flags?.length) score -= 20;
      score += Number(log.hydration) - 3 + Number(log.fiber) - 3 + Number(log.comfort) - 3;
      score -= Math.max(0, Number(log.stress) - 3);
    });
    score = Math.max(0, Math.min(100, score));
    headline = latest.flags?.length ? "Your gut is asking for backup" : [3, 4].includes(Number(latest.bristol_type)) ? "Your latest log is in the smooth zone" : Number(latest.bristol_type) <= 2 ? "Your latest log leaned hard" : Number(latest.bristol_type) >= 6 ? "Your latest log leaned loose" : "Your gut is giving usable data";
    summary = `Latest report: type ${latest.bristol_type} (${latest.bristol_label}), ${latest.color} color, ${latest.amount} amount, urgency ${latest.urgency}/5.`;
    nextStep = latest.flags?.length ? "Red flags beat experiments. Consider contacting a medical professional, especially for blood, tarry black stool, severe pain, fever, or dehydration." : "Try one small controlled experiment for the next 24 hours: hydration, fiber, movement, or stress reduction. Change one variable at a time.";
  }

  return {
    totals: {
      log_count: logs.length,
      week_count: logs.filter((log) => new Date(log.logged_at).getTime() >= weekAgo).length,
      avg_bristol: avg(logs, "bristol_type").toFixed(1).replace(".0", ""),
      avg_comfort: avg(logs, "comfort").toFixed(1).replace(".0", ""),
    },
    gut_score: { score, headline, summary, next_step: nextStep },
    patterns: buildLocalPatterns(recent),
    logs: logs.slice(0, 20),
    community: community.slice(0, 12),
  };
}

function buildLocalPatterns(recent) {
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

function renderSummary(data) {
  gutScoreEl.textContent = String(data.gut_score.score);
  gutHeadlineEl.textContent = data.gut_score.headline;
  gutSummaryEl.textContent = data.gut_score.summary;
  nextStepEl.textContent = data.gut_score.next_step;
  logCountEl.textContent = String(data.totals.log_count);
  weekCountEl.textContent = String(data.totals.week_count);
  avgBristolEl.textContent = String(data.totals.avg_bristol);
  avgComfortEl.textContent = String(data.totals.avg_comfort);
  renderPatterns(data.patterns);
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

resetButtonEl.addEventListener("click", async () => {
  if (!window.confirm("Reset all local Gutty demo data?")) return;
  await apiRequest("/api/reset", {});
  writeStorage(LOG_STORAGE_KEY, []);
  writeStorage(COMMUNITY_STORAGE_KEY, []);
  writeStorage(DONATION_STORAGE_KEY, []);
  statusEl.textContent = "Gutty data reset. Your gut gets a fresh notebook.";
  await fetchSummary();
});

logFormEl.elements.logged_at.value = localDatetimeValue();
initializeSupabaseAuth();
const user = savedSignup();
if (user) {
  unlockApp(user);
  fetchSummary();
} else {
  fetchSummary();
}
