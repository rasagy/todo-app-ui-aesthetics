const STORAGE_KEY = "swiss_todos_v1";

const inputEl = document.getElementById("todo-input");
const addBtnEl = document.getElementById("add-btn");
const listEl = document.getElementById("todo-list");
const emptyStateEl = document.getElementById("empty-state");

let todos = loadTodos();
render();

addBtnEl.addEventListener("click", addTodoFromInput);
inputEl.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    addTodoFromInput();
  }
});

function loadTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item) => item && typeof item.text === "string")
      .map((item) => ({
        id: typeof item.id === "number" ? item.id : Date.now() + Math.random(),
        text: item.text.trim(),
        done: Boolean(item.done),
        createdAt:
          typeof item.createdAt === "number" ? item.createdAt : Date.now(),
      }))
      .filter((item) => item.text.length > 0);
  } catch {
    return [];
  }
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function addTodoFromInput() {
  const text = inputEl.value.trim();
  if (!text) {
    inputEl.focus();
    return;
  }

  todos.push({
    id: Date.now() + Math.random(),
    text,
    done: false,
    createdAt: Date.now(),
  });

  inputEl.value = "";
  persistAndRender();
  inputEl.focus();
}

function toggleTodo(id, done) {
  todos = todos.map((todo) =>
    todo.id === id
      ? {
          ...todo,
          done,
        }
      : todo,
  );

  persistAndRender();
}

function sortedTodos() {
  return [...todos].sort((a, b) => {
    if (a.done !== b.done) {
      return a.done ? 1 : -1;
    }
    return a.createdAt - b.createdAt;
  });
}

function persistAndRender() {
  saveTodos();
  render();
}

function render() {
  const orderedTodos = sortedTodos();

  listEl.innerHTML = "";

  orderedTodos.forEach((todo) => {
    const itemEl = document.createElement("li");
    itemEl.className = `todo-item${todo.done ? " todo-item--done" : ""}`;

    const checkboxEl = document.createElement("input");
    checkboxEl.type = "checkbox";
    checkboxEl.checked = todo.done;
    checkboxEl.setAttribute("aria-label", `Mark ${todo.text} as done`);
    checkboxEl.addEventListener("change", (event) => {
      toggleTodo(todo.id, event.target.checked);
    });

    const textEl = document.createElement("p");
    textEl.className = "todo-item__text";
    textEl.textContent = todo.text;

    itemEl.append(checkboxEl, textEl);
    listEl.append(itemEl);
  });

  emptyStateEl.hidden = orderedTodos.length > 0;
}
