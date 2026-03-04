import React, { useMemo, useState } from "https://esm.sh/react@18.2.0";
import { createRoot } from "https://esm.sh/react-dom@18.2.0/client";
import htm from "https://esm.sh/htm@3.1.1";
import { ThemeProvider, createGlobalStyle } from "https://esm.sh/styled-components@5.3.11?deps=react@18.2.0,react-dom@18.2.0";
import {
  styleReset,
  Window,
  WindowHeader,
  WindowContent,
  Button,
  TextInput,
} from "https://esm.sh/react95@3.0.0-beta.27?deps=react@18.2.0,react-dom@18.2.0,styled-components@5.3.11";
import original from "https://esm.sh/react95@3.0.0-beta.27/dist/themes/original?deps=react@18.2.0,react-dom@18.2.0,styled-components@5.3.11";
import msSansSerif from "https://esm.sh/react95@3.0.0-beta.27/dist/fonts/MS-Sans-Serif.woff2";

const html = htm.bind(React.createElement);

const STORAGE_KEY = "win95_todos_v1";

const GlobalStyles = createGlobalStyle`
  ${styleReset}

  @font-face {
    font-family: "MS-Sans-Serif";
    src: url(${msSansSerif}) format("woff2");
    font-style: normal;
    font-weight: 400;
  }

  body {
    margin: 0;
    font-family: "MS-Sans-Serif", "MS Sans Serif", "Segoe UI", Tahoma, sans-serif;
  }
`;

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

function saveTodos(todos) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    return true;
  } catch (error) {
    console.warn("Could not save todos to localStorage.", error);
    return false;
  }
}

function sortTodos(todos) {
  return [...todos].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
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

function App() {
  const [todos, setTodos] = useState(() => loadTodos());
  const [inputValue, setInputValue] = useState("");
  const [storageWarning, setStorageWarning] = useState("");

  const sortedTodos = useMemo(() => sortTodos(todos), [todos]);

  function persist(nextTodos) {
    const ok = saveTodos(nextTodos);
    setStorageWarning(ok ? "" : "Could not save changes to local storage.");
  }

  function handleSubmit(event) {
    event.preventDefault();

    const text = inputValue.trim();
    if (!text) return;

    const nextTodos = [...todos, createTodo(text)];
    setTodos(nextTodos);
    persist(nextTodos);
    setInputValue("");
  }

  function handleToggle(todoId, checked) {
    setTodos((prevTodos) => {
      const nextTodos = prevTodos.map((todo) => {
        if (todo.id !== todoId) return todo;
        return {
          ...todo,
          completed: checked,
          completedAt: checked ? Date.now() : null,
        };
      });

      persist(nextTodos);
      return nextTodos;
    });
  }

  return html`
    <main className="page-shell">
      <${Window} className="todo-window">
        <${WindowHeader}>Win95 Todo<//>
        <${WindowContent}>
          <form className="todo-form" onSubmit=${handleSubmit} autoComplete="off">
            <label className="sr-only" htmlFor="todo-input">Add a todo</label>
            <${TextInput}
              id="todo-input"
              className="todo-input"
              value=${inputValue}
              placeholder="Add a todo"
              maxLength=${200}
              onChange=${(event) => setInputValue(event.target.value)}
            />
            <${Button} type="submit" className="add-button">Add<//>
          </form>

          ${storageWarning
            ? html`<p className="status-message warning" role="status">${storageWarning}</p>`
            : null}

          ${sortedTodos.length === 0
            ? html`<p className="status-message empty" role="status">No todos yet. Add one above.</p>`
            : null}

          <ul className="todo-list" aria-label="Todo items">
            ${sortedTodos.map(
              (todo) => html`
                <li
                  key=${todo.id}
                  className=${`todo-item ${todo.completed ? "completed" : ""}`}
                >
                  <label className="todo-label">
                    <input
                      className="todo-checkbox"
                      type="checkbox"
                      checked=${todo.completed}
                      onChange=${(event) =>
                        handleToggle(todo.id, event.target.checked)}
                      aria-label=${`Mark "${todo.text}" as done`}
                    />
                    <span className="todo-text">${todo.text}</span>
                  </label>
                </li>
              `
            )}
          </ul>
        <//>
      <//>
    </main>
  `;
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element '#root' not found.");
}

createRoot(rootElement).render(html`
  <${React.StrictMode}>
    <${ThemeProvider} theme=${original}>
      <${GlobalStyles} />
      <${App} />
    <//>
  <//>
`);
