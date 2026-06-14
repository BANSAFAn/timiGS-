<template>
  <div class="coding-view custom-scrollbar animate-enter">
    <div class="coding-view-container">
      <header class="coding-view-header">
        <div class="header-left">
          <div class="header-icon" v-html="codingIcon"></div>
          <div>
            <h2>{{ $t('coding.title') || 'Coding Workspace' }}</h2>
            <p class="header-subtitle">Analyze your active development sessions and AI assistance</p>
          </div>
        </div>
        
        <div class="date-navigator">
          <button class="nav-arrow" @click="goToPreviousDay" aria-label="Previous Day">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div class="current-date-badge" @click="showCalendar = !showCalendar">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>{{ displayDate }}</span>
          </div>
          <button class="nav-arrow" :disabled="isToday" @click="goToNextDay" aria-label="Next Day">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <CustomCalendar
            v-if="showCalendar"
            v-model="selectedDate"
            class="calendar-popover"
            @close="showCalendar = false"
          />
        </div>
      </header>

      <CodingTracker :selectedDate="selectedDate" />

      <div class="coding-timeline-section" v-if="codingSessions.length > 0">
        <div class="coding-timeline-header">
          <div class="coding-header-left">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="16 18 22 12 16 6"/>
              <polyline points="8 6 2 12 8 18"/>
            </svg>
            <span>{{ t('coding.timeline_title') || 'Sessions & File Activity' }}</span>
          </div>

          <div class="coding-view-toggle">
            <button 
              type="button"
              class="toggle-btn" 
              :class="{ active: activeViewMode === 'chronological' }" 
              @click="activeViewMode = 'chronological'"
            >
              {{ t('coding.timeline_view') || 'Timeline View' }}
            </button>
            <button 
              type="button"
              class="toggle-btn" 
              :class="{ active: activeViewMode === 'grouped' }" 
              @click="activeViewMode = 'grouped'"
            >
              {{ t('coding.grouped_view') || 'Files Summary' }}
            </button>
          </div>

          <span class="coding-timeline-total">{{ formatDuration(codingTotalTime) }}</span>
        </div>

        <div class="coding-sessions-list" v-if="activeViewMode === 'chronological'">
          <div v-for="session in codingSessions" :key="session.id" class="coding-session-item">
            <div class="cs-time">
              {{ formatTime(session.start_time) }} - {{ session.end_time ? formatTime(session.end_time) : 'Now' }}
            </div>
            <div class="cs-content">
              <div class="cs-editor-badge" :class="getEditorBadgeClass(session.editor_name)">
                {{ session.editor_name }}
              </div>
              <div class="cs-info">
                <div class="cs-file" v-if="session.file_path">
                  <span class="cs-lang-dot" :style="{ background: getLangColor(session.language) }"></span>
                  <span class="cs-filename" :title="session.file_path || undefined">{{ session.file_path === 'Workspace / General' ? t('coding.workspaceGeneral') : session.file_path }}</span>
                  <span class="cs-lang" v-if="session.language">{{ session.language === 'Unknown' ? t('coding.unknown') : session.language }}</span>
                </div>
                <div class="cs-project" v-if="session.project_dir">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 256 256" fill="currentColor" style="display:inline;vertical-align:middle;margin-right:3px;">
                    <path d="M216,72H131.31L104,44.69A15.86,15.86,0,0,0,92.69,40H40A16,16,0,0,0,24,56V200.62A15.4,15.4,0,0,0,39.38,216H216.89A15.13,15.13,0,0,0,232,200.89V88A16,16,0,0,0,216,72ZM40,56H92.69l16,16H40ZM216,200H40V88H216Z"/>
                  </svg>
                  {{ session.project_dir === 'No Project' ? t('coding.noProject') : session.project_dir }}
                </div>
              </div>
              <div class="cs-right">
                <span class="cs-duration">{{ formatDuration(session.duration_seconds) }}</span>
                <span class="cs-ai" v-if="session.is_ai_assisted">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 256 256" fill="currentColor">
                    <path d="M200,112a8,8,0,0,1-8,8H152a8,8,0,0,1,0-16h40A8,8,0,0,1,200,112Zm-8,24H152a8,8,0,0,0,0,16h40a8,8,0,0,0,0-16Zm-32,32H152a8,8,0,0,0,0,16h8a8,8,0,0,0,0-16ZM96,208H72a8,8,0,0,1-8-8V160a8,8,0,0,1,16,0v32H96a8,8,0,0,1,0,16Zm0-96H80V80a8,8,0,0,0-16,0v40a8,8,0,0,0,8,8H96a8,8,0,0,0,0-16ZM232,56V200a16,16,0,0,1-16,16H40a16,16,0,0,1-16-16V56A16,16,0,0,1,40,40H216A16,16,0,0,1,232,56Zm-16,0H40V200H216V56Z"/>
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="coding-grouped-list" v-else>
          <div v-for="file in groupedCodingSessions" :key="file.key" class="grouped-file-item">
            <div class="file-summary-row" @click="toggleFile(file.key)">
              <div class="file-expand-toggle">
                <svg :class="{ 'rotated': expandedTimelineFiles.has(file.key) }" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
              
              <div class="file-info-col">
                <div class="file-meta-header">
                  <span class="lang-color-dot" :style="{ background: getLangColor(file.language) }"></span>
                  <span class="file-name" :title="file.filePath">{{ file.filePath === 'Workspace / General' ? t('coding.workspaceGeneral') : file.filePath }}</span>
                  <span class="lang-tag" v-if="file.language">{{ file.language === 'Unknown' ? t('coding.unknown') : file.language }}</span>
                </div>
                <div class="file-project-sub">
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 256 256" fill="currentColor" style="display:inline;vertical-align:middle;margin-right:4px;">
                    <path d="M216,72H131.31L104,44.69A15.86,15.86,0,0,0,92.69,40H40A16,16,0,0,0,24,56V200.62A15.4,15.4,0,0,0,39.38,216H216.89A15.13,15.13,0,0,0,232,200.89V88A16,16,0,0,0,216,72ZM40,56H92.69l16,16H40ZM216,200H40V88H216Z"/>
                  </svg>
                  {{ file.projectDir === 'No Project' ? t('coding.noProject') : file.projectDir }}
                </div>
              </div>

              <div class="file-progress-col">
                <div class="file-progress-wrapper" v-if="file.totalSeconds > 0">
                  <div class="file-progress-bar">
                    <div class="bar-manual" :style="{ width: (100 - file.aiPercent) + '%' }"></div>
                    <div class="bar-ai" :style="{ width: file.aiPercent + '%' }"></div>
                  </div>
                  <div class="file-progress-labels">
                    <span class="label-manual">{{ formatDuration(file.manualSeconds) }}</span>
                    <span class="label-ai" v-if="file.aiSeconds > 0">{{ formatDuration(file.aiSeconds) }} {{ t('coding.ai', 'AI') }}</span>
                  </div>
                </div>
              </div>

              <div class="file-total-time-col">
                <span class="file-time-badge">{{ formatDuration(file.totalSeconds) }}</span>
              </div>
            </div>

            <div v-show="expandedTimelineFiles.has(file.key)" class="file-sessions-drawer">
              <div v-for="sess in file.sessions" :key="sess.id" class="sub-session-item">
                <span class="sub-sess-time">
                  {{ formatTime(sess.start_time) }} - {{ sess.end_time ? formatTime(sess.end_time) : t('common.now', 'Now') }}
                </span>
                <span class="sub-sess-editor" :class="getEditorBadgeClass(sess.editor_name)">
                  {{ sess.editor_name }}
                </span>
                <span class="sub-sess-path" :title="sess.file_path || undefined">{{ sess.file_path === 'Workspace / General' ? t('coding.workspaceGeneral') : (sess.file_path || t('coding.workspaceGeneral')) }}</span>
                <div class="sub-sess-right">
                  <span class="sub-sess-duration">{{ formatDuration(sess.duration_seconds) }}</span>
                  <span class="sub-sess-type" :class="sess.is_ai_assisted ? 'type-ai' : 'type-manual'">
                    {{ sess.is_ai_assisted ? t('coding.ai', 'AI') : t('coding.manual', 'Manual') }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="empty-coding-state" v-else>
        <div class="empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="16 18 22 12 16 6"/>
            <polyline points="8 6 2 12 8 18"/>
          </svg>
        </div>
        <h3>No Coding Sessions for this Day</h3>
        <p>Open one of your editors and start coding to record statistics here.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { invoke } from '@tauri-apps/api/core';
import { useActivityStore, type CodingSession } from '../stores/activity';
import CodingTracker from '../components/CodingTracker.vue';
import CustomCalendar from '../components/CustomCalendar.vue';

const { t } = useI18n();
const store = useActivityStore();

const codingIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`;

const selectedDate = ref(new Date());
const showCalendar = ref(false);
const codingSessions = ref<CodingSession[]>([]);

const codingTotalTime = computed(() =>
  codingSessions.value.reduce((acc, s) => acc + s.duration_seconds, 0)
);

const activeViewMode = ref<'chronological' | 'grouped'>('chronological');
const expandedTimelineFiles = ref<Set<string>>(new Set());

const isToday = computed(() => {
  const today = new Date();
  return selectedDate.value.toDateString() === today.toDateString();
});

const displayDate = computed(() => {
  if (isToday.value) return t('common.today') || 'Today';
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (selectedDate.value.toDateString() === yesterday.toDateString()) {
    return t('common.yesterday') || 'Yesterday';
  }
  
  return selectedDate.value.toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
});

function toggleFile(fileKey: string) {
  const newSet = new Set(expandedTimelineFiles.value);
  if (newSet.has(fileKey)) {
    newSet.delete(fileKey);
  } else {
    newSet.add(fileKey);
  }
  expandedTimelineFiles.value = newSet;
}

const groupedCodingSessions = computed(() => {
  const fileMap: Record<string, {
    key: string;
    filePath: string;
    language: string;
    projectDir: string;
    totalSeconds: number;
    aiSeconds: number;
    manualSeconds: number;
    sessions: CodingSession[];
  }> = {};

  codingSessions.value.forEach(session => {
    let file = session.file_path || 'Workspace / General';
    if (file.includes('/') || file.includes('\\')) {
      const parts = file.split(/[/\\]/);
      file = parts[parts.length - 1];
    }
    if (file.trim() === '') {
      file = 'Workspace / General';
    }

    const lang = session.language || 'Unknown';
    const proj = session.project_dir || 'No Project';

    const key = `${file}|${lang}|${proj}`;

    if (!fileMap[key]) {
      fileMap[key] = {
        key,
        filePath: file,
        language: lang,
        projectDir: proj,
        totalSeconds: 0,
        aiSeconds: 0,
        manualSeconds: 0,
        sessions: []
      };
    }

    const duration = session.duration_seconds || 0;
    fileMap[key].totalSeconds += duration;
    if (session.is_ai_assisted) {
      fileMap[key].aiSeconds += duration;
    } else {
      fileMap[key].manualSeconds += duration;
    }
    fileMap[key].sessions.push(session);
  });

  return Object.values(fileMap)
    .map(f => ({
      ...f,
      aiPercent: f.totalSeconds > 0 ? Math.round((f.aiSeconds / f.totalSeconds) * 100) : 0
    }))
    .sort((a, b) => b.totalSeconds - a.totalSeconds);
});

function goToPreviousDay() {
  const newDate = new Date(selectedDate.value);
  newDate.setDate(newDate.getDate() - 1);
  selectedDate.value = newDate;
}

function goToNextDay() {
  if (!isToday.value) {
    const newDate = new Date(selectedDate.value);
    newDate.setDate(newDate.getDate() + 1);
    selectedDate.value = newDate;
  }
}

async function fetchCodingSessions() {
  try {
    if (isToday.value) {
      codingSessions.value = store.todayCodingSessions;
    } else {
      const startOfDay = new Date(selectedDate.value);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate.value);
      endOfDay.setHours(23, 59, 59, 999);
      
      codingSessions.value = await invoke<CodingSession[]>('get_coding_sessions_range_cmd', {
        startTime: startOfDay.toISOString(),
        endTime: endOfDay.toISOString()
      });
    }
  } catch (error) {
    console.error('Failed to fetch coding sessions:', error);
    codingSessions.value = [];
  }
}

onMounted(async () => {
  await store.fetchCodingData();
  await fetchCodingSessions();
});

watch(selectedDate, async () => {
  await fetchCodingSessions();
});

watch(() => store.todayCodingSessions, () => {
  if (isToday.value) {
    codingSessions.value = store.todayCodingSessions;
  }
}, { deep: true });

function formatTime(timeStr: string): string {
  return new Date(timeStr).toLocaleTimeString(undefined, { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

function formatDuration(seconds: number): string {
  const h_sym = t('common.h_symbol', 'h');
  const m_sym = t('common.m_symbol', 'm');
  const s_sym = t('common.s_symbol', 's');
  if (seconds < 60) return `${seconds}${s_sym}`;
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs}${h_sym} ${mins}${m_sym}`;
  return `${mins}${m_sym}`;
}

