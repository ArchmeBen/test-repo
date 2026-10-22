// Mock taskboard: seed data plus localStorage persistence, no backend.
const STORAGE_KEY = "taskboard.tasks";

const SEED_TASKS = [
  { id: 1, title: "Set up project repo", priority: "high", done: true, assignee: "Alex" },
  { id: 2, title: "Design landing page mockup", priority: "medium", done: false, assignee: "Sam" },
  { id: 3, title: "Write API spec draft", priority: "high", done: false, assignee: "Jordan" },
  { id: 4, title: "Pick a color palette", priority: "low", done: true, assignee: "Sam" },
  { id: 5, title: "Schedule user interviews", priority: "medium", done: false, assignee: "Alex" },
];

let tasks = load();
let filter = "all";

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved)) return saved;
  } catch {}
  return structuredClone(SEED_TASKS);
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {}
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
      task.done = checkbox.checked;
      update();
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
      tasks = tasks.filter((t) => t.id !== task.id);
      update();
    });

    li.append(checkbox, title, meta, del);
    list.append(li);
  }
}

function update() {
  save();
  renderStats();
  renderTasks();
}

document.getElementById("new-task").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = document.getElementById("title");
  const title = input.value.trim();
  if (!title) return;
  tasks.unshift({
    id: Date.now(),
    title,
    priority: document.getElementById("priority").value,
    done: false,
    assignee: "You",
  });
  input.value = "";
  update();
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

update();
