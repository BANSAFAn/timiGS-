<template>
  <div class="tray-container">
    <div class="tray-header">
      <div class="logo">
        <span class="logo-icon">⏱️</span>
        <span class="logo-text">TimiGS</span>
      </div>
      <button class="close-btn" @click="hideTray">×</button>
    </div>
    
    <div class="tray-menu">
      <div class="menu-section">
        <span class="section-label">Navigation</span>
        <button class="menu-item" @click="navigateTo('/')">
          <span class="icon" v-html="Icons.dashboard"></span>
          <span>Dashboard</span>
          <span class="shortcut">1</span>
        </button>

        <button class="menu-item" @click="navigateTo('/timeline')">
          <span class="icon" v-html="Icons.timeline"></span>
          <span>Timeline</span>
          <span class="shortcut">2</span>
        </button>

        <button class="menu-item" @click="navigateTo('/tools')">
          <span class="icon" v-html="Icons.tools"></span>
          <span>Tools</span>
          <span class="shortcut">3</span>
        </button>

        <button class="menu-item" @click="navigateTo('/analytics')">
          <span class="icon" v-html="Icons.analytics"></span>
          <span>Analytics</span>
          <span class="shortcut">4</span>
        </button>
      </div>

      <div class="menu-section">
        <span class="section-label">Settings</span>
        <button class="menu-item" @click="navigateTo('/settings')">
          <span class="icon" v-html="Icons.settings"></span>
          <span>Settings</span>
        </button>
      </div>

      <div class="divider"></div>

      <button class="menu-item danger" @click="quitApp">
        <span class="icon" v-html="Icons.cancelFocus"></span>
        <span>Quit TimiGS</span>
        <span class="shortcut">Q</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Icons } from "../components/icons/IconMap";

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
  width: 280px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05);
}

.tray-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px 12px;
  border-bottom: 1px solid #334155;
  margin-bottom: 8px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  font-size: 1.5rem;
}

.logo-text {
  font-weight: 700;
  font-size: 1.1rem;
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.close-btn {
  background: rgba(255, 255, 255, 0.05);
  border: none;
  color: #94a3b8;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #f1f5f9;
}

.tray-menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.menu-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.section-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #64748b;
  font-weight: 600;
  padding: 6px 12px 4px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #f1f5f9;
  cursor: pointer;
  font-size: 0.9rem;
  font-family: inherit;
  text-align: left;
  transition: all 0.15s ease;
  width: 100%;
}

.menu-item:hover {
  background: #334155;
  transform: translateX(2px);
}

.menu-item .icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8b5cf6;
}

.menu-item .icon :deep(svg) {
  width: 18px;
  height: 18px;
}

.menu-item .shortcut {
  margin-left: auto;
  font-size: 0.75rem;
  color: #64748b;
  background: rgba(255, 255, 255, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}

.menu-item:hover .shortcut {
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.1);
}

.divider {
  height: 1px;
  background: #334155;
  margin: 8px 0;
}

.menu-item.danger {
  color: #ef4444;
}

.menu-item.danger .icon {
  color: #ef4444;
}

.menu-item.danger:hover {
  background: rgba(239, 68, 68, 0.1);
}

.menu-item.danger:hover .shortcut {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}
</style>