function getEditorBadgeClass(editor: string): string {
  const e = editor.toLowerCase();
  if (e.includes('cursor') || e.includes('windsurf')) return 'editor-ai';
  if (e.includes('code') || e.includes('vs code')) return 'editor-vscode';
  if (e.includes('zed')) return 'editor-zed';
  if (e.includes('neovim') || e.includes('vim')) return 'editor-vim';
  if (e.includes('intellij') || e.includes('webstorm') || e.includes('pycharm') ||
      e.includes('clion') || e.includes('goland') || e.includes('phpstorm')) return 'editor-jetbrains';
  return 'editor-default';
}

const LANG_COLORS: Record<string, string> = {
  'Rust': '#CE422B', 'TypeScript': '#3178C6', 'JavaScript': '#F7DF1E',
  'Python': '#3776AB', 'Go': '#00ADD8', 'Ruby': '#CC342D', 'Java': '#ED8B00',
  'Kotlin': '#7F52FF', 'Swift': '#FA7343', 'C': '#A8B9CC', 'C++': '#00599C',
  'C#': '#239120', 'PHP': '#777BB4', 'HTML': '#E34C26', 'CSS': '#1572B6',
  'Vue': '#42B883', 'Svelte': '#FF3E00', 'Markdown': '#083FA1', 'JSON': '#555',
  'YAML': '#CB171E', 'TOML': '#9C4121', 'Shell': '#4EAA25', 'PowerShell': '#012456',
  'SQL': '#336791', 'Lua': '#000080', 'Dart': '#0175C2', 'Zig': '#F7A41D',
};

