const STORAGE_KEY = "todo_skeuomorphism_notes_v1";

const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");

let todos = loadTodos();
let lastCreatedAt = todos.reduce((max, todo) => Math.max(max, todo.createdAt), 0);

function generateId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `todo_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function nextCreatedAt() {
  const now = Date.now();
  lastCreatedAt = now > lastCreatedAt ? now : lastCreatedAt + 1;
  return lastCreatedAt;
}

function loadTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item) => item && typeof item.text === "string")
      .map((item) => ({
        id: typeof item.id === "string" && item.id ? item.id : generateId(),
        text: item.text.trim(),
        done: Boolean(item.done),
        createdAt: Number.isFinite(item.createdAt) ? item.createdAt : Date.now(),
      }))
      .filter((item) => item.text.length > 0);
  } catch {
    return [];
  }
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function sortTodos() {
  todos.sort((a, b) => {
    if (a.done !== b.done) return Number(a.done) - Number(b.done);
    if (a.createdAt !== b.createdAt) return a.createdAt - b.createdAt;
    return a.id.localeCompare(b.id);
  });
}

function createTodoItem(todo) {
  const item = document.createElement("li");
  item.className = `todo-item${todo.done ? " done" : ""}`;
  item.dataset.id = todo.id;

  const toggle = document.createElement("input");
  toggle.className = "todo-toggle";
  toggle.type = "checkbox";
  toggle.checked = todo.done;
  toggle.setAttribute("aria-label", `Mark "${todo.text}" as done`);

  const text = document.createElement("span");
  text.className = "todo-text";
  text.textContent = todo.text;

  item.append(toggle, text);
  return item;
}

function renderEmptyState() {
  const empty = document.createElement("li");
  empty.className = "empty-state";
  empty.textContent = "No todos yet. Add one above.";
  list.appendChild(empty);
}

function renderTodos() {
  sortTodos();
  list.textContent = "";

  if (todos.length === 0) {
    renderEmptyState();
    return;
  }

  const fragment = document.createDocumentFragment();
  todos.forEach((todo) => {
    fragment.appendChild(createTodoItem(todo));
  });
  list.appendChild(fragment);
}

function addTodo(text) {
  const normalized = text.trim();
  if (!normalized) return;

  todos.push({
    id: generateId(),
    text: normalized,
    done: false,
    createdAt: nextCreatedAt(),
  });

  saveTodos();
  renderTodos();
}

function toggleTodo(id) {
  todos = todos.map((todo) => {
    if (todo.id !== id) return todo;
    return { ...todo, done: !todo.done };
  });

  saveTodos();
  renderTodos();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  addTodo(input.value);
  form.reset();
  input.focus();
});

list.addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement) || !target.classList.contains("todo-toggle")) return;

  const item = target.closest(".todo-item");
  if (!item) return;

  const { id } = item.dataset;
  if (!id) return;

  toggleTodo(id);
});

renderTodos();
