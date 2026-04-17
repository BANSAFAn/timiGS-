<template>
  <div 
    class="modern-toggle" 
    :class="{ 
      'toggle-checked': modelValue,
      'toggle-disabled': disabled,
      'toggle-small': size === 'small',
      'toggle-large': size === 'large'
    }"
    @click="handleToggle"
    :title="disabled ? 'Disabled' : ''"
  >
    <div class="toggle-track">
      <div class="toggle-track-bg"></div>
      <div class="toggle-icons">
        <span class="icon-on" v-if="showIcons">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </span>
        <span class="icon-off" v-if="showIcons">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </span>
      </div>
    </div>
    <div class="toggle-thumb">
      <div class="thumb-glow"></div>
      <div class="thumb-inner"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  showIcons?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

function handleToggle() {
  if (!props.disabled) {
    emit('update:modelValue', !props.modelValue);
  }
}
</script>

<style scoped>
.modern-toggle {
  position: relative;
  width: 52px;
  height: 28px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}

.modern-toggle.toggle-small {
  width: 44px;
  height: 24px;
}

.modern-toggle.toggle-large {
  width: 60px;
  height: 32px;
}

.modern-toggle.toggle-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Track */
.toggle-track {
  position: absolute;
  inset: 0;
  border-radius: 14px;
  overflow: hidden;
  background: var(--bg-tertiary);
  border: 2px solid var(--border-color);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toggle-track-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--color-primary) 0%, #8b5cf6 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.toggle-checked .toggle-track {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(91, 110, 225, 0.15);
}

.toggle-checked .toggle-track-bg {
  opacity: 1;
}

/* Icons */
.toggle-icons {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  z-index: 1;
  pointer-events: none;
}

.icon-on,
.icon-off {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.icon-on {
  color: white;
  opacity: 0;
  transform: scale(0.5);
}

.icon-off {
  color: var(--text-muted);
  opacity: 1;
  transform: scale(1);
}

.toggle-checked .icon-on {
  opacity: 1;
  transform: scale(1);
}

.toggle-checked .icon-off {
  opacity: 0;
  transform: scale(0.5);
}

/* Thumb */
.toggle-thumb {
  position: absolute;
  top: 50%;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 2;
  transform: translateY(-50%);
}

.toggle-checked .toggle-thumb {
  left: auto;
  right: 2px;
  transform: translateY(-50%);
}

.thumb-glow {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(91, 110, 225, 0.4) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
  animation: pulse 2s ease-in-out infinite;
}

.toggle-checked .thumb-glow {
  opacity: 1;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.3;
  }
}

.thumb-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: var(--text-muted);
  box-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  transition: all 0.3s ease;
}

.toggle-checked .thumb-inner {
  background: white;
  box-shadow: 
    0 2px 8px rgba(91, 110, 225, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.2) inset;
}

/* Hover effects */
.modern-toggle:not(.toggle-disabled):hover .toggle-track {
  border-color: var(--color-primary);
}

.modern-toggle:not(.toggle-disabled):hover .thumb-inner {
  box-shadow: 
    0 2px 6px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.15) inset;
}

/* Active/Click effect */
.modern-toggle:not(.toggle-disabled):active .toggle-thumb {
  width: 24px;
}

.modern-toggle.toggle-checked:not(.toggle-disabled):active .toggle-thumb {
  right: 0px;
}

/* Small size adjustments */
.toggle-small .toggle-thumb {
  width: 16px;
  height: 16px;
}

.toggle-small.toggle-checked .toggle-thumb {
  right: 2px;
}

.toggle-small .toggle-icons {
  padding: 0 6px;
}

.toggle-small .icon-on svg,
.toggle-small .icon-off svg {
  width: 10px;
  height: 10px;
}

/* Large size adjustments */
.toggle-large .toggle-thumb {
  width: 24px;
  height: 24px;
}

.toggle-large.toggle-checked .toggle-thumb {
  right: 2px;
}

.toggle-large .toggle-icons {
  padding: 0 10px;
}

.toggle-large .icon-on svg,
.toggle-large .icon-off svg {
  width: 14px;
  height: 14px;
}

/* Dark theme enhancements */
[data-theme="dark"] .toggle-track {
  background: rgba(255, 255, 255, 0.05);
}

[data-theme="dark"] .toggle-checked .toggle-track {
  box-shadow: 0 0 0 3px rgba(91, 110, 225, 0.25);
}

/* Light theme adjustments */
[data-theme="light"] .toggle-track {
  background: rgba(0, 0, 0, 0.05);
}

[data-theme="light"] .thumb-inner {
  background: #6b7280;
}

[data-theme="light"] .toggle-checked .thumb-inner {
  background: white;
}
</style>
