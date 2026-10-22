// Mock taskboard. Uses taskboard-api when it's reachable, otherwise falls back
// to seed data plus localStorage persistence.
const STORAGE_KEY = "taskboard.tasks";
const API_TIMEOUT_MS = 2000;

// Override with ?api=http://host:port, e.g. index.html?api=http://localhost:4000
const API_BASE = (new URLSearchParams(location.search).get("api") || "http://localhost:3000").replace(/\/$/, "");

const SEED_TASKS = [
  { id: 1, title: "Set up project repo", priority: "high", done: true, assignee: "Alex" },
  { id: 2, title: "Design landing page mockup", priority: "medium", done: false, assignee: "Sam" },
  { id: 3, title: "Write API spec draft", priority: "high", done: false, assignee: "Jordan" },
  { id: 4, title: "Pick a color palette", priority: "low", done: true, assignee: "Sam" },
  { id: 5, title: "Schedule user interviews", priority: "medium", done: false, assignee: "Alex" },
];

let tasks = [];
let filter = "all";
let online = false;

async function api(path, { method = "GET", body } = {}) {
  const res = await fetch(API_BASE + path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body && JSON.stringify(body),
    signal: AbortSignal.timeout(API_TIMEOUT_MS),
  });
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({}));
    throw new Error(error || `Request failed (${res.status})`);
  }
  return res.status === 204 ? undefined : res.json();
}

function loadLocal() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved)) return saved;
  } catch {}
  return structuredClone(SEED_TASKS);
}

function saveLocal() {
  if (online) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {}
}

function setOnline(value, message) {
  online = value;
  const badge = document.getElementById("status");
  badge.textContent = online ? "api" : "local";
  badge.classList.toggle("online", online);
  badge.title = online ? `Connected to ${API_BASE}` : `Saving in this browser (${API_BASE} unreachable)`;
  showNotice(message);
}

function showNotice(message) {
  const notice = document.getElementById("notice");
  notice.textContent = message || "";
  notice.hidden = !message;
}

// Runs a change against the API, or applies it locally when offline.
// If the API call fails, switch to local mode and apply the change there.
async function mutate(remote, local) {
  if (online) {
    try {
      await remote();
      return update();
    } catch (err) {
      tasks = loadLocal();
      setOnline(false, `Lost connection to the API (${err.message}). Switched to local mode.`);
    }
  }
  local();
  update();
}

function renderStats() {
  const done = tasks.filter((t) => t.done).length;
  const stats = [
    { label: "Total", value: tasks.length },
    { label: "Open", value: tasks.length - done },
    { label: "Done", value: done },
  ];
  document.getElementById("stats").innerHTML = stats
    .map((s) => `<div class="stat"><div class="value">${s.value}</div><div class="label">${s.label}</div></div>`)
    .join("");
}

function renderTasks() {
  const list = document.getElementById("tasks");
  const visible = tasks.filter((t) =>
    filter === "all" ? true : filter === "done" ? t.done : !t.done
  );

  list.replaceChildren();
  if (visible.length === 0) {
    list.innerHTML = `<li class="empty">Nothing here.</li>`;
    return;
  }

  for (const task of visible) {
    const li = document.createElement("li");
    li.className = `task ${task.priority}${task.done ? " done" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.addEventListener("change", () => {
      const done = checkbox.checked;
      mutate(
        async () => Object.assign(task, await api(`/tasks/${task.id}`, { method: "PATCH", body: { done } })),
        () => { tasks.find((t) => t.id === task.id).done = done; }
      );
    });

    const title = document.createElement("span");
    title.className = "title";
    title.textContent = task.title;

    const meta = document.createElement("span");
    meta.className = "meta";
    meta.textContent = `${task.assignee} · ${task.priority}`;

    const del = document.createElement("button");
    del.className = "delete";
    del.title = "Delete";
    del.textContent = "✕";
    del.addEventListener("click", () => {
      const removeIt = () => { tasks = tasks.filter((t) => t.id !== task.id); };
      mutate(async () => { await api(`/tasks/${task.id}`, { method: "DELETE" }); removeIt(); }, removeIt);
    });

    li.append(checkbox, title, meta, del);
    list.append(li);
  }
}

function update() {
  saveLocal();
  renderStats();
  renderTasks();
}

document.getElementById("new-task").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = document.getElementById("title");
  const title = input.value.trim();
  if (!title) return;
  const priority = document.getElementById("priority").value;
  input.value = "";
  mutate(
    async () => tasks.unshift(await api("/tasks", { method: "POST", body: { title, priority } })),
    () => tasks.unshift({ id: Date.now(), title, priority, done: false, assignee: "You" })
  );
});

document.getElementById("filters").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-filter]");
  if (!btn) return;
  filter = btn.dataset.filter;
  for (const b of e.currentTarget.querySelectorAll("button")) {
    b.classList.toggle("active", b === btn);
  }
  renderTasks();
});

async function init() {
  try {
    tasks = await api("/tasks");
    setOnline(true);
  } catch {
    tasks = loadLocal();
    setOnline(false);
  }
  update();
}

init();
