<template>
  <div class="page page-shell tools-page">
    <div class="page-container">
      <div class="page-header">
        <h2>{{ $t("nav.tools", "Tools") }}</h2>
        <p class="subtitle">Utilities to boost your productivity</p>
      </div>

      
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
                    <div class="mode-tabs">
                      <button 
                        class="mode-tab-btn" 
                        :class="{ active: editorMode === 'edit' }" 
                        @click="editorMode = 'edit'"
                        :title="$t('tools.edit', 'Edit')"
                      >
                        {{ $t('tools.edit', 'Edit') }}
                      </button>
                      <button 
                        class="mode-tab-btn" 
                        :class="{ active: editorMode === 'preview' }" 
                        @click="editorMode = 'preview'"
                        :title="$t('tools.preview', 'Preview')"
                      >
                        {{ $t('tools.preview', 'Preview') }}
                      </button>
                    </div>
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

                
                <div v-if="showAppsPanel && recentApps.length > 0" class="apps-panel">
                  <div class="apps-header">
                    <span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                      {{ $t('tools.recentTrackedApps', 'Recent Tracked Apps') }}
                    </span>
                    <div class="insert-format-selector">
                      <button 
                        class="format-btn" 
                        :class="{ active: insertFormat === 'name' }" 
                        @click="insertFormat = 'name'"
                        :title="$t('tools.insertFormatName', 'Name')"
                      >{{ $t('tools.insertFormatName', 'Name') }}</button>
                      <button 
                        class="format-btn" 
                        :class="{ active: insertFormat === 'logo' }" 
                        @click="insertFormat = 'logo'"
                        :title="$t('tools.insertFormatLogo', 'Logo')"
                      >{{ $t('tools.insertFormatLogo', 'Logo') }}</button>
                      <button 
                        class="format-btn" 
                        :class="{ active: insertFormat === 'both' }" 
                        @click="insertFormat = 'both'"
                        :title="$t('tools.insertFormatBoth', 'Both')"
                      >{{ $t('tools.insertFormatBoth', 'Both') }}</button>
                    </div>
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
                      <img 
                        v-if="appIcons[app.app_name]" 
                        :src="appIcons[app.app_name]" 
                        class="app-chip-icon-img" 
                        alt=""
                      />
                      {{ app.app_name }}
                      <span class="app-time">{{ formatAppTime(app.total_seconds) }}</span>
                    </button>
                  </div>
                </div>

                <textarea
                  v-if="editorMode === 'edit'"
                  v-model="selectedNote.content"
                  class="notepad-area custom-scrollbar"
                  :placeholder="
                    $t('tools.notepadPlaceholder', 'Type your notes here...')
                  "
                  @input="handleInput"
                ></textarea>
                <div
                  v-else
                  class="notepad-preview markdown-body custom-scrollbar"
                  v-html="previewHtml"
                ></div>
              </div>

              <div v-else class="empty-editor">
                <div class="empty-state-content">
                  <span class="select-icon" v-html="Icons.chevronLeft"></span>
                  <p>{{ $t('tools.selectNoteHint', 'Select a note to view or create a new one') }}</p>
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
import { ref, onMounted, computed } from "vue";
import { useI18n } from "vue-i18n";
import { invoke } from "@tauri-apps/api/core";
import ShutdownTimer from "../components/ShutdownTimer.vue";
import FocusMode from "../components/FocusMode.vue";
import TimeOut from "../components/TimeOut.vue";
import TasksWidget from "../components/TasksWidget.vue";
import { Icons } from "../components/icons/IconMap";
import { useDebounceFn } from "@vueuse/core";
import { marked } from "marked";

const { locale } = useI18n();

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
  exe_path: string;
  total_seconds: number;
}

const notes = ref<Note[]>([]);
const selectedNote = ref<Note | null>(null);
const isSaved = ref(true);
const showAppsPanel = ref(false);
const recentApps = ref<AppSummary[]>([]);
const appIcons = ref<Record<string, string>>({});
const editorMode = ref<'edit' | 'preview'>('edit');
const insertFormat = ref<'name' | 'logo' | 'both'>('both');

