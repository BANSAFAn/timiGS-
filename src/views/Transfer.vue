<template>
  <div class="page transfer-page">
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h2>P2P Transfer</h2>
          <p class="subtitle">Secure direct file transfer between devices</p>
        </div>
        <div class="connection-indicator" :class="{ connected: isConnected }">
          <span class="indicator-dot"></span>
          <span>{{ isConnected ? 'Connected' : 'Disconnected' }}</span>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="tab-nav">
        <div class="tab-slider" :style="{ transform: activeTab === 'receive' ? 'translateX(100%)' : 'translateX(0)' }"></div>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'send' }"
          @click="activeTab = 'send'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
          </svg>
          Send
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'receive' }"
          @click="activeTab = 'receive'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
          </svg>
          Receive
        </button>
      </div>

      <!-- Main Content -->
      <div class="tab-panels">
        <!-- SEND TAB -->
        <transition name="slide-fade" mode="out-in">
          <div v-if="activeTab === 'send'" key="send" class="panel send-panel">
            <!-- Connection Section -->
            <div class="connect-section" v-if="!isConnected">
              <div class="section-card">
                <div class="card-header">
                  <span class="card-icon">🔗</span>
                  <h3>Connect to Receiver</h3>
                </div>
                <div class="input-row">
                  <input
                    v-model="targetPeerId"
                    type="text"
                    placeholder="Enter receiver's token..."
                    class="input-field"
                    :disabled="isConnected"
                  />
                  <button
                    class="btn-connect"
                    @click="connectToPeer"
                    :disabled="!targetPeerId"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" x2="14" y1="3" y2="10"/><line x1="3" x2="10" y1="21" y2="14"/>
                    </svg>
                    Connect
                  </button>
                </div>
                <p v-if="connectionError" class="error-text">{{ connectionError }}</p>
              </div>
            </div>

            <!-- Connected - Ready to Send -->
            <div v-else class="send-ready">
              <div class="connected-badge">
                <span class="pulse-ring"></span>
                <span class="badge-icon">✓</span>
                <span>Connected to <strong>{{ targetPeerId.substring(0, 12) }}...</strong></span>
              </div>

              <!-- Drop Zone -->
              <div
                class="drop-zone"
                :class="{ 'has-file': selectedFile, 'dragging': isDragging }"
                @click="triggerFileSelect"
                @drop.prevent="onDrop"
                @dragover.prevent="isDragging = true"
                @dragleave="isDragging = false"
              >
                <div v-if="!selectedFile" class="drop-content">
                  <div class="drop-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>
                    </svg>
                  </div>
                  <p class="drop-text">Drop file here or click to browse</p>
                  <span class="drop-hint">Maximum file size: Unlimited</span>
                </div>
                
                <div v-else class="file-preview">
                  <div class="file-icon">{{ getFileIcon(selectedFile.name) }}</div>
                  <div class="file-info">
                    <span class="file-name">{{ selectedFile.name }}</span>
                    <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
                  </div>
                  <button class="remove-file" @click.stop="selectedFile = null">×</button>
                </div>
              </div>
              <input type="file" ref="fileInput" @change="onFileSelected" class="hidden-input" />

              <!-- Transfer Progress -->
              <div v-if="isTransferring" class="progress-section">
                <div class="progress-header">
                  <span>Sending...</span>
                  <span class="progress-percent">{{ transferProgress }}%</span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill" :style="{ width: transferProgress + '%' }"></div>
                </div>
              </div>

              <!-- Send Button -->
              <button
                class="btn-send"
                @click="startTransfer"
                :disabled="!selectedFile || isTransferring"
                v-if="selectedFile"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
                </svg>
                {{ isTransferring ? 'Sending...' : 'Send File' }}
              </button>

              <p v-if="transferStatus" class="status-text" :class="{ success: transferStatus.includes('complete') }">
                {{ transferStatus }}
              </p>
            </div>
          </div>

          <!-- RECEIVE TAB -->
          <div v-else-if="activeTab === 'receive'" key="receive" class="panel receive-panel">
            <!-- Token Section -->
            <div class="section-card token-card">
              <div class="card-header">
                <span class="card-icon">🎫</span>
                <h3>Your Token</h3>
              </div>
              <div class="token-display" @click="copyToken">
                <span class="token-text">{{ myPeerId || 'Generating...' }}</span>
                <button class="copy-btn" v-if="myPeerId">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                  </svg>
                </button>
              </div>
              <p class="token-hint">Share this token with the sender</p>
            </div>

            <!-- Status -->
            <div class="status-card">
              <div class="status-icon" :class="{ active: isConnected }">
                <div class="status-pulse" v-if="!isConnected"></div>
                {{ isConnected ? '✓' : '...' }}
              </div>
              <div class="status-info">
                <span class="status-label">{{ isConnected ? 'Connection Established' : 'Waiting for connection...' }}</span>
                <span class="status-detail">{{ isConnected ? 'Ready to receive files' : 'Sender will connect using your token' }}</span>
              </div>
            </div>

            <!-- Save Path -->
            <div class="section-card compact">
              <label>Save Location</label>
              <div class="input-row">
                <input
                  v-model="savePath"
                  type="text"
                  class="input-field"
                  placeholder="Default: Downloads folder"
                />
              </div>
            </div>

            <!-- Pending File Confirmation -->
            <transition name="bounce">
              <div v-if="pendingFile" class="pending-card">
                <div class="pending-header">
                  <span class="pending-icon">📥</span>
                  <h4>Incoming File</h4>
                </div>
                <div class="pending-file">
                  <div class="file-icon-lg">{{ getFileIcon(pendingFile.name) }}</div>
                  <div class="file-details">
                    <span class="file-name">{{ pendingFile.name }}</span>
                    <span class="file-size">{{ formatFileSize(pendingFile.size) }}</span>
                  </div>
                </div>
                <div class="pending-actions">
                  <button class="btn-reject" @click="rejectTransfer">Decline</button>
                  <button class="btn-accept" @click="acceptTransfer">Accept</button>
                </div>
              </div>
            </transition>

            <!-- Receiving Progress -->
            <div v-if="incomingFile" class="receiving-card">
              <div class="receiving-header">
                <span class="receiving-icon">📥</span>
                <div class="receiving-info">
                  <span class="receiving-name">{{ incomingFile.name }}</span>
                  <span class="receiving-size">{{ formatFileSize(incomingFile.size) }}</span>
                </div>
              </div>
              <div class="progress-track">
                <div class="progress-fill receiving" :style="{ width: transferProgress + '%' }"></div>
              </div>
              <span class="progress-label">{{ transferProgress }}% received</span>
            </div>

            <p v-if="transferStatus" class="status-text success">{{ transferStatus }}</p>

            <!-- Transfer History -->
            <div class="history-section" v-if="transferHistory.length > 0">
              <h3 class="history-title">Recent Transfers</h3>
              <div class="history-list">
                <div v-for="item in transferHistory" :key="item.id" class="history-item">
                  <div class="history-icon" :class="item.type">
                    {{ item.type === 'sent' ? '↑' : '↓' }}
                  </div>
                  <div class="history-info">
                    <span class="history-name">{{ item.name }}</span>
                    <span class="history-meta">
                      {{ item.status }} • {{ new Date(item.date).toLocaleTimeString() }}
                    </span>
                  </div>
                  <span class="history-size">{{ formatFileSize(item.size) }}</span>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import Peer from "peerjs";
