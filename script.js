// StudyFlow - gerenciamento de tarefas com LocalStorage

const STORAGE_KEY = "studyflow_tasks";
const THEME_KEY = "studyflow_theme";

const taskForm = document.getElementById("taskForm");
const taskName = document.getElementById("taskName");
const taskSubject = document.getElementById("taskSubject");
const taskDueDate = document.getElementById("taskDueDate");
const taskPriority = document.getElementById("taskPriority");
const formError = document.getElementById("formError");
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const totalTasksEl = document.getElementById("totalTasks");
const completedTasksEl = document.getElementById("completedTasks");
const weeklyGoalEl = document.getElementById("weeklyGoal");
const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");
const smartRecommendation = document.getElementById("smartRecommendation");
const themeToggle = document.getElementById("themeToggle");
const filterButtons = document.querySelectorAll(".filter-btn");

let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let currentFilter = "all";

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

function getPriorityWeight(priority) {
  return { Baixa: 1, Média: 2, Alta: 3 }[priority] || 2;
}

function getDaysRemaining(dateValue) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dateValue);
  due.setHours(0, 0, 0, 0);

  const diff = due - today;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getSmartTask() {
  const pendingTasks = tasks.filter((task) => !task.completed);
  if (!pendingTasks.length) return null;

  return pendingTasks.reduce((best, task) => {
    const bestScore = getPriorityWeight(best.priority) * 10 - getDaysRemaining(best.dueDate);
    const taskScore = getPriorityWeight(task.priority) * 10 - getDaysRemaining(task.dueDate);
    return taskScore > bestScore ? task : best;
  });
}

function validateForm() {
  const name = taskName.value.trim();
  const subject = taskSubject.value.trim();
  const dueDate = taskDueDate.value;

  if (!name || !subject || !dueDate) {
    return "Preencha todos os campos antes de adicionar a tarefa.";
  }

  if (new Date(dueDate) < new Date(new Date().setHours(0, 0, 0, 0))) {
    return "A data de entrega não pode ser no passado.";
  }

  return "";
}

function addTask(event) {
  event.preventDefault();
  const errorMessage = validateForm();

  if (errorMessage) {
    formError.textContent = errorMessage;
    return;
  }

  const newTask = {
    id: Date.now(),
    name: taskName.value.trim(),
    subject: taskSubject.value.trim(),
    dueDate: taskDueDate.value,
    priority: taskPriority.value,
    completed: false,
  };

  tasks.unshift(newTask);
  saveTasks();
  taskForm.reset();
  taskPriority.value = "Média";
  formError.textContent = "";
  renderTasks();
}

function toggleTask(id) {
  tasks = tasks.map((task) =>
    task.id === id ? { ...task, completed: !task.completed } : task
  );
  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  const card = document.querySelector(`[data-id="${id}"]`);
  if (card) {
    card.classList.add("removing");
    setTimeout(() => {
      tasks = tasks.filter((task) => task.id !== id);
      saveTasks();
      renderTasks();
    }, 250);
  }
}

function setFilter(filter) {
  currentFilter = filter;
  filterButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.filter === filter));
  renderTasks();
}

function getFilteredTasks() {
  if (currentFilter === "pending") return tasks.filter((task) => !task.completed);
  if (currentFilter === "completed") return tasks.filter((task) => task.completed);
  return tasks;
}

function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const percentage = total ? Math.round((completed / total) * 100) : 0;

  totalTasksEl.textContent = total;
  completedTasksEl.textContent = completed;
  weeklyGoalEl.textContent = `${Math.min(completed, 5)}/5`;
  progressText.textContent = `${percentage}%`;
  progressFill.style.width = `${percentage}%`;

  const smartTask = getSmartTask();
  smartRecommendation.textContent = smartTask
    ? `Faça primeiro: ${smartTask.name}`
    : "Faça primeiro: nenhuma tarefa cadastrada.";
}

function renderTasks() {
  const filteredTasks = getFilteredTasks();
  taskList.innerHTML = "";

  emptyState.style.display = filteredTasks.length ? "none" : "block";

  filteredTasks.forEach((task) => {
    const days = getDaysRemaining(task.dueDate);
    const dueLabel =
      days === 0 ? "Vence hoje" : days < 0 ? "Prazo expirado" : `${days} dia(s) restante(s)`;

    const card = document.createElement("article");
    card.className = `task-card ${task.completed ? "completed" : ""}`;
    card.dataset.id = task.id;

    card.innerHTML = `
      <div class="task-top">
        <div>
          <h3>${task.name}</h3>
          <p class="task-meta">${task.subject}</p>
        </div>
        <span class="task-pill priority-${task.priority}">${task.priority}</span>
      </div>
      <p class="task-meta">Prazo: ${task.dueDate} • ${dueLabel}</p>
      <div class="task-actions">
        <button class="task-btn task-btn--done" data-action="toggle">
          ${task.completed ? "Desmarcar" : "Concluir"}
        </button>
        <button class="task-btn task-btn--delete" data-action="delete">Excluir</button>
      </div>
    `;

    card.querySelector('[data-action="toggle"]').addEventListener("click", () => toggleTask(task.id));
    card.querySelector('[data-action="delete"]').addEventListener("click", () => deleteTask(task.id));

    taskList.appendChild(card);
  });

  updateStats();
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeToggle.textContent = theme === "dark" ? "☀️ Tema claro" : "🌙 Tema escuro";
}

function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY) || "light";
  applyTheme(savedTheme);
}

taskForm.addEventListener("submit", addTask);

filterButtons.forEach((button) => {
  button.addEventListener("click", () => setFilter(button.dataset.filter));
});

themeToggle.addEventListener("click", () => {
  const currentTheme = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  const nextTheme = currentTheme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
  saveTheme(nextTheme);
});

initTheme();
renderTasks();