const STORAGE_KEY = "timigs_notes";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(locale.value, {
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

async function loadIcon(appName: string, path: string) {
  if (appIcons.value[appName] || !path) return;
  try {
    const base64 = await invoke<string | null>("get_app_icon", { path });
    if (base64) appIcons.value[appName] = `data:image/png;base64,${base64}`;
  } catch {}
}

function insertAppToNote(appName: string) {
  if (!selectedNote.value) return;
  const timestamp = new Date().toLocaleTimeString();
  
  let appendText = '';
  const iconBase64 = appIcons.value[appName];
  
  if (insertFormat.value === 'name') {
    appendText = `\n[${timestamp}] ${appName}\n`;
  } else if (insertFormat.value === 'logo') {
    if (iconBase64) {
      appendText = `\n![${appName}](${iconBase64})\n`;
    } else {
      appendText = `\n[${timestamp}] ${appName}\n`;
    }
  } else if (insertFormat.value === 'both') {
    if (iconBase64) {
      appendText = `\n[${timestamp}] ![${appName}](${iconBase64}) ${appName}\n`;
    } else {
      appendText = `\n[${timestamp}] ${appName}\n`;
    }
  }

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
    
    // Load icons
    recentApps.value.forEach((app) => {
      if (app.exe_path) {
        loadIcon(app.app_name, app.exe_path);
      }
    });
  } catch (e) {
    console.error("Failed to load recent apps", e);
  }
}

const previewHtml = computed(() => {
  if (!selectedNote.value) return "";
  try {
    return marked.parse(selectedNote.value.content || "", { gfm: true, breaks: true });
  } catch (e) {
    console.error("Markdown parsing failed", e);
    return selectedNote.value.content || "";
  }
});

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
  overflow-y: hidden;
  position: relative;
  width: 100%;
  box-sizing: border-box;
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


.notepad-card {
  min-height: 600px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-lg);
}

.notepad-layout {
  display: flex;
  gap: 20px;
  flex: 1;
  min-height: 480px;
}

.notes-sidebar {
  width: 280px;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 16px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  max-height: 520px;
  border: 1px solid var(--border-color);
  transition: background var(--transition-base);
}

[data-theme="light"] .notes-sidebar {
  background: rgba(0, 0, 0, 0.02);
}

.note-item {
  padding: 14px 16px;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  background: transparent;
  border: 1px solid transparent;
}

.note-item:hover {
  background: var(--bg-hover);
  border-color: var(--border-color);
  transform: translateX(2px);
}

.note-item.active {
  background: rgba(245, 158, 11, 0.08);
  border-color: rgba(245, 158, 11, 0.3);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.05);
  position: relative;
}

.note-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 12px;
  bottom: 12px;
  width: 3px;
  background: #f59e0b;
  border-radius: 0 4px 4px 0;
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
  color: var(--text-main);
  transition: color var(--transition-fast);
}

.note-item.active .note-title {
  color: #f59e0b;
  font-weight: 700;
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

[data-theme="light"] .btn-delete {
  background: rgba(0, 0, 0, 0.03);
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


.note-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--border-color);
  transition: background var(--transition-base);
}

[data-theme="light"] .note-editor {
  background: rgba(0, 0, 0, 0.01);
}

.editor-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.editor-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
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
  background: rgba(59, 130, 246, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.2);
  padding: 8px 14px;
  border-radius: 10px;
  color: #60a5fa;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-insert-apps:hover {
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.35);
  transform: translateY(-1px);
}

.btn-insert-apps svg {
  width: 18px;
  height: 18px;
}

.note-title-input {
  background: transparent;
  border: none;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  width: 100%;
  padding: 4px 0;
  flex: 1;
  transition: color var(--transition-fast);
}

.note-title-input:focus {
  outline: none;
}

.save-indicator {
  font-size: 0.75rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  background: var(--bg-secondary);
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid var(--border-color);
  font-weight: 500;
}

.save-indicator::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-disabled);
  transition: all 0.3s ease;
}

.save-indicator.saved {
  color: var(--color-success);
  background: rgba(16, 185, 129, 0.06);
  border-color: rgba(16, 185, 129, 0.2);
}

.save-indicator.saved::before {
  background: var(--color-success);
  box-shadow: 0 0 8px var(--color-success);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.9); opacity: 0.8; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(0.9); opacity: 0.8; }
}


.apps-panel {
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.25);
  border-bottom: 1px solid var(--border-color);
  animation: slideDown 0.2s ease;
}

[data-theme="light"] .apps-panel {
  background: rgba(0, 0, 0, 0.03);
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
  padding: 24px;
  color: var(--text-main);
  font-size: 1rem;
  line-height: 1.7;
  resize: none;
  font-family: inherit;
  transition: color var(--transition-fast);
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
  background: rgba(0, 0, 0, 0.03);
  border-radius: 12px;
  margin: 20px;
  border: 1px dashed var(--border-color);
}

[data-theme="light"] .empty-editor {
  background: rgba(0, 0, 0, 0.01);
}

.empty-state-content {
  text-align: center;
}

.select-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 12px;
}


.btn-new-note {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
}

.btn-new-note:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.35);
  filter: brightness(1.05);
}

.btn-new-note:active {
  transform: translateY(0);
}


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