function getLangColor(lang: string | null): string {
  if (!lang) return '#888';
  return LANG_COLORS[lang] || '#888';
}
</script>

<style scoped>
.coding-view {
  padding: 24px;
  height: 100%;
  overflow-y: auto;
}

.coding-view-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.coding-view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.header-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--bg-tertiary), rgba(139,92,246,0.15));
  border: 1px solid rgba(99,102,241,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a5b4fc;
}

.header-icon :deep(svg) {
  width: 24px;
  height: 24px;
}

h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 2px 0;
}

.header-subtitle {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 0;
}

.date-navigator {
  display: flex;
  align-items: center;
  gap: 6px;
  position: relative;
}

.nav-arrow {
  background: var(--bg-card, rgba(255, 255, 255, 0.04));
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
  color: var(--text-muted);
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-arrow:hover:not(:disabled) {
  background: rgba(99, 102, 241, 0.08);
  border-color: rgba(99, 102, 241, 0.25);
  color: var(--text-primary);
}

.nav-arrow:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.current-date-badge {
  background: var(--bg-card, rgba(255, 255, 255, 0.04));
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
  color: var(--text-primary);
  height: 32px;
  padding: 0 14px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.current-date-badge:hover {
  background: rgba(99, 102, 241, 0.08);
  border-color: rgba(99, 102, 241, 0.25);
}

.calendar-popover {
  position: absolute;
  top: 38px;
  right: 0;
  z-index: 100;
}

.coding-timeline-section {
  background: var(--bg-card, rgba(255,255,255,0.04));
  border: 1px solid rgba(99,102,241,0.2);
  border-radius: 14px;
  overflow: hidden;
}

.coding-timeline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  background: var(--bg-tertiary), rgba(139,92,246,0.08));
  border-bottom: 1px solid rgba(99,102,241,0.15);
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-primary);
  flex-wrap: wrap;
}

