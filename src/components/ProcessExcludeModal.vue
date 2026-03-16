<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-container" @click.stop>
        <!-- Header -->
        <div class="modal-header">
          <div class="modal-title-row">
            <div class="modal-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
              </svg>
            </div>
            <h3>{{ $t('excludeProcesses.title') || 'Manage Process Tracking' }}</h3>
          </div>
          <button class="close-btn" @click="$emit('close')">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- Tabs -->
        <div class="modal-tabs">
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'tracked' }"
            @click="activeTab = 'tracked'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            {{ $t('excludeProcesses.trackedTab') || 'Tracked' }}
            <span class="tab-count">{{ trackedProcesses.length }}</span>
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'excluded' }"
            @click="activeTab = 'excluded'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
            </svg>
            {{ $t('excludeProcesses.excludedTab') || 'Excluded' }}
            <span class="tab-count excluded" v-if="store.excludedProcesses.length > 0">{{ store.excludedProcesses.length }}</span>
            <span class="tab-count" v-else>0</span>
          </button>
        </div>

        <!-- Search -->
        <div class="modal-search">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            v-model="searchQuery" 
            :placeholder="$t('excludeProcesses.searchPlaceholder') || 'Search processes...'"
            class="search-input"
          />
        </div>

        <!-- Body -->
        <div class="modal-body">
          <!-- Tracked Processes Tab -->
          <div v-if="activeTab === 'tracked'" class="process-list">
            <div v-if="filteredTracked.length === 0" class="empty-list">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              <p>{{ $t('excludeProcesses.noProcesses') || 'No processes found' }}</p>
            </div>

            <div 
              v-for="proc in filteredTracked" 
              :key="proc.exe_path"
              class="process-item"
            >
              <div class="process-icon">
                <img v-if="appIcons[proc.app_name]" :src="appIcons[proc.app_name]" class="icon-img" />
                <div v-else class="icon-fallback" :style="{ background: getAppColor(proc.app_name) }">
                  {{ proc.app_name.charAt(0).toUpperCase() }}
                </div>
              </div>
              <div class="process-info">
                <span class="process-name">{{ proc.app_name }}</span>
                <span class="process-path">{{ truncatePath(proc.exe_path) }}</span>
              </div>
              <button 
                class="action-btn exclude-action"
                @click="excludeProcess(proc.exe_path)"
                :title="$t('excludeProcesses.excludeAction') || 'Stop tracking'"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                </svg>
                <span>{{ $t('excludeProcesses.excludeAction') || 'Exclude' }}</span>
              </button>
            </div>
          </div>

          <!-- Excluded Processes Tab -->
          <div v-if="activeTab === 'excluded'" class="process-list">
            <div v-if="filteredExcluded.length === 0" class="empty-list">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <p>{{ $t('excludeProcesses.allTracked') || 'All processes are being tracked' }}</p>
            </div>

            <div 
              v-for="exePath in filteredExcluded" 
              :key="exePath"
              class="process-item excluded"
            >
              <div class="process-icon">
                <div class="icon-fallback excluded-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                  </svg>
                </div>
              </div>
              <div class="process-info">
                <span class="process-name">{{ getAppNameFromPath(exePath) }}</span>
                <span class="process-path excluded-path">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                  </svg>
                  {{ $t('excludeProcesses.notBeingTracked') || 'Not being tracked' }}
                </span>
              </div>
              <button 
                class="action-btn include-action"
                @click="includeProcess(exePath)"
                :title="$t('excludeProcesses.includeAction') || 'Resume tracking'"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>{{ $t('excludeProcesses.includeAction') || 'Track' }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Footer info -->
        <div class="modal-footer">
          <div class="footer-info">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <span>{{ $t('excludeProcesses.footerHint') || 'Excluded processes still appear in Timeline with a "Not Tracked" badge' }}</span>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { useActivityStore } from '../stores/activity';

const emit = defineEmits(['close']);
const store = useActivityStore();

const activeTab = ref<'tracked' | 'excluded'>('tracked');
const searchQuery = ref('');
const appIcons = ref<Record<string, string>>({});

// Get unique tracked processes from today's summary
const trackedProcesses = computed(() => {
  return store.todaySummary
    .filter(app => !store.isProcessExcluded(app.exe_path))
    .map(app => ({
      app_name: app.app_name,
      exe_path: app.exe_path,
      total_seconds: app.total_seconds
    }))
    .sort((a, b) => b.total_seconds - a.total_seconds);
});

const filteredTracked = computed(() => {
  if (!searchQuery.value) return trackedProcesses.value;
  const q = searchQuery.value.toLowerCase();
  return trackedProcesses.value.filter(p => 
    p.app_name.toLowerCase().includes(q) || 
    p.exe_path.toLowerCase().includes(q)
  );
});

const filteredExcluded = computed(() => {
  if (!searchQuery.value) return store.excludedProcesses;
  const q = searchQuery.value.toLowerCase();
  return store.excludedProcesses.filter(p => p.toLowerCase().includes(q));
});

function getAppColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 55%, 45%)`;
}

function getAppNameFromPath(exePath: string): string {
  const parts = exePath.replace(/\\/g, '/').split('/');
  const filename = parts[parts.length - 1] || 'Unknown';
  return filename.replace(/\.exe$/i, '');
}

function truncatePath(path: string): string {
  if (path.length <= 50) return path;
  const parts = path.replace(/\\/g, '/').split('/');
  if (parts.length <= 3) return path;
  return parts[0] + '/.../' + parts.slice(-2).join('/');
}

async function excludeProcess(exePath: string) {
  try {
    await store.addExcludedProcess(exePath);
  } catch (error) {
    console.error('Failed to exclude process:', error);
  }
}

async function includeProcess(exePath: string) {
  try {
    await store.removeExcludedProcess(exePath);
  } catch (error) {
    console.error('Failed to include process:', error);
  }
}

async function loadIcons() {
  for (const app of store.todaySummary) {
    if (appIcons.value[app.app_name] || !app.exe_path) continue;
    try {
      const base64 = await invoke<string | null>('get_app_icon', { path: app.exe_path });
      if (base64) {
        appIcons.value[app.app_name] = `data:image/png;base64,${base64}`;
      }
    } catch { /* fallback to letter */ }
  }
}

onMounted(async () => {
  await store.fetchExcludedProcesses();
  if (store.todaySummary.length === 0) {
    await store.fetchTodayData();
  }
  loadIcons();
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.modal-container {
  background: linear-gradient(160deg, rgba(25, 25, 45, 0.98), rgba(15, 15, 30, 0.99));
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  width: 95%;
  max-width: 560px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 
    0 24px 80px rgba(0, 0, 0, 0.5),
    0 0 60px rgba(99, 102, 241, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}

/* Header */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 28px 16px;
}

.modal-title-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.modal-icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.08));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ef4444;
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.15);
}

.modal-header h3 {
  font-size: 1.2rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
  letter-spacing: -0.3px;
}

.close-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.15);
}

/* Tabs */
.modal-tabs {
  display: flex;
  gap: 6px;
  padding: 0 28px;
  margin-bottom: 16px;
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.8);
}

.tab-btn.active {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.18), rgba(99, 102, 241, 0.08));
  border-color: rgba(99, 102, 241, 0.3);
  color: #a5b4fc;
  box-shadow: 0 2px 12px rgba(99, 102, 241, 0.15);
}

.tab-count {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.5);
  min-width: 22px;
  text-align: center;
}

.tab-btn.active .tab-count {
  background: rgba(99, 102, 241, 0.25);
  color: #a5b4fc;
}

.tab-count.excluded {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

/* Search */
.modal-search {
  position: relative;
  padding: 0 28px;
  margin-bottom: 16px;
}

.modal-search .search-icon {
  position: absolute;
  left: 42px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.3);
  pointer-events: none;
}

.modal-search .search-input {
  width: 100%;
  padding: 12px 16px 12px 40px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  color: #fff;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  outline: none;
}

.modal-search .search-input:focus {
  border-color: rgba(99, 102, 241, 0.4);
  background: rgba(255, 255, 255, 0.06);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.modal-search .search-input::placeholder {
  color: rgba(255, 255, 255, 0.25);
}

/* Body */
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 28px 16px;
  min-height: 200px;
  max-height: 400px;
}

.modal-body::-webkit-scrollbar {
  width: 6px;
}

.modal-body::-webkit-scrollbar-track {
  background: transparent;
}

.modal-body::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Process List */
.process-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.process-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01));
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  transition: all 0.25s ease;
}

.process-item:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.03));
  border-color: rgba(255, 255, 255, 0.12);
  transform: translateX(4px);
}

.process-item.excluded {
  border-color: rgba(239, 68, 68, 0.15);
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.05), rgba(239, 68, 68, 0.02));
}

.process-item.excluded:hover {
  border-color: rgba(239, 68, 68, 0.25);
}

/* Process Icon */
.process-icon {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
}

.icon-img {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  object-fit: contain;
  background: rgba(255, 255, 255, 0.05);
  padding: 4px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.icon-fallback {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.excluded-icon {
  background: rgba(239, 68, 68, 0.15) !important;
  color: #ef4444 !important;
  font-size: 1rem;
}

/* Process Info */
.process-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.process-name {
  font-weight: 600;
  font-size: 0.95rem;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.process-path {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.35);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: 'Consolas', 'Monaco', monospace;
}

.excluded-path {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #ef4444;
  font-family: inherit;
  font-weight: 500;
}

/* Action Buttons */
.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid transparent;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.exclude-action {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.exclude-action:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
  color: #ef4444;
  box-shadow: 0 2px 12px rgba(239, 68, 68, 0.2);
  transform: scale(1.02);
}

.include-action {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.2);
  color: #34d399;
}

.include-action:hover {
  background: rgba(16, 185, 129, 0.2);
  border-color: rgba(16, 185, 129, 0.4);
  color: #10b981;
  box-shadow: 0 2px 12px rgba(16, 185, 129, 0.2);
  transform: scale(1.02);
}

/* Empty List */
.empty-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 20px;
  color: rgba(255, 255, 255, 0.35);
  text-align: center;
}

.empty-list svg {
  opacity: 0.3;
  margin-bottom: 16px;
}

.empty-list p {
  font-size: 0.95rem;
  font-weight: 500;
}

/* Footer */
.modal-footer {
  padding: 14px 28px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.footer-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.35);
  font-weight: 400;
}

.footer-info svg {
  flex-shrink: 0;
  opacity: 0.6;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    transform: translateY(30px) scale(0.96); 
    opacity: 0; 
  }
  to { 
    transform: translateY(0) scale(1); 
    opacity: 1; 
  }
}

/* Responsive */
@media (max-width: 600px) {
  .modal-container {
    max-width: 100%;
    width: 100%;
    max-height: 90vh;
    border-radius: 20px 20px 0 0;
    margin-top: auto;
  }

  .modal-header {
    padding: 20px 20px 12px;
  }

  .modal-tabs,
  .modal-search,
  .modal-footer {
    padding-left: 20px;
    padding-right: 20px;
  }

  .modal-body {
    padding: 0 20px 16px;
  }

  .action-btn span {
    display: none;
  }

  .action-btn {
    padding: 10px;
    border-radius: 10px;
  }
}
</style>
