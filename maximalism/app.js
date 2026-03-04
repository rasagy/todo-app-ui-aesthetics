(() => {
  "use strict";

  const STORAGE_KEY = "maximalism_todo_items_v1";

  const form = document.getElementById("todo-form");
  const input = document.getElementById("todo-input");
  const list = document.getElementById("todo-list");
  const emptyState = document.getElementById("empty-state");

  const state = {
    todos: loadTodos(),
    storageAvailable: true,
  };

  function isValidTodoItem(item) {
    return (
      item &&
      typeof item.id === "string" &&
      typeof item.text === "string" &&
      typeof item.done === "boolean" &&
      typeof item.createdAt === "number" &&
      (typeof item.doneAt === "number" || item.doneAt === null)
    );
  }

  function loadTodos() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      return parsed
        .filter(isValidTodoItem)
        .map((todo) => ({
          id: todo.id,
          text: todo.text.trim(),
          done: todo.done,
          createdAt: todo.createdAt,
          doneAt: todo.doneAt,
        }));
    } catch (error) {
      console.warn("Could not load todos from localStorage.", error);
      return [];
    }
  }

  function saveTodos() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.todos));
      state.storageAvailable = true;
    } catch (error) {
      state.storageAvailable = false;
      console.warn("Could not save todos to localStorage.", error);
    }
  }

  function sortTodos(todos) {
    return [...todos].sort((a, b) => {
      if (a.done !== b.done) {
        return Number(a.done) - Number(b.done);
      }

      if (!a.done) {
        return a.createdAt - b.createdAt;
      }

      const aDoneAt = a.doneAt ?? Number.MAX_SAFE_INTEGER;
      const bDoneAt = b.doneAt ?? Number.MAX_SAFE_INTEGER;
      return aDoneAt - bDoneAt;
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
      done: false,
      createdAt: now,
      doneAt: null,
    };
  }

  function setEmptyStateVisibility() {
    emptyState.hidden = state.todos.length > 0;
  }

  function render() {
    state.todos = sortTodos(state.todos);
    list.textContent = "";

    const fragment = document.createDocumentFragment();

    for (const todo of state.todos) {
      const item = document.createElement("li");
      item.className = todo.done ? "todo-item done" : "todo-item";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = todo.done;
      checkbox.dataset.todoId = todo.id;
      checkbox.setAttribute("aria-label", `Mark ${todo.text} as done`);

      const text = document.createElement("span");
      text.className = "todo-text";
      text.textContent = todo.text;

      item.append(checkbox, text);
      fragment.append(item);
    }

    list.append(fragment);
    setEmptyStateVisibility();
  }

  function addTodoFromInput() {
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
    addTodoFromInput();
  });

  list.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.type !== "checkbox") return;

    const { todoId } = target.dataset;
    if (!todoId) return;

    const todo = state.todos.find((item) => item.id === todoId);
    if (!todo) return;

    todo.done = target.checked;
    todo.doneAt = target.checked ? Date.now() : null;

    saveTodos();
    render();
  });

  render();
})();
