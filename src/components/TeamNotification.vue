<template>
  <div class="team-notifications">
    <TransitionGroup name="team-notif" tag="div">
      <div
        v-for="notif in notifications"
        :key="notif.id"
        class="team-notif-card"
        :class="notif.type"
      >
        <div class="team-notif-icon">
          <span v-if="notif.type === 'report_downloaded'" v-html="Icons.download"></span>
          <span v-else-if="notif.type === 'member_joined'" v-html="Icons.plus"></span>
          <span v-else-if="notif.type === 'member_left'" v-html="Icons.close"></span>
          <span v-else v-html="Icons.about"></span>
        </div>
        <div class="team-notif-content">
          <div class="team-notif-title">{{ notif.title }}</div>
          <div class="team-notif-message">{{ notif.message }}</div>
        </div>
        <button class="team-notif-close" @click="remove(notif.id)">
          <span v-html="Icons.close"></span>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Icons } from './icons/IconMap';

interface TeamNotification {
  id: string;
  type: 'report_downloaded' | 'member_joined' | 'member_left' | 'info';
  title: string;
  message: string;
  timestamp: number;
}

const notifications = ref<TeamNotification[]>([]);

function add(notif: Omit<TeamNotification, 'id' | 'timestamp'>) {
  const id = Date.now().toString() + Math.random().toString(36).slice(2);
  notifications.value.push({
    ...notif,
    id,
    timestamp: Date.now()
  });

  // Auto-remove after 5 seconds
  setTimeout(() => {
    remove(id);
  }, 5000);
}

function remove(id: string) {
  notifications.value = notifications.value.filter(n => n.id !== id);
}

function reportDownloaded(downloadedByName: string) {
  add({
    type: 'report_downloaded',
    title: 'Report Downloaded',
    message: `${downloadedByName} downloaded your activity report`
  });
}

function memberJoined(memberName: string) {
  add({
    type: 'member_joined',
    title: 'Member Joined',
    message: `${memberName} joined the group`
  });
}

function memberLeft(memberName: string) {
  add({
    type: 'member_left',
    title: 'Member Left',
    message: `${memberName} left the group`
  });
}

defineExpose({
  reportDownloaded,
  memberJoined,
  memberLeft,
  add
});
</script>

<style scoped>
.team-notifications {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 380px;
  width: calc(100% - 40px);
  pointer-events: none;
}

.team-notif-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  pointer-events: auto;
  animation: teamNotifSlideIn 0.3s ease-out;
}

.team-notif-card.report_downloaded {
  border-left: 3px solid var(--color-primary);
}

.team-notif-card.member_joined {
  border-left: 3px solid var(--color-success);
}

.team-notif-card.member_left {
  border-left: 3px solid var(--color-warning);
}

.team-notif-card.info {
  border-left: 3px solid var(--color-info, #0ea5e9);
}

.team-notif-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  flex-shrink: 0;
}

.team-notif-icon :deep(svg) {
  width: 18px;
  height: 18px;
}

.team-notif-content {
  flex: 1;
  min-width: 0;
}

.team-notif-title {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-main);
  margin-bottom: 2px;
}

.team-notif-message {
  font-size: 0.82rem;
  color: var(--text-muted);
  line-height: 1.4;
}

.team-notif-close {
  background: transparent;
  border: none;
  color: var(--text-muted);
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition-fast);
  flex-shrink: 0;
}

.team-notif-close:hover {
  background: var(--bg-hover);
  color: var(--text-main);
}

.team-notif-close :deep(svg) {
  width: 14px;
  height: 14px;
}

/* Animations */
.team-notif-enter-active {
  animation: teamNotifSlideIn 0.3s ease-out;
}

.team-notif-leave-active {
  animation: teamNotifSlideOut 0.2s ease-in;
}

@keyframes teamNotifSlideIn {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes teamNotifSlideOut {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}
</style>