import { invoke } from "@tauri-apps/api/core";
import { useNotificationStore } from "../stores/notifications";

const notifications = useNotificationStore();

// State
const activeTab = ref("send");
const myPeerId = ref("");
const targetPeerId = ref("");
const isConnected = ref(false);
const connectionError = ref("");
const transferStatus = ref("");
const isTransferring = ref(false);
const transferProgress = ref(0);
const savePath = ref("");
const isDragging = ref(false);

// File State
const selectedFile = ref<File | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const incomingFile = ref<{ name: string; size: number } | null>(null);
const pendingFile = ref<{ name: string; size: number } | null>(null);

// History
interface TransferRecord {
  id: string;
  name: string;
  type: 'sent' | 'received';
  size: number;
  date: Date;
  status: 'completed' | 'failed' | 'rejected';
}
const transferHistory = ref<TransferRecord[]>([]);

// P2P Objects
let peer: Peer | null = null;
let conn: any = null;
let receivedChunks: { [key: number]: ArrayBuffer } = {};
let receivedSize = 0;

onMounted(() => {
  initPeer();
});

onUnmounted(() => {
  peer?.destroy();
});

function initPeer() {
  peer = new Peer({
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
      ],
    },
  });

  peer.on('open', (id) => {
    myPeerId.value = id;
  });

  peer.on('connection', (c) => {
    conn = c;
    setupReceiverConnection();
  });

  peer.on('error', (err: any) => {
    if (err.type === 'peer-unavailable') {
      connectionError.value = "Peer not found. Check the token.";
    } else {
      connectionError.value = "P2P Error: " + (err.type || err);
    }
  });
}

