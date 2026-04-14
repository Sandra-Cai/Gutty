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
const logFormEl = document.getElementById("logForm");
const communityFormEl = document.getElementById("communityForm");
const resetButtonEl = document.getElementById("resetButton");

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

function collectFlags(form) {
  return Array.from(form.querySelectorAll('input[name="flags"]:checked')).map((input) => input.value);
}

function renderPatterns(patterns) {
  patternListEl.innerHTML = "";
  patterns.forEach((pattern) => {
    const item = document.createElement("article");
    item.className = `pattern-card ${pattern.tone}`;
    item.innerHTML = `
      <h3>${escapeHtml(pattern.title)}</h3>
      <p>${escapeHtml(pattern.detail)}</p>
    `;
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
    const flags = log.flags.length
      ? `<span class="flag-chip">Red flags: ${escapeHtml(log.flags.join(", "))}</span>`
      : "";
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
  const response = await fetch("/api/summary");
  const data = await response.json();
  renderSummary(data);
}

logFormEl.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(logFormEl);
  const payload = Object.fromEntries(formData.entries());
  payload.logged_at = payload.logged_at ? new Date(payload.logged_at).toISOString() : new Date().toISOString();
  payload.bristol_type = Number(payload.bristol_type);
  payload.urgency = Number(payload.urgency);
  payload.comfort = Number(payload.comfort);
  payload.hydration = Number(payload.hydration);
  payload.fiber = Number(payload.fiber);
  payload.stress = Number(payload.stress);
  payload.flags = collectFlags(logFormEl);

  const response = await fetch("/api/logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    statusEl.textContent = data.error || "Could not save that poop situation.";
    return;
  }

  logFormEl.reset();
  logFormEl.elements.logged_at.value = localDatetimeValue();
  logFormEl.elements.bristol_type.value = "4";
  logFormEl.elements.color.value = "brown";
  logFormEl.elements.amount.value = "medium";
  statusEl.textContent = `Logged poop situation #${data.id}. Analysis refreshed.`;
  await fetchSummary();
});

communityFormEl.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(communityFormEl);
  const payload = Object.fromEntries(formData.entries());

  const response = await fetch("/api/community", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    statusEl.textContent = data.error || "Could not publish the community note.";
    return;
  }

  communityFormEl.reset();
  statusEl.textContent = `Published local community note #${data.id}.`;
  await fetchSummary();
});

resetButtonEl.addEventListener("click", async () => {
  const confirmed = window.confirm("Reset all local Gutty demo data?");
  if (!confirmed) {
    return;
  }
  const response = await fetch("/api/reset", { method: "POST" });
  const data = await response.json();
  statusEl.textContent = data.message || "Reset complete.";
  await fetchSummary();
});

logFormEl.elements.logged_at.value = localDatetimeValue();
fetchSummary().catch(() => {
  statusEl.textContent = "Could not load Gutty.";
});
