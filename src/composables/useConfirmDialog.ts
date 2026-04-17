import { ref, type Ref } from 'vue';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
  showCancel?: boolean;
}

// Global reference to the ConfirmDialog component instance
const dialogRef: Ref<{ show: (options: ConfirmOptions) => Promise<boolean> } | null> = ref(null);

export function useConfirmDialog() {
  function setDialogRef(el: { show: (options: ConfirmOptions) => Promise<boolean> } | null) {
    dialogRef.value = el;
  }

  async function confirm(options: ConfirmOptions): Promise<boolean> {
    if (!dialogRef.value) {
      console.warn('ConfirmDialog component not registered');
      return window.confirm(options.message);
    }
    return dialogRef.value.show(options);
  }

  // Convenience methods
  async function warning(message: string, title = 'Warning'): Promise<boolean> {
    return confirm({ title, message, type: 'warning' });
  }

  async function danger(message: string, title = 'Confirm'): Promise<boolean> {
    return confirm({ title, message, type: 'danger', confirmText: 'Delete', cancelText: 'Cancel' });
  }

  async function info(message: string, title = 'Info'): Promise<boolean> {
    return confirm({ title, message, type: 'info', showCancel: false });
  }

  return {
    setDialogRef,
    confirm,
    warning,
    danger,
    info
  };
}

// Export a shared instance getter
export function getConfirmDialog() {
  return {
    setDialogRef: (el: { show: (options: ConfirmOptions) => Promise<boolean> } | null) => {
      dialogRef.value = el;
    },
    confirm: (options: ConfirmOptions) => {
      if (!dialogRef.value) {
        console.warn('ConfirmDialog component not registered');
        return Promise.resolve(window.confirm(options.message));
      }
      return dialogRef.value.show(options);
    },
    warning: (message: string, title = 'Warning') => {
      return getConfirmDialog().confirm({ title, message, type: 'warning' });
    },
    danger: (message: string, title = 'Confirm') => {
      return getConfirmDialog().confirm({ title, message, type: 'danger', confirmText: 'Delete', cancelText: 'Cancel' });
    },
    info: (message: string, title = 'Info') => {
      return getConfirmDialog().confirm({ title, message, type: 'info', showCancel: false });
    }
  };
}