function copyToken() {
  if (myPeerId.value) {
    navigator.clipboard.writeText(myPeerId.value);
    notifications.success("Token copied!");
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB';
}

function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const icons: Record<string, string> = {
    pdf: '📕',
    doc: '📘', docx: '📘',
    xls: '📗', xlsx: '📗',
    ppt: '📙', pptx: '📙',
    zip: '🗜️', rar: '🗜️', '7z': '🗜️',
    jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', webp: '🖼️',
    mp4: '🎬', mov: '🎬', avi: '🎬', mkv: '🎬',
    mp3: '🎵', wav: '🎵', flac: '🎵',
    exe: '⚙️', msi: '⚙️',
    txt: '📝', md: '📝',
    html: '🌐', css: '🎨', js: '📜', ts: '📜',
  };
  return icons[ext] || '📄';
}

// SENDER LOGIC
function connectToPeer() {
  if (!targetPeerId.value || !peer) return;
  connectionError.value = '';
  
  conn = peer.connect(targetPeerId.value, { reliable: true });
  
  conn.on('open', () => {
    isConnected.value = true;
    transferStatus.value = "";
  });
  
  conn.on('error', (err: any) => {
    connectionError.value = "Connection failed: " + err;
    isConnected.value = false;
  });
  
  conn.on('data', (data: any) => {
    if (data.type === 'accept') {
      beginChunkTransfer();
    } else if (data.type === 'reject') {
      transferStatus.value = "Transfer rejected by peer.";
      isTransferring.value = false;
      notifications.error("Transfer rejected.");
    }
  });

  conn.on('close', () => {
    isConnected.value = false;
    transferStatus.value = "Connection closed.";
  });
}

function triggerFileSelect() {
  fileInput.value?.click();
}

function onFileSelected(e: Event) {
  const input = e.target as HTMLInputElement;
  if (input.files?.length) {
    selectedFile.value = input.files[0];
  }
}

function onDrop(e: DragEvent) {
  isDragging.value = false;
  if (e.dataTransfer?.files.length) {
    selectedFile.value = e.dataTransfer.files[0];
  }
}

function startTransfer() {
  if (!conn || !selectedFile.value) return;
  
  const file = selectedFile.value;
  isTransferring.value = true;
  transferProgress.value = 0;
  transferStatus.value = "Starting transfer...";

  conn.send({
    type: 'offer',
    name: file.name,
    size: file.size
  });
  transferStatus.value = "Waiting for acceptance...";
}

function beginChunkTransfer() {
  if (!selectedFile.value || !conn) return;
  const file = selectedFile.value;
  transferStatus.value = "Sending data...";

  const chunkSize = 16384 * 4;
  const reader = new FileReader();
  let offset = 0;
  let chunkIndex = 0;

  reader.onload = (e) => {
    if (e.target?.result) {
      const arrayBuffer = e.target.result as ArrayBuffer;
      
      conn.send({
        type: 'chunk',
        index: chunkIndex,
        data: arrayBuffer
      });
      
      offset += arrayBuffer.byteLength;
      chunkIndex++;
      
      transferProgress.value = Math.round((offset / file.size) * 100);

      if (offset < file.size) {
        setTimeout(readNextChunk, 5);
      } else {
        isTransferring.value = false;
        transferStatus.value = "Transfer complete! ✓";
        conn.send({ type: 'complete', totalChunks: chunkIndex });
        
        transferHistory.value.unshift({
          id: Date.now().toString(),
          name: file.name,
          type: 'sent',
          size: file.size,
          date: new Date(),
          status: 'completed'
        });
      }
    }
  };

  const readNextChunk = () => {
    const slice = file.slice(offset, offset + chunkSize);
    reader.readAsArrayBuffer(slice);
  };

  readNextChunk();
}

