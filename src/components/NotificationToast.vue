<template>
  <div class="notification-container">
    <transition-group name="toast">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="toast-card"
        :class="notification.type"
        @click="remove(notification.id)"
      >
        <div class="toast-icon">
          <svg v-if="notification.type === 'success'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          <svg v-else-if="notification.type === 'error'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          <svg v-else-if="notification.type === 'warning'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        </div>
        <div class="toast-content">
          <h4 v-if="notification.title">{{ notification.title }}</h4>
          <p>{{ notification.message }}</p>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { useNotificationStore } from '../stores/notifications';
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';
import { listen } from '@tauri-apps/api/event';

const store = useNotificationStore();
const { notifications } = storeToRefs(store);
const { remove, add } = store;

onMounted(async () => {
  // Listen for system notifications from Rust backend
  await listen('system-notification', (event: any) => {
    const { title, body } = event.payload;
    add({
      title,
      message: body,
      type: detectType(title, body),
    });
  });

  // Listen for task completed
  await listen('task-completed', () => {
    add({
      title: 'Task Completed! 🎉',
      message: "You've reached your goal!",
      type: 'success',
    });
  });

  // Listen for timer warnings
  await listen('timer-warning', (event: any) => {
    add({
      title: event.payload.title || 'Timer Warning',
      message: event.payload.body || 'Time is running out!',
      type: 'warning',
    });
  });
});

function detectType(title: string, body: string): 'success' | 'error' | 'warning' | 'info' {
  const text = (title + ' ' + body).toLowerCase();
  if (text.includes('completed') || text.includes('success') || text.includes('🎉')) {
    return 'success';
  } else if (text.includes('warning') || text.includes('soon') || text.includes('⚠️')) {
    return 'warning';
  } else if (text.includes('error') || text.includes('failed')) {
    return 'error';
  }
  return 'info';
}
</script>

<style scoped>
.notification-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none; /* Allow clicking through container */
}

.toast-card {
  pointer-events: auto;
  background: var(--bg-card, #1e2230);
  border: 1px solid var(--border-color, rgba(255,255,255,0.1));
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  backdrop-filter: blur(12px);
  padding: 16px;
  border-radius: 12px;
  min-width: 300px;
  max-width: 400px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  cursor: pointer;
  border-left: 4px solid;
}

.toast-content h4 {
  margin: 0 0 4px 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-main, #fff);
}
.toast-content p {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-muted, #aaa);
}

.toast-card.success { border-left-color: #10b981; }
.toast-card.error { border-left-color: #ef4444; }
.toast-card.warning { border-left-color: #f59e0b; }
.toast-card.info { border-left-color: #3b82f6; }

/* Transitions */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(30px);
}
</style>
