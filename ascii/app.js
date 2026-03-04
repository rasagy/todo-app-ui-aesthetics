(() => {
  "use strict";

  const STORAGE_KEY = "ascii_todo_items_v1";

  const form = document.getElementById("todo-form");
  const input = document.getElementById("todo-input");
  const list = document.getElementById("todo-list");
  const emptyState = document.getElementById("empty-state");

  const state = {
    todos: loadTodos(),
  };

  function isValidTodo(item) {
    return (
      item &&
      typeof item.id === "string" &&
      typeof item.text === "string" &&
      typeof item.completed === "boolean" &&
      typeof item.createdAt === "number" &&
      (typeof item.completedAt === "number" || item.completedAt === null)
    );
  }

  function loadTodos() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      return parsed
        .filter(isValidTodo)
        .map((todo) => ({
          id: todo.id,
          text: todo.text.trim(),
          completed: todo.completed,
          createdAt: todo.createdAt,
          completedAt: todo.completedAt,
        }))
        .filter((todo) => todo.text.length > 0);
    } catch (error) {
      console.warn("Could not load todos from localStorage.", error);
      return [];
    }
  }

  function saveTodos() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.todos));
    } catch (error) {
      console.warn("Could not save todos to localStorage.", error);
    }
  }

  function sortTodos(todos) {
    return [...todos].sort((a, b) => {
      if (a.completed !== b.completed) {
        return Number(a.completed) - Number(b.completed);
      }

      if (!a.completed) {
        return a.createdAt - b.createdAt;
      }

      return (a.completedAt ?? Number.MAX_SAFE_INTEGER) - (b.completedAt ?? Number.MAX_SAFE_INTEGER);
    });
  }

  function createTodo(text) {
    const now = Date.now();
    const id =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${now}-${Math.random().toString(16).slice(2)}`;

    return {
      id,
      text,
      completed: false,
      createdAt: now,
      completedAt: null,
    };
  }

  function setEmptyState() {
    emptyState.hidden = state.todos.length > 0;
  }

  function render() {
    state.todos = sortTodos(state.todos);
    list.textContent = "";

    const fragment = document.createDocumentFragment();

    for (const todo of state.todos) {
      const item = document.createElement("li");
      item.className = todo.completed ? "todo-item completed" : "todo-item";

      const label = document.createElement("label");
      label.className = "todo-toggle";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = todo.completed;
      checkbox.dataset.todoId = todo.id;
      checkbox.setAttribute("aria-label", `mark ${todo.text} as done`);

      const mark = document.createElement("span");
      mark.className = "todo-mark";
      mark.setAttribute("aria-hidden", "true");

      const text = document.createElement("span");
      text.className = "todo-text";
      text.textContent = todo.text;

      label.append(checkbox, mark, text);
      item.append(label);
      fragment.append(item);
    }

    list.append(fragment);
    setEmptyState();
  }

  function addTodo() {
    const text = input.value.trim();
    if (!text) return;

    state.todos.push(createTodo(text));
    saveTodos();
    render();

    input.value = "";
    input.focus();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    addTodo();
  });

  list.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.type !== "checkbox") return;

    const { todoId } = target.dataset;
    if (!todoId) return;

    const todo = state.todos.find((item) => item.id === todoId);
    if (!todo) return;

    todo.completed = target.checked;
    todo.completedAt = target.checked ? Date.now() : null;

    saveTodos();
    render();
  });

  render();
})();