.coding-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.coding-timeline-header svg {
  color: #a5b4fc;
  flex-shrink: 0;
}

.coding-timeline-total {
  margin-left: auto;
  font-size: 0.78rem;
  color: #a5b4fc;
  background: rgba(99,102,241,0.15);
  padding: 3px 10px;
  border-radius: 20px;
  border: 1px solid rgba(99,102,241,0.25);
}

.coding-view-toggle {
  display: flex;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 2px;
  margin: 0 auto;
}

.toggle-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  padding: 4px 14px;
  font-size: 0.78rem;
  font-weight: 600;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  color: var(--text-primary);
}

.toggle-btn.active {
  background: var(--color-primary, #6366f1);
  color: #fff;
  box-shadow: 0 2px 6px rgba(99, 102, 241, 0.3);
}

.coding-sessions-list {
  display: flex;
  flex-direction: column;
}

.coding-session-item {
  display: grid;
  grid-template-columns: 130px 1fr;
  gap: 0;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  transition: background 0.15s;
}

.coding-session-item:last-child {
  border-bottom: none;
}

.coding-session-item:hover {
  background: rgba(99,102,241,0.05);
}

.cs-time {
  padding: 10px 14px;
  font-size: 0.72rem;
  color: var(--text-muted);
  font-family: monospace;
  display: flex;
  align-items: center;
  border-right: 1px solid rgba(255,255,255,0.05);
  white-space: nowrap;
}

.cs-content {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  flex-wrap: wrap;
}

.cs-editor-badge {
  padding: 2px 8px;
  border-radius: 5px;
  font-size: 0.68rem;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.cs-editor-badge.editor-vscode  { background: rgba(0,122,204,0.18); color: #60a5fa; border: 1px solid rgba(0,122,204,0.28); }
.cs-editor-badge.editor-zed     { background: rgba(83,191,162,0.18); color: #53BFA2; border: 1px solid rgba(83,191,162,0.28); }
.cs-editor-badge.editor-vim     { background: rgba(24,157,94,0.18); color: #34d399; border: 1px solid rgba(24,157,94,0.28); }
.cs-editor-badge.editor-jetbrains { background: rgba(255,49,140,0.12); color: #f472b6; border: 1px solid rgba(255,49,140,0.22); }
.cs-editor-badge.editor-ai      { background: rgba(16,185,129,0.18); color: #10b981; border: 1px solid rgba(16,185,129,0.3); }
.cs-editor-badge.editor-default { background: rgba(148,163,184,0.12); color: #94a3b8; border: 1px solid rgba(148,163,184,0.2); }

.cs-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cs-file {
  display: flex;
  align-items: center;
  gap: 7px;
}

.cs-lang-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.cs-filename {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cs-lang {
  font-size: 0.65rem;
  padding: 1px 5px;
  background: rgba(148,163,184,0.1);
  border-radius: 3px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.cs-project {
  font-size: 0.72rem;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cs-right {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  flex-shrink: 0;
}

.cs-duration {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-primary);
  font-family: monospace;
}

.cs-ai {
  font-size: 0.85rem;
}

.coding-grouped-list {
  display: flex;
  flex-direction: column;
}

.grouped-file-item {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.grouped-file-item:last-child {
  border-bottom: none;
}

.file-summary-row {
  display: grid;
  grid-template-columns: 40px 2.5fr 2fr 120px;
  gap: 16px;
  align-items: center;
  padding: 14px 18px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.file-summary-row:hover {
  background: rgba(99, 102, 241, 0.04);
}

.file-expand-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.file-expand-toggle svg {
  transition: transform 0.25s ease;
}

.file-expand-toggle svg.rotated {
  transform: rotate(180deg);
}

.file-info-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.file-meta-header {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.file-name {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lang-tag {
  font-size: 0.65rem;
  padding: 1px 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  color: var(--text-muted);
  font-weight: 500;
  flex-shrink: 0;
}

.file-project-sub {
  font-size: 0.72rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
}

.file-progress-col {
  min-width: 0;
}

.file-progress-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-progress-bar {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.06);
  overflow: hidden;
  display: flex;
}

.bar-manual {
  height: 100%;
  background: #6366f1;
}

.bar-ai {
  height: 100%;
  background: #10b981;
}

.file-progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  font-weight: 500;
}

.label-manual {
  color: #a5b4fc;
}

.label-ai {
  color: #6ee7b7;
}

.file-total-time-col {
  display: flex;
  justify-content: flex-end;
}

.file-time-badge {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.06);
  padding: 4px 10px;
  border-radius: 6px;
  font-family: monospace;
  border: 1px solid rgba(255, 255, 255, 0.04);
}

.file-sessions-drawer {
  background: rgba(0, 0, 0, 0.15);
  padding: 10px 18px 14px 56px;
  border-top: 1px dashed rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sub-session-item {
  display: grid;
  grid-template-columns: 110px 100px 1fr 140px;
  gap: 12px;
  align-items: center;
  font-size: 0.76rem;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.sub-session-item:last-child {
  border-bottom: none;
}

.sub-sess-time {
  font-family: monospace;
  color: var(--text-muted);
}

.sub-sess-editor {
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 600;
  text-align: center;
  width: fit-content;
}

.sub-sess-path {
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sub-sess-right {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: flex-end;
}

.sub-sess-duration {
  font-family: monospace;
  font-weight: 600;
  color: var(--text-primary);
}

.sub-sess-type {
  font-size: 0.68rem;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  text-align: center;
  width: 58px;
}

.sub-sess-type.type-manual {
  background: rgba(99, 102, 241, 0.12);
  color: #a5b4fc;
  border: 1px solid rgba(99, 102, 241, 0.2);
}

.sub-sess-type.type-ai {
  background: rgba(16, 185, 129, 0.12);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.empty-coding-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: var(--bg-card, rgba(255, 255, 255, 0.03));
  border: 1px dashed rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  text-align: center;
}

.empty-icon {
  margin-bottom: 16px;
  color: var(--text-muted);
}

.empty-coding-state h3 {
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 6px 0;
}

.empty-coding-state p {
  font-size: 0.85rem;
  color: var(--text-muted);
  max-width: 320px;
  margin: 0;
}

@media (max-width: 768px) {
  .file-summary-row {
    grid-template-columns: 32px 1.5fr 1fr;
  }

  .file-progress-col {
    display: none;
  }

  .file-sessions-drawer {
    padding-left: 36px;
  }

  .sub-session-item {
    grid-template-columns: 1fr;
    gap: 6px;
    padding: 10px 0;
  }

  .sub-sess-right {
    justify-content: space-between;
  }
}

@media (max-width: 600px) {
  .coding-session-item {
    grid-template-columns: 1fr;
  }

  .cs-time {
    border-right: none;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    padding: 8px 14px 4px;
  }

  .cs-content {
    padding: 6px 14px 10px;
  }
}

@media (max-width: 480px) {
  .coding-view-toggle {
    margin: 8px auto 0;
    width: 100%;
    justify-content: center;
  }

  .toggle-btn {
    flex: 1;
    text-align: center;
  }

  .coding-timeline-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .coding-timeline-total {
    margin-left: 0;
  }
}
</style>
