<template>
  <div class="tray-container">
    <div class="tray-menu">
      <div class="tray-header">
        <span class="tray-title">TimiGS</span>
        <button class="btn-icon-close" @click="hideTray" title="Close">✕</button>
      </div>

      <button class="menu-item" @click="navigateTo('/')">
        <span class="icon">🏠</span>
        <span>Dashboard</span>
      </button>

      <button class="menu-item" @click="navigateTo('/tools')">
        <span class="icon">🛠️</span>
        <span>Tools</span>
      </button>

      <button class="menu-item" @click="navigateTo('/settings')">
          <span class="icon">⚙️</span>
          <span>Settings</span>
      </button>

      <button class="menu-item" @click="navigateTo('/analytics')">
          <span class="icon">📊</span>
          <span>Analytics</span>
      </button>

      <div class="divider"></div>

      <button class="menu-item danger" @click="quitApp">
        <span class="icon">🚪</span>
        <span>Quit</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";

// No dynamic resizing needed - using fixed size from config

async function hideTray() {
  await getCurrentWindow().hide();
}

async function navigateTo(path: string) {
    await invoke("show_main_window_cmd"); 
    await invoke("emit_navigate_cmd", { path });
    await hideTray();
}

async function quitApp() {
  await invoke("quit_app_cmd");
}
</script>

<style scoped>
.tray-container {
  width: 100%;
  height: auto;
  padding: 0;
  margin: 0;
  background: transparent;
  display: flex;
  flex-direction: column;
}

.tray-menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: #1e293b; /* Slate-800 */
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 6px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  min-width: 180px;
}

.tray-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  margin-bottom: 4px;
  border-bottom: 1px solid #334155;
}

.tray-title {
  font-weight: 600;
  font-size: 0.85rem;
  color: #f1f5f9;
}

.btn-icon-close {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 1rem;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.btn-icon-close:hover {
  background: #334155;
  color: #f1f5f9;
}

.menu-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    background: transparent;
    border: none;
    border-radius: 6px;
    color: #f1f5f9;
    cursor: pointer;
    font-size: 0.9rem;
    font-family: inherit;
    text-align: left;
    transition: all 0.15s ease;
    width: 100%;
}

.menu-item:hover {
    background: #334155; /* Slate-700 */
}

.menu-item .icon {
    font-size: 1.1rem;
    width: 20px;
    display: flex;
    justify-content: center;
}

.divider {
    height: 1px;
    background: #334155;
    margin: 4px 0;
}

.menu-item.danger {
    color: #ef4444;
}

.menu-item.danger:hover {
    background: rgba(239, 68, 68, 0.1);
}
</style>
