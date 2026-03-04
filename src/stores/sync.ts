import { defineStore } from 'pinia';
import { invoke } from '@tauri-apps/api/core';

export interface SyncPayload {
  id: string;
  timestamp: number;
  type: 'activity' | 'settings' | 'tasks' | 'full_backup';
  data: any;
  deviceId: string;
  deviceType: 'desktop' | 'mobile';
}

export interface SyncDevice {
  id: string;
  name: string;
  type: 'desktop' | 'mobile';
  lastSync: number | null;
  publicKey?: string;
}

export interface SyncCode {
  code: string;
  expiresAt: number;
  deviceId: string;
  used: boolean;
}

export interface PendingSync {
  id: string;
  payload: SyncPayload;
  createdAt: number;
  retries: number;
  status: 'pending' | 'sent' | 'confirmed';
}

export const useSyncStore = defineStore('sync', {
  state: () => ({
    // Device identity
    deviceId: '',
    deviceType: 'desktop' as 'desktop' | 'mobile',
    deviceName: '',
    
    // Paired devices
    pairedDevices: [] as SyncDevice[],
    
    // Sync state
    isSyncing: false,
    lastSyncTime: null as number | null,
    syncEnabled: true,
    
    // Code-based pairing
    generatedCode: null as SyncCode | null,
    enteredCode: '',
    
    // Store-and-forward queue
    pendingSyncs: [] as PendingSync[],
    receivedSyncs: [] as SyncPayload[],
    
    // API configuration
    apiEndpoint: '',
    apiToken: '',
    useP2P: false,
    
    // Status
    connectionStatus: 'disconnected' as 'disconnected' | 'connecting' | 'connected' | 'error',
    errorMessage: ''
  }),

  getters: {
    hasPairedDevices(): boolean {
      return this.pairedDevices.length > 0;
    },
    
    pendingCount(): number {
      return this.pendingSyncs.filter(s => s.status === 'pending').length;
    },
    
    isPaired(): boolean {
      return this.pairedDevices.some(d => d.type !== this.deviceType);
    },
    
    syncQueueSize(): number {
      return this.pendingSyncs.length;
    }
  },

  actions: {
    // Initialize sync store
    async initialize() {
      try {
        // Load or generate device ID
        let savedId = localStorage.getItem('timigs_device_id');
        if (!savedId) {
          savedId = this.generateDeviceId();
          localStorage.setItem('timigs_device_id', savedId);
        }
        this.deviceId = savedId;
        
        // Detect device type
        this.deviceType = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
          ? 'mobile' 
          : 'desktop';
        
        // Set device name
        this.deviceName = `${this.deviceType === 'desktop' ? 'Desktop' : 'Mobile'} - ${this.getDeviceModel()}`;
        
        // Load paired devices
        this.loadPairedDevices();
        
        // Load pending syncs
        this.loadPendingSyncs();
        
        // Try to connect if we have paired devices
        if (this.hasPairedDevices && this.syncEnabled) {
          await this.tryReconnect();
        }
        
        console.log(`[Sync] Initialized device: ${this.deviceName} (${this.deviceId})`);
      } catch (error) {
        console.error('[Sync] Initialization failed:', error);
        this.errorMessage = 'Failed to initialize sync';
        this.connectionStatus = 'error';
      }
    },
    
    generateDeviceId(): string {
      const array = new Uint8Array(16);
      crypto.getRandomValues(array);
      return Array.from(array, b => b.toString(16).padStart(2, '0')).join('-');
    },
    
    getDeviceModel(): string {
      const ua = navigator.userAgent;
      if (ua.includes('Windows')) return 'Windows';
      if (ua.includes('Mac')) return 'macOS';
      if (ua.includes('Linux')) return 'Linux';
      if (ua.includes('Android')) return 'Android';
      if (ua.includes('iOS')) return 'iOS';
      return 'Unknown';
    },
    
    // Load paired devices from storage
    loadPairedDevices() {
      const saved = localStorage.getItem('timigs_paired_devices');
      if (saved) {
        try {
          this.pairedDevices = JSON.parse(saved);
        } catch (e) {
          console.error('[Sync] Failed to load paired devices:', e);
        }
      }
    },
    
    // Save paired devices
    savePairedDevices() {
      localStorage.setItem('timigs_paired_devices', JSON.stringify(this.pairedDevices));
    },
    
    // Load pending syncs from storage
    loadPendingSyncs() {
      const saved = localStorage.getItem('timigs_pending_syncs');
      if (saved) {
        try {
          this.pendingSyncs = JSON.parse(saved);
        } catch (e) {
          console.error('[Sync] Failed to load pending syncs:', e);
        }
      }
    },
    
    // Save pending syncs
    savePendingSyncs() {
      localStorage.setItem('timigs_pending_syncs', JSON.stringify(this.pendingSyncs));
    },
    
    // Generate pairing code for manual entry
    generatePairingCode(): string {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      this.generatedCode = {
        code,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
        deviceId: this.deviceId,
        used: false
      };
      
      // Auto-expire
      setTimeout(() => {
        if (this.generatedCode && !this.generatedCode.used) {
          this.generatedCode = null;
        }
      }, 5 * 60 * 1000);
      
      return code;
    },
    
    // Create pairing request
    async createPairing(): Promise<{ code: string; deviceId: string }> {
      this.connectionStatus = 'connecting';
      
      if (!this.generatedCode) {
        this.generatePairingCode();
      }
      
      return {
        code: this.generatedCode!.code,
        deviceId: this.deviceId
      };
    },
    
    // Accept pairing from another device
    async acceptPairing(code: string, remoteDeviceId: string, remoteDeviceName: string, remoteDeviceType: 'desktop' | 'mobile'): Promise<boolean> {
      try {
        // Validate code (in real implementation, this would verify with API or P2P)
        if (code.length !== 6) {
          throw new Error('Invalid code format');
        }
        
        // Add to paired devices
        const newDevice: SyncDevice = {
          id: remoteDeviceId,
          name: remoteDeviceName,
          type: remoteDeviceType,
          lastSync: null
        };
        
        // Check if already paired
        if (!this.pairedDevices.some(d => d.id === remoteDeviceId)) {
          this.pairedDevices.push(newDevice);
          this.savePairedDevices();
        }
        
        this.connectionStatus = 'connected';
        return true;
      } catch (error) {
        console.error('[Sync] Pairing failed:', error);
        this.connectionStatus = 'error';
        return false;
      }
    },
    
    // Remove paired device
    async removePairedDevice(deviceId: string) {
      this.pairedDevices = this.pairedDevices.filter(d => d.id !== deviceId);
      this.savePairedDevices();
    },
    
    // Queue data for sync (store-and-forward)
    queueForSync(type: 'activity' | 'settings' | 'tasks', data: any) {
      if (!this.syncEnabled) return;
      
      const payload: SyncPayload = {
        id: this.generateSyncId(),
        timestamp: Date.now(),
        type,
        data,
        deviceId: this.deviceId,
        deviceType: this.deviceType
      };
      
      const pending: PendingSync = {
        id: payload.id,
        payload,
        createdAt: Date.now(),
        retries: 0,
        status: 'pending'
      };
      
      this.pendingSyncs.push(pending);
      this.savePendingSyncs();
      
      // Try to send immediately if connected
      if (this.connectionStatus === 'connected') {
        this.processQueue();
      }
    },
    
    generateSyncId(): string {
      return `${this.deviceId}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    },
    
    // Process pending sync queue
    async processQueue() {
      if (this.isSyncing || this.pendingSyncs.length === 0) return;
      
      this.isSyncing = true;
      
      try {
        const pending = this.pendingSyncs.filter(s => s.status === 'pending');
        
        for (const sync of pending) {
          try {
            await this.sendSyncPayload(sync.payload);
            sync.status = 'confirmed';
            sync.retries = 0;
          } catch (error) {
            console.error('[Sync] Failed to send:', error);
            sync.retries++;
            if (sync.retries >= 3) {
              sync.status = 'pending'; // Keep for retry later
            }
          }
        }
        
        // Remove confirmed syncs older than 24 hours
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        this.pendingSyncs = this.pendingSyncs.filter(s => 
          s.status !== 'confirmed' || s.createdAt > oneDayAgo
        );
        
        this.savePendingSyncs();
        this.lastSyncTime = Date.now();
        
      } finally {
        this.isSyncing = false;
      }
    },
    
    // Send sync payload to paired device
    async sendSyncPayload(payload: SyncPayload) {
      // Try P2P first if enabled
      if (this.useP2P) {
        try {
          await this.sendViaP2P(payload);
          return;
        } catch (e) {
          console.warn('[Sync] P2P failed, falling back to API:', e);
        }
      }
      
      // Fallback to API
      if (this.apiEndpoint) {
        await this.sendViaAPI(payload);
      } else {
        throw new Error('No sync method configured');
      }
    },
    
    // Send via P2P (WebRTC)
    async sendViaP2P(payload: SyncPayload) {
      // This would use PeerJS or similar for direct device-to-device transfer
      // For now, we'll simulate with localStorage for same-browser testing
      const key = `timigs_sync_${payload.id}`;
      localStorage.setItem(key, JSON.stringify(payload));
      
      // Dispatch event for receiver
      window.dispatchEvent(new CustomEvent('timigs-sync-received', { detail: payload }));
    },
    
    // Send via API (store-and-forward)
    async sendViaAPI(payload: SyncPayload) {
      if (!this.apiEndpoint) {
        throw new Error('API endpoint not configured');
      }
      
      const response = await fetch(`${this.apiEndpoint}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiToken}`,
          'X-Device-ID': this.deviceId
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
    },
    
    // Receive sync payload from paired device
    async receiveSyncPayload(payload: SyncPayload) {
      // Check if we already received this
      if (this.receivedSyncs.some(s => s.id === payload.id)) {
        console.log('[Sync] Duplicate sync ignored:', payload.id);
        return;
      }
      
      // Store received sync
      this.receivedSyncs.push(payload);
      
      // Process based on type
      await this.processReceivedSync(payload);
      
      // Keep only last 100 received syncs
      if (this.receivedSyncs.length > 100) {
        this.receivedSyncs = this.receivedSyncs.slice(-100);
      }
    },
    
    // Process received sync based on type
    async processReceivedSync(payload: SyncPayload) {
      switch (payload.type) {
        case 'activity':
          // Merge activity data
          await this.mergeActivityData(payload.data);
          break;
          
        case 'settings':
          // Update settings
          await this.mergeSettings(payload.data);
          break;
          
        case 'tasks':
          // Merge tasks
          await this.mergeTasks(payload.data);
          break;
          
        case 'full_backup':
          // Full restore
          await this.restoreFromBackup(payload.data);
          break;
      }
      
      // Update last sync time for device
      const device = this.pairedDevices.find(d => d.id === payload.deviceId);
      if (device) {
        device.lastSync = payload.timestamp;
        this.savePairedDevices();
      }
    },
    
    // Merge activity data from received sync
    async mergeActivityData(data: any) {
      // This would intelligently merge activity sessions
      // avoiding duplicates based on timestamps and IDs
      console.log('[Sync] Merging activity data:', data);
      
      // For now, just log - actual implementation would call backend
      try {
        await invoke('import_activity_data', { data });
      } catch (e) {
        console.error('[Sync] Failed to import activity:', e);
      }
    },
    
    // Merge settings from received sync
    async mergeSettings(data: any) {
      console.log('[Sync] Merging settings:', data);
      try {
        await invoke('import_settings', { settings: data });
      } catch (e) {
        console.error('[Sync] Failed to import settings:', e);
      }
    },
    
    // Merge tasks from received sync
    async mergeTasks(data: any) {
      console.log('[Sync] Merging tasks:', data);
      // Task merging logic
    },
    
    // Restore from full backup
    async restoreFromBackup(data: any) {
      console.log('[Sync] Restoring from backup:', data);
      try {
        await invoke('restore_backup', { backup: data });
      } catch (e) {
        console.error('[Sync] Failed to restore backup:', e);
      }
    },
    
    // Try to reconnect to paired devices
    async tryReconnect() {
      if (this.pairedDevices.length === 0) return;
      
      this.connectionStatus = 'connecting';
      
      try {
        // Try P2P reconnection
        if (this.useP2P) {
          // Would attempt PeerJS reconnection here
        }
        
        // Try API health check
        if (this.apiEndpoint) {
          const healthUrl = `${this.apiEndpoint}/health`;
          const response = await fetch(healthUrl, {
            headers: { 'Authorization': `Bearer ${this.apiToken}` }
          });
          
          if (response.ok) {
            this.connectionStatus = 'connected';
            // Process any pending syncs
            await this.processQueue();
            return;
          }
        }
        
        this.connectionStatus = 'disconnected';
      } catch (error) {
        console.error('[Sync] Reconnection failed:', error);
        this.connectionStatus = 'error';
      }
    },
    
    // Manual sync trigger
    async syncNow() {
      if (!this.isPaired) {
        throw new Error('No paired devices');
      }
      
      await this.processQueue();
      
      // Request sync from paired device
      await this.requestSyncFromDevice();
    },
    
    // Request sync data from paired device
    async requestSyncFromDevice() {
      const requestPayload: SyncPayload = {
        id: this.generateSyncId(),
        timestamp: Date.now(),
        type: 'activity',
        data: { requestType: 'full' },
        deviceId: this.deviceId,
        deviceType: this.deviceType
      };
      
      await this.sendSyncPayload(requestPayload);
    },
    
    // Export all data as backup
    async exportBackup(): Promise<any> {
      try {
        const backup = await invoke('export_full_backup');
        return backup;
      } catch (error) {
        console.error('[Sync] Export failed:', error);
        throw error;
      }
    },
    
    // Configure API endpoint
    configureAPI(endpoint: string, token?: string) {
      this.apiEndpoint = endpoint;
      if (token) this.apiToken = token;
      localStorage.setItem('timigs_sync_api', JSON.stringify({ endpoint, token }));
    },
    
    // Load API config from storage
    loadAPIConfig() {
      const saved = localStorage.getItem('timigs_sync_api');
      if (saved) {
        try {
          const config = JSON.parse(saved);
          this.apiEndpoint = config.endpoint;
          this.apiToken = config.token;
        } catch (e) {
          console.error('[Sync] Failed to load API config:', e);
        }
      }
    },
    
    // Toggle P2P mode
    setP2PMode(enabled: boolean) {
      this.useP2P = enabled;
      localStorage.setItem('timigs_sync_p2p', enabled.toString());
    },
    
    // Load P2P preference
    loadP2PPreference() {
      const saved = localStorage.getItem('timigs_sync_p2p');
      if (saved) {
        this.useP2P = saved === 'true';
      }
    },
    
    // Clear all sync data
    clearSyncData() {
      this.pendingSyncs = [];
      this.receivedSyncs = [];
      this.pairedDevices = [];
      this.lastSyncTime = null;
      this.savePendingSyncs();
      this.savePairedDevices();
      localStorage.removeItem('timigs_pending_syncs');
      localStorage.removeItem('timigs_paired_devices');
    }
  }
});
