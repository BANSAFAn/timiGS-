<template>
  <div class="tray-container">
    <div class="tray-card">
      <div class="tray-header">
        <div class="app-info">
          <img src="/icons/128x128.png" alt="Logo" class="tray-logo" />
          <div class="app-text">
            <span class="app-name">TimiGS</span>
            <span class="app-status">Running</span>
          </div>
        </div>
        <button class="btn-close" @click="hideTray">✕</button>
      </div>

      <div class="tray-actions">
        <button class="tray-btn" @click="showWindow">
          <span class="icon">🖥️</span>
          <span>Open Dashboard</span>
        </button>
        
        <button class="tray-btn" @click="toggleTracking">
            <span class="icon">{{ isTracking ? '⏸️' : '▶️' }}</span>
            <span>{{ isTracking ? 'Pause Tracking' : 'Resume Tracking' }}</span>
        </button>

        <div class="divider"></div>

        <button class="tray-btn danger" @click="quitApp">
          <span class="icon">🚪</span>
          <span>Quit TimiGS</span>
        </button>
      </div>
      
      <div class="tray-footer">
        <span class="version">v1.1.0</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";

const isTracking = ref(true);

onMounted(async () => {
    // Sync tracking status
    await checkStatus();
    // Update every few seconds
    setInterval(checkStatus, 5000);
});

async function checkStatus() {
    isTracking.value = await invoke("is_tracking");
}

async function hideTray() {
  await getCurrentWindow().hide();
}

async function showWindow() {
  await invoke("show_main_window_cmd"); // We might need to implement this or use window label
  // Since we can't easily reference main window from here without label, let's assume valid command or use window API if allowed
  // Actually, standard way:
  // We can't access other windows directly from this webview easily without tauri API.
  // Best is to emit event or invoke command.
  // Let's rely on a command 'show_main_window' we'll add to lib.rs
  await invoke("show_window_cmd"); 
  await hideTray();
}

async function toggleTracking() {
    if (isTracking.value) {
        await invoke("stop_tracking");
    } else {
        await invoke("start_tracking");
    }
    isTracking.value = !isTracking.value;
}

async function quitApp() {
  await invoke("quit_app_cmd"); // We'll add this
}
</script>

<style scoped>
.tray-container {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: transparent; /* allow mouse through? No, window should be sizable */
  /* Actually for a tray window, it usually takes full size of window we defined. */
  padding: 10px;
  box-sizing: border-box;
}

.tray-card {
  width: 100%;
  max-width: 300px;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  gap: 16px;
  color: white;
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}

.tray-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.app-info {
    display: flex;
    align-items: center;
    gap: 10px;
}

.tray-logo {
    width: 32px;
    height: 32px;
    border-radius: 8px;
}

.app-text {
    display: flex;
    flex-direction: column;
}

.app-name {
    font-weight: 700;
    font-size: 0.95rem;
}

.app-status {
    font-size: 0.75rem;
    color: #10b981;
}

.btn-close {
    background: transparent;
    border: none;
    color: rgba(255,255,255,0.5);
    font-size: 1.2rem;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
}
.btn-close:hover {
    background: rgba(255,255,255,0.1);
    color: white;
}

.tray-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.tray-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: rgba(255,255,255,0.05);
    border: none;
    border-radius: 10px;
    color: #e2e8f0;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
    text-align: left;
}

.tray-btn:hover {
    background: rgba(255,255,255,0.1);
    transform: translateX(2px);
}

.tray-btn .icon {
    font-size: 1.1rem;
    width: 24px;
    text-align: center;
}

.divider {
    height: 1px;
    background: rgba(255,255,255,0.1);
    margin: 4px 0;
}

.tray-btn.danger {
    color: #ef4444;
}

.tray-btn.danger:hover {
    background: rgba(239, 68, 68, 0.1);
}

.tray-footer {
    text-align: center;
    font-size: 0.7rem;
    color: rgba(255,255,255,0.3);
}
</style>
