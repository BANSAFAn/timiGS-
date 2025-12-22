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
            <button class="btn-new-note" @click="createNote">
              + {{ $t('tools.newNote', 'New Note') }}
            </button>
          </div>
          <div class="card-body notepad-body">
            <!-- Notes List -->
            <div class="notes-sidebar">
              <div 
                v-for="note in notes" 
                :key="note.id" 
                class="note-item"
                :class="{ active: selectedNote?.id === note.id }"
                @click="selectNote(note)"
              >
                <span class="note-title">{{ note.title || $t('tools.untitled', 'Untitled') }}</span>
                <button class="btn-delete" @click.stop="deleteNote(note.id)" title="Delete">🗑️</button>
              </div>
              <div v-if="notes.length === 0" class="no-notes">
                {{ $t('tools.noNotes', 'No notes yet') }}
              </div>
            </div>

            <!-- Note Editor -->
            <div class="note-editor">
              <div v-if="selectedNote" class="editor-content">
                <input 
                  v-model="selectedNote.title" 
                  class="note-title-input"
                  :placeholder="$t('tools.untitled', 'Untitled Note')"
                  @input="handleInput"
                />
                <textarea 
                  v-model="selectedNote.content" 
                  class="notepad-area" 
                  :placeholder="$t('tools.notepadPlaceholder', 'Type your notes here...')"
                  @input="handleInput"
                ></textarea>
                <div class="editor-footer">
                  <span class="save-status" :class="{ saved: isSaved }">
                    {{ isSaved ? $t('common.saved', 'Saved') : $t('common.saving', 'Saving...') }}
                  </span>
                </div>
              </div>
              <div v-else class="empty-editor">
                <p>{{ $t('tools.noNotes', 'Select or create a note') }}</p>
              </div>
            </div>
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

function loadNotes() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    notes.value = JSON.parse(saved);
    if (notes.value.length > 0) {
      selectedNote.value = notes.value[0];
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
    notes.value.splice(index, 1);
    if (selectedNote.value?.id === id) {
      selectedNote.value = notes.value[0] || null;
    }
    saveNotes();
  }
}

onMounted(() => {
  loadNotes();
});
</script>

<style scoped>
.tools-grid {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 24px;
  min-height: 400px;
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
  margin-bottom: 16px;
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
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.timer-icon {
  background: rgba(239, 68, 68, 0.1);
}

.note-icon {
  background: rgba(245, 158, 11, 0.1);
}

.card-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.card-body {
  flex: 1;
}

.notepad-body {
  display: flex;
  gap: 16px;
  height: 300px;
}

.notes-sidebar {
  width: 160px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  padding: 8px;
  overflow-y: auto;
  flex-shrink: 0;
}

.note-item {
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  transition: background 0.2s;
}

.note-item:hover {
  background: var(--bg-secondary);
}

.note-item.active {
  background: var(--primary);
  color: white;
}

.note-title {
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100px;
}

.btn-delete {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  opacity: 0.5;
  font-size: 0.75rem;
}

.btn-delete:hover {
  opacity: 1;
}

.no-notes {
  text-align: center;
  color: var(--text-muted);
  font-size: 0.8rem;
  padding: 20px 0;
}

.note-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.editor-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 8px;
}

.note-title-input {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 600;
}

.note-title-input:focus {
  outline: none;
  border-color: var(--primary);
}

.notepad-area {
  flex: 1;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 12px;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.9rem;
  resize: none;
}

.notepad-area:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.editor-footer {
  display: flex;
  justify-content: flex-end;
}

.save-status {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.save-status.saved {
  color: var(--success);
}

.empty-editor {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-muted);
}

.btn-new-note {
  background: var(--primary);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: var(--radius-md);
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-new-note:hover {
  background: var(--primary-dark);
}

@media (max-width: 900px) {
  .tools-grid {
    grid-template-columns: 1fr;
  }
  
  .notepad-body {
    flex-direction: column;
    height: auto;
  }
  
  .notes-sidebar {
    width: 100%;
    max-height: 150px;
  }
  
  .notepad-area {
    min-height: 200px;
  }
}
</style>
