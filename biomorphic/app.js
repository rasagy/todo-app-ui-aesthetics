(() => {
  "use strict";

  const STORAGE_KEY = "biomorphic_todo_items_v1";

  const form = document.getElementById("todo-form");
  const input = document.getElementById("todo-input");
  const list = document.getElementById("todo-list");
  const emptyState = document.getElementById("empty-state");
  const storageNote = document.getElementById("storage-note");

  const state = {
    todos: loadTodos(),
    storageAvailable: true,
  };

  function isValidTodoItem(item) {
    return (
      item &&
      typeof item.id === "string" &&
      typeof item.text === "string" &&
      item.text.trim().length > 0 &&
      typeof item.completed === "boolean" &&
      typeof item.createdAt === "number" &&
      (typeof item.completedAt === "number" || item.completedAt === null)
    );
  }

  function loadTodos() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.filter(isValidTodoItem).map((todo) => ({
        id: todo.id,
        text: todo.text.trim(),
        completed: todo.completed,
        createdAt: todo.createdAt,
        completedAt: todo.completedAt,
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

  function sortTodos(todos) {
    return [...todos].sort((a, b) => {
      if (a.completed !== b.completed) {
        return Number(a.completed) - Number(b.completed);
      }

      if (!a.completed) {
        return a.createdAt - b.createdAt;
      }

      const aCompletedAt = a.completedAt ?? Number.MAX_SAFE_INTEGER;
      const bCompletedAt = b.completedAt ?? Number.MAX_SAFE_INTEGER;
      return aCompletedAt - bCompletedAt;
    });
  }

  function setStatusVisibility() {
    emptyState.hidden = state.todos.length > 0;
    storageNote.hidden = state.storageAvailable;
  }

  function render() {
    state.todos = sortTodos(state.todos);
    list.textContent = "";

    const fragment = document.createDocumentFragment();

    for (const todo of state.todos) {
      const item = document.createElement("li");
      item.className = todo.completed ? "todo-item completed" : "todo-item";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = todo.completed;
      checkbox.dataset.todoId = todo.id;
      checkbox.setAttribute("aria-label", `Mark ${todo.text} as done`);

      const text = document.createElement("span");
      text.className = "todo-text";
      text.textContent = todo.text;

      item.append(checkbox, text);
      fragment.append(item);
    }

    list.append(fragment);
    setStatusVisibility();
  }

  function addTodoFromInput() {
    const text = input.value.trim();
    if (!text) {
      return;
    }

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
    if (!(target instanceof HTMLInputElement) || target.type !== "checkbox") {
      return;
    }

    const { todoId } = target.dataset;
    if (!todoId) {
      return;
    }

    const todo = state.todos.find((item) => item.id === todoId);
    if (!todo) {
      return;
    }

    todo.completed = target.checked;
    todo.completedAt = target.checked ? Date.now() : null;

    saveTodos();
    render();
  });

  render();
})();
