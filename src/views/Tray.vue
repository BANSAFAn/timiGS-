<template>
  <div class="tray-popup">
    <div class="tray-header">
      <div class="brand-row">
        <img src="/icons/128x128.png" alt="TimiGS" class="brand-icon" />
        <span class="brand">TimiGS</span>
      </div>
      <span class="status-badge" :class="{ active: isTracking }">
        {{ isTracking ? "● Tracking" : "○ Idle" }}
      </span>
    </div>

    <div class="tray-sep"></div>

    <button class="tray-btn open-btn" @click="showMainWindow">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
      <span>Open App</span>
    </button>

    <button class="tray-btn quit-btn" @click="quitApp">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      <span>Quit</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getCurrentWindow, Window } from "@tauri-apps/api/window";
import { exit } from "@tauri-apps/plugin-process";
import { invoke } from "@tauri-apps/api/core";

const trayWindow = getCurrentWindow();
const isTracking = ref(false);

async function refreshStatus() {
  try {
    isTracking.value = await invoke<boolean>("is_tracking");
  } catch {
    isTracking.value = false;
  }
}

onMounted(() => {
  refreshStatus();
  // Refresh each time the popup is shown
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) refreshStatus();
  });
});

async function hideTray() {
  try {
    await trayWindow.hide();
  } catch (e) {
    console.error("[Tray] Failed to hide:", e);
  }
}

async function showMainWindow() {
  try {
    const mainWin = await Window.getByLabel("main");
    if (mainWin) {
      await mainWin.show();
      await mainWin.unminimize();
      await mainWin.setFocus();
    }
    await hideTray();
  } catch (e) {
    console.error("[Tray] Failed to show main window:", e);
  }
}

async function quitApp() {
  try {
    await exit(0);
  } catch (e) {
    console.error("[Tray] Quit failed:", e);
  }
}

// ESC key to hide
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") hideTray();
});
</script>

<style scoped>
.tray-popup {
  width: 220px;
  background: #1a1d2e;
  border: 1px solid rgba(139, 92, 246, 0.25);
  border-radius: 12px;
  padding: 12px;
  font-family:
    "Segoe UI",
    system-ui,
    -apple-system,
    sans-serif;
  color: #e2e8f0;
  box-shadow:
    0 16px 48px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.04),
    0 0 20px rgba(139, 92, 246, 0.08);
  overflow: hidden;
  user-select: none;
}

.tray-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 4px 8px;
}

.brand-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.brand-icon {
  width: 20px;
  height: 20px;
  border-radius: 4px;
}

.brand {
  font-weight: 700;
  font-size: 0.95rem;
  background: linear-gradient(135deg, #a78bfa, #818cf8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.status-badge {
  font-size: 0.7rem;
  padding: 3px 8px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  color: #94a3b8;
  font-weight: 500;
  letter-spacing: 0.02em;
}

.status-badge.active {
  background: rgba(34, 197, 94, 0.12);
  color: #4ade80;
}

.tray-sep {
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
  margin: 4px 0 6px;
}

.tray-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  background: transparent;
  color: #e2e8f0;
  border-radius: 8px;
  font-size: 0.85rem;
  font-family: inherit;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  transition: all 0.12s ease;
}

.tray-btn svg {
  flex-shrink: 0;
  opacity: 0.8;
}

.open-btn:hover {
  background: rgba(139, 92, 246, 0.15);
  color: #c4b5fd;
}

.open-btn:hover svg {
  opacity: 1;
  color: #a78bfa;
}

.open-btn:active {
  background: rgba(139, 92, 246, 0.25);
  transform: scale(0.98);
}

.quit-btn {
  color: #94a3b8;
  margin-top: 2px;
}

.quit-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
}

.quit-btn:hover svg {
  opacity: 1;
  color: #f87171;
}

.quit-btn:active {
  background: rgba(239, 68, 68, 0.18);
  transform: scale(0.98);
}
</style>
