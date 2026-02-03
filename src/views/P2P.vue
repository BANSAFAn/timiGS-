<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-6">P2P File Transfer (PC Receiver)</h1>

    <div class="card bg-base-100 shadow-xl max-w-2xl mx-auto">
      <div class="card-body">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-4">
            <div :class="`w-4 h-4 rounded-full ${isServerRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`"></div>
            <span class="text-xl font-semibold">{{ isServerRunning ? 'Server Running' : 'Server Stopped' }}</span>
          </div>
          <button 
            @click="toggleServer" 
            :class="`btn ${isServerRunning ? 'btn-error' : 'btn-success'}`"
          >
            {{ isServerRunning ? 'Stop Server' : 'Start Server' }}
          </button>
        </div>

         <div v-if="isServerRunning" class="alert alert-info shadow-lg mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current flex-shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <div>
            <h3 class="font-bold">Ready to Receive!</h3>
            <div class="text-sm">
              <p>1. Open TimiGS on Android.</p>
              <p>2. Go to Tools -> P2P File Transfer.</p>
              <p>3. Enter your PC's local IP address (e.g. 192.168.x.x).</p>
              <p>4. Click "Send Database".</p>
              <p class="mt-2 font-mono bg-base-300 p-2 rounded">Target IP: {{ localIp || 'Check your Network Settings' }}</p>
            </div>
          </div>
        </div>

        <div class="divider">Logs</div>
        
        <div class="bg-base-300 p-4 rounded-lg h-48 overflow-y-auto font-mono text-xs">
          <div v-if="logs.length === 0" class="text-base-content/50 italic">Waiting for connection...</div>
          <div v-for="(log, i) in logs" :key="i">{{ log }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { invoke } from '@tauri-apps/api/core';

const isServerRunning = ref(false);
const logs = ref<string[]>([]);
const localIp = ref<string>('');

const log = (msg: string) => {
  logs.value.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
};

const toggleServer = async () => {
    try {
        if (isServerRunning.value) {
            await invoke('stop_p2p_server');
            isServerRunning.value = false;
            log('Server stopped');
        } else {
            const res = await invoke('start_p2p_server');
            isServerRunning.value = true;
            log(`Server started: ${res}`);
        }
    } catch (e) {
        log(`Error: ${e}`);
    }
};

// Simple attempt to guess local IP (using WebRTC trick or just instructions)
// Browsers/Webview block local IP discovery often. 
// We generally can't get it easily from JS without Tauri command.
// For now we leave it blank or static instruction.

</script>
