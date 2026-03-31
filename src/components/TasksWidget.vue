<template>
  <div class="tasks-widget">
    <div class="widget-header">
      <h3>{{ $t('tasks.title', 'Tasks & Goals') }}</h3>
      <div class="header-actions">
        <button
          @click="viewMode = viewMode === 'active' ? 'history' : 'active'"
          class="btn-icon header-btn"
          :title="viewMode === 'active' ? 'View History' : 'View Active'"
        >
          <span v-html="viewMode === 'active' ? Icons.tasksHistory : Icons.tasksActive"></span>
        </button>
        <button
            v-if="viewMode === 'history'"
            @click="exportCsv"
            class="btn-icon header-btn"
            title="Export CSV"
        >
          <span v-html="Icons.tasksExport"></span>
        </button>
      </div>
    </div>

    <!-- Tasks List -->
    <div class="tasks-list">
      <div v-if="loading" class="state-message">
        {{ $t('common.loading', 'Loading...') }}
      </div>
      
      <div v-else-if="filteredTasks.length === 0" class="state-message empty-state">
        <p>{{ viewMode === 'active' ? $t('tasks.noTasks', 'No active tasks. Start by adding one!') : 'No completed tasks found.' }}</p>
      </div>
      
      <div v-for="task in filteredTasks" :key="task.id" class="task-card" :class="{ completed: task.status === 'completed' }">
        <div class="task-header">
          <div class="task-info">
            <h4 class="task-title">
                {{ task.app_name }}
                <span v-if="task.title_filter" class="filter-tag">{{ task.title_filter }}</span>
            </h4>
            <p v-if="task.description" class="task-desc">{{ task.description }}</p>
            <p class="task-date">{{ new Date(task.created_at).toLocaleDateString() }}</p>
          </div>
          <div class="task-actions">
             <span class="status-badge" :class="task.status">
               {{ task.status }}
             </span>
             <button @click="deleteTask(task.id)" class="btn-icon delete-btn" title="Delete">
               <span v-html="Icons.tasksDelete"></span>
             </button>
          </div>
        </div>
        
        <!-- Progress Bar (Only for active tasks) -->
        <div v-if="task.status === 'active'" class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: getProgress(task) + '%' }"></div>
          </div>
          <div class="progress-labels">
            <span>{{ formatDuration(taskUsage[task.id] || 0) }} / {{ formatDuration(task.goal_seconds) }}</span>
            <span>{{ getProgress(task) }}%</span>
          </div>
        </div>
        <div v-else class="completion-info">
            <span>Goal: {{ formatDuration(task.goal_seconds) }}</span>
        </div>
      </div>
    </div>

    <!-- Add Button / Form (Only in Active View) -->
    <div v-if="viewMode === 'active'" class="widget-footer">
      <button
        v-if="!showAddForm"
        @click="openAddForm"
        class="btn-primary full-width"
      >
        <span v-html="Icons.tasksAdd"></span> {{ $t('tasks.addTask', 'Add New Task') }}
      </button>

      <!-- Add Form -->
      <div v-else class="add-form">
        <div class="form-group mb-2 relative">
             <label class="input-label">{{ $t('tasks.appName', 'App Name') }}</label>
             <input 
                v-model="newTask.app_name" 
                @focus="showAppSuggestions = true"
                @blur="handleInputBlur"
                placeholder="e.g. Code.exe" 
                class="input-field"
             />
             <!-- Suggestions Dropdown -->
             <div v-if="showAppSuggestions && recentApps.length > 0" class="suggestions-list">
                 <div 
                    v-for="app in recentApps" 
                    :key="app" 
                    @mousedown="selectApp(app)"
                    class="suggestion-item"
                 >
                    {{ app }}
                 </div>
             </div>
        </div>

        <!-- Optional Website/Title Filter (shown if browser) -->
        <div v-if="isBrowser(newTask.app_name)" class="form-group mb-2">
            <label class="input-label">Website / Title Keyword</label>
            <input 
            v-model="newTask.title_filter" 
            placeholder="e.g. YouTube, GitHub" 
            class="input-field"
            />
        </div>

        <div class="form-group mb-2">
            <label class="input-label">{{ $t('tasks.description', 'Description') }}</label>
            <input 
            v-model="newTask.description" 
            placeholder="Optional" 
            class="input-field"
            />
        </div>
        
        <!-- Time Input Row -->
        <div class="form-row mb-3">
             <div class="input-wrapper flex-1">
                <label class="input-label">Hours</label>
                <input 
                v-model.number="newTask.hours" 
                type="number"
                min="0"
                class="input-field"
                />
            </div>
            <div class="input-wrapper flex-1">
                <label class="input-label">Minutes</label>
                 <input 
                v-model.number="newTask.minutes" 
                type="number"
                min="0"
                max="59"
                class="input-field"
                />
            </div>
             <div class="input-wrapper flex-1">
                <label class="input-label">Seconds</label>
                 <input 
                v-model.number="newTask.seconds" 
                type="number"
                min="0"
                max="59"
                class="input-field"
                />
            </div>
        </div>
        
        <div class="form-actions">
          <button @click="addTask" class="btn-primary flex-1">
            <span v-html="Icons.tasksCheck"></span> {{ $t('tasks.create', 'Create') }}
          </button>
          <button @click="showAddForm = false" class="btn-secondary flex-1">
            <span v-html="Icons.tasksCancel"></span> {{ $t('tasks.cancel', 'Cancel') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { Icons } from './icons/IconMap';

interface Task {
  id: number;
  app_name: string;
  description?: string;
  goal_seconds: number;
  created_at: string;
  status: string;
  title_filter?: string;
}

const tasks = ref<Task[]>([]);
const recentApps = ref<string[]>([]);
const loading = ref(false);
const showAddForm = ref(false);
const showAppSuggestions = ref(false);
const viewMode = ref<'active' | 'history'>('active');
const taskUsage = ref<Record<number, number>>({});
let pollInterval: any = null;

const newTask = ref({
  app_name: '',
  description: '',
  hours: 1,
  minutes: 0,
  seconds: 0,
  title_filter: ''
});

const BROWSERS = ['chrome', 'firefox', 'msedge', 'brave', 'vivaldi', 'opera', 'safari'];

const filteredTasks = computed(() => {
    if (viewMode.value === 'active') {
        return tasks.value.filter(t => t.status === 'active');
    } else {
        return tasks.value.filter(t => t.status !== 'active');
    }
});

function isBrowser(appName: string) {
    if (!appName) return false;
    const lower = appName.toLowerCase();
    return BROWSERS.some(b => lower.includes(b));
}

async function loadTasks() {
  loading.value = true;
  try {
    tasks.value = await invoke('get_tasks_cmd');
    await fetchAllUsages();
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

async function fetchAllUsages() {
    for (const task of tasks.value) {
        if (task.status === 'active') {
             try {
                const usage = await invoke('get_task_progress_cmd', { id: task.id }) as number;
                taskUsage.value[task.id] = usage;
             } catch(e) {
                 console.error(`Failed to get progress for task ${task.id}`, e);
             }
        }
    }
}

async function loadRecentApps() {
    try {
        recentApps.value = await invoke('get_recent_apps_cmd');
    } catch(e) {
        console.error("Failed to load apps", e);
    }
}

function openAddForm() {
    showAddForm.value = true;
    loadRecentApps();
}

function handleInputBlur() {
    // Moved from inline to function to avoid template errors
    setTimeout(() => {
        showAppSuggestions.value = false;
    }, 200);
}

function selectApp(app: string) {
    newTask.value.app_name = app;
    showAppSuggestions.value = false;
}

async function addTask() {
  if (!newTask.value.app_name) return;
  
  const totalSeconds = (newTask.value.hours * 3600) + (newTask.value.minutes * 60) + newTask.value.seconds;
  if (totalSeconds <= 0) {
      alert("Please set a goal time.");
      return;
  }

  try {
    await invoke('create_task_cmd', {
      appName: newTask.value.app_name,
      description: newTask.value.description || null,
      goalSeconds: totalSeconds,
      titleFilter: newTask.value.title_filter || null
    });
    showAddForm.value = false;
    newTask.value = { app_name: '', description: '', hours: 1, minutes: 0, seconds: 0, title_filter: '' };
    await loadTasks();
  } catch (e) {
    console.error(e);
  }
}

async function deleteTask(id: number) {
    if(!confirm('Delete this task?')) return;
    try {
        await invoke('delete_task_cmd', { id });
        await loadTasks();
    } catch(e) {
        console.error(e);
    }
}

function exportCsv() {
    const tableStyle = `
        <style>
            table {
                border-collapse: collapse;
                width: 100%;
                font-family: 'Segoe UI', Arial, sans-serif;
                font-size: 14px;
            }
            th {
                background-color: #1e293b;
                color: #f8fafc;
                text-align: left;
                padding: 12px 16px;
                font-weight: 600;
                border: 1px solid #334155;
            }
            td {
                padding: 10px 16px;
                border: 1px solid #334155;
                color: #e2e8f0;
                background-color: #0f172a;
            }
            .status-active { color: #60a5fa; font-weight: bold; }
            .status-completed { color: #4ade80; font-weight: bold; background-color: rgba(34, 197, 94, 0.1); }
            .status-failed { color: #f87171; font-weight: bold; }
            tr:hover td { background-color: #1e293b; }
        </style>
    `;

    const headers = `
        <tr>
            <th>ID</th>
            <th>App</th>
            <th>Target App/Site</th>
            <th>Description</th>
            <th>Goal (h)</th>
            <th>Created At</th>
            <th>Status</th>
        </tr>
    `;

    const rows = filteredTasks.value.map(t => `
        <tr>
            <td>${t.id}</td>
            <td>${t.app_name}</td>
            <td>${t.title_filter || 'Any'}</td>
            <td>${t.description || ''}</td>
            <td>${(t.goal_seconds / 3600).toFixed(2)}</td>
            <td>${new Date(t.created_at).toLocaleString()}</td>
            <td class="status-${t.status.toLowerCase()}">${t.status}</td>
        </tr>
    `).join('');

    const htmlContent = `
        <html>
        <head>
            <meta charset="utf-8">
            <title>TimiGS Tasks Report</title>
            ${tableStyle}
        </head>
        <body style="background-color: #0f172a; color: white;">
            <h2 style="font-family: sans-serif; padding: 20px;">TimiGS Tasks & Goals Report</h2>
            <table>
                <thead>${headers}</thead>
                <tbody>${rows}</tbody>
            </table>
        </body>
        </html>
    `;
    
    // We export as .xls Extension so Excel opens it with the rich HTML rendering enabled automatically
    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'TimiGS_Tasks_Report.xls');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function getProgress(task: Task) {
    // Placeholder until we implement backend fetching
    // Ideally: (current / goal) * 100
    const current = taskUsage.value[task.id] || 0;
    if (task.goal_seconds === 0) return 0;
    return Math.min(100, Math.round((current / task.goal_seconds) * 100));
}

function formatDuration(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

onMounted(async () => {
  loadTasks();
  // Poll for updates (though without backend command it wont update much yet)
  pollInterval = setInterval(loadTasks, 60000);
  
  // Listen for task completion events
  await listen('task-completed', (event: any) => {
    console.log('Task completed:', event.payload);
    loadTasks(); // Reload tasks to show updated status
  });
});

onUnmounted(() => {
    if (pollInterval) clearInterval(pollInterval);
});

// We need to expose a command to get usage! 
// I will add 'get_task_progress' to backend in next step.
</script>

<style scoped>
.tasks-widget {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 20px;
}

.widget-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.widget-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-primary);
    background: #60a5fa;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.header-actions {
    display: flex;
    gap: 8px;
}

.header-btn {
    font-size: 1.1rem;
    padding: 8px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    color: var(--text-muted);
}

.header-btn svg {
    width: 18px;
    height: 18px;
}

.header-btn:hover { 
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-primary);
    transform: translateY(-2px);
}

.tasks-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 4px;
  padding-bottom: 8px;
}

.tasks-list::-webkit-scrollbar {
  width: 6px;
}

.tasks-list::-webkit-scrollbar-track {
  background: transparent;
}

.tasks-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.state-message {
  text-align: center;
  color: var(--text-muted);
  font-size: 0.9rem;
  padding: 40px 0;
}

.empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 200px;
}

