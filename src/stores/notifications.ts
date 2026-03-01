import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  duration?: number;
}

export const useNotificationStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([]);

  function show(notification: Omit<Notification, 'id'>) {
    const id = Date.now().toString();
    notifications.value.push({ ...notification, id });

    const duration = notification.duration ?? 4000;
    if (duration > 0) {
      setTimeout(() => {
        remove(id);
      }, duration);
    }
  }

  function remove(id: string) {
    notifications.value = notifications.value.filter((n) => n.id !== id);
  }

  function success(message: string, title?: string) {
    show({ type: 'success', message, title });
  }
  
  function error(message: string, title?: string) {
    show({ type: 'error', message, title });
  }

  function info(message: string, title?: string) {
    show({ type: 'info', message, title });
  }

  return {
    notifications,
    show,
    remove,
    success,
    error,
    info
  };
});
