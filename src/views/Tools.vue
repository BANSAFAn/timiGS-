<template>
  <div class="page page-shell tools-page">
    <div class="page-container">
      <div class="page-header">
        <h2>{{ $t('nav.tools', 'Tools') }}</h2>
        <p class="subtitle">Utilities to boost your productivity</p>
      </div>

      <div class="tools-grid">
        <!-- Shutdown Timer Card (Premium Gradient) -->
        <div class="tool-card timer-card">
          <div class="card-bg-glow"></div>
          <div class="card-header">
            <div class="header-icon-box timer-icon">
              <span>⏲️</span>
            </div>
            <h3>{{ $t('tools.timer', 'Shutdown Timer') }}</h3>
          </div>
          <div class="card-body">
            <ShutdownTimer />
          </div>
        </div>

        <!-- Tasks Card -->
        <div class="tool-card tasks-card">
          <div class="card-header">
            <div class="header-icon-box task-icon">
              <span>✅</span>
            </div>
            <h3>{{ $t('tasks.title', 'Tasks & Goals') }}</h3>
          </div>
          <div class="card-body">
            <TasksWidget />
          </div>
        </div>

        <!-- P2P Transfer Card -->
        <div class="tool-card p2p-card" @click="$router.push('/transfer')">
          <div class="card-header">
            <div class="header-icon-box p2p-icon">
              <span>📡</span>
            </div>
            <h3>P2P Transfer</h3>
          </div>
          <div class="card-body">
            <p>Receive DB from Mobile</p>
          </div>
        </div>

        <!-- Notepad Card (Full Width) -->
        <div class="tool-card notepad-card">
          <div class="card-header flex-between">
            <div class="header-left">
              <div class="header-icon-box note-icon">
                <span>📝</span>
              </div>
              <h3>{{ $t('tools.notepad', 'Notepad') }}</h3>
            </div>
            <button class="btn-new-note" @click="createNote">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              {{ $t('tools.newNote', 'New Note') }}
            </button>
          </div>
          
          <div class="notepad-layout">
            <!-- Sidebar -->
            <div class="notes-sidebar custom-scrollbar">
              <div 
                v-for="note in notes" 
                :key="note.id" 
                class="note-item"
                :class="{ active: selectedNote?.id === note.id }"
                @click="selectNote(note)"
              >
                <div class="note-item-content">
                  <span class="note-title">{{ note.title || $t('tools.untitled', 'Untitled') }}</span>
                  <span class="note-date">{{ formatDate(note.createdAt) }}</span>
                </div>
                <button class="btn-delete" @click.stop="deleteNote(note.id)" title="Delete">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
              
              <div v-if="notes.length === 0" class="empty-notes">
                <div class="empty-icon">📝</div>
                <p>{{ $t('tools.noNotes', 'No notes yet') }}</p>
              </div>
            </div>

            <!-- Editor -->
            <div class="note-editor">
              <div v-if="selectedNote" class="editor-container">
                <div class="editor-header">
                  <input 
                    v-model="selectedNote.title" 
                    class="note-title-input"
                    :placeholder="$t('tools.untitled', 'Untitled Note')"
                    @input="handleInput"
                  />
                  <span class="save-indicator" :class="{ saved: isSaved }">
                    <span v-if="!isSaved" class="saving-spinner"></span>
                    {{ isSaved ? $t('common.saved', 'Saved') : $t('common.saving', 'Saving...') }}
                  </span>
                </div>
                
                <textarea 
                  v-model="selectedNote.content" 
                  class="notepad-area custom-scrollbar" 
                  :placeholder="$t('tools.notepadPlaceholder', 'Type your notes here...')"
                  @input="handleInput"
                ></textarea>
              </div>
              
              <div v-else class="empty-editor">
                <div class="empty-state-content">
                  <span class="select-icon">👈</span>
                  <p>Select a note to view or create a new one</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'; // removed unused 'computed'
import ShutdownTimer from '../components/ShutdownTimer.vue';
import TasksWidget from '../components/TasksWidget.vue';
import { useDebounceFn } from '@vueuse/core';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}

const notes = ref<Note[]>([]);
const selectedNote = ref<Note | null>(null);
const isSaved = ref(true);

