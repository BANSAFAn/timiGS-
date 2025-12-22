<template>
  <div class="page">
    <div class="page-container">
      <div class="page-header">
        <h2>{{ $t('nav.tools', 'Tools') }}</h2>
      </div>

      <div class="tools-grid">
        <!-- Shutdown Timer Card -->
        <div class="tool-card">
          <div class="card-header">
            <div class="header-icon timer-icon">⏲️</div>
            <h3>{{ $t('tools.timer', 'Shutdown Timer') }}</h3>
          </div>
          <div class="card-body">
            <ShutdownTimer />
          </div>
        </div>

        <!-- Notepad Card -->
        <div class="tool-card notepad-card">
          <div class="card-header flex-between">
            <div class="header-left">
              <div class="header-icon note-icon">📝</div>
              <h3>{{ $t('tools.notepad', 'Notepad') }}</h3>
            </div>
            <div class="save-status" :class="{ saved: isSaved }">
              {{ isSaved ? $t('common.saved', 'Saved') : $t('common.saving', 'Saving...') }}
            </div>
          </div>
          <div class="card-body full-height">
            <textarea 
              v-model="noteContent" 
              class="notepad-area" 
              :placeholder="$t('tools.notepadPlaceholder', 'Type your notes here...')"
              @input="handleInput"
            ></textarea>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import ShutdownTimer from '../components/ShutdownTimer.vue';
import { useDebounceFn } from '@vueuse/core';

const noteContent = ref('');
const isSaved = ref(true);

const saveNote = useDebounceFn(() => {
  localStorage.setItem('timigs_notepad', noteContent.value);
  isSaved.value = true;
}, 1000);

function handleInput() {
  isSaved.value = false;
  saveNote();
}

onMounted(() => {
  const savedNote = localStorage.getItem('timigs_notepad');
  if (savedNote) {
    noteContent.value = savedNote;
  }
});
</script>

<style scoped>
.tools-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  max-height: 400px;
}

.tool-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.3s ease;
}

.tool-card:hover {
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  border-color: var(--primary-dark);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.flex-between {
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.timer-icon {
  background: rgba(239, 68, 68, 0.1);
}

.note-icon {
  background: rgba(245, 158, 11, 0.1);
}

.card-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.card-body {
  flex: 1;
}

.full-height {
  height: 100%;
  display: flex;
}

.notepad-area {
  width: 100%;
  height: 100%;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 16px;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.95rem;
  resize: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.notepad-area:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.save-status {
  font-size: 0.8rem;
  color: var(--text-muted);
  opacity: 0.7;
  transition: color 0.3s;
}

.save-status.saved {
  color: var(--success);
  opacity: 1;
}

@media (max-width: 900px) {
  .tools-grid {
    grid-template-columns: 1fr;
    max-height: none;
  }
  
  .tool-card {
    min-height: 300px;
  }
}
</style>
