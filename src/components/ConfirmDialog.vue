<template>
  <Transition name="dialog-fade">
    <div v-if="visible" class="dialog-overlay" @click.self="handleOverlayClick">
      <div class="dialog-card animate-scale">
        <div class="dialog-icon" :class="type">
          <span v-if="type === 'warning'" v-html="Icons.warning"></span>
          <span v-else-if="type === 'danger'" v-html="Icons.trash"></span>
          <span v-else v-html="Icons.about"></span>
        </div>

        <div class="dialog-content">
          <h3 class="dialog-title">{{ title }}</h3>
          <p class="dialog-message">{{ message }}</p>
        </div>

        <div class="dialog-actions" :class="{ 'center': singleButton }">
          <button
            v-if="!singleButton"
            class="btn btn-secondary"
            @click="handleCancel"
          >
            {{ cancelText }}
          </button>
          <button
            class="btn"
            :class="confirmClass"
            @click="handleConfirm"
            :autofocus="true"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Icons } from './icons/IconMap';

const visible = ref(false);
const resolveRef = ref<((value: boolean) => void) | null>(null);

const title = ref('');
const message = ref('');
const confirmText = ref('OK');
const cancelText = ref('Cancel');
const type = ref<'warning' | 'danger' | 'info'>('info');
const singleButton = ref(false);

const confirmClass = computed(() => {
  if (type.value === 'danger') return 'btn-danger';
  if (type.value === 'warning') return 'btn-warning';
  return 'btn-primary';
});

function show(options: {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
  showCancel?: boolean;
}): Promise<boolean> {
  title.value = options.title;
  message.value = options.message;
  confirmText.value = options.confirmText || 'OK';
  cancelText.value = options.cancelText || 'Cancel';
  type.value = options.type || 'info';
  singleButton.value = options.showCancel === false;
  visible.value = true;

  return new Promise((resolve) => {
    resolveRef.value = resolve;
  });
}

function handleConfirm() {
  visible.value = false;
  if (resolveRef.value) {
    resolveRef.value(true);
    resolveRef.value = null;
  }
}

function handleCancel() {
  visible.value = false;
  if (resolveRef.value) {
    resolveRef.value(false);
    resolveRef.value = null;
  }
}

function handleOverlayClick() {
  if (!singleButton.value) {
    handleCancel();
  }
}

defineExpose({ show });
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.dialog-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: 32px;
  max-width: 420px;
  width: 90%;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
  text-align: center;
}

.dialog-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}

.dialog-icon.warning {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.dialog-icon.danger {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.dialog-icon.info {
  background: rgba(91, 110, 225, 0.15);
  color: var(--color-primary);
}

.dialog-icon :deep(svg) {
  width: 28px;
  height: 28px;
}

.dialog-content {
  margin-bottom: 24px;
}

.dialog-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 8px;
}

.dialog-message {
  color: var(--text-muted);
  font-size: 0.95rem;
  line-height: 1.5;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.dialog-actions.center {
  justify-content: center;
}

.dialog-actions .btn {
  min-width: 100px;
}

/* Animations */
.animate-scale {
  animation: dialogScale 0.2s ease-out;
}

@keyframes dialogScale {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.dialog-fade-enter-active {
  animation: dialogFadeIn 0.2s ease-out;
}

.dialog-fade-leave-active {
  animation: dialogFadeOut 0.15s ease-in;
}

@keyframes dialogFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes dialogFadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}
</style>
