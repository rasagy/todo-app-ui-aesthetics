const STORAGE_KEY = "neumorphism-todos-v1";

const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");

let todos = loadTodos();

renderTodos();

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();

  if (!text) return;

  todos.push({
    id: crypto.randomUUID(),
    text,
    done: false,
    createdAt: Date.now(),
    completedAt: null,
  });

  persistTodos();
  renderTodos();
  form.reset();
  input.focus();
});

list.addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement) || target.type !== "checkbox") return;

  const todoId = target.dataset.todoId;
  const todo = todos.find((item) => item.id === todoId);
  if (!todo) return;

  todo.done = target.checked;
  todo.completedAt = target.checked ? Date.now() : null;

  persistTodos();
  renderTodos();
});

function loadTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (todo) =>
        todo &&
        typeof todo.id === "string" &&
        typeof todo.text === "string" &&
        typeof todo.done === "boolean"
    );
  } catch {
    return [];
  }
}

function persistTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function sortTodos(items) {
  return [...items].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;

    if (!a.done) {
      return (a.createdAt || 0) - (b.createdAt || 0);
    }

    return (a.completedAt || 0) - (b.completedAt || 0);
  });
}

function renderTodos() {
  list.innerHTML = "";
  const orderedTodos = sortTodos(todos);

  if (orderedTodos.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = "No todos yet. Add one above.";
    list.appendChild(empty);
    return;
  }

  orderedTodos.forEach((todo, index) => {
    const item = document.createElement("li");
    item.className = `todo-item${todo.done ? " is-done" : ""}`;
    item.style.setProperty("--index", String(index));

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.done;
    checkbox.dataset.todoId = todo.id;
    checkbox.setAttribute("aria-label", `Mark "${todo.text}" as done`);

    const text = document.createElement("p");
    text.className = "todo-text";
    text.textContent = todo.text;

    item.append(checkbox, text);
    list.appendChild(item);
  });
}