@media (min-width: 2560px) {
  .page-container {
    max-width: 1800px;
  }

  .tools-tabs {
    max-width: 1200px;
    margin: 0 auto;
  }

  .tab-btn {
    padding: 16px 32px;
    font-size: 1.1rem;
  }

  .tab-icon {
    font-size: 1.5rem;
  }

  .tool-content-card {
    padding: 40px;
  }

  .card-header h3 {
    font-size: 1.8rem;
  }

  .apps-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
}


@media (min-width: 1920px) and (max-width: 2559px) {
  .page-container {
    max-width: 1600px;
  }

  .tools-tabs {
    max-width: 1000px;
  }

  .tool-content-card {
    padding: 32px;
  }
}


@media (min-width: 1440px) and (max-width: 1919px) {
  .page-container {
    max-width: 1400px;
  }

  .tools-tabs {
    max-width: 100%;
  }
}


@media (min-width: 1024px) and (max-width: 1439px) {
  .page-container {
    max-width: 1000px;
  }

  .tools-tabs {
    max-width: 100%;
  }

  .tool-content-card {
    padding: 24px;
  }
}


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


@media (max-width: 900px) {
  .page-header h2 {
    font-size: 1.4rem;
  }

  .subtitle {
    font-size: 0.9rem;
  }

  .tools-tabs {
    gap: 8px;
  }

  .tab-btn {
    padding: 12px 20px;
    font-size: 0.9rem;
  }

  .tab-icon {
    font-size: 1.1rem;
  }

  .tool-content-card {
    padding: 20px;
    border-radius: 16px;
  }

  .card-header {
    gap: 14px;
  }

  .header-icon-box {
    width: 44px;
    height: 44px;
    font-size: 1.2rem;
  }

  .tool-content-card h3 {
    font-size: 1.2rem;
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
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .tab-btn {
    padding: 10px 16px;
    font-size: 0.85rem;
    white-space: nowrap;
    flex-shrink: 0;
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
    min-height: 300px;
  }

  .note-editor {
    gap: 12px;
  }
}


@media (max-width: 600px) {
  .page-container {
    max-width: 100%;
    padding: 0 12px;
  }

  .page-header {
    margin-bottom: 16px;
  }

  .page-header h2 {
    font-size: 1.2rem;
  }

  .subtitle {
    font-size: 0.8rem;
  }

  .tools-tabs {
    padding: 4px;
    gap: 4px;
  }

  .tab-btn {
    padding: 8px 14px;
    font-size: 0.8rem;
  }

  .tab-icon {
    font-size: 0.95rem;
  }

  .tool-content-card {
    padding: 14px;
    border-radius: 14px;
  }

  .card-header {
    gap: 10px;
  }

  .header-icon-box {
    width: 38px;
    height: 38px;
    font-size: 1.1rem;
  }

  .tool-content-card h3 {
    font-size: 1.05rem;
  }

  .notepad-card,
  .timeout-card,
  .focus-card,
  .tasks-card,
  .timer-card {
    border-radius: 14px;
  }

  .notes-sidebar {
    max-height: 120px;
    padding: 8px;
  }

  .note-item {
    min-width: 140px;
    padding: 10px;
  }

  .note-item-content {
    padding-right: 30px;
  }

  .note-item-title {
    font-size: 0.85rem;
  }

  .note-item-preview {
    font-size: 0.75rem;
  }

  .note-title-input {
    font-size: 0.95rem;
    padding: 10px 12px;
  }

  .notepad-area {
    min-height: 250px;
    padding: 12px;
  }

  .note-content {
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .apps-grid {
    grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
    max-height: 140px;
    gap: 8px;
  }

  .app-chip {
    padding: 7px 9px;
  }

  .app-chip span {
    font-size: 0.7rem;
  }

  .btn-insert-apps {
    padding: 6px 10px;
    font-size: 0.75rem;
  }

  .btn-save {
    padding: 8px 14px;
    font-size: 0.8rem;
  }
}


@media (max-width: 480px) {
  .page-container {
    padding: 0 10px;
  }

  .page-header {
    margin-bottom: 14px;
  }

  .page-header h2 {
    font-size: 1.1rem;
  }

  .subtitle {
    font-size: 0.75rem;
  }

  .tools-tabs {
    padding: 4px;
    gap: 3px;
  }

  .tab-btn {
    padding: 7px 12px;
    font-size: 0.75rem;
  }

  .tab-icon {
    font-size: 0.9rem;
  }

  .tool-content-card {
    padding: 12px;
    border-radius: 12px;
  }

  .card-header {
    gap: 8px;
  }

  .header-icon-box {
    width: 36px;
    height: 36px;
    font-size: 1rem;
  }

  .tool-content-card h3 {
    font-size: 1rem;
  }

  .notes-sidebar {
    max-height: 100px;
    padding: 6px;
  }

  .note-item {
    min-width: 120px;
    padding: 8px;
  }

  .note-item-content {
    padding-right: 28px;
  }

  .note-item-title {
    font-size: 0.8rem;
  }

  .note-item-preview {
    font-size: 0.7rem;
    margin-top: 4px;
  }

  .note-title-input {
    font-size: 0.9rem;
    padding: 8px 10px;
  }

  .notepad-area {
    min-height: 200px;
    padding: 10px;
    font-size: 0.85rem;
  }

  .note-content {
    font-size: 0.85rem;
    line-height: 1.4;
  }

  .apps-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    max-height: 120px;
    gap: 6px;
  }

  .app-chip {
    padding: 6px 8px;
  }

  .app-chip span {
    font-size: 0.65rem;
  }

  .btn-insert-apps {
    padding: 5px 9px;
    font-size: 0.7rem;
  }

  .btn-save {
    padding: 7px 12px;
    font-size: 0.75rem;
  }

  .editor-actions {
    gap: 6px;
  }
}


@media (max-width: 360px) {
  .page-container {
    padding: 0 8px;
  }

  .page-header h2 {
    font-size: 1rem;
  }

  .subtitle {
    display: none;
  }

  .tools-tabs {
    padding: 3px;
    gap: 2px;
  }

  .tab-btn {
    padding: 6px 10px;
    font-size: 0.7rem;
  }

  .tab-icon {
    font-size: 0.85rem;
  }

  .tool-content-card {
    padding: 10px;
    border-radius: 10px;
  }

  .card-header {
    gap: 6px;
  }

  .header-icon-box {
    width: 32px;
    height: 32px;
    font-size: 0.9rem;
  }

  .tool-content-card h3 {
    font-size: 0.95rem;
  }

  .notes-sidebar {
    max-height: 90px;
  }

  .note-item {
    min-width: 110px;
    padding: 6px;
  }

  .notepad-area {
    min-height: 180px;
  }

  .apps-grid {
    grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
    max-height: 100px;
  }
}

/* App chip and icon styling */
.app-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 8px;
  color: #fff;
  border: none;
  font-weight: 500;
  font-size: 0.85rem;
  cursor: pointer;
  transition: opacity 0.2s ease, transform 0.1s ease;
}

