import { defineStore } from 'pinia';
import { invoke } from '@tauri-apps/api/core';
import Peer, { DataConnection } from 'peerjs';

export interface SyncPayload {
  id: string;
  timestamp: number;
  type: 'activity' | 'settings' | 'tasks' | 'full_backup' | 'pairing_request' | 'pairing_response';
  data: any;
  deviceId: string;
  deviceType: 'desktop' | 'mobile';
  deviceName?: string;
}

export interface SyncDevice {
  id: string;
  name: string;
  type: 'desktop' | 'mobile';
  lastSync: number | null;
  publicKey?: string;
  peerId?: string;
}

export interface SyncCode {
  code: string;
  expiresAt: number;
  deviceId: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile';
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
    errorMessage: '',

    // PeerJS connection
    peer: null as Peer | null,
    peerConnections: {} as Record<string, DataConnection>
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

        // Initialize PeerJS for P2P connections
        if (this.useP2P) {
          await this.initializePeer();
        }

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

    // Initialize PeerJS for P2P connections
    async initializePeer() {
      try {
        // Clean up existing peer if any
        if (this.peer) {
          this.peer.destroy();
        }

        // Create PeerJS instance with device ID as peer ID
        this.peer = new Peer(this.deviceId, {
          debug: 2
        });

        this.peer.on('open', (id) => {
          console.log('[Sync] PeerJS initialized with ID:', id);
        });

        this.peer.on('connection', (conn) => {
          this.handlePeerConnection(conn);
        });

        this.peer.on('error', (err) => {
          console.error('[Sync] PeerJS error:', err);
          this.connectionStatus = 'error';
          this.errorMessage = `PeerJS error: ${err.type}`;
        });

      } catch (error) {
        console.error('[Sync] Failed to initialize PeerJS:', error);
      }
    },

    // Handle incoming peer connection
    handlePeerConnection(conn: DataConnection) {
      console.log('[Sync] Incoming connection from:', conn.peer);

      conn.on('open', () => {
        console.log('[Sync] Connection opened:', conn.peer);
      });

      conn.on('data', (data) => {
        this.handlePeerData(data, conn);
      });

      conn.on('close', () => {
        console.log('[Sync] Connection closed:', conn.peer);
        delete this.peerConnections[conn.peer];
      });

      conn.on('error', (err) => {
        console.error('[Sync] Connection error:', err);
      });

      // Store connection
      this.peerConnections[conn.peer] = conn;
    },

    // Handle data received from peer
    async handlePeerData(data: any, _conn?: DataConnection) {
      try {
        const payload = data as SyncPayload;
        console.log('[Sync] Received peer data:', payload);

        // Handle pairing response
        if (payload.type === 'pairing_response') {
          await this.handlePairingResponse(payload);
          return;
        }

        // Handle regular sync payloads
        await this.receiveSyncPayload(payload);
      } catch (error) {
        console.error('[Sync] Failed to handle peer data:', error);
      }
    },

