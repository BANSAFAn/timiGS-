<template>
  <div class="page page-shell">
    <div class="page-container">
      
      <!-- HEADER -->
      <div class="page-header">
        <div>
           <h2>{{ store.isConnected ? (store.isLeader ? 'Your Team (Leader)' : 'Team Member') : 'Team Collaboration' }}</h2>
           <p class="text-muted" v-if="store.isConnected">
              Peer ID: <span class="code-badge" @click="copyId">{{ store.myProfile.id }}</span>
           </p>
           <p class="text-muted" v-else>Connect to work together.</p>
        </div>
        <div class="header-actions" v-if="store.isConnected">
            <button class="btn btn-secondary" @click="leaveTeam">Leave Team</button>
        </div>
        <div class="header-actions" v-else-if="store.myProfile.name">
             <button class="btn btn-text" @click="regenerateId" title="Refresh ID">↻ New ID</button>
             <button class="btn btn-text danger" @click="logout" title="Clear Profile">Logout</button>
        </div>
      </div>

      <!-- IDENTITY SETUP (If no name) -->
      <div class="setup-container animate-enter" v-if="!store.myProfile.name">
         <div class="glass-card setup-card">
            <div class="icon-circle primary" style="margin: 0 auto 16px;">🔑</div>
            <h3>Welcome to Teams</h3>
            <p style="margin-bottom: 24px">Please sign in with Google to continue.</p>
            
             <!-- Google Auth Option -->
             <div class="google-auth-option" v-if="googleAccount">
                 <div class="user-preview">
                     <div class="avatar-preview">{{ googleAccount.email.charAt(0).toUpperCase() }}</div>
                     <div class="user-details">
                         <span class="name">{{ googleAccount.name || googleAccount.email.split('@')[0] }}</span>
                         <span class="email">{{ googleAccount.email }}</span>
                     </div>
                 </div>
                 <button class="btn btn-primary full-width" @click="loginWithGoogle">
                     Continue as <strong>{{ googleAccount.name || googleAccount.email.split('@')[0] }}</strong>
                 </button>
                 <button class="btn btn-text sm" @click="startGoogleAuth">Switch Account</button>
             </div>

             <div class="google-auth-option" v-else>
                 <button class="btn btn-google-login" @click="startGoogleAuth">
                     <span class="icon">G</span>
                     Sign in with Google
                 </button>
                 <p class="text-xs text-muted" style="margin-top: 12px">
                     Secure authentication via Google is required to join teams.
                 </p>
             </div>
         </div>
      </div>


      <!-- LOBBY (If not connected) -->
      <div class="lobby-grid animate-enter" v-else-if="!store.isConnected">
          <!-- Create Team -->
          <div class="glass-card lobby-card">
              <div class="icon-circle primary">👑</div>
              <h3>Create Team</h3>
              <p>Host a session and invite others.</p>
              <button class="btn btn-primary" @click="createTeam">Start New Team</button>
          </div>

          <!-- Join Team -->
          <div class="glass-card lobby-card">
              <div class="icon-circle accent">🤝</div>
              <h3>Join Team</h3>
              <p>Enter the Leader's Peer ID.</p>
              <div class="join-input-group">
                  <input v-model="joinId" placeholder="Paste ID here" />
                  <button class="btn btn-accent" :disabled="!joinId" @click="joinTeam">Join</button>
              </div>
          </div>
      </div>

      <!-- TEAM DASHBOARD (If connected) -->
      <div class="team-dashboard animate-enter" v-else>
         
         <!-- LEFT: Members & Chat -->
         <div class="col-left">
            <!-- VIDEO GRID (PIP Style) -->
            <div class="glass-card video-card" v-if="store.voiceActive">
               <div class="video-container">
                   <!-- Remote Videos -->
                   <div class="remote-video" v-for="[peerId, stream] in store.remoteStreams" :key="peerId">
                       <video :srcObject="stream" autoplay playsinline></video>
                       <span class="peer-label">{{ getMemberName(peerId) }}</span>
                   </div>
                   <!-- Local Video (Mini) -->
                   <div class="local-video" v-if="store.localStream">
                       <video :srcObject="store.localStream" autoplay playsinline muted></video>
                   </div>
                   <!-- Placeholder if no video -->
                   <div class="video-placeholder" v-if="store.remoteStreams.size === 0 && !store.localStream">
                       Waiting for video...
                   </div>
               </div>
               
               <!-- Controls -->
               <div class="video-controls">
                   <button class="icon-btn" :class="{ active: store.voiceActive }" @click="toggleVoice" title="Mute/Unmute Mic">
                       🎙️
                   </button>
                   <button class="icon-btn" @click="store.toggleCamera()" title="Toggle Camera">
                       📷
                   </button>
                   <button class="icon-btn" @click="store.shareScreen()" title="Share Screen">
                       🖥️
                   </button>
                    <button class="icon-btn danger" @click="store.leaveVoice()" title="Leave Call">
                       📞
                   </button>
               </div>
            </div>

            <!-- Members List -->
            <div class="glass-card members-card">
               <div class="card-header">
                  <h3>Members ({{ store.members.length }})</h3>
                  <button class="icon-btn sm" @click="toggleVoice" :class="{ 'active': store.voiceActive }" title="Join Voice" v-if="!store.voiceActive">
                     📞
                  </button>
               </div>
               <div class="members-list">
                  <div class="member-row" v-for="member in store.members" :key="member.id">
                      <div class="avatar" :class="{ leader: member.isLeader, voice: member.status === 'voice' }">
                         {{ member.name.charAt(0).toUpperCase() }}
                      </div>
                      <div class="member-info">
                         <span class="member-name">{{ member.name }} <span v-if="member.id === store.myProfile.id">(You)</span></span>
                         <span class="member-status">{{ member.isLeader ? 'Leader' : member.status }}</span>
                      </div>
                      <!-- Kick Button (Admin) -->
                      <button v-if="store.isLeader && member.id !== store.myProfile.id" class="icon-btn danger sm" @click="kickMember(member.id)" title="Kick">
                         ✕
                      </button>
                      <div class="member-progress-text" v-if="member.progress">
                         {{ member.progress.percentage }}%
                      </div>
                  </div>
               </div>
            </div>

            <!-- Chat -->
            <div class="glass-card chat-card">
               <h3>Team Chat</h3>
               <div class="chat-messages" ref="chatBox">
                  <div class="message" v-for="msg in store.messages" :key="msg.id" :class="{ outgoing: msg.senderId === store.myProfile.id }">
                     <div class="msg-sender">{{ msg.senderName }}</div>
                     <div class="msg-bubble">{{ msg.text }}</div>
                  </div>
               </div>
               <div class="chat-input">
                  <input v-model="chatMsg" @keyup.enter="sendChat" placeholder="Type a message..." />
                  <button class="icon-btn" @click="sendChat">➤</button>
               </div>
            </div>
         </div>

         <!-- RIGHT: Active Goal & Progress -->
         <div class="col-right">
             <!-- ACTIVE GOAL -->
             <div class="glass-card goal-card">
                <div class="card-header">
                   <h3>Active Goal</h3>
                   <span class="goal-status" v-if="store.activeGoal" :class="store.activeGoal.status">{{ store.activeGoal.status?.toUpperCase() || 'ACTIVE' }}</span>
                   <span class="goal-status idle" v-else>IDLE</span>
                </div>

                <div v-if="store.activeGoal" class="goal-details">
                   <div class="goal-icon">🎯</div>
                   <div class="goal-text">
                      <h4>{{ store.activeGoal.appName }}</h4>
                      <p>{{ store.activeGoal.description }}</p>
                   </div>
                </div>
                
                <!-- Admin Goal Controls -->
                <div v-if="store.isLeader && store.activeGoal" class="admin-actions">
                     <button class="btn btn-success btn-sm" @click="store.updateGoalStatus('completed')">Done</button>
                     <button class="btn btn-danger btn-sm" @click="store.updateGoalStatus('failed')">Fail</button>
                     <button class="btn btn-secondary btn-sm" @click="store.updateGoalStatus('cancelled')">Cancel</button>
                </div>

                <div v-if="!store.activeGoal" class="no-goal">
                   <p>No active goal set.</p>
                   <button v-if="store.isLeader" class="btn btn-outline" @click="showGoalModal = true">Set Team Goal</button>
                </div>
             </div>

             <!-- PROGRESS GRID -->
             <div class="progress-grid">
               <div class="glass-card progress-card" v-for="member in store.members" :key="member.id">
                  <div class="progress-header">
                     <span>{{ member.name }}</span>
                     <span>{{ member.progress?.percentage || 0 }}%</span>
                  </div>
                  <div class="progress-bar-bg">
                     <div class="progress-bar-fill" :style="{ width: (member.progress?.percentage || 0) + '%' }"></div>
                  </div>
                  <div class="progress-meta">
                     <span v-if="member.progress">{{ formatTime(member.progress.current) }} / {{ formatTime(member.progress.target) }}</span>
                     <span v-else>Thinking...</span>
                  </div>
               </div>
             </div>
         </div>

      </div>

      <!-- Set Goal Modal (Leader Only) -->
      <div class="modal-overlay" v-if="showGoalModal">
          <div class="glass-card modal">
              <h3>Set New Goal</h3>
              <div class="form-group">
                 <label>Application / Website</label>
                 <!-- App Selector -->
                 <select v-model="goalApp" class="input-glass">
                    <option value="" disabled>Select an app...</option>
                    <option v-for="app in filteredApps" :key="app.app_name" :value="app.app_name">
                        {{ app.app_name }}
                    </option>
                    <option value="Visual Studio Code">Visual Studio Code (Manual)</option>
                    <option value="Figma">Figma (Manual)</option>
                 </select>
                 <input v-if="!goalApp" v-model="goalApp" placeholder="Or type manually..." style="margin-top: 8px" />
              </div>
              <div class="form-group">
                 <label>Duration (Minutes)</label>
                 <input type="number" v-model="goalMinutes" />
              </div>
              <div class="modal-actions">
                  <button class="btn btn-text" @click="showGoalModal = false">Cancel</button>
                  <button class="btn btn-primary" @click="createGoal">Set Goal</button>
              </div>
          </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted, computed } from "vue";
