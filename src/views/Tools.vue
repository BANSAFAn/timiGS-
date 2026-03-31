<template>
  <div class="page page-shell tools-page">
    <div class="page-container">
      <div class="page-header">
        <h2>{{ $t("nav.tools", "Tools") }}</h2>
        <p class="subtitle">Utilities to boost your productivity</p>
      </div>

      <!-- Tab Navigation -->
      <div class="tools-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
          :data-tab="tab.id"
          @click="activeTab = tab.id"
        >
          <span class="tab-icon" v-html="tab.icon"></span>
          {{ $t(tab.titleKey, tab.defaultTitle) }}
        </button>
      </div>

      <div class="tools-content">
        <!-- Shutdown Timer Card (Premium Gradient) -->
        <div
          v-show="activeTab === 'timer'"
          class="tool-content-card timer-card"
        >
          <div class="card-bg-glow"></div>
          <div class="card-header">
            <div class="header-icon-box timer-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </div>
            <h3>{{ $t("tools.timer", "Shutdown Timer") }}</h3>
          </div>
          <div class="card-body">
            <ShutdownTimer />
          </div>
        </div>

        <!-- Tasks Card -->
        <div
          v-show="activeTab === 'tasks'"
          class="tool-content-card tasks-card"
        >
          <div class="card-header">
            <div class="header-icon-box task-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
            </div>
            <h3>{{ $t("tasks.title", "Tasks & Goals") }}</h3>
          </div>
          <div class="card-body">
            <TasksWidget />
          </div>
        </div>

        <!-- Focus Mode Card -->
        <div
          v-show="activeTab === 'focus'"
          class="tool-content-card focus-card"
        >
          <div class="card-bg-glow"></div>
          <div class="card-header">
            <div class="header-icon-box focus-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
            </div>
            <h3>{{ $t("focus.title", "Focus Mode") }}</h3>
          </div>
          <div class="card-body">
            <FocusMode />
          </div>
        </div>

        <!-- Time OUT Card -->
        <div
          v-show="activeTab === 'timeout'"
          class="tool-content-card timeout-card"
        >
          <div class="card-bg-glow"></div>
          <div class="card-header">
            <div class="header-icon-box timeout-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"></path><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"></path><line x1="6" y1="2" x2="6" y2="4"></line><line x1="10" y1="2" x2="10" y2="4"></line><line x1="14" y1="2" x2="14" y2="4"></line></svg>
            </div>
            <h3>{{ $t("timeout.title", "Time OUT") }}</h3>
          </div>
          <div class="card-body">
            <TimeOut />
          </div>
        </div>

        <!-- Notepad Card (Full Width) -->
        <div
          v-show="activeTab === 'notepad'"
          class="tool-content-card notepad-card"
        >
          <div class="card-header flex-between">
            <div class="header-left">
              <div class="header-icon-box note-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>
              </div>
              <h3>{{ $t("tools.notepad", "Notepad") }}</h3>
            </div>
            <button class="btn-new-note" @click="createNote">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              {{ $t("tools.newNote", "New Note") }}
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
                  <span class="note-title">{{
                    note.title || $t("tools.untitled", "Untitled")
                  }}</span>
                  <span class="note-date">{{
                    formatDate(note.createdAt)
                  }}</span>
                </div>
                <button
                  class="btn-delete"
                  @click.stop="deleteNote(note.id)"
                  title="Delete"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path
                      d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                    ></path>
                  </svg>
                </button>
              </div>

              <div v-if="notes.length === 0" class="empty-notes">
                <div class="empty-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>
                </div>
                <p>{{ $t("tools.noNotes", "No notes yet") }}</p>
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
                  <div class="editor-actions">
                    <button 
                      class="btn-insert-apps" 
                      @click="showAppsPanel = !showAppsPanel"
                      title="Insert tracked apps"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                      </svg>
                      Apps
                    </button>
                    <span class="save-indicator" :class="{ saved: isSaved }">
                      <span v-if="!isSaved" class="saving-spinner"></span>
                      {{
                        isSaved
                          ? $t("common.saved", "Saved")
                          : $t("common.saving", "Saving...")
                      }}
                    </span>
                  </div>
                </div>

                <!-- Apps Panel -->
                <div v-if="showAppsPanel && recentApps.length > 0" class="apps-panel">
                  <div class="apps-header">
                    <span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                      Recent Tracked Apps
                    </span>
                    <button class="btn-close-panel" @click="showAppsPanel = false">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                  <div class="apps-grid">
                    <button
                      v-for="app in recentApps"
                      :key="app.app_name"
                      class="app-chip"
                      @click="insertAppToNote(app.app_name)"
                      :style="{ background: getAppColor(app.app_name) }"
                    >
                      {{ app.app_name }}
                      <span class="app-time">{{ formatAppTime(app.total_seconds) }}</span>
                    </button>
                  </div>
                </div>

                <textarea
                  v-model="selectedNote.content"
                  class="notepad-area custom-scrollbar"
                  :placeholder="
                    $t('tools.notepadPlaceholder', 'Type your notes here...')
                  "
                  @input="handleInput"
                ></textarea>
              </div>

              <div v-else class="empty-editor">
                <div class="empty-state-content">
                  <span class="select-icon" v-html="Icons.chevronLeft"></span>
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
import { ref, onMounted } from "vue";
import { invoke } from "@tauri-apps/api/core";
import ShutdownTimer from "../components/ShutdownTimer.vue";
import TasksWidget from "../components/TasksWidget.vue";
import FocusMode from "../components/FocusMode.vue";
import TimeOut from "../components/TimeOut.vue";
import { Icons } from "../components/icons/IconMap";
import { useDebounceFn } from "@vueuse/core";

