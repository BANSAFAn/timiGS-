// src/stores/doctorMode.ts
import { defineStore } from 'pinia';
import { useNotificationStore } from './notifications';

export const useDoctorModeStore = defineStore('doctorMode', {
  state: () => ({
    enabled: localStorage.getItem('doctorMode_enabled') === 'true',
    // Interval in minutes for reminders (default 45)
    reminderIntervalMins: parseInt(localStorage.getItem('doctorMode_reminderInterval') || '45', 10),
    // Lock duration in minutes (default 60)
    lockDurationMins: parseInt(localStorage.getItem('doctorMode_lockDuration') || '60', 10),
    // Current session elapsed time in minutes
    elapsedMins: 0,
    intervalId: null as any | null,
    // Number of reminders sent in current cycle
    reminderCount: 0,
    // Maximum reminders before lock (default 4)
    maxReminders: parseInt(localStorage.getItem('doctorMode_maxReminders') || '4', 10),
    // Whether PC is currently locked
    isLocked: false,
    // Lock end time
    lockEndTime: 0,
    // Last reminder time
    lastReminderTime: 0,
    // Reactive timestamp for timer updates
    currentTime: Date.now(),
  }),

  getters: {
    // Time remaining until lock (in minutes)
    timeUntilLock: (state) => {
      if (state.isLocked) return 0;
      const remindersNeeded = state.maxReminders - state.reminderCount;
      return Math.max(0, remindersNeeded * state.reminderIntervalMins);
    },

    // Time remaining in current lock (in minutes) - reactive
    lockTimeRemaining: (state) => {
      if (!state.isLocked || !state.lockEndTime) return 0;
      // Use currentTime to make this reactive
      const now = state.currentTime;
      const remaining = Math.max(0, (state.lockEndTime - now) / 60000);
      return remaining;
    },
    
    // Lock time remaining in seconds for smooth display
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
      // Reset tracking start
      this.elapsedMins = 0;
      this.reminderCount = 0;
      this.lastReminderTime = 0;

      // Update every minute for reminders
      this.intervalId = setInterval(() => {
        this.elapsedMins += 1;
        this.checkReminders();
      }, 60000); // 1 minute
      
      // Send immediate notification when enabled
      const notifications = useNotificationStore();
      notifications.success(
        `🌿 Doctor Mode Enabled!\n\n` +
        `You will be reminded to take a break every ${this.reminderIntervalMins} minutes. ` +
        `After ${this.maxReminders} reminders, your PC will be locked for ${this.lockDurationMins} minutes.\n\n` +
        `Your health is important!`
      );
    },

    stopTracking() {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    },

    resetSession() {
      this.elapsedMins = 0;
      this.reminderCount = 0;
      this.lastReminderTime = 0;
    },

    checkReminders() {
      if (!this.enabled || this.isLocked) return;

      const notifications = useNotificationStore();

      // Check if we've reached a reminder interval
      // Use >= to catch any missed minutes
      const nextReminderAt = (this.reminderCount + 1) * this.reminderIntervalMins;
      
      if (this.elapsedMins >= nextReminderAt && this.reminderCount < this.maxReminders) {
        this.reminderCount++;
        this.lastReminderTime = this.elapsedMins;

        if (this.reminderCount < this.maxReminders) {
          // Send friendly reminder
          const messages = [
            `🌿 Doctor Mode: You've been at your PC for ${this.elapsedMins} minutes. Time to take a break! Go for a walk, stretch, or rest your eyes.`,
            `💚 Health Reminder: ${this.elapsedMins} minutes of screen time! Your body needs a break. Step away from the computer for a few minutes.`,
            `🌸 Doctor Mode: Don't forget to take care of yourself! You've been working for ${this.elapsedMins} minutes. Time for a short break!`,
            `☕ Break Time: ${this.elapsedMins} minutes passed. How about a cup of tea and some fresh air? Your health matters!`
          ];

          const messageIndex = (this.reminderCount - 1) % messages.length;
          notifications.warning(messages[messageIndex]);
        } else {
          // Max reminders reached - lock the PC
          this.lockPC();
        }
      }
    },

    lockPC() {
      this.isLocked = true;
      this.lockEndTime = Date.now() + (this.lockDurationMins * 60000);

      const notifications = useNotificationStore();
      notifications.error(
        `🔒 Doctor Mode: PC Locked for Your Health!\n\n` +
        `You've ignored ${this.maxReminders} break reminders. ` +
        `Your computer is now locked for ${this.lockDurationMins} minutes.\n\n` +
        `Please go for a walk, drink some tea, or rest your eyes. ` +
        `Your health is more important than any task!`
      );

      // Start countdown to unlock - update every second for smooth timer
      const unlockInterval = setInterval(() => {
        // Update currentTime to make lockTimeRemaining reactive
        this.currentTime = Date.now();
        
        const remaining = this.lockTimeRemainingSeconds;

        if (remaining <= 0) {
          this.unlock();
          clearInterval(unlockInterval);

          notifications.success(
            `🎉 Doctor Mode: PC Unlocked!\n\n` +
            `Welcome back! Remember to take regular breaks every ${this.reminderIntervalMins} minutes. ` +
            `Your health is your greatest asset!`
          );
        }
      }, 1000); // Update every second for smooth countdown
    },

    unlock() {
      this.isLocked = false;
      this.lockEndTime = 0;
      this.resetSession();
    },

    // Manual unlock (for emergencies)
    emergencyUnlock() {
      this.unlock();
      const notifications = useNotificationStore();
      notifications.warning(
        `⚠️ Emergency Unlock: PC unlocked manually. ` +
        `Please remember to take breaks for your health!`
      );
    },
    
    // Force unlock (for testing/debugging)
    forceUnlock() {
      this.isLocked = false;
      this.lockEndTime = 0;
      this.elapsedMins = 0;
      this.reminderCount = 0;
    },
  }
});