.task-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 16px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.task-card::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: #3b82f6;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.task-card.completed::before {
  background: #22c55e;
}

.task-card:hover {
    border-color: rgba(96, 165, 250, 0.3);
    transform: translateX(4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    background: rgba(255, 255, 255, 0.05);
}

.task-card:hover::before {
  opacity: 1;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 14px;
}

.task-info {
    flex: 1;
    min-width: 0;
}

.task-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-tag {
    font-size: 0.65rem;
    background: rgba(59, 130, 246, 0.15);
    color: #60a5fa;
    padding: 2px 8px;
    border-radius: 6px;
    font-weight: 600;
    border: 1px solid rgba(59, 130, 246, 0.2);
}

.task-desc {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin: 4px 0 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-date {
    font-size: 0.7rem;
    color: var(--text-muted);
    opacity: 0.6;
    margin-top: 6px;
}

.task-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.status-badge {
  font-size: 0.65rem;
  padding: 3px 10px;
  border-radius: 20px;
  text-transform: capitalize;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.status-badge.active {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.status-badge.completed {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.delete-btn {
  color: var(--text-muted);
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-btn svg {
  width: 18px;
  height: 18px;
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  transform: scale(1.1);
}

/* Progress Bar */
.progress-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
}

.progress-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
}

.progress-fill {
  height: 100%;
  background: #3b82f6;
  border-radius: 4px;
  transition: width 0.5s ease;
  position: relative;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
}

.progress-fill::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.2);
  animation: shimmer 2s ease-in-out infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 500;
}

.progress-labels span:last-child {
  color: #60a5fa;
  font-weight: 700;
}

.completion-info {
    font-size: 0.8rem;
    color: var(--text-muted);
    text-align: right;
    padding-top: 8px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    margin-top: 8px;
}

.completion-info span {
  background: rgba(34, 197, 94, 0.08);
  padding: 4px 10px;
  border-radius: 8px;
  color: #4ade80;
  font-weight: 600;
}

/* Footer / Form */
.widget-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 16px;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-primary svg {
  width: 18px;
  height: 18px;
}

.btn-primary:hover {
  background: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.btn-secondary {
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-muted);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 12px 20px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-weight: 600;
}

.btn-secondary svg {
    width: 18px;
    height: 18px;
}

.btn-secondary:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-primary);
    border-color: rgba(255, 255, 255, 0.2);
}