import { useTeamsStore } from "../stores/teams";
import { useActivityStore } from "../stores/activity";

const store = useTeamsStore();
const activityStore = useActivityStore();

const tempName = ref(store.myProfile.name);
const tempEmail = ref(store.myProfile.email);
const joinId = ref("");
const chatMsg = ref("");
const chatBox = ref<HTMLElement | null>(null);

const showGoalModal = ref(false);
const goalApp = ref("");
const goalMinutes = ref(30);

// --- State Management ---
const googleAccount = ref<{ email: string; name?: string } | null>(null);

function saveProfile(name?: string, email?: string) {
  store.saveProfile(name || tempName.value, email || tempEmail.value);
}

function loginWithGoogle() {
  if (googleAccount.value) {
    const name = googleAccount.value.name || googleAccount.value.email.split('@')[0];
    saveProfile(name, googleAccount.value.email);
  }
}

async function startGoogleAuth() {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const { open } = await import("@tauri-apps/plugin-shell");
    
    const port = await invoke("start_google_auth_server");
    await open(`http://localhost:${port}/auth/google`);
    
    // Start polling for account
    const poll = setInterval(async () => {
      const accounts: any = await invoke("get_cloud_accounts");
      if (Array.isArray(accounts) && accounts.length > 0) {
        googleAccount.value = accounts[0];
        clearInterval(poll);
      }
    }, 2000);
  } catch (e) {
    console.error("Auth Error", e);
    alert("Failed to start Google Auth. Please try again.");
  }
}