const STORAGE_KEY = 'timigs_notes';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function loadNotes() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      notes.value = JSON.parse(saved);
      if (notes.value.length > 0) {
        selectedNote.value = notes.value[0];
      }
    } catch (e) {
      console.error("Failed to parse notes", e);
      notes.value = [];
    }
  }
}

function saveNotes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes.value));
  isSaved.value = true;
}

const debouncedSave = useDebounceFn(saveNotes, 1000);

function handleInput() {
  isSaved.value = false;
  debouncedSave();
}

function createNote() {
  const newNote: Note = {
    id: generateId(),
    title: '',
    content: '',
    createdAt: Date.now()
  };
  notes.value.unshift(newNote);
  selectedNote.value = newNote;
  saveNotes();
}

function selectNote(note: Note) {
  selectedNote.value = note;
}

function deleteNote(id: string) {
  const index = notes.value.findIndex(n => n.id === id);
  if (index > -1) {
    if (confirm("Delete this note?")) {
      notes.value.splice(index, 1);
      if (selectedNote.value?.id === id) {
        selectedNote.value = notes.value[0] || null;
      }
      saveNotes();
    }
  }
}

onMounted(() => {
  loadNotes();
});
</script>

<style scoped>
.tools-page {
  padding-bottom: 40px;
}

.page-header {
  margin-bottom: 24px;
}

.subtitle {
  color: var(--text-muted);
  font-size: 0.95rem;
  margin-top: 4px;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  width: 100%;
}

.tool-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.tool-card:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.timer-card {
  background: linear-gradient(145deg, rgba(239, 68, 68, 0.05), rgba(255, 255, 255, 0.02));
  border-color: rgba(239, 68, 68, 0.1);
}

.timer-card:hover {
  border-color: rgba(239, 68, 68, 0.3);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.flex-between {
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon-box {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.timer-icon { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
.task-icon { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
.note-icon { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
.p2p-icon { background: rgba(16, 185, 129, 0.15); color: #10b981; }

.tool-card h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}

/* Notepad Specifics */
.notepad-card {
  grid-column: span 2;
  min-height: 500px;
}

.notepad-layout {
  display: flex;
  gap: 24px;
  flex: 1;
  min-height: 400px;
}

.notes-sidebar {
  width: 260px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 16px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  max-height: 500px;
}

.note-item {
  padding: 12px 14px;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s;
  background: transparent;
  border: 1px solid transparent;
}

.note-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.note-item.active {
  background: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.3);
}

.note-item-content {
  flex: 1;
  min-width: 0;
}

.note-title {
  display: block;
  font-weight: 500;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
  color: #fff;
}

.note-item.active .note-title {
  color: #fbbf24;
}

.note-date {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.btn-delete {
  background: rgba(255, 255, 255, 0.05);
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s;
}

.note-item:hover .btn-delete {
  opacity: 1;
}

.btn-delete:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.empty-notes {
  text-align: center;
  padding: 40px 10px;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 2rem;
  opacity: 0.3;
  margin-bottom: 10px;
}

/* Note Editor */
.note-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.editor-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.editor-header {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.note-title-input {
  background: transparent;
  border: none;
  font-size: 1.2rem;
  font-weight: 600;
  color: #fff;
  width: 100%;
  padding: 4px 0;
}

.note-title-input:focus {
  outline: none;
}

.save-indicator {
  font-size: 0.8rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  margin-left: 16px;
}

.save-indicator.saved {
  color: #10b981;
}

.notepad-area {
  flex: 1;
  background: transparent;
  border: none;
  padding: 20px;
  color: var(--text-primary);
  font-size: 1rem;
  line-height: 1.6;
  resize: none;
  font-family: inherit;
}

.notepad-area:focus {
  outline: none;
}

.empty-editor {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.empty-state-content {
  text-align: center;
}

.select-icon {
  font-size: 2rem;
  display: block;
  margin-bottom: 10px;
}

/* Button */
.btn-new-note {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-new-note:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

/* Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

@media (max-width: 900px) {
  .tools-grid { grid-template-columns: 1fr; }
  .notepad-card { grid-column: span 1; }
  .notepad-layout { flex-direction: column; }
  .notes-sidebar { width: 100%; max-height: 200px; }
  .notepad-area { min-height: 300px; }
}
</style>
