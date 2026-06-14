import { defineStore } from 'pinia';
import { useNotificationStore } from './notifications';
import { useActivityStore } from './activity';
import { invoke } from '@tauri-apps/api/core';
import { i18n } from '../i18n';

export const useDoctorModeStore = defineStore('doctorMode', {
  state: () => {
    const savedStart = localStorage.getItem('doctorMode_sessionStart');
    const savedLocked = localStorage.getItem('doctorMode_isLocked') === 'true';
    const savedLockEndTime = parseInt(localStorage.getItem('doctorMode_lockEndTime') || '0', 10);
    
    // Check if the lock duration has already expired while the app was closed
    const isLocked = savedLocked && savedLockEndTime > Date.now();
    
    return {
      enabled: localStorage.getItem('doctorMode_enabled') === 'true',
      reminderIntervalMins: parseInt(localStorage.getItem('doctorMode_reminderInterval') || '45', 10),
      lockDurationMins: parseInt(localStorage.getItem('doctorMode_lockDuration') || '60', 10),
      sessionStartTimestamp: savedStart ? parseInt(savedStart, 10) : 0,
      elapsedSeconds: 0,
      idleSeconds: 0,
      intervalId: null as any | null,
      reminderCount: 0,
      maxReminders: parseInt(localStorage.getItem('doctorMode_maxReminders') || '4', 10),
      isLocked: isLocked,
      lockEndTime: isLocked ? savedLockEndTime : 0,
      lastReminderTime: 0,
      currentTime: Date.now(),
    };
  },

  getters: {
    elapsedMins: (state) => Math.floor(state.elapsedSeconds / 60),
    
    secondsUntilLock: (state) => {
      if (state.isLocked) return 0;
      const reminderIntervalSeconds = state.reminderIntervalMins * 60;
      const totalSecondsNeeded = state.maxReminders * reminderIntervalSeconds;
      return Math.max(0, totalSecondsNeeded - state.elapsedSeconds);
    },

    timeUntilLock: (state) => {
      if (state.isLocked) return 0;
      const remindersNeeded = state.maxReminders - state.reminderCount;
      return Math.max(0, remindersNeeded * state.reminderIntervalMins);
    },

    lockTimeRemaining: (state) => {
      if (!state.isLocked || !state.lockEndTime) return 0;
      const now = state.currentTime;
      return Math.max(0, (state.lockEndTime - now) / 60000);
    },

    lockTimeRemainingSeconds: (state) => {
      if (!state.isLocked || !state.lockEndTime) return 0;
      const now = state.currentTime;
      return Math.max(0, Math.floor((state.lockEndTime - now) / 1000));
    },
  },

  actions: {
    toggle(state: boolean) {
      this.enabled = state;
      localStorage.setItem('doctorMode_enabled', state.toString());
      if (this.enabled) {
        this.startTracking();
        
        // Show in-app feedback on manual toggle only
        const notifications = useNotificationStore();
        notifications.success(
          i18n.global.t('settings.notificationEnabledBody', {
            interval: this.reminderIntervalMins,
            max: this.maxReminders,
            duration: this.lockDurationMins
          })
        );
      } else {
        this.stopTracking();
        this.unlock();
      }
    },

    setReminderInterval(mins: number) {
      this.reminderIntervalMins = Math.max(10, Math.min(120, mins));
      localStorage.setItem('doctorMode_reminderInterval', this.reminderIntervalMins.toString());
    },

    setLockDuration(mins: number) {
      this.lockDurationMins = Math.max(15, Math.min(180, mins));
      localStorage.setItem('doctorMode_lockDuration', this.lockDurationMins.toString());
    },

    setMaxReminders(count: number) {
      this.maxReminders = Math.max(1, Math.min(10, count));
      localStorage.setItem('doctorMode_maxReminders', this.maxReminders.toString());
    },

    startTracking() {
      this.stopTracking();

      this.elapsedSeconds = 0;
      this.idleSeconds = 0;
      this.reminderCount = 0;
      this.lastReminderTime = 0;
      this.currentTime = Date.now();

      const now = Date.now();
      const savedStart = localStorage.getItem('doctorMode_sessionStart');
      this.sessionStartTimestamp = savedStart ? parseInt(savedStart, 10) : now;
      if (!savedStart) {
        localStorage.setItem('doctorMode_sessionStart', this.sessionStartTimestamp.toString());
      }

      // If app started and is already locked, enforce backend lock
      if (this.isLocked) {
        invoke('set_doctor_mode_locked_cmd', { locked: true })
          .catch(err => console.error('Failed to set doctor mode lock on startup:', err));
      }

      this.intervalId = setInterval(() => {
        const currentNow = Date.now();
        this.currentTime = currentNow;

        if (this.isLocked) {
          // locked mode tick
          const remaining = this.lockTimeRemainingSeconds;
          if (remaining <= 0) {
            this.unlock();
            
            // Native system notification ONLY (no in-app success toast)
            invoke('send_notification_cmd', {
              title: i18n.global.t('settings.notificationUnlockTitle'),
              body: i18n.global.t('settings.notificationUnlockBody')
            }).catch(err => console.error('Failed to send system notification:', err));
          }
        } else {
          // active mode tick
          // check if user went idle (based on activity store)
          const activityStore = useActivityStore();
          const currentApp = activityStore.currentActivity?.app_name;
          if (currentApp === 'Idle' || currentApp === 'No activity detected' || !currentApp) {
            this.idleSeconds += 1;
            // 5 minutes of idle = reset session
            if (this.idleSeconds >= 300) {
              this.resetSession();
              this.idleSeconds = 0;
            }
          } else {
            this.idleSeconds = 0;
          }

          if (!this.sessionStartTimestamp) {
            this.sessionStartTimestamp = currentNow;
            localStorage.setItem('doctorMode_sessionStart', currentNow.toString());
          }

          // Compute accurate elapsed seconds
          this.elapsedSeconds = Math.max(0, Math.floor((currentNow - this.sessionStartTimestamp) / 1000));
          this.checkReminders();
        }
      }, 1000); // precise tick every second
    },

    stopTracking() {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    },

    resetSession() {
      this.sessionStartTimestamp = Date.now();
      localStorage.setItem('doctorMode_sessionStart', this.sessionStartTimestamp.toString());
      this.elapsedSeconds = 0;
      this.idleSeconds = 0;
      this.reminderCount = 0;
      this.lastReminderTime = 0;
    },

    checkReminders() {
      if (!this.enabled || this.isLocked) return;

      const reminderIntervalSeconds = this.reminderIntervalMins * 60;
      const nextReminderAt = (this.reminderCount + 1) * reminderIntervalSeconds;

      if (this.elapsedSeconds >= nextReminderAt && this.reminderCount < this.maxReminders) {
        this.reminderCount++;
        this.lastReminderTime = this.elapsedSeconds;

        const minutesPassed = Math.floor(this.elapsedSeconds / 60);

        if (this.reminderCount < this.maxReminders) {
          const messageKeys = [
            'settings.notificationReminder1',
            'settings.notificationReminder2',
            'settings.notificationReminder3',
            'settings.notificationReminder4'
          ];
          const messageKey = messageKeys[(this.reminderCount - 1) % messageKeys.length];
          const localizedBody = i18n.global.t(messageKey, { mins: minutesPassed });

          // Native system notification ONLY (no in-app warning toast)
          invoke('send_notification_cmd', {
            title: i18n.global.t('settings.notificationBreakReminderTitle'),
            body: localizedBody
          }).catch(err => console.error('Failed to send native notification:', err));
        } else {
          this.lockPC();
        }
      }
    },

    lockPC() {
      this.isLocked = true;
      this.lockEndTime = Date.now() + (this.lockDurationMins * 60000);
      localStorage.setItem('doctorMode_isLocked', 'true');
      localStorage.setItem('doctorMode_lockEndTime', this.lockEndTime.toString());

      // Invoke backend lock!
      invoke('set_doctor_mode_locked_cmd', { locked: true })
        .catch(err => console.error('Failed to set doctor mode lock:', err));

      // Native system notification ONLY (no in-app error toast)
      invoke('send_notification_cmd', {
        title: i18n.global.t('settings.notificationLockTitle'),
        body: i18n.global.t('settings.notificationLockBody', { count: this.maxReminders, mins: this.lockDurationMins })
      }).catch(err => console.error('Failed to send native notification:', err));
    },

    unlock() {
      this.isLocked = false;
      this.lockEndTime = 0;
      localStorage.removeItem('doctorMode_isLocked');
      localStorage.removeItem('doctorMode_lockEndTime');

      // Invoke backend unlock!
      invoke('set_doctor_mode_locked_cmd', { locked: false })
        .catch(err => console.error('Failed to unset doctor mode lock:', err));

      this.resetSession();
    },

    emergencyUnlock() {
      this.unlock();
      
      // Native system notification ONLY (no in-app warning toast)
      invoke('send_notification_cmd', {
        title: i18n.global.t('settings.notificationEmergencyTitle'),
        body: i18n.global.t('settings.notificationEmergencyBody')
      }).catch(err => console.error('Failed to send native notification:', err));
    },

    forceUnlock() {
      this.isLocked = false;
      this.lockEndTime = 0;
      localStorage.removeItem('doctorMode_isLocked');
      localStorage.removeItem('doctorMode_lockEndTime');

      // Invoke backend unlock!
      invoke('set_doctor_mode_locked_cmd', { locked: false })
        .catch(err => console.error('Failed to force unlock doctor mode:', err));

      this.resetSession();
    },
  }
});
