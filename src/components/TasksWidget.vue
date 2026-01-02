<template>
  <div class="tasks-widget">
    <!-- Active Tasks List -->
    <div class="tasks-list">
      <div v-if="loading" class="state-message">
        {{ $t('common.loading', 'Loading...') }}
      </div>
      
      <div v-else-if="tasks.length === 0" class="state-message empty-state">
        <p>{{ $t('tasks.noTasks', 'No active tasks. Start by adding one!') }}</p>
      </div>
      
      <div v-for="task in tasks" :key="task.id" class="task-card">
        <div class="task-header">
          <div class="task-info">
            <h4 class="task-title">{{ task.app_name }}</h4>
            <p v-if="task.description" class="task-desc">{{ task.description }}</p>
          </div>
          <div class="task-actions">
             <span class="status-badge" :class="task.status">
               {{ task.status }}
             </span>
             <button @click="deleteTask(task.id)" class="btn-icon delete-btn" title="Delete">✕</button>
          </div>
        </div>
        
        <!-- Progress Bar -->
        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: getProgress(task) + '%' }"></div>
          </div>
          <div class="progress-labels">
            <span>{{ formatDuration(getProgressSeconds(task)) }}</span>
            <span>{{ $t('tasks.goal', 'Goal') }}: {{ formatDuration(task.goal_seconds) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Button / Form -->
    <div class="widget-footer">
      <button 
        v-if="!showAddForm"
        @click="showAddForm = true"
        class="btn-primary full-width"
      >
        <span>+</span> {{ $t('tasks.addTask', 'Add New Task') }}
      </button>

      <!-- Add Form -->
      <div v-else class="add-form">
        <div class="form-group mb-2">
            <input 
            v-model="newTask.app_name" 
            :placeholder="$t('tasks.appName', 'App Name (e.g. Code.exe)')" 
            class="input-field"
            />
        </div>
        <div class="form-group mb-2">
            <input 
            v-model="newTask.description" 
            :placeholder="$t('tasks.description', 'Description (optional)')" 
            class="input-field"
            />
        </div>
        
        <div class="form-row mb-3">
            <div class="input-wrapper">
                <input 
                v-model.number="newTask.goal_hours" 
                type="number"
                min="0"
                step="0.5"
                class="input-field"
                />
                <span class="input-suffix">{{ $t('tasks.hours', 'hours') }}</span>
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
import { ref, onMounted } from 'vue';
import { invoke } from '@tauri-apps/api/core';

interface Task {
  id: number;
  app_name: string;
  description?: string;
  goal_seconds: number;
  created_at: string;
  status: string;
}

const tasks = ref<Task[]>([]);
const loading = ref(false);
const showAddForm = ref(false);

const newTask = ref({
  app_name: '',
  description: '',
  goal_hours: 1
});

async function loadTasks() {
  loading.value = true;
  try {
    tasks.value = await invoke('get_tasks_cmd');
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

async function addTask() {
  if (!newTask.value.app_name || newTask.value.goal_hours <= 0) return;
  
  try {
    await invoke('create_task_cmd', {
      appName: newTask.value.app_name,
      description: newTask.value.description || null,
      goalSeconds: Math.floor(newTask.value.goal_hours * 3600)
    });
    showAddForm.value = false;
    newTask.value = { app_name: '', description: '', goal_hours: 1 };
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

function getProgress(_task: Task) {
    // Mock for now
    return 0; 
}

function getProgressSeconds(_task: Task) {
    return 0;
}

function formatDuration(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h${m > 0 ? ` ${m}m` : ''}`;
}

onMounted(() => {
  loadTasks();
});
</script>

<style scoped>
.tasks-widget {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 16px;
}

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
}

.task-desc {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin: 2px 0 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

.form-row {
    display: flex;
    gap: 12px;
}

.input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.input-suffix {
    position: absolute;
    right: 12px;
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
