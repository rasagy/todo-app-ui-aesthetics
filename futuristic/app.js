const STORAGE_KEY = "futuristic-todo-items-v1";

const state = {
  todos: [],
};

const formEl = document.getElementById("todo-form");
const inputEl = document.getElementById("todo-input");
const listEl = document.getElementById("todo-list");
const emptyStateEl = document.getElementById("empty-state");

init();

function init() {
  state.todos = loadTodos();
  render();
  formEl.addEventListener("submit", handleSubmit);
}

function handleSubmit(event) {
  event.preventDefault();

  const text = inputEl.value.trim();
  if (!text) return;

  state.todos.push({
    id: createId(),
    text,
    completed: false,
    createdAt: Date.now(),
    completedAt: null,
  });

  saveTodos();
  inputEl.value = "";
  inputEl.focus();
  render();
}

function handleToggle(todoId, isCompleted) {
  state.todos = state.todos.map((todo) => {
    if (todo.id !== todoId) return todo;
    return {
      ...todo,
      completed: isCompleted,
      completedAt: isCompleted ? Date.now() : null,
    };
  });

  saveTodos();
  render();
}

function render() {
  const sortedTodos = getSortedTodos(state.todos);
  listEl.innerHTML = "";

  emptyStateEl.hidden = sortedTodos.length > 0;

  for (const todo of sortedTodos) {
    const item = document.createElement("li");
    item.className = `todo-item${todo.completed ? " is-done" : ""}`;
    item.dataset.id = todo.id;

    const checkbox = document.createElement("input");
    checkbox.className = "todo-checkbox";
    checkbox.type = "checkbox";
    checkbox.checked = todo.completed;
    checkbox.setAttribute("aria-label", `Mark "${todo.text}" as done`);
    checkbox.addEventListener("change", (event) => {
      handleToggle(todo.id, event.target.checked);
    });

    const text = document.createElement("span");
    text.className = "todo-text";
    text.textContent = todo.text;

    item.append(checkbox, text);
    listEl.append(item);
  }
}

function getSortedTodos(todos) {
  return [...todos].sort((a, b) => {
    if (a.completed !== b.completed) {
      return Number(a.completed) - Number(b.completed);
    }

    if (!a.completed) {
      return a.createdAt - b.createdAt;
    }

    return (a.completedAt || 0) - (b.completedAt || 0);
  });
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.todos));
}

function loadTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isValidTodo);
  } catch {
    return [];
  }
}

function isValidTodo(todo) {
  return (
    todo &&
    typeof todo.id === "string" &&
    typeof todo.text === "string" &&
    typeof todo.completed === "boolean" &&
    typeof todo.createdAt === "number"
  );
}

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