// RECEIVER LOGIC
function setupReceiverConnection() {
  isConnected.value = true;
  receivedChunks = {};
  receivedSize = 0;

  conn.on('data', async (data: any) => {
    if (data.type === 'offer') {
      pendingFile.value = { name: data.name, size: data.size };
      notifications.info(`Incoming file: ${data.name}`);
      return;
    }
    
    if (data.type === 'chunk') {
       receivedChunks[data.index] = data.data;
       receivedSize += data.data.byteLength;
       
       if (incomingFile.value) {
         transferProgress.value = Math.round((receivedSize / incomingFile.value.size) * 100);
       }
    }

    if (data.type === 'complete') {
       saveReceivedFile(data.totalChunks);
       return;
    }
  });

  conn.on('close', () => {
    isConnected.value = false;
  });
}

async function saveReceivedFile(totalChunks: number) {
  if (!incomingFile.value) return;
  
  const chunksArray: ArrayBuffer[] = [];
  for (let i = 0; i < totalChunks; i++) {
    if (receivedChunks[i]) {
      chunksArray.push(receivedChunks[i]);
    } else {
      notifications.error("Transfer corrupted: missing chunks.");
      return;
    }
  }

  const blob = new Blob(chunksArray);
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = Array.from(new Uint8Array(arrayBuffer));

  transferStatus.value = "Saving file...";
  
  try {
    const savedPath = await invoke('save_local_file', {
       filename: incomingFile.value.name,
       data: bytes,
       targetFolder: savePath.value || null
    });
    transferStatus.value = `File saved to: ${savedPath}`;
    notifications.success(`File Received! Saved to: ${savedPath}`);
    
    transferHistory.value.unshift({
      id: Date.now().toString(),
      name: incomingFile.value.name,
      type: 'received',
      size: incomingFile.value.size,
      date: new Date(),
      status: 'completed'
    });

  } catch (e) {
    transferStatus.value = "Error saving file: " + e;
    notifications.error("Save Error: " + e);
  }
  
  incomingFile.value = null;
  receivedChunks = {};
}

function acceptTransfer() {
  if (!pendingFile.value || !conn) return;
  incomingFile.value = pendingFile.value;
  pendingFile.value = null;
  
  receivedChunks = {};
  receivedSize = 0;
  transferProgress.value = 0;
  
  conn.send({ type: 'accept' });
}

function rejectTransfer() {
  if (!conn) return;
  conn.send({ type: 'reject' });
  pendingFile.value = null;
}
</script>

<style scoped>
.transfer-page {
  padding-bottom: 40px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 28px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-content h2 {
  margin-bottom: 4px;
}

.subtitle {
  color: var(--text-muted);
  font-size: 0.95rem;
}

.connection-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255,255,255,0.05);
  border-radius: 20px;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.connection-indicator.connected {
  background: rgba(16,185,129,0.15);
  color: #10b981;
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-muted);
}

.connection-indicator.connected .indicator-dot {
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
}

/* Tab Navigation */
.tab-nav {
  display: flex;
  position: relative;
  background: rgba(255,255,255,0.05);
  border-radius: 16px;
  padding: 6px;
  margin-bottom: 28px;
}

.tab-slider {
  position: absolute;
  top: 6px;
  left: 6px;
  width: calc(50% - 6px);
  height: calc(100% - 12px);
  background: var(--color-primary);
  border-radius: 12px;
  transition: transform 0.3s ease;
  z-index: 0;
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 24px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  position: relative;
  z-index: 1;
  transition: color 0.3s;
  border-radius: 12px;
}

.tab-btn.active {
  color: #fff;
}

.tab-btn:hover:not(.active) {
  color: var(--text-color);
}