function getMemberName(peerId: string) {
  const m = store.members.find(x => x.id === peerId);
  return m ? m.name : 'Unknown';
}

function logout() {
  if (confirm("Clear profile and logout?")) {
    store.saveProfile("", "");
    tempName.value = "";
    tempEmail.value = "";
    googleAccount.value = null;
    window.location.reload();
  }
}

async function regenerateId() {
  store.leaveTeam();
  window.location.reload(); 
}

// Google Auth Check
async function checkGoogleProfile() {
  if (store.myProfile.name) return;
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const accounts: any = await invoke("get_cloud_accounts");
    if (Array.isArray(accounts) && accounts.length > 0) {
      googleAccount.value = accounts[0];
      tempName.value = accounts[0].name || accounts[0].email.split('@')[0];
      tempEmail.value = accounts[0].email;
    }
  } catch (e) {
    console.error(e);
  }
}

async function createTeam() {
  await store.createTeam();
}

async function joinTeam() {
  await store.joinTeam(joinId.value);
}

function leaveTeam() {
  store.leaveTeam();
}

function copyId() {
  navigator.clipboard.writeText(store.myProfile.id);
}

function sendChat() {
  if (!chatMsg.value.trim()) return;
  store.sendMessage(chatMsg.value);
  chatMsg.value = "";
  scrollToBottom();
}

