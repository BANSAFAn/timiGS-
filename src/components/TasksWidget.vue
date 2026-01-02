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
          {{ viewMode === 'active' ? '🕒' : '📝' }}
        </button>
        <button 
            v-if="viewMode === 'history'"
            @click="exportCsv" 
            class="btn-icon header-btn" 
            title="Export CSV"
        >
          💾
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
      
      <div v-for="task in filteredTasks" :key="task.id" class="task-card">
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
             <button @click="deleteTask(task.id)" class="btn-icon delete-btn" title="Delete">✕</button>
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
        <span>+</span> {{ $t('tasks.addTask', 'Add New Task') }}
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
          <button @click="addTask" class="btn-primary flex-1">{{ $t('tasks.create', 'Create') }}</button>
          <button @click="showAddForm = false" class="btn-secondary flex-1">{{ $t('tasks.cancel', 'Cancel') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { invoke } from '@tauri-apps/api/core';

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
    const headers = ['ID', 'App', 'Target App/Site', 'Description', 'Goal (h)', 'Created At', 'Status'];
    const rows = filteredTasks.value.map(t => [
        t.id,
        t.app_name,
        t.title_filter || 'Any',
        t.description || '',
        (t.goal_seconds / 3600).toFixed(2),
        new Date(t.created_at).toLocaleString(),
        t.status
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'tasks_history.csv');
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

onMounted(() => {
  loadTasks();
  // Poll for updates (though without backend command it wont update much yet)
  pollInterval = setInterval(loadTasks, 60000);
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
  gap: 16px;
}

.widget-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.widget-header h3 {
    margin: 0;
    font-size: 1.1rem;
    color: var(--text-primary);
}

.header-actions {
    display: flex;
    gap: 8px;
}

.header-btn {
    font-size: 1.1rem;
    padding: 6px;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 6px;
    cursor: pointer;
}
.header-btn:hover { background: var(--bg-tertiary); }

.tasks-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 4px; /* Space for scrollbar */
}

/* Scrollbar styling */
.tasks-list::-webkit-scrollbar {
  width: 6px;
}
.tasks-list::-webkit-scrollbar-track {
  background: transparent;
}
.tasks-list::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 3px;
}

.state-message {
  text-align: center;
  color: var(--text-muted);
  font-size: 0.9rem;
  padding: 24px 0;
}

.empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
}

.task-card {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 12px;
  transition: all 0.2s;
}

.task-card:hover {
    border-color: var(--primary);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.task-info {
    flex: 1;
    min-width: 0;
}

.task-title {
  font-size: 0.95rem;
  font-weight: 600;
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
    font-size: 0.7rem;
    background: #3b82f633;
    color: #60a5fa;
    padding: 1px 6px;
    border-radius: 4px;
}

.task-desc {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin: 2px 0 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-date {
    font-size: 0.7rem;
    color: var(--text-muted);
    opacity: 0.7;
    margin-top: 4px;
}

.task-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.status-badge {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 12px;
  text-transform: capitalize;
  font-weight: 500;
}

.status-badge.active {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
}

.status-badge.completed {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.delete-btn {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
}

/* Progress Bar */
.progress-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.progress-bar {
  height: 6px;
  background: rgba(255,255,255,0.1);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.completion-info {
    font-size: 0.8rem;
    color: var(--text-muted);
    text-align: right;
}

/* Footer / Form */
.widget-footer {
  border-top: 1px solid var(--border);
  padding-top: 16px;
}

.btn-primary {
  background: var(--primary);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-primary:hover {
  background: var(--primary-dark);
}

.btn-secondary {
    background: var(--bg-secondary);
    color: var(--text-muted);
    border: 1px solid var(--border);
    padding: 8px 16px;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.2s;
}

.btn-secondary:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
}

.full-width {
  width: 100%;
}

.add-form {
  background: var(--bg-tertiary);
  padding: 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
}

.form-group {
    margin-bottom: 8px;
}

.mb-2 { margin-bottom: 8px; }
.mb-3 { margin-bottom: 12px; }

.input-label {
    display: block;
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-bottom: 4px;
}

.input-field {
  width: 100%;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 8px 12px;
  color: var(--text-primary);
  font-size: 0.9rem;
  transition: border-color 0.2s;
}

.input-field:focus {
  outline: none;
  border-color: var(--primary);
}

.relative { position: relative; }

.suggestions-list {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 0 0 6px 6px;
    max-height: 150px;
    overflow-y: auto;
    z-index: 10;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.suggestion-item {
    padding: 8px 12px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background 0.1s;
}

.suggestion-item:hover {
    background: var(--bg-primary);
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

.input-suffix {
    position: absolute;
    right: 12px;
    top: 32px;
    color: var(--text-muted);
    font-size: 0.85rem;
    pointer-events: none;
}

.form-actions {
  display: flex;
  gap: 8px;
}

.flex-1 {
    flex: 1;
}
</style>