    // Handle pairing response from remote device
    async handlePairingResponse(payload: SyncPayload) {
      const { deviceId, deviceName, deviceType } = payload;
      
      console.log('[Sync] Pairing response received:', { deviceId, deviceName, deviceType });

      // Add/update paired device with real information
      const existingIndex = this.pairedDevices.findIndex(d => d.id === deviceId);
      
      const device: SyncDevice = {
        id: deviceId,
        name: deviceName || 'Unknown Device',
        type: deviceType || 'desktop',
        lastSync: Date.now()
      };

      if (existingIndex >= 0) {
        this.pairedDevices[existingIndex] = device;
      } else {
        this.pairedDevices.push(device);
      }

      this.savePairedDevices();
      this.connectionStatus = 'connected';
      
      // Dispatch event for UI update
      window.dispatchEvent(new CustomEvent('timigs-sync-paired', { detail: device }));
      
      console.log('[Sync] Device paired successfully:', device);
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
        deviceName: this.deviceName,
        deviceType: this.deviceType,
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
    async createPairing(): Promise<{ code: string; deviceId: string; deviceName: string }> {
      this.connectionStatus = 'connecting';

      if (!this.generatedCode) {
        this.generatePairingCode();
      }

      return {
        code: this.generatedCode!.code,
        deviceId: this.deviceId,
        deviceName: this.deviceName
      };
    },

    // Accept pairing from another device
    async acceptPairing(code: string, remoteDeviceId: string, remoteDeviceName: string, remoteDeviceType: 'desktop' | 'mobile'): Promise<boolean> {
      try {
        // Validate code
        if (code.length !== 6) {
          throw new Error('Invalid code format');
        }

        // Check if code matches any generated code (for mutual pairing)
        if (this.generatedCode && this.generatedCode.code === code) {
          // Self-pairing detected - this shouldn't happen
          console.warn('[Sync] Self-pairing attempt detected');
          return false;
        }

        // Create pairing response payload with OUR device info
        const pairingResponse: SyncPayload = {
          id: this.generateSyncId(),
          timestamp: Date.now(),
          type: 'pairing_response',
          data: {
            code: code,
            pairedAt: Date.now()
          },
          deviceId: this.deviceId,
          deviceType: this.deviceType,
          deviceName: this.deviceName
        };

        // Add remote device to paired devices with REAL information
        const newDevice: SyncDevice = {
          id: remoteDeviceId,
          name: remoteDeviceName || 'Unknown Device',
          type: remoteDeviceType,
          lastSync: Date.now()
        };

        // Check if already paired
        const existingIndex = this.pairedDevices.findIndex(d => d.id === remoteDeviceId);
        if (existingIndex >= 0) {
          this.pairedDevices[existingIndex] = newDevice;
        } else {
          this.pairedDevices.push(newDevice);
        }

        this.savePairedDevices();

        // Send pairing response via P2P if available
        if (this.useP2P && this.peer) {
          try {
            const conn = this.peer.connect(remoteDeviceId);
            conn.on('open', () => {
              conn.send(pairingResponse);
              console.log('[Sync] Pairing response sent via P2P');
            });
            conn.on('error', (err) => {
              console.error('[Sync] P2P connection error:', err);
            });
            this.peerConnections[remoteDeviceId] = conn;
          } catch (e) {
            console.warn('[Sync] P2P send failed, falling back to local:', e);
          }
        }

        // Also dispatch locally for same-device testing
        window.dispatchEvent(new CustomEvent('timigs-sync-received', { detail: pairingResponse }));

        this.connectionStatus = 'connected';
        
        // Dispatch event for UI update
        window.dispatchEvent(new CustomEvent('timigs-sync-paired', { detail: newDevice }));
        
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
      if (!this.peer) {
        throw new Error('P2P not initialized');
      }

      // Send to all paired devices of different type
      const targetDevices = this.pairedDevices.filter(d => d.type !== this.deviceType);
      
      for (const device of targetDevices) {
        try {
          let conn = this.peerConnections[device.id];
          
          // Create connection if doesn't exist
          if (!conn || !conn.open) {
            conn = this.peer.connect(device.id);
            
            // Wait for connection to open
            await new Promise<void>((resolve, reject) => {
              const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000);
              conn!.on('open', () => {
                clearTimeout(timeout);
                resolve();
              });
              conn!.on('error', (err) => {
                clearTimeout(timeout);
                reject(err);
              });
            });
            
            this.peerConnections[device.id] = conn;
          }
          
          // Send payload
          conn.send(payload);
          console.log('[Sync] P2P payload sent to:', device.name);
        } catch (error) {
          console.error('[Sync] P2P send failed to', device.name, ':', error);
          throw error;
        }
      }
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
      
      // Initialize or cleanup peer
      if (enabled) {
        this.initializePeer();
      } else {
        this.cleanupPeer();
      }
    },

    // Load P2P preference
    loadP2PPreference() {
      const saved = localStorage.getItem('timigs_sync_p2p');
      if (saved) {
        this.useP2P = saved === 'true';
      }
    },

    // Cleanup PeerJS connections
    cleanupPeer() {
      // Close all connections
      Object.values(this.peerConnections).forEach(conn => {
        try {
          conn.close();
        } catch (e) {
          console.warn('[Sync] Failed to close connection:', e);
        }
      });
      this.peerConnections = {};

      // Destroy peer instance
      if (this.peer) {
        this.peer.destroy();
        this.peer = null;
      }
    },

    // Clear all sync data
    clearSyncData() {
      // Cleanup P2P connections
      this.cleanupPeer();
      
      this.pendingSyncs = [];
      this.receivedSyncs = [];
      this.pairedDevices = [];
      this.lastSyncTime = null;
      this.connectionStatus = 'disconnected';
      
      this.savePendingSyncs();
      this.savePairedDevices();
      localStorage.removeItem('timigs_pending_syncs');
      localStorage.removeItem('timigs_paired_devices');
    },

    // Dispose sync store (call on app unmount)
    dispose() {
      this.cleanupPeer();
    }
  }
});
