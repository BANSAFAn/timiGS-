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
          <span v-if="notification.type === 'success'">✅</span>
          <span v-else-if="notification.type === 'error'">❌</span>
          <span v-else-if="notification.type === 'warning'">⚠️</span>
          <span v-else>ℹ️</span>
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

const store = useNotificationStore();
const { notifications } = storeToRefs(store);
const { remove } = store;
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