const activeTab = ref("timeout");
const tabs = [
  { id: "timeout", titleKey: "timeout.title", defaultTitle: "Time OUT", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"></path><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"></path><line x1="6" y1="2" x2="6" y2="4"></line><line x1="10" y1="2" x2="10" y2="4"></line><line x1="14" y1="2" x2="14" y2="4"></line></svg>` },
  { id: "focus", titleKey: "focus.title", defaultTitle: "Focus Mode", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>` },
  { id: "tasks", titleKey: "tasks.title", defaultTitle: "Tasks & Goals", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="m9 12 2 2 4-4"></path></svg>` },
  { id: "timer", titleKey: "tools.timer", defaultTitle: "Shutdown Timer", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>` },
  { id: "notepad", titleKey: "tools.notepad", defaultTitle: "Notepad", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>` },
];

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}

interface AppSummary {
  app_name: string;
  total_seconds: number;
}

const notes = ref<Note[]>([]);
const selectedNote = ref<Note | null>(null);
const isSaved = ref(true);
const showAppsPanel = ref(false);
const recentApps = ref<AppSummary[]>([]);

const STORAGE_KEY = "timigs_notes";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
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
    title: "",
    content: "",
    createdAt: Date.now(),
  };
  notes.value.unshift(newNote);
  selectedNote.value = newNote;
  saveNotes();
}

function selectNote(note: Note) {
  selectedNote.value = note;
}

function deleteNote(id: string) {
  const index = notes.value.findIndex((n) => n.id === id);
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

function insertAppToNote(appName: string) {
  if (!selectedNote.value) return;
  const timestamp = new Date().toLocaleTimeString();
  const appendText = `\n[${timestamp}] ${appName}\n`;
  selectedNote.value.content += appendText;
  handleInput();
}

function getAppColor(appName: string): string {
  let hash = 0;
  for (let i = 0; i < appName.length; i++) {
    hash = appName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 60%, 45%)`;
}

function formatAppTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${seconds}s`;
}

async function loadRecentApps() {
  try {
    const summary = await invoke<AppSummary[]>("get_summary_by_date_cmd", {
      date: new Date().toISOString().split("T")[0],
    });
    recentApps.value = summary.sort((a, b) => b.total_seconds - a.total_seconds).slice(0, 20);
  } catch (e) {
    console.error("Failed to load recent apps", e);
  }
}

onMounted(async () => {
  loadNotes();
  loadRecentApps();
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

.tools-tabs {
  display: flex;
  gap: 8px;
  background: rgba(0, 0, 0, 0.2);
  padding: 8px;
  border-radius: 16px;
  margin-bottom: 24px;
  overflow-x: auto;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.tools-tabs::-webkit-scrollbar {
  display: none;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: transparent;
  border: none;
  border-radius: 12px;
  color: var(--text-muted);
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
}

.tab-btn.active {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.tab-icon {
  font-size: 1.1rem;
}

.tools-content {
  width: 100%;
}

.tool-content-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.timer-card {
  background: rgba(239, 68, 68, 0.03);
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
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.timer-icon {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}
.task-icon {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}
.note-icon {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}
.p2p-icon {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}
.focus-icon {
  background: rgba(139, 92, 246, 0.15);
  color: #8b5cf6;
}
.timeout-icon {
  background: rgba(20, 184, 166, 0.15);
  color: #14b8a6;
}

.focus-card {
  background: rgba(139, 92, 246, 0.03);
  border-color: rgba(139, 92, 246, 0.1);
}
.focus-card:hover {
  border-color: rgba(139, 92, 246, 0.3);
}

.timeout-card {
  background: rgba(20, 184, 166, 0.03);
  border-color: rgba(20, 184, 166, 0.1);
}
.timeout-card:hover {
  border-color: rgba(20, 184, 166, 0.3);
}

.tool-content-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

/* Notepad Specifics */
.notepad-card {
  min-height: 550px;
  background: rgba(245, 158, 11, 0.03);
  border-color: rgba(245, 158, 11, 0.1);
}

.notepad-layout {
  display: flex;
  gap: 20px;
  flex: 1;
  min-height: 450px;
}

.notes-sidebar {
  width: 280px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 16px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  max-height: 500px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.note-item {
  padding: 14px 16px;
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
  border-color: rgba(255, 255, 255, 0.08);
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
  font-weight: 600;
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
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
  width: 32px;
  height: 32px;
  border-radius: 8px;
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
  transform: scale(1.05);
}

.empty-notes {
  text-align: center;
  padding: 40px 10px;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 2.5rem;
  opacity: 0.3;
  margin-bottom: 10px;
}

/* Note Editor */
.note-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.3);
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
  gap: 12px;
}

.editor-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.btn-insert-apps {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.3);
  padding: 8px 14px;
  border-radius: 10px;
  color: #60a5fa;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-insert-apps:hover {
  background: rgba(59, 130, 246, 0.22);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

.btn-insert-apps svg {
  width: 18px;
  height: 18px;
}

.note-title-input {
  background: transparent;
  border: none;
  font-size: 1.2rem;
  font-weight: 700;
  color: #fff;
  width: 100%;
  padding: 4px 0;
  flex: 1;
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
}

.save-indicator.saved {
  color: #10b981;
}

/* Apps Panel */
.apps-panel {
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.apps-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-muted);
}

.btn-close-panel {
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
  font-size: 1rem;
  transition: all 0.2s;
}

.btn-close-panel:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.apps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
  padding-right: 4px;
}

.app-chip {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 10px 12px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  position: relative;
  overflow: hidden;
}

.app-chip::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255,255,255,0.05);
  opacity: 0;
  transition: opacity 0.2s;
}

.app-chip:hover::before {
  opacity: 1;
}

.app-chip:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.app-chip span {
  font-size: 0.8rem;
  font-weight: 600;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.app-time {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.8) !important;
  font-weight: 500;
  margin-top: 4px;
}

.notepad-area {
  flex: 1;
  background: transparent;
  border: none;
  padding: 20px;
  color: var(--text-primary);
  font-size: 1rem;
  line-height: 1.8;
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
  font-size: 2.5rem;
  display: block;
  margin-bottom: 12px;
}

/* Button */
.btn-new-note {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f59e0b;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
}

.btn-new-note:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.3);
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

/* Mobile Responsive */
@media (max-width: 1024px) {
  .tools-page {
    padding-bottom: 20px;
  }
  
  .tool-content-card {
    padding: 20px;
  }
  
  .notepad-layout {
    flex-direction: column;
  }
  
  .notes-sidebar {
    width: 100%;
    max-height: 180px;
    flex-direction: row;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 10px;
  }
  
  .note-item {
    min-width: 180px;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .btn-delete {
    opacity: 1;
    position: absolute;
    top: 8px;
    right: 8px;
  }
  
  .note-item-content {
    width: 100%;
    padding-right: 36px;
  }
  
  .apps-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
}

@media (max-width: 768px) {
  .page-header h2 {
    font-size: 1.3rem;
  }
  
  .subtitle {
    font-size: 0.85rem;
  }
  
  .tools-tabs {
    padding: 6px;
    gap: 6px;
  }
  
  .tab-btn {
    padding: 10px 16px;
    font-size: 0.85rem;
  }
  
  .tab-icon {
    font-size: 1rem;
  }
  
  .tool-content-card {
    padding: 16px;
    border-radius: 16px;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .header-icon-box {
    width: 42px;
    height: 42px;
    font-size: 1.2rem;
  }
  
  .tool-content-card h3 {
    font-size: 1.1rem;
  }
  
  .notepad-card {
    min-height: auto;
  }
  
  .notepad-layout {
    min-height: auto;
  }
  
  .notes-sidebar {
    max-height: 140px;
  }
  
  .note-item {
    min-width: 150px;
  }
  
  .editor-header {
    flex-wrap: wrap;
  }
  
  .editor-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .note-title-input {
    font-size: 1rem;
  }
  
  .btn-insert-apps {
    padding: 6px 12px;
    font-size: 0.8rem;
  }
  
  .apps-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    max-height: 150px;
  }
  
  .app-chip {
    padding: 8px 10px;
  }
  
  .app-chip span {
    font-size: 0.75rem;
  }
  
  .app-time {
    font-size: 0.65rem;
  }
  
  .notepad-area {
    padding: 14px;
    font-size: 0.95rem;
    min-height: 250px;
  }
  
  .btn-new-note {
    padding: 8px 16px;
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .tools-tabs {
    overflow-x: scroll;
    -webkit-overflow-scrolling: touch;
  }
  
  .tools-tabs::-webkit-scrollbar {
    height: 4px;
  }
  
  .tab-btn {
    white-space: nowrap;
  }
  
  .tool-content-card {
    padding: 12px;
  }
  
  .notes-sidebar {
    max-height: 120px;
  }
  
  .note-item {
    min-width: 130px;
  }
  
  .apps-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .app-chip {
    min-height: 60px;
    justify-content: center;
  }
  
  .notepad-area {
    min-height: 200px;
  }
}
</style>
