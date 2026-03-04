(() => {
  "use strict";

  const STORAGE_KEY = "shadcn_todo_items_v1";
  const MAX_TODO_LENGTH = 200;

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
      item.text.trim().length > 0 &&
      item.text.trim().length <= MAX_TODO_LENGTH &&
      typeof item.completed === "boolean" &&
      typeof item.createdAt === "number" &&
      (typeof item.completedAt === "number" || item.completedAt === null)
    );
  }

  function normalizeTodoItem(item) {
    return {
      id: item.id,
      text: item.text.trim(),
      completed: item.completed,
      createdAt: item.createdAt,
      completedAt: item.completedAt,
    };
  }

  function loadTodos() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      return parsed.filter(isValidTodoItem).map(normalizeTodoItem);
    } catch (error) {
      console.warn("Could not read todos from localStorage.", error);
      return [];
    }
  }

  function saveTodos(todos) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
      state.storageAvailable = true;
      return true;
    } catch (error) {
      state.storageAvailable = false;
      console.warn("Could not save todos to localStorage.", error);
      return false;
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

  function setStatusMessage() {
    if (!state.storageAvailable) {
      emptyState.textContent = "Changes could not be saved locally. Check browser storage settings.";
      emptyState.hidden = false;
      return;
    }

    if (state.todos.length === 0) {
      emptyState.textContent = "No todos yet. Add one above.";
      emptyState.hidden = false;
      return;
    }

    emptyState.hidden = true;
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
      checkbox.className = "todo-checkbox";
      checkbox.checked = todo.completed;
      checkbox.dataset.todoId = todo.id;
      checkbox.setAttribute(
        "aria-label",
        todo.completed ? `Mark "${todo.text}" as open` : `Mark "${todo.text}" as done`
      );

      const text = document.createElement("p");
      text.className = "todo-text";
      text.textContent = todo.text;

      item.append(checkbox, text);
      fragment.append(item);
    }

    list.append(fragment);
    setStatusMessage();
  }

  function addTodoFromInput() {
    const text = input.value.trim();
    if (!text) return;

    state.todos.push(createTodo(text));
    saveTodos(state.todos);
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
    if (!(target instanceof HTMLInputElement) || target.type !== "checkbox") return;

    const { todoId } = target.dataset;
    if (!todoId) return;

    const todo = state.todos.find((item) => item.id === todoId);
    if (!todo) return;

    todo.completed = target.checked;
    todo.completedAt = target.checked ? Date.now() : null;

    saveTodos(state.todos);
    render();
  });

  render();
})();