function toggleVoice() {
    if (store.voiceActive) store.leaveVoice();
    else store.joinVoice();
}

function kickMember(id: string) {
    if (confirm("Kick this member?")) {
        store.kickMember(id);
    }
}

function scrollToBottom() {
  nextTick(() => {
    if (chatBox.value) chatBox.value.scrollTop = chatBox.value.scrollHeight;
  });
}

const filteredApps = computed(() => {
    const ignored = ['lockapp', 'explorer', 'searchapp', 'shellexperiencehost', 'applicationframehost'];
    return activityStore.topApps.filter(app => !ignored.includes(app.app_name.toLowerCase().replace(/\s/g, '')));
});

watch(() => store.messages.length, scrollToBottom);
watch(showGoalModal, (val) => {
    if (val) activityStore.fetchTodayData();
});

function createGoal() {
  store.setGoal(goalApp.value, goalMinutes.value * 60);
  showGoalModal.value = false;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

// --- Tracking Integration ---
let trackInterval: number | null = null;

onMounted(async () => {
    // Load any existing Google account
    await checkGoogleProfile();

  trackInterval = window.setInterval(async () => {
    if (store.isConnected && store.activeGoal && store.activeGoal.status === 'active') { // Only track if active
      await activityStore.fetchCurrentActivity();
      const currentApp = activityStore.currentActivity?.app_name || "";
      
      if (currentApp.toLowerCase().includes(store.activeGoal.appName.toLowerCase())) {
         await activityStore.fetchTodayData();
         const appStats = activityStore.topApps.find(a => a.app_name.toLowerCase().includes(store.activeGoal!.appName.toLowerCase()));
         const totalSeconds = appStats ? appStats.total_seconds : 0;
         
         store.sendProgress(totalSeconds, currentApp);
      }
    }
  }, 5000);
});

onUnmounted(() => {
  if (trackInterval) clearInterval(trackInterval);
});

</script>

<style scoped>
.page-container { max-width: 1200px; margin: 0 auto; height: 100vh; display: flex; flex-direction: column; }
.text-muted { color: var(--text-muted); }
.code-badge { background: var(--bg-hover); padding: 4px 8px; border-radius: 4px; font-family: monospace; cursor: pointer; color: var(--color-primary); }

.setup-container { height: 60vh; display: flex; align-items: center; justify-content: center; }
.setup-card { width: 400px; padding: 32px; text-align: center; }

.lobby-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; padding-top: 40px; }
.lobby-card { padding: 40px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 16px; transition: transform 0.2s; }
.lobby-card:hover { transform: translateY(-5px); }
.icon-circle { width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin-bottom: 8px; }
.icon-circle.primary { background: rgba(99,102,241,0.1); }
.icon-circle.accent { background: rgba(6,182,212,0.1); }
.join-input-group { display: flex; gap: 8px; margin-top: 16px; width: 100%; }
.join-input-group input { flex: 1; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-color); color: var(--text-color); }