/* Panels */
.tab-panels {
  min-height: 400px;
}

.panel {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Section Card */
.section-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 20px;
}

.section-card.compact {
  padding: 20px;
}

.section-card.compact label {
  display: block;
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 10px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.card-icon {
  font-size: 1.5rem;
}

.card-header h3 {
  font-size: 1.1rem;
  font-weight: 600;
}

.input-row {
  display: flex;
  gap: 12px;
}

.input-field {
  flex: 1;
  padding: 14px 18px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  color: #fff;
  font-size: 1rem;
  transition: all 0.2s;
}

.input-field:focus {
  outline: none;
  border-color: var(--color-primary);
  background: rgba(255,255,255,0.08);
}

.btn-connect {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 24px;
  background: var(--color-primary);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-connect:hover:not(:disabled) {
  background: #7c3aed;
  transform: translateY(-2px);
}

.btn-connect:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-text {
  color: #f87171;
  font-size: 0.9rem;
  margin-top: 12px;
}

/* Connected Badge */
.connected-badge {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  background: rgba(16,185,129,0.1);
  border: 1px solid rgba(16,185,129,0.2);
  padding: 12px 20px;
  border-radius: 30px;
  margin-bottom: 24px;
  color: #10b981;
  position: relative;
}

.pulse-ring {
  position: absolute;
  left: 12px;
  width: 24px;
  height: 24px;
  border: 2px solid #10b981;
  border-radius: 50%;
  animation: pulse-ring 2s infinite;
}

@keyframes pulse-ring {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.5); opacity: 0; }
}

.badge-icon {
  width: 24px;
  height: 24px;
  background: #10b981;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 0.8rem;
}

/* Drop Zone */
.drop-zone {
  border: 2px dashed rgba(255,255,255,0.15);
  border-radius: 20px;
  padding: 48px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: rgba(255,255,255,0.02);
  margin-bottom: 20px;
}

.drop-zone:hover,
.drop-zone.dragging {
  border-color: var(--color-primary);
  background: rgba(99,102,241,0.05);
}

.drop-zone.dragging {
  transform: scale(1.01);
}

.drop-zone.has-file {
  border-style: solid;
  border-color: rgba(16,185,129,0.3);
  background: rgba(16,185,129,0.05);
  padding: 24px;
}

.drop-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.drop-icon {
  color: var(--text-muted);
  opacity: 0.6;
}

.drop-text {
  font-size: 1.1rem;
  color: var(--text-muted);
}

.drop-hint {
  font-size: 0.85rem;
  color: var(--text-muted);
  opacity: 0.6;
}

.hidden-input {
  display: none;
}

/* File Preview */
.file-preview {
  display: flex;
  align-items: center;
  gap: 16px;
}

.file-icon {
  font-size: 2.5rem;
}

.file-info {
  flex: 1;
  text-align: left;
}

.file-name {
  display: block;
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: 4px;
  word-break: break-all;
}

.file-size {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.remove-file {
  width: 36px;
  height: 36px;
  background: rgba(255,255,255,0.1);
  border: none;
  border-radius: 50%;
  color: var(--text-muted);
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-file:hover {
  background: rgba(239,68,68,0.2);
  color: #ef4444;
}

/* Progress */
.progress-section {
  margin-bottom: 20px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.progress-percent {
  font-weight: 600;
  color: var(--color-primary);
}

.progress-track {
  height: 8px;
  background: rgba(255,255,255,0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), #a855f7);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-fill.receiving {
  background: linear-gradient(90deg, #10b981, #34d399);
}

/* Send Button */
.btn-send {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px;
  background: linear-gradient(135deg, var(--color-primary), #a855f7);
  border: none;
  border-radius: 14px;
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-send:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(99,102,241,0.4);
}

.btn-send:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.status-text {
  text-align: center;
  margin-top: 16px;
  color: var(--text-muted);
}

.status-text.success {
  color: #10b981;
}

/* Token Card */
.token-card {
  text-align: center;
}

.token-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(255,255,255,0.05);
  border: 1px dashed var(--color-primary);
  border-radius: 14px;
  padding: 18px 24px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 12px;
}

.token-display:hover {
  background: rgba(99,102,241,0.1);
}

.token-text {
  font-family: 'Consolas', monospace;
  font-size: 1.1rem;
  letter-spacing: 1px;
  word-break: break-all;
}

.copy-btn {
  background: rgba(255,255,255,0.1);
  border: none;
  border-radius: 8px;
  padding: 8px;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.copy-btn:hover {
  background: var(--color-primary);
  color: #fff;
}

.token-hint {
  color: var(--text-muted);
  font-size: 0.9rem;
}

/* Status Card */
.status-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
}

.status-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.05);
  border-radius: 50%;
  font-size: 1.2rem;
  color: var(--text-muted);
  position: relative;
}

.status-icon.active {
  background: rgba(16,185,129,0.15);
  color: #10b981;
}

.status-pulse {
  position: absolute;
  inset: 0;
  border: 2px solid var(--text-muted);
  border-radius: 50%;
  animation: status-pulse 2s infinite;
}

@keyframes status-pulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.2); opacity: 0; }
}

