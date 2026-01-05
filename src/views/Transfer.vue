<template>
  <div class="page-shell">
    <div class="header-section">
      <h1>P2P Transfer</h1>
      <p class="subtitle">
        Direct file transfer between devices using a secure token.
      </p>
    </div>

    <div class="transfer-container glass-card">
      <div class="tabs">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'send' }"
          @click="activeTab = 'send'"
        >
          📤 Send
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'receive' }"
          @click="activeTab = 'receive'"
        >
          📥 Receive
        </button>
      </div>

      <div class="tab-content">
        <!-- SEND TAB -->
        <div v-if="activeTab === 'send'" class="fade-in">
          <div class="input-group">
            <label>Receiver Token</label>
            <div class="row">
              <input
                v-model="targetPeerId"
                type="text"
                placeholder="Enter token from receiver..."
                class="input-field"
                :disabled="isConnected"
              />
              <button
                class="btn btn-primary"
                @click="connectToPeer"
                :disabled="!targetPeerId || isConnected"
              >
                {{ isConnected ? "Connected" : "Connect" }}
              </button>
            </div>
            <p v-if="connectionError" class="error-msg">
              {{ connectionError }}
            </p>
          </div>

          <div v-if="isConnected" class="send-area">
            <div class="status-indicator online">
              Connected to {{ targetPeerId }}
            </div>

            <div
              class="drop-zone"
              @click="triggerFileSelect"
              @drop.prevent="onDrop"
              @dragover.prevent
            >
              <span v-if="!selectedFile"
                >📄 Click or Drag file here to send</span
              >
              <div v-else class="file-preview">
                <strong>{{ selectedFile.name }}</strong>
                <small
                  >{{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB</small
                >
              </div>
            </div>
            <input
              type="file"
              ref="fileInput"
              @change="onFileSelected"
              style="display: none"
            />

            <button
              class="btn btn-success full-width"
              @click="startTransfer"
              :disabled="!selectedFile || isTransferring"
              v-if="selectedFile"
            >
              {{
                isTransferring ? `Sending... ${transferProgress}%` : "Send File"
              }}
            </button>

            <div class="progress-bar-container" v-if="isTransferring">
              <div
                class="progress-bar"
                :style="{ width: transferProgress + '%' }"
              ></div>
            </div>
            <p v-if="transferStatus" class="status-msg">{{ transferStatus }}</p>
          </div>
        </div>

        <!-- RECEIVE TAB -->
        <div v-if="activeTab === 'receive'" class="fade-in">
          <div class="receive-info">
            <label>Your Token</label>
            <div class="token-display" @click="copyToken">
              {{ myPeerId || "Generating..." }}
              <span class="copy-hint" v-if="myPeerId">📋</span>
            </div>
            <p class="hint">Share this token with the sender.</p>
          </div>

          <div class="settings-group">
            <label>Save Folder</label>
            <div class="row">
              <input
                v-model="savePath"
                type="text"
                class="input-field"
                placeholder="Default: Downloads"
              />
              <!-- Folder selection would require dialog, defaulting to manual or downloads -->
            </div>
            <small>Files will be saved here.</small>
          </div>

          <div class="connection-status">
            Status:
            <span :class="['badge', isConnected ? 'online' : 'waiting']">
              {{
                isConnected ? "Connected via P2P" : "Waiting for connection..."
              }}
            </span>
          </div>

          <div v-if="incomingFile" class="incoming-alert">
            <h3>Receiving File...</h3>
            <p>{{ incomingFile.name }}</p>
            <div class="progress-bar-container">
              <div
                class="progress-bar"
                :style="{ width: transferProgress + '%' }"
              ></div>
            </div>
            <p>{{ transferProgress }}%</p>
          </div>

          <div v-if="transferStatus" class="success-msg">
            {{ transferStatus }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import Peer from "peerjs";
import { invoke } from "@tauri-apps/api/core";

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

// File State
const selectedFile = ref<File | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const incomingFile = ref<{ name: string; size: number } | null>(null);

// P2P Objects
let peer: Peer | null = null;
let conn: any = null;
let receivedChunks: ArrayBuffer[] = [];
let receivedSize = 0;

onMounted(() => {
  initPeer();
});

onUnmounted(() => {
  peer?.destroy();
});

function initPeer() {
  // Use public PeerJS server
  peer = new Peer();

  peer.on("open", (id) => {
    myPeerId.value = id;
    console.log("My Peer ID:", id);
  });

  peer.on("connection", (c) => {
    // Receiver Side Logic
    conn = c;
    setupReceiverConnection();
  });

  peer.on("error", (err) => {
    connectionError.value = "P2P Error: " + err.type;
    console.error(err);
  });
}

function copyToken() {
  if (myPeerId.value) {
    navigator.clipboard.writeText(myPeerId.value);
    alert("Token copied!");
  }
}

// SENDER LOGIC
function connectToPeer() {
  if (!targetPeerId.value || !peer) return;
  connectionError.value = "";

  conn = peer.connect(targetPeerId.value);

  conn.on("open", () => {
    isConnected.value = true;
    transferStatus.value = "";
  });

  conn.on("error", (err: any) => {
    connectionError.value = "Connection failed: " + err;
    isConnected.value = false;
  });

  conn.on("close", () => {
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

  // 1. Send Metadata
  conn.send({
    type: "meta",
    name: file.name,
    size: file.size,
  });

  // 2. Read and Send Chunks
  const chunkSize = 16384; // 16KB chunks
  const reader = new FileReader();
  let offset = 0;

  reader.onload = (e) => {
    if (e.target?.result) {
      conn.send(e.target.result); // Send ArrayBuffer
      offset += (e.target.result as ArrayBuffer).byteLength;

      transferProgress.value = Math.round((offset / file.size) * 100);

      if (offset < file.size) {
        readNextChunk();
      } else {
        isTransferring.value = false;
        transferStatus.value = "Transfer complete!";
        conn.send({ type: "complete" });
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
  receivedChunks = [];
  receivedSize = 0;

  conn.on("data", async (data: any) => {
    // Handle Meta
    if (data.type === "meta") {
      incomingFile.value = { name: data.name, size: data.size };
      receivedChunks = [];
      receivedSize = 0;
      transferProgress.value = 0;
      return;
    }

    // Handle Completion
    if (data.type === "complete") {
      saveReceivedFile();
      return;
    }

    // Handle Data Chunk (ArrayBuffer)
    if (data instanceof ArrayBuffer) {
      receivedChunks.push(data);
      receivedSize += data.byteLength;
      if (incomingFile.value) {
        transferProgress.value = Math.round(
          (receivedSize / incomingFile.value.size) * 100
        );
      }
    }
  });

  conn.on("close", () => {
    isConnected.value = false;
  });
}

async function saveReceivedFile() {
  if (!incomingFile.value) return;

  const blob = new Blob(receivedChunks);
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = Array.from(new Uint8Array(arrayBuffer));

  transferStatus.value = "Saving file...";

  // Use Rust to save to disk
  try {
    const savedPath = await invoke("save_local_file", {
      filename: incomingFile.value.name,
      data: bytes,
      targetFolder: savePath.value || null,
    });
    transferStatus.value = `File saved to: ${savedPath}`;
    alert(`File Received!\nSaved to: ${savedPath}`);
  } catch (e) {
    transferStatus.value = "Error saving file: " + e;
    alert("Save Error: " + e);
  }

  incomingFile.value = null;
  receivedChunks = [];
}
</script>

<style scoped>
.page-shell {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}
.header-section {
  margin-bottom: 20px;
}
.subtitle {
  color: var(--text-muted);
}

.tabs {
  display: flex;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--border-color);
}
.tab-btn {
  flex: 1;
  padding: 12px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 1rem;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.3s;
}
.tab-btn.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.input-group {
  margin-bottom: 20px;
}
.row {
  display: flex;
  gap: 10px;
}
.input-field {
  flex: 1;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
}
.btn {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
}
.btn-primary {
  background: var(--color-primary);
  color: #fff;
}
.btn-success {
  background: #10b981;
  color: #fff;
}
.full-width {
  width: 100%;
  margin-top: 10px;
}

.token-display {
  background: var(--bg-tertiary);
  padding: 15px;
  border-radius: 12px;
  font-family: monospace;
  font-size: 1.2rem;
  text-align: center;
  border: 1px dashed var(--color-primary);
  cursor: pointer;
  margin: 10px 0;
  transition: all 0.2s;
}
.token-display:hover {
  background: rgba(59, 130, 246, 0.1);
}

.drop-zone {
  border: 2px dashed var(--border-color);
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.02);
}
.drop-zone:hover {
  border-color: var(--color-primary);
  background: rgba(59, 130, 246, 0.05);
}

.status-indicator {
  text-align: center;
  margin-bottom: 15px;
  color: #10b981;
  font-weight: bold;
}
.badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
}
.badge.online {
  background: #10b981;
  color: #fff;
}
.badge.waiting {
  background: #f59e0b;
  color: #fff;
}

.progress-bar-container {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  margin: 15px 0;
  overflow: hidden;
}
.progress-bar {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.3s;
}

.error-msg {
  color: #ef4444;
  margin-top: 5px;
  font-size: 0.9rem;
}
.success-msg {
  color: #10b981;
  margin-top: 10px;
  font-weight: bold;
}
</style>