.team-dashboard { display: grid; grid-template-columns: 350px 1fr; gap: 24px; flex: 1; min-height: 0; padding-bottom: 24px; }
.col-left { display: flex; flex-direction: column; gap: 24px; min-height: 0; }
.col-right { display: flex; flex-direction: column; gap: 24px; overflow-y: auto; }

.members-card { flex: 1; display: flex; flex-direction: column; min-height: 200px; max-height: 400px; }
.members-list { overflow-y: auto; display: flex; flex-direction: column; gap: 12px; padding-top: 16px; }
.member-row { display: flex; align-items: center; gap: 12px; padding: 8px; border-radius: 8px; transition: background 0.2s; }
.member-row:hover { background: var(--bg-hover); }
.avatar { width: 40px; height: 40px; background: var(--bg-hover); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: var(--text-muted); border: 2px solid transparent; position: relative; }
.avatar.leader { border-color: var(--color-warning); color: var(--color-warning); }
.avatar.voice { box-shadow: 0 0 0 2px var(--color-success); }
.avatar.voice::after { content: '🎤'; position: absolute; bottom: -5px; right: -5px; font-size: 10px; background: var(--bg-color); border-radius: 50%; padding: 2px; }
.member-info { flex: 1; display: flex; flex-direction: column; line-height: 1.2; }
.member-name { font-weight: 600; font-size: 0.9rem; }
.member-status { font-size: 0.75rem; color: var(--text-muted); }
.member-progress-text { font-weight: bold; color: var(--color-primary); }

.chat-card { flex: 1; display: flex; flex-direction: column; min-height: 300px; }
.chat-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; background: rgba(0,0,0,0.1); border-radius: 8px; margin: 12px 0; }
.message { display: flex; flex-direction: column; align-items: flex-start; max-width: 80%; }
.message.outgoing { align-items: flex-end; align-self: flex-end; }
.msg-sender { font-size: 0.7rem; color: var(--text-muted); margin-bottom: 2px; }
.msg-bubble { background: var(--bg-hover); padding: 8px 12px; border-radius: 12px; border-top-left-radius: 2px; }
.message.outgoing .msg-bubble { background: var(--color-primary); color: white; border-radius: 12px; border-top-right-radius: 2px; border-top-left-radius: 12px; }
.chat-input { display: flex; gap: 8px; }
.chat-input input { flex: 1; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-color); color: var(--text-color); }

.goal-card { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.goal-status { font-size: 0.75rem; font-weight: bold; background: rgba(16,185,129,0.2); color: var(--color-success); padding: 4px 8px; border-radius: 4px; }
.goal-status.idle { background: var(--bg-hover); color: var(--text-muted); }
.goal-status.completed { background: rgba(16,185,129,0.2); color: var(--color-success); }
.goal-status.failed { background: rgba(239,68,68,0.2); color: var(--color-danger); }
.goal-status.cancelled { background: rgba(255,255,255,0.1); color: var(--text-muted); }

.admin-actions { display: flex; gap: 8px; margin-top: 16px; justify-content: flex-end; }
.btn-success { background: var(--color-success); color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; }
.btn-danger { background: var(--color-danger); color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; }

.goal-details { display: flex; align-items: center; gap: 16px; background: var(--bg-hover); padding: 16px; border-radius: 12px; }
.goal-icon { font-size: 2rem; }
.goal-text h4 { margin: 0; font-size: 1.1rem; }
.goal-text p { margin: 0; color: var(--text-muted); font-size: 0.9rem; }

.progress-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
.progress-card { padding: 16px; display: flex; flex-direction: column; gap: 8px; }
.progress-header { display: flex; justify-content: space-between; font-size: 0.9rem; font-weight: 600; }
.progress-bar-bg { height: 8px; background: var(--bg-hover); border-radius: 4px; overflow: hidden; }
.progress-bar-fill { height: 100%; background: var(--color-primary); transition: width 0.3s; }
.progress-meta { font-size: 0.8rem; color: var(--text-muted); text-align: right; }

/* Modal */
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal { width: 400px; padding: 24px; display: flex; flex-direction: column; gap: 16px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }

/* Form */
.form-group { display: flex; flex-direction: column; gap: 6px; text-align: left; }
.form-group label { font-size: 0.9rem; color: var(--text-muted); }
.form-group input, .form-group select { padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-color); color: var(--text-color); }
.form-group select option { background: var(--bg-color); color: var(--text-color); }
.input-glass { background: rgba(255,255,255,0.05); }

