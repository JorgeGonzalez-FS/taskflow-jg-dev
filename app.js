const STORAGE_KEY = "jgdev-taskflow-tasks-v1";
const taskForm = document.querySelector("#taskForm");
const taskTitle = document.querySelector("#taskTitle");
const taskPriority = document.querySelector("#taskPriority");
const taskDate = document.querySelector("#taskDate");
const taskList = document.querySelector("#taskList");
const emptyState = document.querySelector("#emptyState");
const searchInput = document.querySelector("#searchInput");
let currentFilter = "all";
let tasks = loadTasks();

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function makeId() {
  return window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function openForm() {
  taskForm.classList.remove("hidden");
  taskTitle.focus();
}

function closeForm() {
  taskForm.reset();
  taskForm.classList.add("hidden");
}

document.querySelector("#showFormBtn").addEventListener("click", openForm);
document.querySelector("#emptyAddBtn").addEventListener("click", openForm);
document.querySelector("#cancelBtn").addEventListener("click", closeForm);

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = taskTitle.value.trim();
  if (!title) {
    taskTitle.focus();
    return;
  }
  tasks.unshift({
    id: makeId(),
    title,
    priority: taskPriority.value,
    dueDate: taskDate.value,
    completed: false,
    createdAt: new Date().toISOString()
  });
  saveTasks();
  closeForm();
  render();
});

document.querySelectorAll("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach((item) => item.classList.toggle("active", item === button));
    const titles = { all: "Todas las tareas", active: "Pendientes", completed: "Completadas" };
    const subtitles = { all: "Tus objetivos, organizados en un solo lugar.", active: "Lo que todavía tienes por hacer.", completed: "Todo lo que ya has conseguido." };
    document.querySelector("#listTitle").textContent = titles[currentFilter];
    document.querySelector("#listSubtitle").textContent = subtitles[currentFilter];
    render();
  });
});

searchInput.addEventListener("input", render);

taskList.addEventListener("change", (event) => {
  const checkbox = event.target.closest("[data-complete]");
  if (!checkbox) return;
  const task = tasks.find((item) => item.id === checkbox.dataset.complete);
  if (task) {
    task.completed = checkbox.checked;
    saveTasks();
    render();
  }
});

taskList.addEventListener("click", (event) => {
  const deleteButton = event.target.closest("[data-delete]");
  if (!deleteButton) return;
  const task = tasks.find((item) => item.id === deleteButton.dataset.delete);
  if (!task) return;
  if (window.confirm(`¿Eliminar la tarea "${task.title}"?`)) {
    tasks = tasks.filter((item) => item.id !== task.id);
    saveTasks();
    render();
  }
});

function formatDate(value) {
  if (!value) return "";
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("es", { day: "numeric", month: "short" }).format(date);
}

function render() {
  const completed = tasks.filter((task) => task.completed).length;
  const active = tasks.length - completed;
  document.querySelector("#allCount").textContent = tasks.length;
  document.querySelector("#activeCount").textContent = active;
  document.querySelector("#completedCount").textContent = completed;
  document.querySelector("#totalStat").textContent = tasks.length;
  document.querySelector("#pendingStat").textContent = active;
  document.querySelector("#doneStat").textContent = completed;
  const percent = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  document.querySelector("#progressText").textContent = `${percent}%`;
  document.querySelector("#progressBar").style.width = `${percent}%`;

  const query = searchInput.value.trim().toLocaleLowerCase("es");
  const filtered = tasks.filter((task) => {
    const matchesFilter = currentFilter === "all" ||
      (currentFilter === "active" && !task.completed) ||
      (currentFilter === "completed" && task.completed);
    return matchesFilter && task.title.toLocaleLowerCase("es").includes(query);
  });

  taskList.replaceChildren();
  emptyState.classList.toggle("hidden", filtered.length > 0);
  taskList.classList.toggle("hidden", filtered.length === 0);
  document.querySelector("#visibleCount").textContent = `${filtered.length} ${filtered.length === 1 ? "tarea" : "tareas"}`;

  if (tasks.length > 0 && filtered.length === 0) {
    emptyState.querySelector("h3").textContent = "No encontramos tareas";
    emptyState.querySelector("p").textContent = "Prueba otra búsqueda o cambia el filtro.";
    emptyState.querySelector("#emptyAddBtn").classList.toggle("hidden", query.length > 0 || currentFilter === "completed");
  } else {
    emptyState.querySelector("h3").textContent = "Todo empieza con una tarea";
    emptyState.querySelector("p").textContent = "Añade tu primera tarea y empieza a avanzar.";
    emptyState.querySelector("#emptyAddBtn").classList.remove("hidden");
  }

  filtered.forEach((task) => {
    const row = document.createElement("article");
    row.className = `task-row${task.completed ? " is-complete" : ""}`;
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-check";
    checkbox.checked = task.completed;
    checkbox.dataset.complete = task.id;
    checkbox.setAttribute("aria-label", `Marcar ${task.title} como completada`);
    const main = document.createElement("div");
    main.className = "task-main";
    const title = document.createElement("div");
    title.className = "task-title";
    title.textContent = task.title;
    const meta = document.createElement("div");
    meta.className = "task-meta";
    const priority = document.createElement("span");
    priority.className = `pill ${task.priority === "high" ? "priority-high" : task.priority === "low" ? "priority-low" : ""}`;
    priority.textContent = `Prioridad ${task.priority === "high" ? "alta" : task.priority === "low" ? "baja" : "normal"}`;
    meta.append(priority);
    if (task.dueDate) {
      const due = document.createElement("span");
      due.className = "pill";
      due.textContent = `Vence ${formatDate(task.dueDate)}`;
      meta.append(due);
    }
    main.append(title, meta);
    const remove = document.createElement("button");
    remove.className = "delete-button";
    remove.type = "button";
    remove.textContent = "×";
    remove.dataset.delete = task.id;
    remove.setAttribute("aria-label", `Eliminar ${task.title}`);
    row.append(checkbox, main, remove);
    taskList.append(row);
  });
}

document.querySelector("#todayLabel").textContent = new Intl.DateTimeFormat("es", {
  weekday: "short", day: "numeric", month: "short"
}).format(new Date());
render();
