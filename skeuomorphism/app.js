const STORAGE_KEY = "todo_skeuomorphic_v1";

const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");

let todos = loadTodos();

function loadTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item) => item && typeof item.text === "string")
      .map((item) => ({
        id: item.id || crypto.randomUUID(),
        text: item.text,
        done: Boolean(item.done),
        createdAt: Number(item.createdAt) || Date.now(),
        completedAt: item.completedAt ? Number(item.completedAt) : null,
      }));
  } catch {
    return [];
  }
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function sortTodos() {
  todos.sort((a, b) => {
    if (a.done !== b.done) return a.done - b.done;

    if (!a.done && !b.done) {
      return a.createdAt - b.createdAt;
    }

    return (a.completedAt || 0) - (b.completedAt || 0);
  });
}

function renderTodos() {
  sortTodos();

  if (todos.length === 0) {
    list.innerHTML = '<li class="empty-state">No todos yet. Add one above.</li>';
    return;
  }

  const items = todos
    .map(
      (todo) => `
        <li class="todo-item ${todo.done ? "done" : ""}" data-id="${todo.id}">
          <input
            class="todo-toggle"
            type="checkbox"
            ${todo.done ? "checked" : ""}
            aria-label="Mark ${escapeHtml(todo.text)} as done"
          />
          <span class="todo-text">${escapeHtml(todo.text)}</span>
        </li>
      `,
    )
    .join("");

  list.innerHTML = items;
}

function addTodo(text) {
  const normalized = text.trim();
  if (!normalized) return;

  todos.push({
    id: crypto.randomUUID(),
    text: normalized,
    done: false,
    createdAt: Date.now(),
    completedAt: null,
  });

  saveTodos();
  renderTodos();
}

function toggleTodo(id) {
  todos = todos.map((todo) => {
    if (todo.id !== id) return todo;

    const nextDone = !todo.done;
    return {
      ...todo,
      done: nextDone,
      completedAt: nextDone ? Date.now() : null,
    };
  });

  saveTodos();
  renderTodos();
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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

  const id = item.getAttribute("data-id");
  if (!id) return;

  toggleTodo(id);
});

renderTodos();