.status-info {
  flex: 1;
}

.status-label {
  display: block;
  font-weight: 600;
  margin-bottom: 4px;
}

.status-detail {
  color: var(--text-muted);
  font-size: 0.85rem;
}

/* Pending Card */
.pending-card {
  background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1));
  border: 1px solid rgba(99,102,241,0.3);
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 20px;
  text-align: center;
}

.pending-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
}

.pending-icon {
  font-size: 1.5rem;
}

.pending-header h4 {
  font-size: 1.1rem;
}

.pending-file {
  display: flex;
  align-items: center;
  gap: 16px;
  justify-content: center;
  margin-bottom: 24px;
}

.file-icon-lg {
  font-size: 3rem;
}

.file-details {
  text-align: left;
}

.pending-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-reject {
  padding: 12px 28px;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 12px;
  color: var(--text-color);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-reject:hover {
  background: rgba(239,68,68,0.2);
  border-color: rgba(239,68,68,0.3);
}

.btn-accept {
  padding: 12px 28px;
  background: #10b981;
  border: none;
  border-radius: 12px;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-accept:hover {
  background: #059669;
  transform: translateY(-1px);
}

/* Receiving Card */
.receiving-card {
  background: rgba(16,185,129,0.1);
  border: 1px solid rgba(16,185,129,0.2);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
}

.receiving-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.receiving-icon {
  font-size: 2rem;
}

.receiving-name {
  display: block;
  font-weight: 600;
  margin-bottom: 2px;
}

.receiving-size {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.progress-label {
  display: block;
  text-align: center;
  margin-top: 10px;
  font-size: 0.9rem;
  color: #10b981;
}

/* History */
.history-section {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid rgba(255,255,255,0.06);
}

.history-title {
  font-size: 1rem;
  color: var(--text-muted);
  margin-bottom: 16px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  background: rgba(255,255,255,0.03);
  border-radius: 12px;
  transition: background 0.2s;
}

.history-item:hover {
  background: rgba(255,255,255,0.05);
}

.history-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-weight: bold;
  font-size: 1.1rem;
}

.history-icon.sent {
  background: rgba(99,102,241,0.15);
  color: var(--color-primary);
}

.history-icon.received {
  background: rgba(16,185,129,0.15);
  color: #10b981;
}

.history-info {
  flex: 1;
  min-width: 0;
}

.history-name {
  display: block;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-meta {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.history-size {
  color: var(--text-muted);
  font-size: 0.85rem;
  white-space: nowrap;
}

/* Transitions */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.bounce-enter-active {
  animation: bounce-in 0.4s;
}

.bounce-leave-active {
  animation: bounce-in 0.3s reverse;
}

@keyframes bounce-in {
  0% { transform: scale(0.9); opacity: 0; }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); opacity: 1; }
}

/* Mobile */
@media (max-width: 600px) {
  .input-row {
    flex-direction: column;
  }
  
  .btn-connect {
    width: 100%;
    justify-content: center;
  }
  
  .pending-actions {
    flex-direction: column;
  }
  
  .btn-reject,
  .btn-accept {
    width: 100%;
  }
}
</style>