.icon-btn.sm { width: 32px; height: 32px; font-size: 0.8rem; }
.icon-btn.active { color: var(--color-success); background: rgba(16,185,129,0.1); }
.icon-btn.danger { color: var(--color-danger); }
.icon-btn.danger:hover { background: rgba(239,68,68,0.1); }

.animate-enter { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

/* Video */
.video-card { min-height: 250px; display: flex; flex-direction: column; overflow: hidden; background: black; }
.video-container { flex: 1; position: relative; display: flex; align-items: center; justify-content: center; background: #111; }
.remote-video { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
.remote-video video { width: 100%; height: 100%; object-fit: contain; }
.local-video { position: absolute; bottom: 16px; right: 16px; width: 120px; height: 90px; background: #222; border-radius: 8px; border: 2px solid var(--border-color); overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.5); }
.local-video video { width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1); }
.video-placeholder { color: var(--text-muted); font-size: 0.9rem; }
.peer-label { position: absolute; bottom: 8px; left: 8px; background: rgba(0,0,0,0.6); padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; pointer-events: none; }

.video-controls { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 12px; background: rgba(255,255,255,0.02); border-top: 1px solid var(--border-color); }
.video-controls .icon-btn { width: 40px; height: 40px; font-size: 1.2rem; border-radius: 50%; background: var(--bg-hover); }
.video-controls .icon-btn:hover { background: var(--bg-active); }
.video-controls .icon-btn.active { background: var(--color-success); color: white; }
.video-controls .icon-btn.danger { background: var(--color-danger); color: white; }

/* Google Button */
.google-auth-option { display: flex; flex-direction: column; align-items: center; gap: 16px; margin-bottom: 24px; width: 100%; }
.btn-google-login { display: flex; align-items: center; gap: 10px; background: white; color: rgba(0,0,0,0.7); font-weight: 500; font-family: 'Roboto', sans-serif; padding: 12px 24px; border-radius: 24px; border: 1px solid #ddd; cursor: pointer; transition: transform 0.1s; width: 100%; justify-content: center; font-size: 1rem; }
.btn-google-login:hover { background: #f8f9fa; transform: translateY(-1px); box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
.btn-google-login .icon { font-weight: bold; font-family: 'Product Sans', sans-serif; color: #4285f4; font-size: 1.4rem; }

.user-preview { display: flex; align-items: center; gap: 12px; background: var(--bg-hover); padding: 8px 16px; border-radius: 12px; width: 100%; margin-bottom: 8px; text-align: left; }
.avatar-preview { width: 40px; height: 40px; background: var(--color-primary); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.2rem; }
.user-details { display: flex; flex-direction: column; }
.user-details .name { font-weight: 600; font-size: 1rem; }
.user-details .email { font-size: 0.8rem; color: var(--text-muted); }

.full-width { width: 100%; }
.text-xs { font-size: 0.75rem; }
</style>