.app-chip:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.app-chip-icon-img {
  width: 16px;
  height: 16px;
  object-fit: contain;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.15);
  padding: 1px;
}

/* Insert format selector inside apps-panel */
.insert-format-selector {
  display: flex;
  background: rgba(0, 0, 0, 0.3);
  padding: 2px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  margin-right: 12px;
  align-items: center;
}

.format-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.format-btn:hover {
  color: #fff;
}

.format-btn.active {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

/* Mode tabs for Edit / Preview */
.mode-tabs {
  display: flex;
  background: rgba(0, 0, 0, 0.3);
  padding: 2px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.mode-tab-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mode-tab-btn:hover {
  color: #fff;
}

.mode-tab-btn.active {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

/* Markdown preview body styling */
.notepad-preview {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  min-height: 250px;
  text-align: left;
}

.markdown-body {
  color: var(--text-normal);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  line-height: 1.6;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
  line-height: 1.25;
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 0.3em;
}

.markdown-body :deep(h1) { font-size: 1.5rem; }
.markdown-body :deep(h2) { font-size: 1.3rem; }
.markdown-body :deep(h3) { font-size: 1.15rem; }
.markdown-body :deep(h4) { font-size: 1rem; }

.markdown-body :deep(p) {
  margin-top: 0;
  margin-bottom: 12px;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin-top: 0;
  margin-bottom: 16px;
  padding-left: 20px;
}

.markdown-body :deep(li) {
  margin-top: 4px;
}

.markdown-body :deep(code) {
  padding: 3px 6px;
  margin: 0;
  font-size: 85%;
  background-color: rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  font-family: monospace;
}

.markdown-body :deep(pre) {
  padding: 16px;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 16px;
}

.markdown-body :deep(pre code) {
  padding: 0;
  margin: 0;
  font-size: 100%;
  background-color: transparent;
  border: 0;
}

.markdown-body :deep(img[src^="data:image/"]) {
  width: 20px;
  height: 20px;
  object-fit: contain;
  vertical-align: middle;
  display: inline-block;
  margin-top: -3px;
  margin-right: 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  padding: 2px;
}

.markdown-body :deep(img:not([src^="data:image/"])) {
  max-width: 100%;
  border-radius: 6px;
}
</style>