.full-width {
  width: 100%;
}

.add-form {
  background: rgba(255, 255, 255, 0.03);
  padding: 16px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.form-group {
    margin-bottom: 12px;
}

.mb-2 { margin-bottom: 12px; }
.mb-3 { margin-bottom: 16px; }

.input-label {
    display: block;
    font-size: 0.8rem;
    color: var(--text-muted);
    margin-bottom: 6px;
    font-weight: 500;
}

.input-field {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 10px 14px;
  color: var(--text-primary);
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.input-field:focus {
  outline: none;
  border-color: #60a5fa;
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.relative { position: relative; }

.suggestions-list {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: rgba(15, 23, 42, 0.98);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0 0 10px 10px;
    max-height: 150px;
    overflow-y: auto;
    z-index: 10;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    margin-top: 4px;
}

.suggestion-item {
    padding: 10px 14px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.15s ease;
    color: var(--text-muted);
}

.suggestion-item:hover {
    background: rgba(59, 130, 246, 0.15);
    color: #60a5fa;
}

.form-row {
    display: flex;
    gap: 12px;
}

.input-wrapper {
    position: relative;
    display: flex;
    flex-direction: column;
}

.flex-1 {
    flex: 1;
}

.form-actions {
  display: flex;
  gap: 10px;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .widget-header h3 {
    font-size: 1.1rem;
  }
  
  .task-card {
    padding: 12px;
  }
  
  .task-header {
    flex-direction: column;
    gap: 10px;
  }
  
  .task-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .task-title {
    font-size: 0.9rem;
  }
  
  .filter-tag {
    font-size: 0.6rem;
    padding: 1px 5px;
  }
  
  .form-row {
    flex-direction: column;
    gap: 10px;
  }
  
  .input-wrapper {
    width: 100%;
  }
  
  .input-field {
    padding: 9px 12px;
    font-size: 0.85rem;
  }
  
  .btn-primary,
  .btn-secondary {
    padding: 10px 16px;
    font-size: 0.9rem;
  }
  
  .progress-bar {
    height: 6px;
  }
  
  .progress-labels {
    font-size: 0.7rem;
  }
}

@media (max-width: 480px) {
  .tasks-widget {
    gap: 12px;
  }
  
  .widget-header {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .header-actions {
    margin-left: auto;
  }
  
  .task-card {
    padding: 10px;
    border-radius: 12px;
  }
  
  .task-title {
    font-size: 0.85rem;
  }
  
  .task-desc {
    font-size: 0.75rem;
  }
  
  .status-badge {
    font-size: 0.6rem;
    padding: 2px 6px;
  }
  
  .add-form {
    padding: 12px;
  }
  
  .apps-panel {
    padding: 12px;
  }
  
  .apps-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
