(() => {
  "use strict";

  const STORAGE_KEY = "material_todo_items_v1";

  const form = document.getElementById("todo-form");
  const input = document.getElementById("todo-input");
  const list = document.getElementById("todo-list");
  const emptyState = document.getElementById("empty-state");

  if (!form || !input || !list || !emptyState) {
    console.warn("Material todo app: required DOM nodes are missing.");
    return;
  }

  const state = {
    todos: loadTodos(),
    animateTodoId: null,
    storageAvailable: true,
  };

  function isValidTodoItem(item) {
    return (
      item &&
      typeof item.id === "string" &&
      typeof item.text === "string" &&
      typeof item.completed === "boolean" &&
      typeof item.createdAt === "number" &&
      (typeof item.completedAt === "number" || item.completedAt === null)
    );
  }

  function sanitizeText(text) {
    return text.replace(/\s+/g, " ").trim();
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
          text: sanitizeText(todo.text),
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
      state.storageAvailable = true;
    } catch (error) {
      state.storageAvailable = false;
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

      const aCompletedAt = a.completedAt ?? Number.MAX_SAFE_INTEGER;
      const bCompletedAt = b.completedAt ?? Number.MAX_SAFE_INTEGER;
      return aCompletedAt - bCompletedAt;
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

  function setEmptyStateVisibility() {
    emptyState.hidden = state.todos.length > 0;
  }

  function captureItemPositions() {
    const positionMap = new Map();
    const existingItems = list.querySelectorAll(".todo-item[data-todo-id]");

    for (const item of existingItems) {
      const todoId = item.dataset.todoId;
      if (!todoId) continue;
      positionMap.set(todoId, item.getBoundingClientRect());
    }

    return positionMap;
  }

  function playFlipAnimation(previousPositions) {
    const currentItems = list.querySelectorAll(".todo-item[data-todo-id]");

    for (const item of currentItems) {
      const todoId = item.dataset.todoId;
      if (!todoId) continue;

      const previousRect = previousPositions.get(todoId);
      if (!previousRect) continue;

      const currentRect = item.getBoundingClientRect();
      const deltaY = previousRect.top - currentRect.top;

      if (Math.abs(deltaY) < 1) continue;

      item.animate(
        [
          { transform: `translateY(${deltaY}px)` },
          { transform: "translateY(0)" },
        ],
        {
          duration: 280,
          easing: "cubic-bezier(0.2, 0, 0, 1)",
        }
      );
    }
  }

  function createTodoListItem(todo, shouldAnimate) {
    const item = document.createElement("li");
    item.className = todo.completed ? "todo-item completed" : "todo-item";
    item.dataset.todoId = todo.id;

    if (shouldAnimate) {
      item.classList.add("todo-enter");
    }

    const checkbox = document.createElement("md-checkbox");
    checkbox.className = "todo-checkbox";
    checkbox.checked = todo.completed;
    checkbox.dataset.todoId = todo.id;
    checkbox.setAttribute("touch-target", "wrapper");
    checkbox.setAttribute("aria-label", `Mark "${todo.text}" as done`);

    const text = document.createElement("p");
    text.className = "todo-text";
    text.textContent = todo.text;

    item.append(checkbox, text);
    return item;
  }

  function render() {
    const previousPositions = captureItemPositions();

    state.todos = sortTodos(state.todos);
    list.textContent = "";

    const fragment = document.createDocumentFragment();

    for (const todo of state.todos) {
      const shouldAnimate = state.animateTodoId === todo.id;
      const item = createTodoListItem(todo, shouldAnimate);
      fragment.append(item);
    }

    list.append(fragment);
    playFlipAnimation(previousPositions);

    state.animateTodoId = null;
    setEmptyStateVisibility();
  }

  function addTodoFromInput() {
    const raw = typeof input.value === "string" ? input.value : "";
    const text = sanitizeText(raw);
    if (!text) return;

    const todo = createTodo(text);
    state.todos.push(todo);
    state.animateTodoId = todo.id;
    saveTodos();
    render();

    if ("value" in input) {
      input.value = "";
    }
    input.focus();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    addTodoFromInput();
  });

  list.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const checkbox = target.closest("md-checkbox[data-todo-id]");
    if (!checkbox) return;

    const todoId = checkbox.dataset.todoId;
    if (!todoId) return;

    const todo = state.todos.find((item) => item.id === todoId);
    if (!todo) return;

    const isChecked = Boolean(checkbox.checked);
    todo.completed = isChecked;
    todo.completedAt = isChecked ? Date.now() : null;

    saveTodos();
    render();
  });

  render();
})();
