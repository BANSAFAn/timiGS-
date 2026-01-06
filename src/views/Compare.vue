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
      </div>

      <!-- IDENTITY SETUP (If no name) -->
      <div class="setup-container animate-enter" v-if="!store.myProfile.name">
         <div class="glass-card setup-card">
            <h3>Set Up Profile</h3>
            <p>Enter your details to join teams.</p>
            <div class="form-group">
                <label>Nickname</label>
                <input v-model="tempName" placeholder="e.g. Alex" />
            </div>
            <div class="form-group">
                <label>Email (Optional)</label>
                <input v-model="tempEmail" placeholder="alex@example.com" />
            </div>
            <button class="btn btn-primary" :disabled="!tempName" @click="saveProfile">Save Profile</button>
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
            <!-- Members List -->
            <div class="glass-card members-card">
               <h3>Members ({{ store.members.length }})</h3>
               <div class="members-list">
                  <div class="member-row" v-for="member in store.members" :key="member.id">
                      <div class="avatar" :class="{ leader: member.isLeader }">
                         {{ member.name.charAt(0).toUpperCase() }}
                      </div>
                      <div class="member-info">
                         <span class="member-name">{{ member.name }} <span v-if="member.id === store.myProfile.id">(You)</span></span>
                         <span class="member-status">{{ member.isLeader ? 'Leader' : 'Member' }}</span>
                      </div>
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
                   <span class="goal-status" v-if="store.activeGoal">IN PROGRESS</span>
                   <span class="goal-status idle" v-else>IDLE</span>
                </div>

                <div v-if="store.activeGoal" class="goal-details">
                   <div class="goal-icon">🎯</div>
                   <div class="goal-text">
                      <h4>{{ store.activeGoal.appName }}</h4>
                      <p>{{ store.activeGoal.description }}</p>
                   </div>
                </div>
                <div v-else class="no-goal">
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
                 <input v-model="goalApp" placeholder="e.g. VS Code, Figma" />
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
import { ref, watch, nextTick, onMounted, onUnmounted } from "vue";
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

function saveProfile() {
  store.saveProfile(tempName.value, tempEmail.value);
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
  // Optional: show toast
}

function sendChat() {
  if (!chatMsg.value.trim()) return;
  store.sendMessage(chatMsg.value);
  chatMsg.value = "";
  scrollToBottom();
}

function scrollToBottom() {
  nextTick(() => {
    if (chatBox.value) chatBox.value.scrollTop = chatBox.value.scrollHeight;
  });
}

watch(() => store.messages.length, scrollToBottom);

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
// Monitor activity store and report progress if matching active goal
let trackInterval: number | null = null;

onMounted(() => {
  trackInterval = window.setInterval(async () => {
    if (store.isConnected && store.activeGoal) {
      await activityStore.fetchCurrentActivity();
      const currentApp = activityStore.currentActivity?.app_name || "";
      
      // Simple logic: If current app contains goal keyword
      if (currentApp.toLowerCase().includes(store.activeGoal.appName.toLowerCase())) {
         // In real app, we'd sum up session time.
         // Here, let's just increment a local "session time" counter or fetch from backend analytics.
         // For demo, we rely on user strictly using it. Ideally, backend `get_today_summary` gives filtered time.
         
         // Let's use `get_today_summary` filtered by appName? Too heavy.
         // Let's just create a tracker in store or use activityStore.
         
         // Simplest: Check if active matches. If yes, increment logic "server-side" or just assume +5s.
         // Better: Scan `activityStore.topApps` for today to find total time for this app.
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
.avatar { width: 40px; height: 40px; background: var(--bg-hover); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: var(--text-muted); border: 2px solid transparent; }
.avatar.leader { border-color: var(--color-warning); color: var(--color-warning); }
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
.form-group input { padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-color); color: var(--text-color); }

.animate-enter { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>
