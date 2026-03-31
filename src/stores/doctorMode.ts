// src/stores/doctorMode.ts
import { defineStore } from 'pinia';
import { useNotificationStore } from './notifications';

export const useDoctorModeStore = defineStore('doctorMode', {
  state: () => ({
    enabled: localStorage.getItem('doctorMode_enabled') === 'true',
    // Limit in minutes
    timeLimitMins: parseInt(localStorage.getItem('doctorMode_timeLimit') || '120', 10),
    // Current session elapsed time in minutes
    elapsedMins: 0,
    intervalId: null as any | null,
    lastAlertMins: 0,
  }),

  actions: {
    toggle(state: boolean) {
      this.enabled = state;
      localStorage.setItem('doctorMode_enabled', state.toString());
      if (this.enabled) {
        this.startTracking();
      } else {
        this.stopTracking();
      }
    },

    setTimeLimit(mins: number) {
      this.timeLimitMins = mins;
      localStorage.setItem('doctorMode_timeLimit', mins.toString());
    },

    startTracking() {
      this.stopTracking();
      // Reset tracking start
      this.elapsedMins = 0;
      this.lastAlertMins = 0;

      // Update every minute
      this.intervalId = setInterval(() => {
        this.elapsedMins += 1;
        this.checkLimit();
      }, 60000); // 1 minute
    },

    stopTracking() {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    },

    resetSession() {
      this.elapsedMins = 0;
      this.lastAlertMins = 0;
    },

    checkLimit() {
      if (!this.enabled) return;

      const notifications = useNotificationStore();

      // If we crossed the primary time limit (2 hours by default)
      if (this.elapsedMins === this.timeLimitMins) {
        this.lastAlertMins = this.elapsedMins;
        notifications.warning("Doctor Mode: You've been at your PC for too long. Please take a break - go for a walk or rest your eyes for at least 1 hour!");
      }
      // If ignored, alert again every 20 mins
      else if (this.elapsedMins > this.timeLimitMins && (this.elapsedMins - this.lastAlertMins) >= 20) {
        this.lastAlertMins = this.elapsedMins;
        notifications.warning("Doctor Mode Reminder: You're still at your PC! Please take a break now - your health is important!");
      }
    }
  }
});
